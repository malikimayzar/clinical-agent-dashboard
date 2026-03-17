import React, { useState } from 'react';
import { useAPI } from '../api';
import { Spinner, EmptyState, ErrorState, SeverityPill, StatusPill, pct, shortDate } from '../components/UI';

const STATUSES = ['all', 'CONFLICT', 'CONFIRMED', 'NEW', 'UNCERTAIN'];

export default function Claims() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const url = status === 'all' ? '/claims?limit=60' : `/claims?limit=60&status=${status}`;
  const { data, loading, error } = useAPI(url, [status]);
  const claims = (data?.claims || []).filter(c =>
    !search || c.text?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = { CONFLICT: 'var(--red)', CONFIRMED: 'var(--green)', NEW: 'var(--blue)', UNCERTAIN: 'var(--amber)', all: 'var(--text3)' };

  return (
    <div style={{ padding: '2rem', maxWidth: 1100 }}>
      <div className="fade-up" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 38, fontWeight: 400, color: 'var(--text)' }}>Claims</h1>
        <p style={{ color: 'var(--text3)', fontSize: 13, fontFamily: 'var(--font-mono)', marginTop: 4 }}>All factual claims extracted from processed ArXiv papers</p>
      </div>

      <div className="fade-up-1" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)} style={{
              background: status === s ? 'var(--bg3)' : 'transparent',
              border: `1px solid ${status === s ? 'var(--border2)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)', padding: '5px 12px',
              color: status === s ? statusColors[s] : 'var(--text3)',
              fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer',
              letterSpacing: '0.04em', transition: 'all 0.15s'
            }}>{s.toLowerCase()}</button>
          ))}
        </div>
        <input
          type="text" placeholder="Search claims..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: 'var(--radius)', padding: '6px 12px',
            color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13,
            outline: 'none', minWidth: 220
          }}
        />
        {data?.count != null && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)', marginLeft: 'auto' }}>{claims.length} claims</span>
        )}
      </div>

      {loading ? <Spinner /> : error ? <ErrorState msg={error} /> : claims.length === 0 ? <EmptyState msg="no claims found" /> : (
        <div className="fade-up-2">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['claim', 'status', 'severity', 'confidence', 'faithfulness', 'date'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claims.map((c, i) => (
                <tr key={c.claim_id} style={{ borderBottom: i < claims.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 12px', color: 'var(--text2)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.text}</td>
                  <td style={{ padding: '10px 12px' }}><StatusPill status={c.status} /></td>
                  <td style={{ padding: '10px 12px' }}>{c.severity ? <SeverityPill severity={c.severity} /> : <span style={{ color: 'var(--text3)', fontSize: 11 }}>—</span>}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text2)' }}>{c.confidence != null ? (c.confidence * 100).toFixed(0) + '%' : '—'}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{pct(c.faithfulness_score)}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{shortDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}