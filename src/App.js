import React, { useState } from 'react';
import Overview from './pages/Overview';
import Papers from './pages/Papers';
import Conflicts from './pages/Conflicts';
import Runs from './pages/Runs';
import Claims from './pages/Claims';
import System from './pages/System';

const NAV = [
  { id: 'overview', label: 'Overview', num: '01' },
  { id: 'conflicts', label: 'Conflicts', num: '02' },
  { id: 'claims', label: 'Claims', num: '03' },
  { id: 'papers', label: 'Papers', num: '04' },
  { id: 'runs', label: 'Runs', num: '05' },
  { id: 'system', label: 'System', num: '06' },
];

export default function App() {
  const [page, setPage] = useState('overview');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex' }}>

      <aside style={{
        width: 220, flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--black2)',
        position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
      }}>
        <div style={{ padding: '2rem 1.5rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, letterSpacing: '-0.02em', textTransform: 'uppercase', color: 'var(--white)', lineHeight: 1 }}>
            CLINICAL<br /><span style={{ color: 'var(--red)' }}>AGENT</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--white4)', letterSpacing: '0.2em', marginTop: 8 }}>V3.0 / AUTONOMOUS</div>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              width: '100%', textAlign: 'left', background: 'none', border: 'none',
              borderLeft: page === n.id ? '3px solid var(--red)' : '3px solid transparent',
              padding: '12px 1.5rem', display: 'flex', alignItems: 'baseline', gap: 12,
              cursor: 'crosshair', transition: 'all 0.1s',
            }}
              onMouseEnter={e => { if (page !== n.id) e.currentTarget.style.background = 'var(--black3)'; }}
              onMouseLeave={e => { if (page !== n.id) e.currentTarget.style.background = 'none'; }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: page === n.id ? 'var(--red)' : 'var(--white4)', letterSpacing: '0.1em' }}>{n.num}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: page === n.id ? 800 : 600, textTransform: 'uppercase', letterSpacing: '0.02em', color: page === n.id ? 'var(--white)' : 'var(--white3)' }}>{n.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--white4)', lineHeight: 2, letterSpacing: '0.08em' }}>
            <div>PYTHON · RUST · GO</div>
            <div>LANGGRAPH · PGVECTOR</div>
            <div>GROQ LLM · ACTIX-WEB</div>
          </div>
          <a href="https://clinical-agent-api-production.up.railway.app/docs" target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--red)', letterSpacing: '0.1em', textDecoration: 'none' }}>
            API DOCS ↗
          </a>
        </div>

        <div style={{ position: 'absolute', bottom: 120, right: 0, width: 2, height: 60, background: 'var(--red)' }} />
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0, position: 'relative' }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'var(--black)', borderBottom: '1px solid var(--border)',
          padding: '10px 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--white4)', letterSpacing: '0.15em' }}>
            CLINICAL-AGENT / {NAV.find(n => n.id === page)?.label.toUpperCase()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--white4)', letterSpacing: '0.1em' }}>
              {new Date().toUTCString().slice(0, 25).toUpperCase()}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', animation: 'pulse-red 2s ease infinite' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--red)', letterSpacing: '0.15em' }}>LIVE</span>
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