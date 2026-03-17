import React, { useState, useEffect, useRef, useCallback } from 'react';
import Overview from './pages/Overview';
import Papers from './pages/Papers';
import Conflicts from './pages/Conflicts';
import Runs from './pages/Runs';
import Claims from './pages/Claims';
import System from './pages/System';

const NAV = [
  { id: 'overview',  label: 'Overview',  num: '01', key: '1', icon: '◈' },
  { id: 'conflicts', label: 'Conflicts', num: '02', key: '2', icon: '⚠' },
  { id: 'claims',    label: 'Claims',    num: '03', key: '3', icon: '◎' },
  { id: 'papers',    label: 'Papers',    num: '04', key: '4', icon: '◻' },
  { id: 'runs',      label: 'Runs',      num: '05', key: '5', icon: '▶' },
  { id: 'system',    label: 'System',    num: '06', key: '6', icon: '⬡' },
];

const SOCIAL_LINKS = [
  { num: '01', label: 'GITHUB',    handle: 'malikimayzar',    url: 'https://github.com/malikimayzar' },
  { num: '02', label: 'LINKEDIN',  handle: 'in/malikimayzar', url: 'https://www.linkedin.com/in/malikimayzar' },
  { num: '03', label: 'INSTAGRAM', handle: 'malikimayzar',    url: 'https://www.instagram.com/malikimayzar?igsh=emxmb3B3M2dldTh4' },
];

const STACK = [
  { layer: 'PERF',  tech: 'RUST / ACTIX-WEB',     color: '#22c55e' },
  { layer: 'NET',   tech: 'GO / FIBER',            color: '#22d3ee' },
  { layer: 'AGENT', tech: 'PY / LANGGRAPH',        color: '#f59e0b' },
  { layer: 'DB',    tech: 'PG / PGVECTOR',         color: '#818cf8' },
  { layer: 'LLM',   tech: 'GROQ / LLAMA-3.3-70B', color: '#a78bfa' },
];

const INFRA = [
  { label: 'ORCHESTRATOR', val: 'LANGGRAPH (8 NODES)' },
  { label: 'PRIMARY_LLM',  val: 'LLAMA-3.3-70B (GROQ)' },
  { label: 'SIMILARITY',   val: 'RUST BM25+COSINE' },
  { label: 'STORAGE',      val: 'POSTGRESQL+PGVECTOR' },
  { label: 'SCHEDULE',     val: 'APSCHEDULER CRON' },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
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
  return <span style={{ color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>;
}

function UTCClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const p = x => String(x).padStart(2, '0');
      setTime(`${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</span>;
}

function HealthDots() {
  const [status, setStatus] = useState({ api: null, db: null });
  useEffect(() => {
    fetch('https://clinical-agent-api-production.up.railway.app/health')
      .then(r => r.json())
      .then(d => setStatus({ api: true, db: d.database === 'connected' }))
      .catch(() => setStatus({ api: false, db: false }));
  }, []);
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {[{ l: 'API', ok: status.api }, { l: 'DB', ok: status.db }, { l: 'RUST', ok: true }].map(d => (
        <div key={d.l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: d.ok === null ? '#3f3f46' : d.ok ? '#22c55e' : '#ef4444' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#3f3f46', letterSpacing: '0.08em' }}>{d.l}</span>
        </div>
      ))}
    </div>
  );
}

function SidebarContent({ page, setPage, onClose, isMobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>

      {/* Logo */}
      <div style={{ padding: '16px', borderBottom: '1px solid #1c1c1e', flexShrink: 0 }}>
        <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 24, letterSpacing: '0.02em', color: '#f4f4f5', lineHeight: 1 }}>
          CLINICAL<br /><span style={{ color: '#ef4444' }}>AGENT</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a', letterSpacing: '0.15em' }}>V3.0.0 · AUTONOMOUS</div>
          <HealthDots />
        </div>
      </div>

      {/* Navigation — top on mobile */}
      <nav style={{ padding: '8px 0', flexShrink: 0 }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => { setPage(n.id); if (onClose) onClose(); }}
            style={{
              width: '100%', textAlign: 'left', background: 'none', border: 'none',
              borderLeft: page === n.id ? '2px solid #ef4444' : '2px solid transparent',
              padding: isMobile ? '13px 16px' : '9px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'crosshair', transition: 'all 0.1s',
              minHeight: isMobile ? 48 : 'auto',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#161618'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: page === n.id ? '#ef4444' : '#27272a', letterSpacing: '0.1em', width: 14 }}>{n.num}</span>
            <span style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 20 : 16, textTransform: 'uppercase', letterSpacing: '0.04em', color: page === n.id ? '#f4f4f5' : '#52525b', flex: 1 }}>{n.label}</span>
            {!isMobile && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a' }}>[{n.key}]</span>}
          </button>
        ))}
      </nav>

      {/* Operator — bottom on mobile */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1c1c1e', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a', letterSpacing: '0.2em', marginBottom: 8 }}>[OPERATOR]</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, flexShrink: 0, background: '#111113', border: '1px solid #ef444444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#ef4444' }}>MM</div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#d4d4d8', letterSpacing: '0.06em' }}>MALIKI MAYZAR</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#52525b', letterSpacing: '0.08em', marginTop: 1 }}>ASPIRING AI ENGINEER</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {SOCIAL_LINKS.map(l => (
            <a key={l.num} href={l.url} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', textDecoration: 'none', border: '1px solid #1c1c1e', padding: isMobile ? '8px' : '4px 8px', letterSpacing: '0.06em', display: 'flex', gap: 6, alignItems: 'center', transition: 'all 0.15s', minHeight: isMobile ? 44 : 'auto' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#3f3f46'; e.currentTarget.style.borderColor = '#1c1c1e'; }}
            >
              <span style={{ color: '#27272a', fontSize: 8 }}>{l.num}</span>
              <span style={{ color: '#52525b' }}>{l.label}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 8 }}>{l.handle}</span>
              <span style={{ fontSize: 8 }}>↗</span>
            </a>
          ))}
        </div>
      </div>

      {/* Infra */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #1c1c1e', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a', letterSpacing: '0.2em', marginBottom: 6 }}>[SYSTEM_INFRA]</div>
        {INFRA.map(({ label, val }) => (
          <div key={label} style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#3f3f46', letterSpacing: '0.06em', width: 80, flexShrink: 0 }}>{label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
          </div>
        ))}
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #1c1c1e' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a', letterSpacing: '0.1em', marginBottom: 2 }}>NEXT_RUN</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}><Countdown /></div>
        </div>
      </div>

      {/* Stack */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #1c1c1e', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a', letterSpacing: '0.2em', marginBottom: 6 }}>[TECH_STACK]</div>
        {STACK.map(({ layer, tech, color }) => (
          <div key={layer} style={{ display: 'flex', gap: 6, marginBottom: 3, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a', width: 36, flexShrink: 0 }}>{layer}</span>
            <span style={{ width: 1, height: 8, background: '#1c1c1e', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color }}>{tech}</span>
          </div>
        ))}
      </div>

      {/* API docs + footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #1c1c1e', marginTop: 'auto', flexShrink: 0 }}>
        <a href="https://clinical-agent-api-production.up.railway.app/docs" target="_blank" rel="noopener noreferrer"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', textDecoration: 'none', border: '1px solid #1c1c1e', padding: '5px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s', letterSpacing: '0.1em', marginBottom: 8 }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#3f3f46'; e.currentTarget.style.borderColor = '#1c1c1e'; }}
        >[API_DOCS] ↗</a>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: '#1c1c1e', lineHeight: 1.8, letterSpacing: '0.06em' }}>
          <div>BUILT BY MAYZAR</div>
          <div style={{ color: '#22c55e' }}>97× RUST SPEEDUP</div>
          <div>ZERO BUDGET OPS</div>
        </div>
      </div>

      <div style={{ position: 'relative', height: 2, flexShrink: 0 }}>
        <div style={{ position: 'absolute', right: 0, top: -40, width: 2, height: 40, background: '#ef4444' }} />
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const touchStartX = useRef(null);

  // Keyboard shortcuts (desktop)
  useEffect(() => {
    if (isMobile) return;
    const handler = (e) => {
      const n = NAV.find(n => n.key === e.key);
      if (n) setPage(n.id);
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMobile]);

  // Swipe gesture
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 60) setMenuOpen(true);
    if (diff < -60) setMenuOpen(false);
    touchStartX.current = null;
  }, []);

  // Close menu on page change
  const changePage = (id) => {
    setPage(id);
    setMenuOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        @keyframes ca-pulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(0.85);} }
        @keyframes pulse-red { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4);}50%{box-shadow:0 0 0 4px rgba(239,68,68,0);} }
        @keyframes sidebar-scan { 0%{top:-1px;}100%{top:100%;} }
        @keyframes slide-in { from{transform:translateX(-100%);}to{transform:translateX(0);} }
        @keyframes fade-in { from{opacity:0;}to{opacity:1;} }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 2px; } ::-webkit-scrollbar-thumb { background: #27272a; }
      `}</style>

      {/* DESKTOP SIDEBAR */}
      {!isMobile && (
        <aside style={{ width: 230, flexShrink: 0, borderRight: '1px solid #1c1c1e', background: '#09090b', position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', overflowY: 'auto' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'rgba(239,68,68,0.06)', animation: 'sidebar-scan 6s linear infinite', pointerEvents: 'none', zIndex: 10 }} />
          <SidebarContent page={page} setPage={changePage} isMobile={false} />
        </aside>
      )}

      {/* MOBILE TOP HEADER */}
      {isMobile && (
        <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#09090b', borderBottom: '1px solid #1c1c1e', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: '1px solid #1c1c1e', color: '#f4f4f5', cursor: 'pointer', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3, minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center' }}>
              {menuOpen ? (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, lineHeight: 1 }}>×</span>
              ) : (
                <>
                  <span style={{ width: 16, height: 1.5, background: '#f4f4f5', display: 'block' }} />
                  <span style={{ width: 16, height: 1.5, background: '#ef4444', display: 'block' }} />
                  <span style={{ width: 10, height: 1.5, background: '#f4f4f5', display: 'block', alignSelf: 'flex-start' }} />
                </>
              )}
            </button>
            <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 18, letterSpacing: '0.04em', color: '#f4f4f5', lineHeight: 1 }}>
              CLINICAL <span style={{ color: '#ef4444' }}>AGENT</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HealthDots />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'pulse-red 2s ease infinite' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#ef4444', letterSpacing: '0.15em' }}>LIVE</span>
            </div>
          </div>
        </header>
      )}

      {/* MOBILE DRAWER OVERLAY */}
      {isMobile && menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 40, animation: 'fade-in 0.2s ease' }} />
          <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '80%', maxWidth: 300, background: '#09090b', borderRight: '1px solid #1c1c1e', zIndex: 50, animation: 'slide-in 0.25s ease', overflowY: 'auto' }}>
            <SidebarContent page={page} setPage={changePage} onClose={() => setMenuOpen(false)} isMobile={true} />
          </div>
        </>
      )}

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0, position: 'relative', background: '#09090b', paddingBottom: isMobile ? 70 : 0 }}>
        {/* Desktop top bar */}
        {!isMobile && (
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#09090b', borderBottom: '1px solid #1c1c1e', padding: '8px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#27272a', letterSpacing: '0.15em' }}>
              CLINICAL-AGENT / {NAV.find(n => n.id === page)?.label.toUpperCase()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#27272a', letterSpacing: '0.1em' }}>UTC <UTCClock /></span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'pulse-red 2s ease infinite' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#ef4444', letterSpacing: '0.15em' }}>LIVE</span>
              </div>
            </div>
          </div>
        )}

        {page === 'overview'  && <Overview />}
        {page === 'conflicts' && <Conflicts />}
        {page === 'claims'    && <Claims />}
        {page === 'papers'    && <Papers />}
        {page === 'runs'      && <Runs />}
        {page === 'system'    && <System />}
      </main>

      {/* MOBILE BOTTOM NAV */}
      {isMobile && (
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 60, background: '#09090b', borderTop: '1px solid #1c1c1e', display: 'flex', zIndex: 30 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => changePage(n.id)} style={{
              flex: 1, background: 'none', border: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              cursor: 'pointer', minHeight: 44,
              borderTop: page === n.id ? '2px solid #ef4444' : '2px solid transparent',
              transition: 'all 0.1s',
            }}>
              <span style={{ fontSize: 14, color: page === n.id ? '#ef4444' : '#27272a' }}>{n.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: page === n.id ? '#f4f4f5' : '#27272a', letterSpacing: '0.08em' }}>{n.label.slice(0, 4).toUpperCase()}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}