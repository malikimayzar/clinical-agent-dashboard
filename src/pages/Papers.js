import React, { useState, useEffect } from 'react';
import { useAPI, apiFetch } from '../api';
import { SectionTitle, Spinner, EmptyState, ErrorState, StatusBadge, SeverityPill, shortDate, pct } from '../components/UI';

function PaperDrawer({ paperId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/papers/${paperId}`)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [paperId]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: '100%', maxWidth: 580, height: '100vh', background: 'var(--black2)', borderLeft: '2px solid var(--red)', overflowY: 'auto', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--black2)', zIndex: 1 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--white4)', letterSpacing: '0.2em' }}>PAPER DETAIL</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--white2)', cursor: 'crosshair', fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 900 }}>×</button>
        </div>
        {loading ? <div style={{ padding: '2rem' }}><Spinner /></div> : !data ? <ErrorState msg="not found" /> : (
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.01em', color: 'var(--white)', marginBottom: 16, lineHeight: 1.1 }}>{data.title}</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
              {data.arxiv_id && (
                <a href={`https://arxiv.org/abs/${data.arxiv_id}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--red)', textDecoration: 'none', letterSpacing: '0.08em', border: '1px solid var(--red)', padding: '2px 8px' }}>
                  ARXIV:{data.arxiv_id} ↗
                </a>
              )}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--white4)', letterSpacing: '0.08em' }}>{shortDate(data.date)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--white4)', letterSpacing: '0.08em' }}>{data.total_claims || 0} CLAIMS · {data.conflict_claims || 0} CONFLICTS</span>
            </div>
            {data.abstract && (
              <div style={{ background: 'var(--black3)', borderLeft: '2px solid var(--white4)', padding: '1rem', marginBottom: '1.5rem', fontSize: 13, color: 'var(--white3)', lineHeight: 1.7 }}>
                {data.abstract}
              </div>
            )}
            {data.claims?.length > 0 && (
              <>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--white4)', letterSpacing: '0.2em', marginBottom: 12 }}>EXTRACTED CLAIMS ({data.claims.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {data.claims.map(c => (
                    <div key={c.claim_id} style={{
                      background: 'var(--black3)',
                      borderLeft: `2px solid ${c.status === 'CONFLICT' ? 'var(--red)' : c.status === 'CONFIRMED' ? '#4dff9f' : 'var(--white4)'}`,
                      padding: '10px 12px',
                    }}>
                      <div style={{ fontSize: 13, color: 'var(--white2)', marginBottom: 8, lineHeight: 1.4 }}>{c.text}</div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <StatusBadge status={c.status} />
                        {c.severity && <SeverityPill severity={c.severity} />}
                        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--white4)', letterSpacing: '0.05em' }}>
                          {c.confidence != null ? (c.confidence * 100).toFixed(0) + '%' : '—'} · {pct(c.faithfulness_score)}
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
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.arxiv_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '2.5rem', maxWidth: 1200 }}>
      <div className="fade-in" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', lineHeight: 0.9 }}>
          ArXiv<br /><span style={{ color: 'var(--red)' }}>Papers</span>
        </h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--white3)', marginTop: 12, letterSpacing: '0.1em' }}>5 PAPERS/DAY · PARALLEL ASYNC FETCH · ~30S
        </div>
      </div>

      <div className="fade-in-1" style={{ marginBottom: '1.5rem' }}>
        <input type="text" placeholder="SEARCH PAPERS..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ background: 'var(--black2)', border: '1px solid var(--border2)', color: 'var(--white)', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '8px 14px', outline: 'none', letterSpacing: '0.05em', width: '100%', maxWidth: 400 }}
        />
      </div>

      {loading ? <Spinner /> : error ? <ErrorState msg={error} /> : papers.length === 0 ? <EmptyState /> : (
        <div className="fade-in-2" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {papers.map((p, i) => (
            <div key={p.paper_id} onClick={() => setSelectedId(p.paper_id)}
              style={{ background: 'var(--black2)', padding: '1rem 1.25rem', cursor: 'crosshair', transition: 'background 0.1s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, borderLeft: '2px solid transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--black3)'; e.currentTarget.style.borderLeftColor = 'var(--red)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--black2)'; e.currentTarget.style.borderLeftColor = 'transparent'; }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: 'var(--white)', marginBottom: 6, fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                <div style={{ display: 'flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--white4)', letterSpacing: '0.06em' }}>
                  {p.arxiv_id && <span style={{ color: 'var(--red)' }}>ARXIV:{p.arxiv_id}</span>}
                  <span>{shortDate(p.date)}</span>
                  <span>{p.source?.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: p.processed ? '#4dff9f' : 'var(--white4)', border: `1px solid ${p.processed ? '#4dff9f' : 'var(--white4)'}`, padding: '2px 8px' }}>
                  {p.processed ? 'PROCESSED' : 'PENDING'}
                </span>
                <span style={{ color: 'var(--red)', fontSize: 18, fontWeight: 900 }}>›</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedId && <PaperDrawer paperId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}