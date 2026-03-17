import React, { useState, useEffect } from 'react';
import Overview from './pages/Overview';
import Papers from './pages/Papers';
import Conflicts from './pages/Conflicts';
import Runs from './pages/Runs';
import Claims from './pages/Claims';
import System from './pages/System';

const NAV = [
  { id: 'overview',  label: 'Overview',  num: '01', key: '1' },
  { id: 'conflicts', label: 'Conflicts', num: '02', key: '2' },
  { id: 'claims',    label: 'Claims',    num: '03', key: '3' },
  { id: 'papers',    label: 'Papers',    num: '04', key: '4' },
  { id: 'runs',      label: 'Runs',      num: '05', key: '5' },
  { id: 'system',    label: 'System',    num: '06', key: '6' },
];

const SOCIAL_LINKS = [
  { num: '01', label: 'GITHUB',   handle: 'malikimayzar',    url: 'https://github.com/malikimayzar' },
  { num: '02', label: 'LINKEDIN', handle: 'in/malikimayzar', url: 'https://www.linkedin.com/in/malikimayzar' },
  { num: '03', label: 'INSTAGRAM', handle: 'malikimayzar',   url: 'https://www.instagram.com/malikimayzar?igsh=emxmb3B3M2dldTh4' },
];

const STACK = [
  { layer: 'PERF',  tech: 'RUST / ACTIX-WEB',   color: '#22c55e' },
  { layer: 'NET',   tech: 'GO / FIBER',          color: '#22d3ee' },
  { layer: 'AGENT', tech: 'PY / LANGGRAPH',      color: '#f59e0b' },
  { layer: 'DB',    tech: 'PG / PGVECTOR',       color: '#818cf8' },
  { layer: 'LLM',   tech: 'GROQ / LLAMA-3.3-70B', color: '#a78bfa' },
];

const INFRA = [
  { label: 'ORCHESTRATOR', val: 'LANGGRAPH (8 NODES)' },
  { label: 'PRIMARY_LLM',  val: 'LLAMA-3.3-70B (GROQ)' },
  { label: 'SIMILARITY',   val: 'RUST BM25+COSINE' },
  { label: 'STORAGE',      val: 'POSTGRESQL+PGVECTOR' },
  { label: 'SCHEDULE',     val: 'APSCHEDULER CRON' },
];

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

  const dots = [
    { label: 'API',  ok: status.api },
    { label: 'DB',   ok: status.db },
    { label: 'RUST', ok: true },
  ];

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {dots.map(d => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: d.ok === null ? '#3f3f46' : d.ok ? '#22c55e' : '#ef4444',
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#3f3f46', letterSpacing: '0.08em' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('overview');
  const [hoveredLink, setHoveredLink] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      const n = NAV.find(n => n.key === e.key);
      if (n) setPage(n.id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex' }}>
      <style>{`
        @keyframes ca-pulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(0.85);} }
        @keyframes pulse-red { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4);}50%{box-shadow:0 0 0 4px rgba(239,68,68,0);} }
        @keyframes sidebar-scan { 0%{top:-1px;}100%{top:100%;} }
        .sb-link:hover { color: #ef4444 !important; border-color: rgba(239,68,68,0.4) !important; background: rgba(239,68,68,0.04) !important; }
        .nav-btn:hover { background: #161618 !important; }
      `}</style>

      {/* Sidebar */}
      <aside style={{
        width: 230, flexShrink: 0,
        borderRight: '1px solid #1c1c1e',
        display: 'flex', flexDirection: 'column',
        background: '#09090b',
        position: 'sticky', top: 0, height: '100vh',
        overflow: 'hidden', overflowY: 'auto',
      }}>
        {/* Scanline effect */}
        <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'rgba(239,68,68,0.06)', animation: 'sidebar-scan 6s linear infinite', pointerEvents: 'none', zIndex: 10 }} />

        {/* Logo + health */}
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #1c1c1e' }}>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 26, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#f4f4f5', lineHeight: 1 }}>
            CLINICAL<br /><span style={{ color: '#ef4444' }}>AGENT</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a', letterSpacing: '0.15em' }}>V3.0.0 · AUTONOMOUS</div>
            <HealthDots />
          </div>
        </div>

        {/* Operator identity */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #1c1c1e' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a', letterSpacing: '0.2em', marginBottom: 10 }}>[OPERATOR]</div>

          {/* Avatar placeholder */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, flexShrink: 0,
              background: '#111113', border: '1px solid #ef444444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#ef4444',
              letterSpacing: '0.05em',
            }}>MM</div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#d4d4d8', letterSpacing: '0.06em', fontWeight: 500 }}>MALIKI MAYZAR</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#52525b', letterSpacing: '0.08em', marginTop: 2 }}>ASPIRING AI ENGINEER</div>
            </div>
          </div>

          {/* Social links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {SOCIAL_LINKS.map(l => (
              <a key={l.num} href={l.url} target="_blank" rel="noopener noreferrer" className="sb-link"
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46',
                  textDecoration: 'none', border: '1px solid #1c1c1e',
                  padding: '4px 8px', letterSpacing: '0.06em',
                  display: 'flex', gap: 6, alignItems: 'center',
                  transition: 'all 0.15s',
                }}>
                <span style={{ color: '#27272a', fontSize: 8 }}>{l.num}</span>
                <span style={{ color: '#52525b' }}>{l.label}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 8 }}>{l.handle}</span>
                <span style={{ fontSize: 8 }}>↗</span>
              </a>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '8px 0' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} className="nav-btn" style={{
              width: '100%', textAlign: 'left', background: 'none', border: 'none',
              borderLeft: page === n.id ? '2px solid #ef4444' : '2px solid transparent',
              padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'crosshair', transition: 'all 0.1s',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: page === n.id ? '#ef4444' : '#27272a', letterSpacing: '0.1em', width: 14 }}>{n.num}</span>
              <span style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 16, fontWeight: page === n.id ? 700 : 400, textTransform: 'uppercase', letterSpacing: '0.04em', color: page === n.id ? '#f4f4f5' : '#52525b', flex: 1 }}>{n.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a', letterSpacing: '0.06em' }}>[{n.key}]</span>
            </button>
          ))}
        </nav>

        {/* Infrastructure monitor */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #1c1c1e', borderBottom: '1px solid #1c1c1e' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a', letterSpacing: '0.2em', marginBottom: 8 }}>[SYSTEM_INFRA]</div>
          {INFRA.map(({ label, val }) => (
            <div key={label} style={{ display: 'flex', gap: 4, marginBottom: 3, fontFamily: 'var(--font-mono)' }}>
              <span style={{ fontSize: 8, color: '#3f3f46', letterSpacing: '0.06em', flexShrink: 0, width: 80 }}>{label}</span>
              <span style={{ fontSize: 8, color: '#52525b', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, padding: '6px 0', borderTop: '1px solid #1c1c1e' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a', letterSpacing: '0.1em', marginBottom: 3 }}>NEXT_RUN</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.06em' }}>
              <Countdown />
            </div>
          </div>
        </div>

        {/* Stack */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1c1c1e' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a', letterSpacing: '0.2em', marginBottom: 8 }}>[TECH_STACK]</div>
          {STACK.map(({ layer, tech, color }) => (
            <div key={layer} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a', letterSpacing: '0.08em', width: 36, flexShrink: 0 }}>{layer}</span>
              <span style={{ width: 1, height: 10, background: '#1c1c1e', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color, letterSpacing: '0.06em' }}>{tech}</span>
            </div>
          ))}
        </div>

        {/* API Docs link */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #1c1c1e' }}>
          <a href="https://clinical-agent-api-production.up.railway.app/docs" target="_blank" rel="noopener noreferrer" className="sb-link"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', textDecoration: 'none', border: '1px solid #1c1c1e', padding: '5px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s', letterSpacing: '0.1em' }}>
            <span>[API_DOCS]</span>
            <span style={{ fontSize: 10 }}>↗</span>
          </a>
        </div>

        {/* Footer callout */}
        <div style={{ padding: '10px 16px', marginTop: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: '#27272a', letterSpacing: '0.08em', lineHeight: 1.8 }}>
            <div>BUILT BY MAYZAR</div>
            <div style={{ color: '#22c55e' }}>97× RUST SPEEDUP</div>
            <div>ZERO BUDGET OPS</div>
            <div style={{ marginTop: 4, color: '#1c1c1e' }}>UTC <UTCClock /></div>
          </div>
        </div>

        {/* Decorative accent */}
        <div style={{ position: 'absolute', bottom: 80, right: 0, width: 2, height: 40, background: '#ef4444' }} />
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0, position: 'relative', background: '#09090b' }}>
        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: '#09090b', borderBottom: '1px solid #1c1c1e',
          padding: '8px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#27272a', letterSpacing: '0.15em' }}>
            CLINICAL-AGENT / {NAV.find(n => n.id === page)?.label.toUpperCase()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#27272a', letterSpacing: '0.1em' }}>
              UTC <UTCClock />
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'pulse-red 2s ease infinite' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#ef4444', letterSpacing: '0.15em' }}>LIVE</span>
            </div>
          </div>
        </div>

        {page === 'overview'  && <Overview />}
        {page === 'conflicts' && <Conflicts />}
        {page === 'claims'    && <Claims />}
        {page === 'papers'    && <Papers />}
        {page === 'runs'      && <Runs />}
        {page === 'system'    && <System />}
      </main>
    </div>
  );
}