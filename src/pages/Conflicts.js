import React, { useState } from 'react';
import { useAPI } from '../api';
import { SectionTitle, Spinner, EmptyState, ErrorState, SeverityPill, pct, shortDatetime, truncate } from '../components/UI';

const FILTERS = ['ALL', 'CRITICAL', 'MAJOR', 'MINOR'];

export default function Conflicts() {
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(null);

  const url = filter === 'ALL' ? '/conflicts?limit=50' : `/conflicts?limit=50&severity=${filter.toLowerCase()}`;
  const { data, loading, error } = useAPI(url, [filter]);
  const conflicts = data?.conflicts || [];

  const filterColors = { ALL: 'var(--white2)', CRITICAL: 'var(--red)', MAJOR: '#f5a623', MINOR: 'var(--white3)' };

  return (
    <div style={{ padding: '2.5rem', maxWidth: 1200 }}>
      <div className="fade-in" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', lineHeight: 0.9, color: 'var(--white)' }}>
          Conflict<br /><span style={{ color: 'var(--red)' }}>Detection</span>
        </h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--white3)', marginTop: 12, letterSpacing: '0.1em' }}>
          NLI-DETECTED CONTRADICTIONS · GROQ LLAMA 3.3 70B · 42MS/CLAIM
        </div>
      </div>

      {/* Filter */}
      <div className="fade-in-1" style={{ display: 'flex', gap: 2, marginBottom: '2rem' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? filterColors[f] : 'transparent',
            border: `1px solid ${filter === f ? filterColors[f] : 'var(--border2)'}`,
            color: filter === f ? (f === 'ALL' ? 'var(--black)' : f === 'CRITICAL' ? 'var(--white)' : 'var(--black)') : 'var(--white3)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.12em',
            padding: '6px 16px',
            cursor: 'crosshair',
            transition: 'all 0.1s',
          }}>{f}</button>
        ))}
        {data?.count != null && (
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--white4)', alignSelf: 'center', letterSpacing: '0.1em' }}>
            {data.count} RESULTS
          </span>
        )}
      </div>

      {loading ? <Spinner /> : error ? <ErrorState msg={error} /> : conflicts.length === 0 ? <EmptyState /> : (
        <div className="fade-in-2" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {conflicts.map((c, i) => (
            <div key={c.claim_id}>
              <div
                onClick={() => setExpanded(expanded === c.claim_id ? null : c.claim_id)}
                style={{
                  background: expanded === c.claim_id ? 'var(--black3)' : 'var(--black2)',
                  borderLeft: `3px solid ${c.severity === 'critical' ? 'var(--red)' : c.severity === 'major' ? '#f5a623' : 'var(--white4)'}`,
                  padding: '14px 20px',
                  cursor: 'crosshair',
                  transition: 'background 0.1s',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 16,
                  alignItems: 'center',
                }}
                onMouseEnter={e => { if (expanded !== c.claim_id) e.currentTarget.style.background = 'var(--black3)'; }}
                onMouseLeave={e => { if (expanded !== c.claim_id) e.currentTarget.style.background = 'var(--black2)'; }}
              >
                <div>
                  <div style={{ fontSize: 14, color: 'var(--white2)', lineHeight: 1.4, marginBottom: 8 }}>{truncate(c.text, 100)}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--white4)', letterSpacing: '0.08em' }}>
                    <span>CONF {c.confidence != null ? (c.confidence * 100).toFixed(0) + '%' : '—'}</span>
                    <span style={{ color: '#4dff9f' }}>FAITH {pct(c.faithfulness_score)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                  <SeverityPill severity={c.severity} />
                  <span style={{ color: 'var(--white4)', fontSize: 18, transform: expanded === c.claim_id ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
                </div>
              </div>

              {expanded === c.claim_id && (
                <div style={{ background: 'var(--black3)', borderLeft: '3px solid var(--red)', padding: '1rem 20px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, color: 'var(--white3)' }}>
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'var(--white4)', marginBottom: 4 }}>CLAIM ID</div>
                      <div style={{ fontSize: 10, color: 'var(--white2)', wordBreak: 'break-all' }}>{c.claim_id}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'var(--white4)', marginBottom: 4 }}>DETECTED</div>
                      <div style={{ color: 'var(--white2)' }}>{shortDatetime(c.created_at)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'var(--white4)', marginBottom: 4 }}>FAITHFULNESS</div>
                      <div style={{ color: '#4dff9f', fontSize: 14, fontWeight: 500 }}>{pct(c.faithfulness_score)}</div>
                    </div>
                  </div>
                  {c.topic_tags?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'var(--white4)', marginBottom: 6 }}>TOPIC TAGS</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {c.topic_tags.map(t => (
                          <span key={t} style={{ background: 'var(--black4)', color: 'var(--white3)', padding: '2px 8px', fontSize: 10, letterSpacing: '0.05em' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}