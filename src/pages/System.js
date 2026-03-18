import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';

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

function vibrate(ms = 50) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
}

// ─────────────────────────────────────────────
// PIPELINE NODES DATA
// ─────────────────────────────────────────────
const NODES = [
  { id: 1, label: 'PAPER MONITOR',     lang: 'PYTHON', color: '#f59e0b', time: '~30s',   desc: 'arxiv fetch' },
  { id: 2, label: 'CLAIM EXTRACTOR',   lang: 'RUST',   color: '#22c55e', time: '963ms',  desc: 'groq + rust' },
  { id: 3, label: 'CLAIM COMPARATOR',  lang: 'PYTHON', color: '#f59e0b', time: '~3s',    desc: 'kb comparison' },
  { id: 4, label: 'CONFLICT DETECT',   lang: 'GROQ',   color: '#a78bfa', time: '672ms',  desc: 'nli inference' },
  { id: 5, label: 'ALERT NODE',        lang: 'PYTHON', color: '#f59e0b', time: '<100ms', desc: 'threshold check' },
  { id: 6, label: 'FAITHFULNESS EVAL', lang: 'PYTHON', color: '#f59e0b', time: '5.3s',   desc: 'llm-eval-fw' },
  { id: 7, label: 'AUDIT LOGGER',      lang: 'SQL',    color: '#818cf8', time: '203ms',  desc: 'postgresql' },
  { id: 8, label: 'REPORT GENERATOR',  lang: 'PYTHON', color: '#f59e0b', time: '9ms',    desc: 'markdown out' },
];

const SPEEDS = { '1×': 1, '2×': 0.5, '4×': 0.25 };

// ─────────────────────────────────────────────
// LANGGRAPH VISUALIZER
// ─────────────────────────────────────────────
function LangGraphVisualizer({ isMobile }) {
  const [active, setActive] = useState(-1);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState([]);
  const [speed, setSpeed] = useState('1×');
  const [mode, setMode] = useState('DETAIL');

  const replay = useCallback(() => {
    if (running) return;
    setRunning(true);
    setActive(-1);
    setCompleted([]);
    vibrate(30);
    NODES.forEach((n, i) => {
      setTimeout(() => {
        setActive(i);
        setCompleted(prev => [...prev, i]);
        if (i === NODES.length - 1) { setActive(-1); setRunning(false); vibrate(80); }
      }, i * 600 * SPEEDS[speed]);
    });
  }, [running, speed]);

  const reset = () => { setActive(-1); setCompleted([]); setRunning(false); };

  const SummaryMode = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, padding: '12px 0' }}>
      {[
        { label: 'TOTAL NODES', val: '8', color: '#f4f4f5' },
        { label: 'END-TO-END', val: '~40S', color: '#f4f4f5' },
        { label: 'SPEEDUP', val: '97×', color: '#22c55e' },
        { label: 'BASELINE', val: '~65MIN', color: '#71717a' },
      ].map(({ label, val, color }) => (
        <div key={label} style={{ background: '#0a0a0c', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#71717a', letterSpacing: '0.15em', marginBottom: 4, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>{label}</div>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 28, color, lineHeight: 1 }}>{val}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ background: '#111113', border: '1px solid #1c1c1e', marginBottom: 2 }}>
      {/* Header */}
      <div style={{ padding: isMobile ? '12px 14px' : '16px', borderBottom: '1px solid #1c1c1e' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 6, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>LANGGRAPH STATEGRAPH</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 28 : 36, color: '#f4f4f5', lineHeight: 1 }}>8-NODE PIPELINE</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {isMobile && (
              <button onClick={() => setMode(m => m === 'SUMMARY' ? 'DETAIL' : 'SUMMARY')} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: mode === 'SUMMARY' ? '#22c55e' : '#52525b', border: `1px solid ${mode === 'SUMMARY' ? 'rgba(34,197,94,0.3)' : '#27272a'}`, background: mode === 'SUMMARY' ? 'rgba(34,197,94,0.08)' : 'transparent', padding: '6px 10px', cursor: 'pointer', letterSpacing: '0.08em', minHeight: 36 }}>
                [{mode === 'SUMMARY' ? 'DETAIL_MODE' : 'SUMMARY_MODE'}]
              </button>
            )}
            {!isMobile && Object.keys(SPEEDS).map(s => (
              <button key={s} onClick={() => setSpeed(s)} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, background: speed === s ? '#22c55e' : 'transparent', color: speed === s ? '#09090b' : '#52525b', border: `1px solid ${speed === s ? '#22c55e' : '#27272a'}`, padding: '4px 8px', cursor: 'crosshair', letterSpacing: '0.08em' }}>{s}</button>
            ))}
            {!isMobile && <button onClick={reset} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', background: 'transparent', border: '1px solid #27272a', padding: '4px 10px', cursor: 'crosshair', letterSpacing: '0.08em' }}>RESET</button>}
            <button onClick={replay} disabled={running} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#09090b', background: running ? '#1c5c2e' : '#22c55e', border: 'none', padding: isMobile ? '8px 14px' : '6px 14px', cursor: running ? 'not-allowed' : 'crosshair', letterSpacing: '0.1em', fontWeight: 700, minHeight: isMobile ? 40 : 'auto' }}>
              ▶ {running ? 'RUNNING...' : 'REPLAY'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary or Detail mode */}
      {isMobile && mode === 'SUMMARY' ? (
        <div style={{ padding: '12px 14px' }}><SummaryMode /></div>
      ) : (
        <div style={{ padding: isMobile ? '12px 14px' : '16px', overflowX: isMobile ? 'hidden' : 'auto' }}>
          {isMobile ? (
            /* MOBILE: Vertical stack */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {NODES.map((n, i) => {
                const isDone = completed.includes(i);
                const isActive = active === i;
                return (
                  <div key={n.id}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderLeft: `2px solid ${isDone ? n.color : '#27272a'}`, paddingLeft: 12, transition: 'border-color 0.3s' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#ef4444' : isDone ? n.color : '#27272a', boxShadow: isDone ? `0 0 6px ${n.color}66` : 'none', flexShrink: 0, animation: isActive ? 'sys-pulse 0.5s ease infinite' : 'none' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 14, color: isDone ? '#f4f4f5' : '#52525b', letterSpacing: '0.04em' }}>{n.label}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: n.color, border: `1px solid ${n.color}33`, padding: '1px 4px', letterSpacing: '0.06em', opacity: isDone ? 1 : 0.4 }}>{n.lang}</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b' }}>{n.desc} · {n.time}</div>
                      </div>
                      {isDone && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: n.color }}>✓</span>}
                    </div>
                    {i < NODES.length - 1 && (
                      <div style={{ marginLeft: 15, width: 2, height: 12, background: isDone ? n.color + '44' : '#1c1c1e' }} />
                    )}
                  </div>
                );
              })}

              {/* Mobile metrics below nodes */}
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
                {[
                  { label: 'TOTAL NODES', val: '8', color: '#f4f4f5' },
                  { label: 'END-TO-END', val: '~40S', color: '#f4f4f5' },
                  { label: 'SPEEDUP', val: '97×', color: '#22c55e' },
                  { label: 'BASELINE', val: '~65MIN', color: '#71717a' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background: '#0a0a0c', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#71717a', letterSpacing: '0.12em', marginBottom: 4, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>{label}</div>
                    <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 24, color, lineHeight: 1 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* DESKTOP: Horizontal scroll */
            <div>
              <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', minWidth: 900 }}>
                {NODES.map((n, i) => {
                  const isDone = completed.includes(i);
                  const isActive = active === i;
                  return (
                    <React.Fragment key={n.id}>
                      <div style={{ background: isDone ? '#0f0f11' : '#0a0a0c', border: `1px solid ${isDone ? n.color + '44' : '#1c1c1e'}`, padding: '14px', minWidth: 130, flex: 1, transition: 'all 0.3s', position: 'relative' }}>
                        {isDone && <div style={{ position: 'absolute', top: 8, right: 8, color: n.color, fontSize: 10 }}>✓</div>}
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a', marginBottom: 8, letterSpacing: '0.1em' }}>{String(i + 1).padStart(2, '0')}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#ef4444' : isDone ? n.color : '#27272a', boxShadow: isDone ? `0 0 6px ${n.color}66` : 'none', animation: isActive ? 'sys-pulse 0.5s ease infinite' : 'none' }} />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: n.color, letterSpacing: '0.08em', opacity: isDone ? 1 : 0.5 }}>{n.lang}</span>
                        </div>
                        <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 13, color: isDone ? '#f4f4f5' : '#52525b', letterSpacing: '0.04em', marginBottom: 4 }}>{n.label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', marginBottom: 6 }}>{n.desc}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: n.color }}>{n.time}</div>
                      </div>
                      {i < NODES.length - 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', flexShrink: 0 }}>
                          <div style={{ color: isDone ? n.color : '#27272a', fontSize: 14, transition: 'color 0.3s' }}>→</div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginTop: 8 }}>
                {[
                  { label: 'TOTAL NODES', val: '8' },
                  { label: 'END-TO-END', val: '~40S' },
                  { label: 'SPEEDUP', val: '97×', color: '#22c55e' },
                  { label: 'BASELINE', val: '~65MIN', color: '#71717a' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background: '#0a0a0c', padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 28, color: color || '#f4f4f5', lineHeight: 1 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#22c55e', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', padding: '6px 12px', marginTop: 10, letterSpacing: '0.06em' }}>
            [LATENCY: &lt;10MS OVERHEAD | ENGINE: LANGGRAPH + PYTHON]
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// KB GROWTH CHART
// ─────────────────────────────────────────────
const KB_PAPERS = [
  { id: 'P1',  title: 'Major Depressive Disorder & SSRIs',     tier: 1, chunks: 280 },
  { id: 'P2',  title: "Alzheimer's Disease Subtypes",           tier: 1, chunks: 310 },
  { id: 'P3',  title: 'Cancer Immunotherapy Trials',           tier: 1, chunks: 290 },
  { id: 'P4',  title: 'Drug-Drug Interaction Prediction',      tier: 2, chunks: 245 },
  { id: 'P5',  title: 'Neural Networks in Diagnostics',        tier: 2, chunks: 198 },
  { id: 'P6',  title: 'Cardiovascular Risk Biomarkers',        tier: 1, chunks: 275 },
  { id: 'P7',  title: 'Antibiotic Resistance Mechanisms',      tier: 2, chunks: 265 },
  { id: 'P8',  title: 'COVID-19 Treatment Evidence',           tier: 1, chunks: 320 },
  { id: 'P9',  title: 'CRISPR Gene Editing Safety',            tier: 3, chunks: 190 },
  { id: 'P10', title: 'Mental Health Digital Interventions',   tier: 2, chunks: 225 },
  { id: 'P11', title: 'Precision Medicine Genomics',           tier: 1, chunks: 300 },
  { id: 'P12', title: 'Pediatric Oncology Protocols',          tier: 3, chunks: 175 },
  { id: 'P13', title: 'Chronic Pain Management',               tier: 3, chunks: 182 },
  { id: 'P14', title: 'Telemedicine Effectiveness',            tier: 2, chunks: 210 },
];

const TIER_COLOR = { 1: '#ef4444', 2: '#f59e0b', 3: '#f5c518' };

function KBGrowthChart({ isMobile }) {
  const [paper, setPaper] = useState(KB_PAPERS.length - 1);
  const [replaying, setReplaying] = useState(false);

  const shown = KB_PAPERS.slice(0, paper + 1);
  const totalChunks = shown.reduce((s, p) => s + p.chunks, 0);

  const replay = () => {
    if (replaying) return;
    setReplaying(true);
    setPaper(0);
    vibrate(30);
    KB_PAPERS.forEach((_, i) => {
      setTimeout(() => {
        setPaper(i);
        if (i === KB_PAPERS.length - 1) { setReplaying(false); vibrate(50); }
      }, i * 180);
    });
  };

  return (
    <div style={{ background: '#111113', border: '1px solid #1c1c1e', padding: isMobile ? '14px' : '16px', marginBottom: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.12em', marginBottom: 4, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>POSTGRESQL + PGVECTOR</div>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 22 : 26, color: '#f4f4f5', lineHeight: 1 }}>KNOWLEDGE BASE GROWTH</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', marginTop: 4, letterSpacing: '0.06em' }}>
            {totalChunks.toLocaleString()} CHUNKS · {shown.length} PAPERS · VECTOR(768) INDEX
          </div>
        </div>
        <button onClick={replay} disabled={replaying} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', padding: '8px 14px', cursor: replaying ? 'not-allowed' : 'crosshair', letterSpacing: '0.1em', minHeight: isMobile ? 44 : 'auto', whiteSpace: 'nowrap' }}>
          ▶ REPLAY GROWTH
        </button>
      </div>

      {/* Bar chart */}
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 60, marginBottom: 8 }}>
        {KB_PAPERS.map((p, i) => {
          const visible = i <= paper;
          const maxC = Math.max(...KB_PAPERS.map(x => x.chunks));
          const h = visible ? Math.round((p.chunks / maxC) * 52) : 4;
          return (
            <div key={p.id} style={{ flex: 1, height: h, background: visible ? TIER_COLOR[p.tier] : '#1c1c1e', transition: 'height 0.3s ease, background 0.3s', minWidth: 0 }} />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 8, color: '#3f3f46', marginBottom: 12 }}>
        <span>P1</span><span>P7</span><span>P14</span>
      </div>

      {/* Slider */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', marginBottom: 6 }}>
          <span>TIME TRAVEL — PAPER {paper + 1}/{KB_PAPERS.length}</span>
          <span style={{ color: '#22c55e', textShadow: '0 0 6px rgba(34,197,94,0.3)' }}>{totalChunks.toLocaleString()} CHUNKS</span>
        </div>
        <input type="range" min={0} max={KB_PAPERS.length - 1} value={paper}
          onChange={e => { setPaper(+e.target.value); vibrate(10); }}
          style={{ width: '100%', accentColor: '#22c55e', height: 4, cursor: 'pointer' }}
        />
      </div>

      {/* Tier legend + papers — stacked on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 8, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>TIER LEGEND</div>
          {[
            { tier: 1, label: 'TIER 1 — HIGH IMPACT' },
            { tier: 2, label: 'TIER 2 — SPECIALIZED' },
            { tier: 3, label: 'TIER 3 — EMERGING' },
          ].map(({ tier, label }) => (
            <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, minHeight: isMobile ? 36 : 'auto' }}>
              <div style={{ width: 12, height: 12, background: TIER_COLOR[tier], flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: TIER_COLOR[tier], letterSpacing: '0.06em', textShadow: `0 0 6px ${TIER_COLOR[tier]}66` }}>{label}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 8, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>INDEXED PAPERS</div>
          <div style={{ maxHeight: isMobile ? 200 : 160, overflowY: 'auto' }}>
            {shown.slice(-6).reverse().map(p => (
              <div key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, minHeight: isMobile ? 36 : 'auto' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: TIER_COLOR[p.tier], flexShrink: 0, textShadow: `0 0 4px ${TIER_COLOR[p.tier]}44` }}>T{p.tier}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 10 : 9, color: '#a1a1aa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', flexShrink: 0 }}>{p.chunks}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 9, color: '#818cf8', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)', padding: '6px 12px', letterSpacing: '0.06em' }}>
        [LATENCY: &lt;10MS | ENGINE: POSTGRESQL 16 + PGVECTOR + IVFFLAT INDEX]
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// API LATENCY MONITOR
// ─────────────────────────────────────────────
const ENDPOINTS = [
  { label: 'FASTAPI REST',  path: '/',                 lang: 'PYTHON', langColor: '#f59e0b' },
  { label: 'HEALTH CHECK',  path: '/health',           lang: 'PYTHON', langColor: '#f59e0b' },
  { label: 'STATS',         path: '/stats',            lang: 'SQL',    langColor: '#818cf8' },
  { label: 'RUNS',          path: '/runs?limit=1',     lang: 'SQL',    langColor: '#818cf8' },
  { label: 'CLAIMS',        path: '/claims?limit=1',   lang: 'SQL',    langColor: '#818cf8' },
  { label: 'CONFLICTS',     path: '/conflicts?limit=1',lang: 'SQL',    langColor: '#818cf8' },
];

function APILatencyMonitor({ isMobile }) {
  const [latencies, setLatencies] = useState({});
  const [pinging, setPinging] = useState(false);
  const [lastPing, setLastPing] = useState(null);

  const pingAll = useCallback(async () => {
    setPinging(true);
    vibrate(30);
    const results = {};
    await Promise.all(ENDPOINTS.map(async ep => {
      const start = performance.now();
      try {
        await fetch(API + ep.path, { method: 'GET' });
        results[ep.path] = Math.round(performance.now() - start);
      } catch {
        results[ep.path] = -1;
      }
    }));
    setLatencies(results);
    setLastPing(new Date());
    setPinging(false);
    const hasSlowEndpoint = Object.values(results).some(v => v > 1000 && v !== -1);
    if (hasSlowEndpoint) vibrate([50, 30, 50]);
  }, []);

  useEffect(() => { pingAll(); }, []);

  const values = Object.values(latencies).filter(v => v > 0);
  const avgLatency = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

  const getLatencyColor = (ms) => {
    if (ms < 0) return '#3f3f46';
    if (ms < 500) return '#22c55e';
    if (ms < 1000) return '#f59e0b';
    return '#ef4444';
  };

  const getStatus = (ms) => {
    if (ms < 0) return 'ERR';
    if (ms < 500) return 'OK';
    if (ms < 1000) return 'WARN';
    return 'SLOW';
  };

  return (
    <div style={{ background: '#111113', border: '1px solid #1c1c1e', padding: isMobile ? '14px' : '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.12em', marginBottom: 4, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>REALTIME DIAGNOSTICS</div>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 22 : 26, color: '#f4f4f5', lineHeight: 1 }}>API LATENCY MONITOR</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 28 : 36, color: avgLatency > 1000 ? '#ef4444' : avgLatency > 500 ? '#f59e0b' : '#22c55e', lineHeight: 1, textShadow: avgLatency > 1000 ? '0 0 10px rgba(239,68,68,0.4)' : 'none', animation: avgLatency > 1500 ? 'sys-blink 1.5s ease infinite' : 'none' }}>
            {avgLatency > 0 ? avgLatency + 'MS' : '—'}
          </div>
          <button onClick={pingAll} disabled={pinging} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: pinging ? '#3f3f46' : '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', padding: '8px 12px', cursor: pinging ? 'not-allowed' : 'crosshair', letterSpacing: '0.1em', minHeight: isMobile ? 44 : 'auto', whiteSpace: 'nowrap' }}>
            {pinging ? '◌ PINGING' : '⟳ PING ALL'}
          </button>
        </div>
      </div>

      {/* Endpoint rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ENDPOINTS.map(ep => {
          const ms = latencies[ep.path];
          const color = getLatencyColor(ms);
          const status = getStatus(ms);
          const barW = ms > 0 ? Math.min((ms / 3000) * 100, 100) : 0;
          return (
            <div key={ep.path} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10, padding: '8px 0', borderBottom: '1px solid #1c1c1e' }}>
              <div style={{ minWidth: isMobile ? 90 : 110, flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 10, color: '#a1a1aa', letterSpacing: '0.06em', textShadow: '0 0 4px rgba(161,161,170,0.2)' }}>{ep.label}</div>
                {!isMobile && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#52525b' }}>{ep.path}</div>}
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: ep.langColor, border: `1px solid ${ep.langColor}33`, padding: '1px 5px', letterSpacing: '0.06em', flexShrink: 0 }}>{ep.lang}</span>
              <div style={{ flex: 1, height: 4, background: '#1c1c1e', borderRadius: 1 }}>
                <div style={{ height: '100%', width: `${barW}%`, background: color, transition: 'width 0.6s ease', boxShadow: ms > 0 && ms < 500 ? `0 0 4px ${color}66` : 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 11 : 12, color, letterSpacing: '0.03em', minWidth: 56, textAlign: 'right', textShadow: color === '#ef4444' ? '0 0 6px rgba(239,68,68,0.4)' : 'none', animation: ms > 1500 ? 'sys-blink 1.5s ease infinite' : 'none' }}>
                  {ms > 0 ? ms + 'MS' : '—'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color, letterSpacing: '0.08em', minWidth: 28 }}>{status}</span>
              </div>
            </div>
          );
        })}
      </div>

      {lastPing && (
        <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 8, color: '#3f3f46', letterSpacing: '0.08em' }}>
          LAST PING: {lastPing.toUTCString().slice(0, 25).toUpperCase()}
        </div>
      )}
      <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: '#22c55e', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', padding: '6px 12px', letterSpacing: '0.06em' }}>
        [LATENCY: REALTIME | ENGINE: FASTAPI + RAILWAY]
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN SYSTEM PAGE
// ─────────────────────────────────────────────
export default function System() {
  const isMobile = useIsMobile();

  return (
    <div style={{ padding: isMobile ? '16px' : '20px 28px', maxWidth: 1200, background: '#09090b', minHeight: '100vh' }}>
      <style>{`
        @keyframes sys-pulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.3;transform:scale(0.7);} }
        @keyframes sys-blink { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes sys-fadein { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);} }
        input[type=range]::-webkit-slider-thumb { width: 20px; height: 20px; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #27272a', paddingBottom: 14, marginBottom: 16 }}>
        <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 'clamp(38px,10vw,52px)' : 64, letterSpacing: '0.04em', lineHeight: 1, color: '#f4f4f5' }}>SYSTEM</div>
        <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 'clamp(38px,10vw,52px)' : 64, letterSpacing: '0.04em', lineHeight: 1, color: '#ef4444' }}>INTERNALS</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 10, color: '#71717a', marginTop: 8, letterSpacing: '0.12em', lineHeight: 1.6 }}>
          PIPELINE ARCHITECTURE · KNOWLEDGE BASE · API DIAGNOSTICS
        </div>
      </div>

      {/* Components — stacked vertically on both mobile and desktop */}
      <LangGraphVisualizer isMobile={isMobile} />
      <KBGrowthChart isMobile={isMobile} />
      <APILatencyMonitor isMobile={isMobile} />
    </div>
  );
}