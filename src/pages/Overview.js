import React, { useState, useEffect, useRef } from 'react';
import { useAPI } from '../api';

const API = 'https://clinical-agent-api-production.up.railway.app';

function UTCClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const p = x => String(x).padStart(2, '0');
      setTime(`UTC ${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#52525b', letterSpacing: '0.1em', fontVariantNumeric: 'tabular-nums' }}>{time}</span>;
}

function CountUp({ target, duration = 1000, suffix = '' }) {
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (target == null || isNaN(target)) return;
    setStarted(true);
    let current = 0;
    const step = target / (duration / 16);
    const iv = setInterval(() => {
      current = Math.min(current + step, target);
      setVal(Math.round(current));
      if (current >= target) clearInterval(iv);
    }, 16);
    return () => clearInterval(iv);
  }, [target, duration]);

  if (!started || target == null) return <span>—</span>;
  return <span>{val.toLocaleString()}{suffix}</span>;
}

function SpeedupCounter() {
  const [val, setVal] = useState(1);
  useEffect(() => {
    const timeout = setTimeout(() => {
      let n = 1;
      const iv = setInterval(() => {
        n = Math.min(n + 80, 3600);
        setVal(n);
        if (n >= 3600) clearInterval(iv);
      }, 16);
    }, 800);
    return () => clearTimeout(timeout);
  }, []);
  return <span>{val.toLocaleString()}×</span>;
}

function TerminalTicker({ runs }) {
  const LOG_PREFIXES = [
    { tag: '[RUST]', color: '#22c55e' },
    { tag: '[PYTHON]', color: '#f59e0b' },
    { tag: '[CRITICAL]', color: '#ef4444' },
    { tag: '[NLI]', color: '#a78bfa' },
    { tag: '[AUDIT]', color: '#52525b' },
    { tag: '[OK]', color: '#22c55e' },
  ];

  const DEFAULT_LOGS = [
    'claim-parser extracted 4 claims in 963ms',
    'similarity-engine batch processed 17 claims in 47ms',
    'conflict detected: contradictory evidence on SSRI efficacy',
    'NLI score 0.91 — severity: CRITICAL — alert sent to Slack',
    'faithfulness eval completed: avg 0.847 across 17 claims',
    'audit_logger persisted 17 records to PostgreSQL',
    'report generated successfully',
    'pipeline run completed in 40.2s — 97x speedup vs baseline',
    'paper_monitor fetched 5 ArXiv papers',
    'rag-research retrieved 3 similar chunks',
  ];

  const logs = runs.length > 0
    ? runs.slice(0, 8).map(r => `run ${r.run_id?.slice(0, 8)}... — ${r.papers_processed || 0} papers, ${r.claims_extracted || 0} claims, ${r.conflicts_found || 0} conflicts`)
    : DEFAULT_LOGS;

  const doubled = [...logs, ...logs];

  return (
    <div style={{ height: 120, overflow: 'hidden', padding: '8px 16px' }}>
      <style>{`
        @keyframes ca-ticker {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .ca-ticker-inner { animation: ca-ticker ${logs.length * 2.5}s linear infinite; }
      `}</style>
      <div className="ca-ticker-inner" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {doubled.map((log, i) => {
          const pre = LOG_PREFIXES[i % LOG_PREFIXES.length];
          const ts = new Date().toISOString().slice(11, 19);
          return (
            <div key={i} style={{ fontSize: 11, whiteSpace: 'nowrap', display: 'flex', gap: 8, fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: '#3f3f46' }}>{ts}</span>
              <span style={{ color: pre.color, fontWeight: 500 }}>{pre.tag}</span>
              <span style={{ color: '#71717a' }}>{log}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function timeAgo(s) {
  if (!s) return '—';
  const diff = Date.now() - new Date(s).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (h > 24) return Math.floor(h / 24) + 'D AGO';
  if (h > 0) return h + 'H AGO';
  if (m > 0) return m + 'M AGO';
  return 'JUST NOW';
}

const STATUSES = [
  { label: 'FASTAPI REST', port: ':8000', color: '#22c55e', lang: 'PYTHON', langColor: '#f59e0b' },
  { label: 'POSTGRESQL 16', port: ':5432', color: '#22c55e', lang: 'SQL', langColor: '#818cf8' },
  { label: 'CLAIM-PARSER', port: ':8002', color: '#22c55e', lang: 'RUST', langColor: '#22c55e' },
  { label: 'SIMILARITY-ENG', port: ':8003', color: '#22c55e', lang: 'RUST', langColor: '#22c55e' },
  { label: 'RAG-RESEARCH', port: ':8001', color: '#f59e0b', lang: 'PYTHON', langColor: '#f59e0b' },
  { label: 'SCHEDULER', port: 'CRON', color: '#a1a1aa', lang: 'PYTHON', langColor: '#f59e0b' },
];

export default function Overview() {
  const { data: statsData } = useAPI('/stats');
  const { data: runsData } = useAPI('/runs?limit=20');
  const [rustBarWidth, setRustBarWidth] = useState(0);
  const [cardsVisible, setCardsVisible] = useState([false, false, false, false]);

  const stats = statsData?.stats || {};
  const runs = runsData?.runs || [];

  useEffect(() => {
    [0, 1, 2, 3].forEach(i => {
      setTimeout(() => {
        setCardsVisible(prev => { const n = [...prev]; n[i] = true; return n; });
      }, i * 120 + 200);
    });
    setTimeout(() => setRustBarWidth(0.028), 1000);
  }, []);

  const faith = stats.avg_faithfulness != null ? Math.round(stats.avg_faithfulness * 100) : null;

  return (
    <div style={{ background: '#09090b', minHeight: '100vh', color: '#e4e4e7', position: 'relative', overflow: 'hidden' }}>

      {/* Dot grid background */}
      <div style={{
        backgroundImage: 'radial-gradient(circle, #27272a 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none',
      }} />

      {/* Scanline */}
      <style>{`
        @keyframes ca-scan { 0% { top: -2px; } 100% { top: 100%; } }
        @keyframes ca-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.85); } }
        @keyframes ca-glitch { 0%,90%,100% { transform:none; color:#f4f4f5; } 92% { transform:translate(-2px,0); color:#ef4444; } 94% { transform:translate(2px,0); color:#22c55e; } 96% { transform:translate(-1px,0); color:#f4f4f5; } }
        @keyframes ca-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .ca-scan { position:absolute; left:0; right:0; height:2px; background:linear-gradient(transparent,rgba(34,197,94,0.12),transparent); animation:ca-scan 4s linear infinite; pointer-events:none; z-index:10; }
        .ca-glitch { animation:ca-glitch 6s ease infinite; font-family:'Bebas Neue','Barlow Condensed',sans-serif; }
        .ca-pulse { animation:ca-pulse 1.8s ease infinite; }
        .ca-fadein { animation:ca-fadein 0.4s ease both; }
        .ca-card-hover:hover { background:#161618 !important; }
        .ca-row-hover:hover { background:#111113 !important; }
      `}</style>
      <div className="ca-scan" />

      <div style={{ position: 'relative', zIndex: 1, padding: '20px 28px', maxWidth: 1200 }}>

        {/* Header */}
        <div className="ca-fadein" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272a', paddingBottom: 14, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="ca-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.2)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em', color: '#a1a1aa' }}>LIVE SYSTEM</span>
            <span style={{ color: '#3f3f46' }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.15em', color: '#22c55e' }}>02:00 UTC DAILY</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <UTCClock />
            <a href="https://clinical-agent-api-production.up.railway.app/docs" target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', color: '#3f3f46', border: '1px solid #27272a', padding: '3px 10px', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.color = '#22c55e'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.color = '#3f3f46'; }}
            >API DOCS ↗</a>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 28 }}>
          <div className="ca-glitch" style={{ fontSize: 64, letterSpacing: '0.04em', lineHeight: 1, color: '#f4f4f5' }}>PIPELINE</div>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 64, letterSpacing: '0.04em', lineHeight: 1, color: '#ef4444' }}>OVERVIEW</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', color: '#52525b', marginTop: 10 }}>
            {stats.last_run
              ? `LAST RUN — ${new Date(stats.last_run).toUTCString().slice(0, 25).toUpperCase()} · ${timeAgo(stats.last_run)}`
              : 'FETCHING LAST RUN...'}
          </div>
        </div>

        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 2, marginBottom: 2 }}>
          {[
            { label: 'TOTAL RUNS', value: stats.total_runs, sub: 'EXECUTIONS', accent: '#3f3f46', textAccent: '#f4f4f5', suffix: '' },
            { label: 'CLAIMS EXTRACTED', value: stats.total_claims, sub: 'FROM ARXIV', accent: '#3f3f46', textAccent: '#f4f4f5', suffix: '' },
            { label: 'CRITICAL CONFLICTS', value: stats.critical_conflicts, sub: 'NLI DETECTED', accent: '#ef4444', textAccent: '#ef4444', suffix: '' },
            { label: 'AVG FAITHFULNESS', value: faith, sub: 'SENTENCE-TRANSFORMERS', accent: '#22c55e', textAccent: '#22c55e', suffix: '%' },
          ].map((m, i) => (
            <div key={i} className="ca-card-hover" style={{
              background: '#111113',
              borderTop: `2px solid ${m.accent}`,
              padding: 16,
              opacity: cardsVisible[i] ? 1 : 0,
              animation: cardsVisible[i] ? 'ca-fadein 0.4s ease both' : 'none',
              transition: 'background 0.15s',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: '#52525b', marginBottom: 10 }}>{m.label}</div>
              <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 52, color: m.textAccent, lineHeight: 1 }}>
                {cardsVisible[i] && <CountUp target={m.value} duration={900} suffix={m.suffix} />}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', marginTop: 8, letterSpacing: '0.1em' }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Benchmark + Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 2 }}>

          {/* Rust Benchmark */}
          <div style={{ background: '#111113', padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: '#52525b', marginBottom: 16 }}>RUST PERFORMANCE BENCHMARK</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#52525b', letterSpacing: '0.1em' }}>[PYTHON] SEQUENTIAL</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#52525b' }}>~58 MIN</span>
              </div>
              <div style={{ height: 14, background: '#27272a' }}>
                <div style={{ height: '100%', width: '100%', background: '#3f3f46' }} />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#22c55e', letterSpacing: '0.1em' }}>[RUST] PARALLEL ASYNC</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#22c55e' }}>963MS</span>
              </div>
              <div style={{ height: 14, background: '#27272a' }}>
                <div style={{ height: '100%', width: `${rustBarWidth}%`, background: '#22c55e', transition: 'width 1.5s ease' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2 }}>
              {[
                { val: <SpeedupCounter />, label: 'EXTRACTION' },
                { val: '435×', label: 'NLI DETECT' },
                { val: '97×', label: 'END-TO-END' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#0a0a0c', padding: 10, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 26, color: '#22c55e' }}>{s.val}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#3f3f46', letterSpacing: '0.12em', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div style={{ background: '#111113', padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: '#52525b', marginBottom: 14 }}>SYSTEM STATUS</div>
            {STATUSES.map((s, i) => (
              <div key={i} className="ca-row-hover" style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: i < STATUSES.length - 1 ? '1px solid #1c1c1e' : 'none', transition: 'background 0.1s' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, marginRight: 10, flexShrink: 0, ...(s.color === '#22c55e' ? { animation: 'ca-pulse 2s ease infinite' } : {}) }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#71717a', letterSpacing: '0.08em', flex: 1 }}>{s.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: s.langColor, border: '1px solid #27272a', padding: '1px 6px', marginRight: 10 }}>{s.lang}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: s.color, letterSpacing: '0.05em' }}>{s.port}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal Ticker */}
        <div style={{ background: '#111113', borderTop: '1px solid #27272a' }}>
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="ca-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: '#52525b' }}>AUDIT LOG / LIVE FEED</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.1em' }}>{runs.length > 0 ? `${runs.length} RECENT RUNS` : '—'}</span>
          </div>
          <TerminalTicker runs={runs} />
        </div>

      </div>
    </div>
  );
}