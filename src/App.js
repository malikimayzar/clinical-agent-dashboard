import React, { useState } from 'react';
import Overview from './pages/Overview';
import Papers from './pages/Papers';
import Conflicts from './pages/Conflicts';
import Runs from './pages/Runs';
import Claims from './pages/Claims';

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'conflicts', label: 'Conflicts' },
  { id: 'claims', label: 'Claims' },
  { id: 'papers', label: 'Papers' },
  { id: 'runs', label: 'Runs' },
];

export default function App() {
  const [page, setPage] = useState('overview');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: 200, flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '1.5rem 0',
        position: 'sticky', top: 0, height: '100vh',
        background: 'var(--bg1)'
      }}>
        {/* Logo */}
        <div style={{ padding: '0 1.25rem 1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, color: 'var(--text)', lineHeight: 1.2 }}>clinical</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.08em' }}>agent v3.0</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0 0.75rem' }}>
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              style={{
                width: '100%', textAlign: 'left',
                background: page === n.id ? 'var(--bg3)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius)',
                padding: '7px 12px',
                color: page === n.id ? 'var(--text)' : 'var(--text3)',
                fontFamily: 'var(--font-body)',
                fontSize: 14, fontWeight: page === n.id ? 500 : 300,
                cursor: 'pointer',
                marginBottom: 2,
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { if (page !== n.id) e.currentTarget.style.color = 'var(--text2)'; }}
              onMouseLeave={e => { if (page !== n.id) e.currentTarget.style.color = 'var(--text3)'; }}
            >
              {n.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', lineHeight: 1.6 }}>
            <div>Python · Rust · Go</div>
            <div>LangGraph · pgvector</div>
            <div style={{ marginTop: 6, color: 'var(--text3)' }}>
              <a href="https://clinical-agent-api-production.up.railway.app/docs" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none', fontSize: 11 }}>API docs ↗</a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {page === 'overview' && <Overview />}
        {page === 'conflicts' && <Conflicts />}
        {page === 'claims' && <Claims />}
        {page === 'papers' && <Papers />}
        {page === 'runs' && <Runs />}
      </main>
    </div>
  );
}