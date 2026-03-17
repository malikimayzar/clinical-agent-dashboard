import React, { useState } from 'react';
import { useAPI } from '../api';
import { SectionTitle, Spinner, EmptyState, ErrorState, SeverityPill, StatusBadge, pct, shortDate, truncate } from '../components/UI';

const STATUSES = ['ALL', 'CONFLICT', 'CONFIRMED', 'NEW', 'UNCERTAIN'];

export default function Claims() {
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const url = status === 'ALL' ? '/claims?limit=60' : `/claims?limit=60&status=${status}`;
  const { data, loading, error } = useAPI(url, [status]);
  const claims = (data?.claims || []).filter(c =>
    !search || c.text?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = { ALL: 'var(--white2)', CONFLICT: 'var(--red)', CONFIRMED: '#4dff9f', NEW: 'var(--white3)', UNCERTAIN: '#f5a623' };

  return (
    <div style={{ padding: '2.5rem', maxWidth: 1200 }}>
      <div className="fade-in" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', lineHeight: 0.9 }}>
          Extracted<br /><span style={{ color: 'var(--red)' }}>Claims</span>
        </h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--white3)', marginTop: 12, letterSpacing: '0.1em' }}>
          GROQ LLAMA 3.3 70B · 3–5 CLAIMS/PAPER · 963MS EXTRACTION
        </div>
      </div>

      <div className="fade-in-1" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '2rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)} style={{
              background: status === s ? statusColors[s] : 'transparent',
              border: `1px solid ${status === s ? statusColors[s] : 'var(--border2)'}`,
              color: status === s ? 'var(--black)' : 'var(--white3)',
              fontFamily: 'var(--font-mono)', fontSize: 9,
              letterSpacing: '0.12em', padding: '5px 12px',
              cursor: 'crosshair', transition: 'all 0.1s',
            }}>{s}</button>
          ))}
        </div>
        <input
          type="text" placeholder="SEARCH CLAIMS..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            background: 'var(--black2)', border: '1px solid var(--border2)',
            color: 'var(--white)', fontFamily: 'var(--font-mono)', fontSize: 11,
            padding: '6px 12px', outline: 'none', letterSpacing: '0.05em',
            minWidth: 240,
          }}
        />
        {data?.count != null && (
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--white4)', letterSpacing: '0.1em' }}>{claims.length} CLAIMS</span>
        )}
      </div>

      {loading ? <Spinner /> : error ? <ErrorState msg={error} /> : claims.length === 0 ? <EmptyState /> : (
        <div className="fade-in-2" style={{ background: 'var(--black2)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 90px 80px 80px 90px', padding: '8px 16px', borderBottom: '2px solid var(--white4)' }}>
            {['CLAIM TEXT', 'STATUS', 'SEVERITY', 'CONF', 'FAITH', 'DATE'].map(h => (
              <div key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--white4)', letterSpacing: '0.15em' }}>{h}</div>
            ))}
          </div>
          {claims.map((c, i) => (
            <div key={c.claim_id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 110px 90px 80px 80px 90px',
                padding: '11px 16px',
                borderBottom: i < claims.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.1s',
                borderLeft: c.status === 'CONFLICT' ? '2px solid var(--red)' : '2px solid transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--black3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: 12, color: 'var(--white2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{c.text}</div>
              <div><StatusBadge status={c.status} /></div>
              <div>{c.severity ? <SeverityPill severity={c.severity} /> : <span style={{ color: 'var(--white4)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>—</span>}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--white3)' }}>{c.confidence != null ? (c.confidence * 100).toFixed(0) + '%' : '—'}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4dff9f' }}>{pct(c.faithfulness_score)}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--white4)' }}>{shortDate(c.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}