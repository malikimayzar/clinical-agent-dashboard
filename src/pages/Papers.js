import React, { useState, useEffect } from 'react';
import { useAPI, apiFetch } from '../api';

const API = 'https://clinical-agent-api-production.up.railway.app';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

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

function Countdown() {
  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const next = new Date(now);
      next.setUTCHours(2, 0, 0, 0);
      if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
      const diff = next - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const p = x => String(x).padStart(2, '0');
      setTimeStr(`${p(h)}:${p(m)}:${p(s)}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);
  return <span style={{ fontVariantNumeric: 'tabular-nums', color: '#ef4444', textShadow: '0 0 10px rgba(239,68,68,0.5)', fontFamily: 'var(--font-mono)', fontSize: 20, letterSpacing: '0.06em' }}>{timeStr}</span>;
}

function TerminalConsole({ isMobile, running }) {
  const [lines, setLines] = useState([]);
  const [cursor, setCursor] = useState(true);

  const LINES = [
    { text: '[PAPER MONITOR: STANDBY]', color: '#22c55e' },
    { text: 'No papers in database yet...', color: '#71717a' },
    { text: 'Fetches 5 ArXiv papers daily at 02:00 UTC', color: '#52525b' },
    { text: '> arxiv_service.py connected', color: '#22c55e' },
    { text: '> parallel async fetch: ready', color: '#22c55e' },
    { text: '> Go HTTP client: standby', color: '#3b82f6' },
    { text: '> Run pipeline manually to populate', color: '#71717a' },
  ];

  useEffect(() => {
    LINES.forEach((l, i) => setTimeout(() => setLines(prev => [...prev, l]), i * 180));
    const iv = setInterval(() => setCursor(c => !c), 500);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (running) {
      setLines(prev => [...prev,
        { text: '> [MANUAL TRIGGER] Pipeline starting...', color: '#f59e0b' },
        { text: '> Fetching ArXiv papers...', color: '#f59e0b' },
      ]);
    }
  }, [running]);

  return (
    <div style={{ background: '#060608', border: '1px solid #1c1c1e', borderLeft: '2px solid #22c55e', maxWidth: isMobile ? '100%' : 540 }}>
      <div style={{ padding: '6px 12px', borderBottom: '1px solid #1c1c1e', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ef4444', '#f59e0b', '#22c55e'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.7 }} />)}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.15em' }}>TERMINAL — paper_monitor.py</span>
      </div>
      <div style={{ padding: '12px', minHeight: isMobile ? 140 : 180 }}>
        {lines.map((l, i) => <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 10 : 12, color: l.color, marginBottom: 4 }}>{l.text}</div>)}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 10 : 12, color: '#22c55e', opacity: cursor ? 1 : 0, transition: 'opacity 0.1s' }}>█</span>
      </div>
      <div style={{ padding: '8px 12px', borderTop: '1px solid #1c1c1e', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.1em' }}>NEXT_RUN:</span>
        <Countdown />
      </div>
    </div>
  );
}

function PaperDrawer({ paperId, onClose, isMobile }) {
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
      <div style={{ width: '100%', maxWidth: isMobile ? '95%' : 580, height: '100vh', background: '#09090b', borderLeft: '2px solid #ef4444', overflowY: 'auto', animation: 'pa-drawer 0.2s ease', boxShadow: '-8px 0 32px rgba(239,68,68,0.1)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #1c1c1e', position: 'sticky', top: 0, background: '#09090b', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.2em' }}>PAPER DETAIL</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'crosshair', fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700 }}>×</button>
        </div>
        {loading ? (
          <div style={{ padding: '2rem', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#52525b' }}>LOADING...</div>
        ) : !data ? (
          <div style={{ padding: '2rem', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ef4444' }}>ERR: NOT FOUND</div>
        ) : (
          <div style={{ padding: '20px' }}>
            <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 22, color: '#f4f4f5', lineHeight: 1.2, marginBottom: 14 }}>{data.title}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {data.arxiv_id && (
                <a href={`https://arxiv.org/abs/${data.arxiv_id}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '2px 8px', textDecoration: 'none', letterSpacing: '0.08em' }}
                >ARXIV:{data.arxiv_id} ↗</a>
              )}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', border: '1px solid #27272a', padding: '2px 8px' }}>{shortDate(data.date)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: data.processed ? '#22c55e' : '#52525b', border: `1px solid ${data.processed ? '#22c55e44' : '#27272a'}`, padding: '2px 8px' }}>
                {data.processed ? '✓ PROCESSED' : 'PENDING'}
              </span>
            </div>
            {data.abstract && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.15em', marginBottom: 8 }}>ABSTRACT</div>
                <div style={{ background: '#111113', borderLeft: '2px solid #27272a', padding: '12px 14px', fontSize: 13, color: '#71717a', lineHeight: 1.7 }}>{data.abstract}</div>
              </div>
            )}
            {data.claims?.length > 0 && (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.15em', marginBottom: 10 }}>EXTRACTED CLAIMS ({data.claims.length})</div>
                {data.claims.map(c => {
                  const col = c.status === 'CONFLICT' ? '#ef4444' : c.status === 'CONFIRMED' ? '#22c55e' : '#3b82f6';
                  return (
                    <div key={c.claim_id} style={{ background: '#111113', borderLeft: `2px solid ${col}44`, padding: '10px 12px', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 6, lineHeight: 1.5 }}>{c.text}</div>
                      <div style={{ display: 'flex', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 9 }}>
                        <span style={{ color: col, border: `1px solid ${col}33`, padding: '1px 6px' }}>{c.status}</span>
                        {c.confidence && <span style={{ color: '#52525b' }}>CONF {(c.confidence * 100).toFixed(0)}%</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PaperRow({ paper, index, onClick, isMobile }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={() => onClick(paper.paper_id)}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? '#161618' : '#111113', borderLeft: `2px solid ${hovered ? '#ef4444' : 'transparent'}`, borderBottom: '1px solid #1c1c1e', padding: isMobile ? '12px 14px' : '14px 16px', cursor: 'crosshair', transition: 'all 0.1s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, animation: `pa-stagger 0.3s ${index * 0.04}s ease both`, opacity: 0, boxShadow: hovered ? '0 0 12px rgba(239,68,68,0.05)' : 'none' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: isMobile ? 13 : 14, color: hovered ? '#f4f4f5' : '#d4d4d8', marginBottom: 5, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.1s' }}>{paper.title}</div>
        <div style={{ display: 'flex', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', flexWrap: 'wrap' }}>
          {paper.arxiv_id && <span style={{ color: '#ef4444', textShadow: hovered ? '0 0 5px rgba(239,68,68,0.4)' : 'none', transition: 'text-shadow 0.2s' }}>ARXIV:{paper.arxiv_id}</span>}
          <span>{shortDate(paper.date)}</span>
          <span style={{ color: '#22c55e', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', padding: '0 5px', boxShadow: hovered ? '0 0 5px rgba(34,197,94,0.3)' : 'none', transition: 'box-shadow 0.2s' }}>[RUST: &lt;50MS]</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: paper.processed ? '#22c55e' : '#52525b', border: `1px solid ${paper.processed ? '#22c55e44' : '#27272a'}`, padding: '2px 7px', boxShadow: paper.processed && hovered ? '0 0 6px rgba(34,197,94,0.3)' : 'none', transition: 'box-shadow 0.2s' }}>
          {paper.processed ? '✓ PROCESSED' : 'PENDING'}
        </span>
        <span style={{ color: '#ef4444', fontSize: 16, fontWeight: 900 }}>›</span>
      </div>
    </div>
  );
}

export default function Papers() {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState(null);

  const { data, loading, error } = useAPI('/papers?limit=50');
  const papers = (data?.papers || []).filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.arxiv_id?.toLowerCase().includes(search.toLowerCase())
  );

  const runPipeline = async () => {
    if (running) return;
    setRunning(true);
    setRunMsg({ text: 'Triggering pipeline...', color: '#f59e0b' });
    try {
      const res = await fetch(`${API}/trigger`, { method: 'POST' });
      if (res.ok) {
        setRunMsg({ text: '✓ Pipeline triggered! Check Runs page.', color: '#22c55e' });
      } else {
        setRunMsg({ text: 'Manual run: python scheduler/daily_runner.py --run-now', color: '#71717a' });
      }
    } catch {
      setRunMsg({ text: 'Manual run: python scheduler/daily_runner.py --run-now', color: '#71717a' });
    }
    setRunning(false);
    setTimeout(() => setRunMsg(null), 6000);
  };

  return (
    <div style={{ padding: isMobile ? '16px' : '20px 28px', maxWidth: 1200, background: '#09090b', minHeight: '100vh', position: 'relative' }}>
      <style>{`
        @keyframes pa-stagger { from{opacity:0;transform:translateX(-8px);}to{opacity:1;transform:translateX(0);} }
        @keyframes pa-slide   { from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);} }
        @keyframes pa-drawer  { from{transform:translateX(20px);opacity:0;}to{transform:translateX(0);opacity:1;} }
        @keyframes pa-pulse   { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.3;transform:scale(0.7);} }
        @keyframes pa-scan    { 0%{top:0;}100%{top:100%;} }
      `}</style>
      <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'rgba(34,197,94,0.04)', animation: 'pa-scan 6s linear infinite', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <div style={{ borderBottom: '1px solid #27272a', paddingBottom: 14, marginBottom: 20, position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 'clamp(40px,11vw,56px)' : 72, letterSpacing: '0.04em', lineHeight: 0.95, color: '#f4f4f5' }}>ARXIV</div>
        <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 'clamp(40px,11vw,56px)' : 72, letterSpacing: '0.04em', lineHeight: 0.95, color: '#ef4444', textShadow: '0 0 24px rgba(239,68,68,0.25)', marginBottom: 10 }}>PAPERS</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 10, color: '#71717a', letterSpacing: '0.15em', lineHeight: 1.6 }}>
          5 PAPERS/DAY · PARALLEL ASYNC FETCH · ~30S · <span style={{ color: '#22d3ee', textShadow: '0 0 5px rgba(34,211,238,0.4)' }}>GO</span> + <span style={{ color: '#f59e0b', textShadow: '0 0 5px rgba(245,158,11,0.4)' }}>PYTHON</span> CLIENT
        </div>
      </div>

      {/* Search + Run */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        <input type="text" placeholder="SEARCH PAPERS..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: '#111113', border: '1px solid #27272a', color: '#d4d4d8', padding: '8px 14px', outline: 'none', letterSpacing: '0.05em', flex: 1, minWidth: isMobile ? 0 : 240, minHeight: isMobile ? 44 : 'auto', transition: 'border-color 0.2s' }}
          onFocus={e => e.target.style.borderColor = '#3f3f46'} onBlur={e => e.target.style.borderColor = '#27272a'}
        />
        <button onClick={runPipeline} disabled={running} style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 10 : 9, letterSpacing: '0.1em', color: running ? '#52525b' : '#f59e0b', background: running ? 'transparent' : 'rgba(245,158,11,0.08)', border: `1px solid ${running ? '#27272a' : 'rgba(245,158,11,0.4)'}`, padding: isMobile ? '10px 14px' : '6px 14px', cursor: running ? 'not-allowed' : 'crosshair', transition: 'all 0.2s', whiteSpace: 'nowrap', minHeight: isMobile ? 44 : 'auto', boxShadow: running ? 'none' : '0 0 8px rgba(245,158,11,0.15)' }}>
          {running ? '◌ RUNNING...' : '▶ RUN PIPELINE NOW'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', animation: 'pa-pulse 1.5s ease infinite', boxShadow: '0 0 6px rgba(34,197,94,0.6)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>AUTO 02:00 UTC</span>
        </div>
      </div>

      {runMsg && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: runMsg.color, padding: '4px 0 8px', letterSpacing: '0.06em', animation: 'pa-slide 0.2s ease' }}>
          &gt; {runMsg.text}
        </div>
      )}

      {data?.count != null && papers.length > 0 && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.1em', marginBottom: 8 }}>
          {papers.length} PAPERS · {data.papers?.filter(p => p.processed).length || 0} PROCESSED
        </div>
      )}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {loading ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#52525b', letterSpacing: '0.1em', padding: '2rem 0' }}>LOADING...</div>
        ) : error ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ef4444', padding: '2rem 0' }}>ERR: {error}</div>
        ) : papers.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TerminalConsole isMobile={isMobile} running={running} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {papers.map((p, i) => <PaperRow key={p.paper_id} paper={p} index={i} onClick={setSelectedId} isMobile={isMobile} />)}
          </div>
        )}
      </div>

      {selectedId && <PaperDrawer paperId={selectedId} onClose={() => setSelectedId(null)} isMobile={isMobile} />}
    </div>
  );
}