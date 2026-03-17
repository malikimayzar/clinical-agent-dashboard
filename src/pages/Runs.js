import React, { useState } from 'react';
import { useAPI, apiFetch } from '../api';
import { Spinner, EmptyState, ErrorState, StatusBadge, shortDatetime, timeAgo } from '../components/UI';

function RunDrawer({ runId, onClose }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiFetch(`/runs/${runId}`)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [runId]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: '100%', maxWidth: 560, height: '100vh', background: 'var(--black2)', borderLeft: '2px solid var(--red)', overflowY: 'auto' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--black2)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--white4)', letterSpacing: '0.2em' }}>RUN DETAIL</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--white2)', cursor: 'crosshair', fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 900 }}>×</button>
        </div>
        {loading ? <div style={{ padding: '2rem' }}><Spinner /></div> : !data ? <ErrorState msg="not found" /> : (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 2, marginBottom: '1.5rem' }}>
              {[
                { l: 'STATUS', v: <StatusBadge status={data.status} /> },
                { l: 'STARTED', v: shortDatetime(data.started_at) },
                { l: 'PAPERS', v: data.papers_processed },
                { l: 'CLAIMS', v: data.claims_extracted },
                { l: 'CONFLICTS', v: <span style={{ color: data.conflicts_found > 0 ? 'var(--red)' : 'var(--white2)', fontWeight: data.conflicts_found > 0 ? 700 : 300 }}>{data.conflicts_found}</span> },
                { l: 'DURATION', v: data.finished_at ? Math.round((new Date(data.finished_at) - new Date(data.started_at)) / 1000) + 'S' : '—' },
              ].map(({ l, v }) => (
                <div key={l} style={{ background: 'var(--black3)', padding: '12px 14px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--white4)', letterSpacing: '0.15em', marginBottom: 6 }}>{l}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--white)' }}>{v}</div>
                </div>
              ))}
            </div>
            {data.audit_log?.length > 0 && (
              <>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--white4)', letterSpacing: '0.2em', marginBottom: 10 }}>AUDIT LOG ({data.audit_log.length} EVENTS)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {data.audit_log.map((l, i) => (
                    <div key={l.log_id || i} style={{ background: 'var(--black3)', padding: '8px 12px', borderLeft: '2px solid var(--white4)', fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)', fontSize: 10, letterSpacing: '0.1em' }}>{l.node?.toUpperCase()}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--white4)', fontSize: 9, letterSpacing: '0.08em' }}>{l.label}</span>
                      </div>
                      {l.action && <div style={{ color: 'var(--white3)', fontSize: 12 }}>{l.action}</div>}
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

export default function Runs() {
  const [selectedId, setSelectedId] = useState(null);
  const { data, loading, error } = useAPI('/runs?limit=30');
  const runs = data?.runs || [];

  return (
    <div style={{ padding: '2.5rem', maxWidth: 1200 }}>
      <div className="fade-in" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', lineHeight: 0.9 }}>
          Pipeline<br /><span style={{ color: 'var(--red)' }}>Runs</span>
        </h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--white3)', marginTop: 12, letterSpacing: '0.1em' }}>FULL EXECUTION HISTORY · ~40S/RUN · 97× SPEEDUP</div>
      </div>

      {loading ? <Spinner /> : error ? <ErrorState msg={error} /> : runs.length === 0 ? <EmptyState /> : (
        <div className="fade-in-1" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {runs.map((r, i) => (
            <div key={r.run_id} onClick={() => setSelectedId(r.run_id)}
              style={{ background: 'var(--black2)', padding: '14px 20px', cursor: 'crosshair', transition: 'all 0.1s', display: 'flex', alignItems: 'center', gap: 20, borderLeft: '2px solid transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--black3)'; e.currentTarget.style.borderLeftColor = 'var(--red)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--black2)'; e.currentTarget.style.borderLeftColor = 'transparent'; }}
            >
              <StatusBadge status={r.status} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--white2)', marginBottom: 4, letterSpacing: '0.03em' }}>{shortDatetime(r.started_at)}</div>
                <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--white4)', letterSpacing: '0.06em' }}>
                  <span>{r.papers_processed ?? 0} PAPERS</span>
                  <span>{r.claims_extracted ?? 0} CLAIMS</span>
                  {r.conflicts_found > 0 && <span style={{ color: 'var(--red)', fontWeight: 600 }}>{r.conflicts_found} CONFLICTS</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--white4)', letterSpacing: '0.1em' }}>{timeAgo(r.started_at)}</span>
                <span style={{ color: 'var(--red)', fontSize: 18, fontWeight: 900 }}>›</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedId && <RunDrawer runId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}