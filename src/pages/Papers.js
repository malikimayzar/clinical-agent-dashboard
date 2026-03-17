import React, { useState, useEffect } from 'react';
import { useAPI, apiFetch } from '../api';

function timeAgo(s) {
  if (!s) return '—';
  const diff = Date.now() - new Date(s).getTime();
  const h = Math.floor(diff / 3600000), m = Math.floor(diff / 60000);
  if (h > 24) return Math.floor(h / 24) + 'D AGO';
  if (h > 0) return h + 'H AGO';
  if (m > 0) return m + 'M AGO';
  return 'JUST NOW';
}

function shortDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase();
}

function pct(v) { return v != null ? (v * 100).toFixed(1) + '%' : '—'; }

const STATUS_CONFIG = {
  CONFLICT:  { color: '#ef4444', label: 'CONFLICT' },
  CONFIRMED: { color: '#22c55e', label: 'CONFIRMED' },
  NEW:       { color: '#3b82f6', label: 'NEW' },
  UNCERTAIN: { color: '#eab308', label: 'UNCERTAIN' },
};

function PaperDrawer({ paperId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/papers/${paperId}`)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [paperId]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: '100%', maxWidth: 600, height: '100vh',
        background: '#09090b', borderLeft: '2px solid #ef4444',
        overflowY: 'auto', animation: 'drawer-in 0.2s ease',
      }}>
        <style>{`@keyframes drawer-in { from{transform:translateX(20px);opacity:0;} to{transform:translateX(0);opacity:1;} }`}</style>

        {/* Drawer header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c1c1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#09090b', zIndex: 1 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.2em' }}>PAPER DETAIL</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'crosshair', fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700 }}>×</button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#52525b', letterSpacing: '0.1em' }}>LOADING...</div>
        ) : !data ? (
          <div style={{ padding: '2rem', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ef4444' }}>ERR: PAPER NOT FOUND</div>
        ) : (
          <div style={{ padding: '20px' }}>

            {/* Title */}
            <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 28, letterSpacing: '0.02em', color: '#f4f4f5', lineHeight: 1.1, marginBottom: 16 }}>
              {data.title}
            </div>

            {/* Meta badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
              {data.arxiv_id && (
                <a href={`https://arxiv.org/abs/${data.arxiv_id}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ef4444', textDecoration: 'none', border: '1px solid #ef444444', padding: '2px 8px', letterSpacing: '0.08em', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >ARXIV:{data.arxiv_id} ↗</a>
              )}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#52525b', letterSpacing: '0.08em', border: '1px solid #27272a', padding: '2px 8px' }}>{shortDate(data.date)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: data.processed ? '#22c55e' : '#52525b', border: `1px solid ${data.processed ? '#22c55e44' : '#27272a'}`, padding: '2px 8px', letterSpacing: '0.08em' }}>
                {data.processed ? '✓ PROCESSED' : 'PENDING'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#52525b', letterSpacing: '0.08em' }}>
                {data.total_claims || 0} CLAIMS · {data.conflict_claims || 0} CONFLICTS
              </span>
            </div>

            {/* Authors */}
            {data.authors?.length > 0 && (
              <div style={{ marginBottom: 16, fontFamily: 'var(--font-mono)', fontSize: 10, color: '#3f3f46', letterSpacing: '0.06em', lineHeight: 1.6 }}>
                {data.authors.slice(0, 5).join(' · ')}{data.authors.length > 5 ? ` +${data.authors.length - 5} MORE` : ''}
              </div>
            )}

            {/* Abstract */}
            {data.abstract && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.15em', marginBottom: 8 }}>ABSTRACT</div>
                <div style={{ background: '#111113', borderLeft: '2px solid #27272a', padding: '12px 14px', fontSize: 13, color: '#71717a', lineHeight: 1.7 }}>
                  {data.abstract}
                </div>
              </div>
            )}

            {/* Claims */}
            {data.claims?.length > 0 && (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.15em', marginBottom: 10 }}>
                  EXTRACTED CLAIMS ({data.claims.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {data.claims.map(c => {
                    const st = STATUS_CONFIG[c.status] || { color: '#52525b', label: c.status };
                    return (
                      <div key={c.claim_id} style={{ background: '#111113', borderLeft: `2px solid ${st.color}44`, padding: '10px 12px' }}>
                        <div style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 8, lineHeight: 1.5 }}>{c.text}</div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: st.color, border: `1px solid ${st.color}33`, padding: '1px 6px', letterSpacing: '0.1em' }}>{st.label}</span>
                          {c.severity && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: c.severity === 'critical' ? '#ef4444' : c.severity === 'major' ? '#f97316' : '#71717a', letterSpacing: '0.08em' }}>{c.severity.toUpperCase()}</span>
                          )}
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', marginLeft: 'auto', letterSpacing: '0.05em' }}>
                            CONF {c.confidence != null ? (c.confidence * 100).toFixed(0) + '%' : '—'} · FAITH {pct(c.faithfulness_score)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  const [lines, setLines] = useState([]);
  const LINES = [
    { text: '[PAPER MONITOR: STANDBY]', color: '#22c55e' },
    { text: 'No papers in database yet...', color: '#52525b' },
    { text: 'Fetches 5 ArXiv papers daily at 02:00 UTC', color: '#3f3f46' },
    { text: '> arxiv_service.py connected', color: '#22c55e' },
    { text: '> parallel async fetch: ready', color: '#22c55e' },
    { text: '> Run pipeline manually to populate', color: '#52525b' },
    { text: '█', color: '#22c55e', blink: true },
  ];
  useEffect(() => {
    LINES.forEach((l, i) => {
      setTimeout(() => setLines(prev => [...prev, l]), i * 180);
    });
  }, []);
  return (
    <div style={{ background: '#0a0a0c', border: '1px solid #1c1c1e', borderLeft: '2px solid #22c55e', padding: '24px 20px', maxWidth: 480, fontFamily: 'var(--font-mono)' }}>
      <style>{`@keyframes em-blink{0%,100%{opacity:1;}50%{opacity:0;}}`}</style>
      <div style={{ fontSize: 9, color: '#3f3f46', letterSpacing: '0.15em', marginBottom: 12 }}>TERMINAL — paper_monitor.py</div>
      {lines.map((l, i) => (
        <div key={i} style={{ fontSize: 12, color: l.color, marginBottom: 4, animation: l.blink ? 'em-blink 1s ease infinite' : 'none' }}>{l.text}</div>
      ))}
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
    <div style={{ padding: '20px 28px', maxWidth: 1200, background: '#09090b', minHeight: '100vh' }}>
      <style>{`
        @keyframes ca-stagger { from{opacity:0;transform:translateX(-8px);}to{opacity:1;transform:translateX(0);} }
        @keyframes ca-pulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(0.85);} }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #27272a', paddingBottom: 14, marginBottom: 24 }}>
        <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 64, letterSpacing: '0.04em', lineHeight: 1, color: '#f4f4f5' }}>ARXIV</div>
        <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 64, letterSpacing: '0.04em', lineHeight: 1, color: '#ef4444' }}>PAPERS</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#52525b', marginTop: 10, letterSpacing: '0.15em' }}>
          5 PAPERS/DAY · PARALLEL ASYNC FETCH · ~30S · GO + PYTHON CLIENT
        </div>
      </div>

      {/* Search + count */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <input type="text" placeholder="SEARCH PAPERS..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: '#111113', border: '1px solid #27272a', color: '#d4d4d8', padding: '6px 14px', outline: 'none', letterSpacing: '0.05em', width: '100%', maxWidth: 400, transition: 'border-color 0.2s' }}
          onFocus={e => e.target.style.borderColor = '#3f3f46'}
          onBlur={e => e.target.style.borderColor = '#27272a'}
        />
        {data?.count != null && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#3f3f46', letterSpacing: '0.1em', marginLeft: 'auto' }}>
            {papers.length} PAPERS
          </span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', animation: 'ca-pulse 1.5s ease infinite' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.1em' }}>AUTO-FETCH 02:00 UTC</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#52525b', letterSpacing: '0.1em', padding: '2rem 0' }}>LOADING...</div>
      ) : error ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ef4444', padding: '2rem 0' }}>ERR: {error}</div>
      ) : papers.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {papers.map((p, i) => (
            <div key={p.paper_id}
              onClick={() => setSelectedId(p.paper_id)}
              style={{
                background: '#111113',
                borderLeft: '2px solid transparent',
                padding: '14px 16px',
                cursor: 'crosshair',
                transition: 'all 0.1s',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                animation: `ca-stagger 0.3s ${i * 0.04}s ease both`,
                opacity: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#161618'; e.currentTarget.style.borderLeftColor = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#111113'; e.currentTarget.style.borderLeftColor = 'transparent'; }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Title */}
                <div style={{ fontSize: 14, color: '#d4d4d8', marginBottom: 6, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.title}
                </div>
                {/* Meta */}
                <div style={{ display: 'flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 10, color: '#3f3f46', letterSpacing: '0.06em', flexWrap: 'wrap' }}>
                  {p.arxiv_id && <span style={{ color: '#ef4444' }}>ARXIV:{p.arxiv_id}</span>}
                  <span>{shortDate(p.date)}</span>
                  <span>{p.source?.toUpperCase() || 'ARXIV'}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#22c55e', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', padding: '0 5px' }}>
                    [RUST-ENGINE: &lt;50MS]
                  </span>
                </div>
              </div>

              {/* Status + arrow */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
                  color: p.processed ? '#22c55e' : '#52525b',
                  border: `1px solid ${p.processed ? '#22c55e44' : '#27272a'}`,
                  padding: '2px 8px',
                  background: p.processed ? 'rgba(34,197,94,0.04)' : 'transparent',
                }}>
                  {p.processed ? '✓ PROCESSED' : 'PENDING'}
                </span>
                <span style={{ color: '#ef4444', fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>›</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedId && <PaperDrawer paperId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}