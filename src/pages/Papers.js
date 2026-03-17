import React, { useState, useEffect } from 'react';
import { useAPI, apiFetch } from '../api';
import { Card, SectionHeader, Spinner, EmptyState, ErrorState, StatusPill, SeverityPill, shortDate, truncate, pct } from '../components/UI';

function PaperDetail({ paperId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/papers/${paperId}`)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [paperId]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 560, height: 'calc(100vh - 2rem)', background: 'var(--bg1)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', overflowY: 'auto', animation: 'fadeUp 0.2s ease' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg1)', zIndex: 1 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Paper detail</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        {loading ? <div style={{ padding: '2rem' }}><Spinner /></div> : !data ? <ErrorState msg="paper not found" /> : (
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20, fontWeight: 400, color: 'var(--text)', marginBottom: 12, lineHeight: 1.4 }}>{data.title}</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              {data.arxiv_id && (
                <a href={`https://arxiv.org/abs/${data.arxiv_id}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--blue)', textDecoration: 'none', background: 'var(--blue-bg)', padding: '2px 8px', borderRadius: 4 }}>
                  arXiv:{data.arxiv_id} ↗
                </a>
              )}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{shortDate(data.date)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{data.total_claims || 0} claims · {data.conflict_claims || 0} conflicts</span>
            </div>
            {data.authors?.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
                {data.authors.slice(0, 4).join(', ')}{data.authors.length > 4 ? ` +${data.authors.length - 4}` : ''}
              </div>
            )}
            {data.abstract && (
              <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.5rem', fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
                {data.abstract}
              </div>
            )}
            {data.claims?.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Extracted claims ({data.claims.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.claims.map(c => (
                    <div key={c.claim_id} style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: '10px 12px', borderLeft: `3px solid ${c.status === 'CONFLICT' ? 'var(--red)' : c.status === 'CONFIRMED' ? 'var(--green)' : 'var(--border2)'}` }}>
                      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6, lineHeight: 1.5 }}>{c.text}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <StatusPill status={c.status} />
                        {c.severity && <SeverityPill severity={c.severity} />}
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', marginLeft: 'auto' }}>
                          conf {c.confidence != null ? (c.confidence * 100).toFixed(0) + '%' : '—'} · faith {pct(c.faithfulness_score)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Papers() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const { data, loading, error } = useAPI('/papers?limit=50');

  const papers = (data?.papers || []).filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.arxiv_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem', maxWidth: 1100 }}>
      <div className="fade-up" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 38, fontWeight: 400, color: 'var(--text)' }}>Papers</h1>
        <p style={{ color: 'var(--text3)', fontSize: 13, fontFamily: 'var(--font-mono)', marginTop: 4 }}>ArXiv medical papers fetched and processed by the pipeline</p>
      </div>

      <div className="fade-up-1" style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search papers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: 420,
            background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: 'var(--radius)', padding: '8px 14px',
            color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 14,
            outline: 'none'
          }}
        />
      </div>

      {loading ? <Spinner /> : error ? <ErrorState msg={error} /> : papers.length === 0 ? <EmptyState msg="no papers found" /> : (
        <div className="fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {papers.map((p, i) => (
            <div
              key={p.paper_id}
              onClick={() => setSelectedId(p.paper_id)}
              style={{
                background: 'var(--bg1)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem',
                cursor: 'pointer', transition: 'border-color 0.15s',
                animationDelay: `${i * 0.03}s`
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 6, lineHeight: 1.4, fontWeight: 400 }}>{p.title}</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {p.arxiv_id && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--blue)' }}>arXiv:{p.arxiv_id}</span>}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{shortDate(p.date)}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{p.source}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: p.processed ? 'var(--accent)' : 'var(--text3)', background: p.processed ? 'rgba(200,245,66,0.08)' : 'transparent', padding: '2px 8px', borderRadius: 4 }}>
                    {p.processed ? '✓ processed' : 'pending'}
                  </span>
                  <span style={{ color: 'var(--text3)', fontSize: 16 }}>›</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedId && <PaperDetail paperId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}