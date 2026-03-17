import React, { useState } from 'react';
import { useAPI } from '../api';
import { Card, SectionHeader, Spinner, EmptyState, ErrorState, SeverityPill, StatusPill, pct, shortDate, shortDatetime } from '../components/UI';

const SEVERITIES = ['all', 'critical', 'major', 'minor'];

export default function Conflicts() {
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const url = filter === 'all' ? '/conflicts?limit=50' : `/conflicts?limit=50&severity=${filter}`;
  const { data, loading, error } = useAPI(url, [filter]);
  const conflicts = data?.conflicts || [];

  return (
    <div style={{ padding: '2rem', maxWidth: 1100 }}>
      <div className="fade-up" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 38, fontWeight: 400, color: 'var(--text)' }}>Conflicts</h1>
        <p style={{ color: 'var(--text3)', fontSize: 13, fontFamily: 'var(--font-mono)', marginTop: 4 }}>NLI-detected contradictions between extracted claims and the knowledge base</p>
      </div>

      {/* Severity filter tabs */}
      <div className="fade-up-1" style={{ display: 'flex', gap: 6, marginBottom: '1.5rem' }}>
        {SEVERITIES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              background: filter === s ? 'var(--bg3)' : 'transparent',
              border: `1px solid ${filter === s ? 'var(--border2)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: '5px 14px',
              color: filter === s ? 'var(--text)' : 'var(--text3)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {s === 'all' ? 'all' : s}
            {s === 'critical' && <span style={{ marginLeft: 4, color: 'var(--red)' }}>●</span>}
            {s === 'major' && <span style={{ marginLeft: 4, color: 'var(--amber)' }}>●</span>}
            {s === 'minor' && <span style={{ marginLeft: 4, color: 'var(--blue)' }}>●</span>}
          </button>
        ))}
        {data?.count != null && (
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)', alignSelf: 'center' }}>
            {data.count} results
          </span>
        )}
      </div>

      {loading ? <Spinner /> : error ? <ErrorState msg={error} /> : conflicts.length === 0 ? <EmptyState msg="no conflicts found" /> : (
        <div className="fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {conflicts.map((c, i) => (
            <div key={c.claim_id} style={{ animationDelay: `${i * 0.02}s` }}>
              <div
                onClick={() => setExpanded(expanded === c.claim_id ? null : c.claim_id)}
                style={{
                  background: 'var(--bg1)',
                  border: `1px solid ${expanded === c.claim_id ? 'var(--border2)' : 'var(--border)'}`,
                  borderRadius: expanded === c.claim_id ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
                  padding: '1rem 1.25rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                  borderLeft: `3px solid ${c.severity === 'critical' ? 'var(--red)' : c.severity === 'major' ? 'var(--amber)' : 'var(--blue)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{c.text || '—'}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <SeverityPill severity={c.severity} />
                    <span style={{ color: 'var(--text3)', fontSize: 14, transform: expanded === c.claim_id ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
                  <span>conf {c.confidence != null ? (c.confidence * 100).toFixed(0) + '%' : '—'}</span>
                  <span style={{ color: 'var(--accent)' }}>faith {pct(c.faithfulness_score)}</span>
                  <span>{shortDate(c.created_at)}</span>
                </div>
              </div>

              {expanded === c.claim_id && (
                <div style={{
                  background: 'var(--bg2)', border: '1px solid var(--border2)',
                  borderTop: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                  padding: '1rem 1.25rem',
                  fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--font-mono)'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>claim id</div>
                      <div style={{ color: 'var(--text2)', fontSize: 11, wordBreak: 'break-all' }}>{c.claim_id}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>detected</div>
                      <div style={{ color: 'var(--text2)' }}>{shortDatetime(c.created_at)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>faithfulness</div>
                      <div style={{ color: 'var(--accent)' }}>{pct(c.faithfulness_score)}</div>
                    </div>
                  </div>
                  {c.topic_tags?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>topic tags</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {c.topic_tags.map(t => (
                          <span key={t} style={{ background: 'var(--bg3)', color: 'var(--text2)', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{t}</span>
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