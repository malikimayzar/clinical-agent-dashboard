import React, { useState } from 'react';
import { useAPI, apiFetch } from '../api';
import { Spinner, EmptyState, ErrorState, StatusPill, SeverityPill, pct, shortDatetime, timeAgo } from '../components/UI';

function RunDetail({ runId, onClose }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiFetch(`/runs/${runId}`)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [runId]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 560, height: 'calc(100vh - 2rem)', background: 'var(--bg1)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', overflowY: 'auto', animation: 'fadeUp 0.2s ease' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg1)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Run detail</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        {loading ? <div style={{ padding: '2rem' }}><Spinner /></div> : !data ? <ErrorState msg="run not found" /> : (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: '1.5rem' }}>
              {[
                { l: 'Status', v: <StatusPill status={data.status} /> },
                { l: 'Started', v: shortDatetime(data.started_at) },
                { l: 'Papers', v: data.papers_processed },
                { l: 'Claims', v: data.claims_extracted },
                { l: 'Conflicts', v: data.conflicts_found },
                { l: 'Duration', v: data.finished_at ? Math.round((new Date(data.finished_at) - new Date(data.started_at)) / 1000) + 's' : '—' },
              ].map(({ l, v }) => (
                <div key={l} style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 14, color: 'var(--text)' }}>{v}</div>
                </div>
              ))}
            </div>
            {data.audit_log?.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Audit log ({data.audit_log.length} events)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {data.audit_log.map((l, i) => (
                    <div key={l.log_id || i} style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: 11 }}>{l.node}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: 10 }}>{l.label}</span>
                      </div>
                      {l.action && <div style={{ color: 'var(--text2)', fontSize: 12 }}>{l.action}</div>}
                      {l.claim_text && <div style={{ color: 'var(--text3)', fontSize: 11, marginTop: 2, fontStyle: 'italic' }}>{l.claim_text.slice(0, 80)}…</div>}
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
    <div style={{ padding: '2rem', maxWidth: 1100 }}>
      <div className="fade-up" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 38, fontWeight: 400, color: 'var(--text)' }}>Pipeline runs</h1>
        <p style={{ color: 'var(--text3)', fontSize: 13, fontFamily: 'var(--font-mono)', marginTop: 4 }}>Full history of autonomous pipeline executions</p>
      </div>

      {loading ? <Spinner /> : error ? <ErrorState msg={error} /> : runs.length === 0 ? <EmptyState msg="no runs found" /> : (
        <div className="fade-up-1" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {runs.map((r, i) => (
            <div
              key={r.run_id}
              onClick={() => setSelectedId(r.run_id)}
              style={{
                background: 'var(--bg1)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem',
                cursor: 'pointer', transition: 'border-color 0.15s',
                display: 'flex', alignItems: 'center', gap: 16,
                animationDelay: `${i * 0.02}s`
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ flexShrink: 0 }}>
                <StatusPill status={r.status} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text2)', flexWrap: 'wrap' }}>
                  <span>{shortDatetime(r.started_at)}</span>
                  <span style={{ color: 'var(--text3)' }}>·</span>
                  <span>{r.papers_processed ?? 0} papers</span>
                  <span>{r.claims_extracted ?? 0} claims</span>
                  {r.conflicts_found > 0 && <span style={{ color: 'var(--red)' }}>{r.conflicts_found} conflicts</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{timeAgo(r.started_at)}</span>
                <span style={{ color: 'var(--text3)' }}>›</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedId && <RunDetail runId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}