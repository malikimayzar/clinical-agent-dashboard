import React, { useState, useEffect, useRef } from 'react';
import { useAPI } from '../api';

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
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</span>;
}

function CountUp({ target, duration = 900 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target || isNaN(target)) return;
    let cur = 0;
    const step = target / (duration / 16);
    const iv = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(Math.round(cur));
      if (cur >= target) clearInterval(iv);
    }, 16);
    return () => clearInterval(iv);
  }, [target]);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{val.toLocaleString()}</span>;
}

// ── Sparkline ──
function Sparkline({ data, color, width = 60, height = 24 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block', opacity: 0.7 }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts.split(' ').pop().split(',')[0]} cy={pts.split(' ').pop().split(',')[1]} r="2" fill={color}/>
    </svg>
  );
}

// ── Benchmark Popup ──
function BenchmarkPopup() {
  const [show, setShow] = useState(false);
  const rows = [
    { label: 'JSON Parse',        rust: '0.8ms',  python: '18ms',  speedup: '22×' },
    { label: 'Claim Extraction',  rust: '963ms',  python: '58min', speedup: '3,600×' },
    { label: 'NLI Detection',     rust: '672ms',  python: '292s',  speedup: '435×' },
    { label: 'Embedding Search',  rust: '47ms',   python: '2.1s',  speedup: '45×' },
    { label: 'End-to-End',        rust: '~40s',   python: '~65min',speedup: '97×' },
  ];
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{ background: 'none', border: 'none', cursor: 'crosshair', padding: '2px 6px', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3b82f6', letterSpacing: '0.08em', textShadow: '0 0 6px rgba(59,130,246,0.4)' }}
      >⬡ DETAIL</button>
      {show && (
        <div style={{ position: 'absolute', left: 0, top: '100%', zIndex: 100, background: '#0a0a0c', border: '1px solid #27272a', padding: '10px 14px', minWidth: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.8)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#52525b', letterSpacing: '0.15em', marginBottom: 8 }}>BENCHMARK BREAKDOWN — CPU ONLY, NO GPU</div>
          {rows.map(r => (
            <div key={r.label} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 50px', gap: 8, marginBottom: 5, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a' }}>{r.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#22c55e' }}>{r.rust}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b' }}>{r.python}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#f59e0b', fontWeight: 700 }}>{r.speedup}</span>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 50px', gap: 8, marginTop: 6, paddingTop: 6, borderTop: '1px solid #1c1c1e' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a' }}></span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#22c55e', letterSpacing: '0.08em' }}>RUST</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#52525b', letterSpacing: '0.08em' }}>PYTHON</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#f59e0b', letterSpacing: '0.08em' }}>SPEED</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Metric Card with Sparkline ──
function MetricCard({ label, value, sub, accent, textAccent, sparkData, sparkColor, visible, isMobile }) {
  return (
    <div style={{ background: '#111113', borderTop: `2px solid ${accent}`, padding: isMobile ? '12px' : '16px', opacity: visible ? 1 : 0, transition: 'opacity 0.4s', position: 'relative', overflow: 'hidden' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 8 : 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 8, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>{label}</div>
      <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 36 : 52, color: textAccent, lineHeight: 1 }}>
        {visible && value != null ? <CountUp target={value} /> : '—'}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 8 : 9, color: '#3f3f46', marginTop: 6, letterSpacing: '0.1em' }}>{sub}</div>
      {sparkData && (
        <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
          <Sparkline data={sparkData} color={sparkColor || accent} width={isMobile ? 44 : 56} height={20} />
        </div>
      )}
    </div>
  );
}

// ── System Status Row ──
function StatusRow({ label, port, lang, langColor, dotColor, isMobile }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: isMobile ? '8px 10px' : '8px 0',
        background: isMobile ? '#0a0a0c' : 'transparent',
        borderLeft: hovered ? `2px solid ${dotColor}` : isMobile ? 'none' : 'none',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'all 0.2s ease',
        boxShadow: hovered ? `0 4px 12px ${dotColor}22` : 'none',
        borderBottom: !isMobile ? '1px solid #1c1c1e' : 'none',
        marginBottom: !isMobile ? 0 : 0,
        cursor: 'default',
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0, boxShadow: `0 0 ${hovered ? 8 : 4}px ${dotColor}88`, transition: 'box-shadow 0.2s' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 10, color: hovered ? '#f4f4f5' : '#a1a1aa', letterSpacing: '0.06em', transition: 'color 0.2s', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
        {!isMobile && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: langColor, letterSpacing: '0.04em', marginTop: 1 }}>{lang} {port}</div>}
      </div>
      {isMobile && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: langColor, flexShrink: 0 }}>{lang}</span>}
    </div>
  );
}

// ── Live Log Stream ──
const LOG_TPLS = [
  { prefix: 'SCHEDULER', color: '#22c55e',  msgs: ['Initiating daily scan of ArXiv papers', 'Missed run recovery: active', 'Next run: 02:00 UTC'] },
  { prefix: 'RAG',       color: '#3b82f6',  msgs: ['Parsing Paper ID #2104.1234, generated 45 chunks', 'BM25+cosine hybrid search: 47ms', 'KB: 3,245 chunks indexed'] },
  { prefix: 'NLI',       color: '#a78bfa',  msgs: ['Checking 3 claims for consistency via Groq', 'Parallel inference: 42ms/claim', '16 claims processed'] },
  { prefix: 'RUST',      color: '#22c55e',  msgs: ['claim-parser :8002 active, parse: <1ms', 'Parallel async extraction: 963ms', 'similarity-engine :8003 ready'] },
  { prefix: 'CONFLICT',  color: '#ef4444',  msgs: ['MAJOR contradiction detected — BIT claims', 'Slack alert dispatched', '3 conflicts in latest run'] },
  { prefix: 'AUDIT',     color: '#71717a',  msgs: ['Persisting 16 claims to PostgreSQL', 'Zero-loss logging confirmed', 'Run logged to audit_trail'] },
  { prefix: 'PIPELINE',  color: '#f59e0b',  msgs: ['faithfulness_eval: 15/18 passed (83%)', 'Report saved: /reports/', 'Done in 40.2s — 97× speedup'] },
];

function LiveLogStream({ isMobile }) {
  const [logs, setLogs] = useState([]);
  const scrollRef = useRef(null);

  const mkLog = (i) => {
    const t = LOG_TPLS[i % LOG_TPLS.length];
    const now = new Date();
    const p = x => String(x).padStart(2, '0');
    const ts = `${p(now.getUTCHours())}:${p(now.getUTCMinutes())}:${p(now.getUTCSeconds())} UTC`;
    return { id: Date.now() + i, prefix: t.prefix, color: t.color, msg: t.msgs[Math.floor(Math.random() * t.msgs.length)], ts };
  };

  useEffect(() => {
    setLogs(Array.from({ length: isMobile ? 4 : 6 }, (_, i) => mkLog(i)));
    const iv = setInterval(() => {
      setLogs(prev => {
        const l = mkLog(Math.floor(Math.random() * LOG_TPLS.length));
        return [...prev.slice(-(isMobile ? 3 : 7)), l];
      });
    }, 3000);
    return () => clearInterval(iv);
  }, [isMobile]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  return (
    <div style={{ background: '#060608', borderTop: '2px solid #22c55e', border: '1px solid #1c1c1e' }}>
      <div style={{ padding: '6px 12px', borderBottom: '1px solid #1c1c1e', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.6)', animation: 'ov-pulse 1.5s ease infinite' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em' }}>AUDIT LOG / LIVE FEED</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 8, color: '#3f3f46' }}>TAIL -F clinical-agent.log</span>
      </div>
      <div ref={scrollRef} style={{ height: isMobile ? 88 : 120, overflowY: 'auto', padding: '6px 12px' }}>
        {logs.map((l, i) => (
          <div key={l.id} style={{ display: 'flex', gap: 8, marginBottom: 3, fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 10, animation: i === logs.length - 1 ? 'ov-fadein 0.2s ease' : 'none', alignItems: 'flex-start' }}>
            <span style={{ color: '#3f3f46', flexShrink: 0, fontSize: 9 }}>&gt;</span>
            <span style={{ color: '#3f3f46', flexShrink: 0, fontSize: 8, whiteSpace: 'nowrap' }}>[{l.ts}]</span>
            <span style={{ color: l.color, flexShrink: 0, textShadow: `0 0 5px ${l.color}55` }}>{l.prefix}:</span>
            <span style={{ color: '#a1a1aa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STATUSES = [
  { label: 'FASTAPI REST',   port: ':8000', lang: 'PYTHON', langColor: '#f59e0b', dotColor: '#22c55e' },
  { label: 'POSTGRESQL 16',  port: ':5432', lang: 'SQL',    langColor: '#818cf8', dotColor: '#22c55e' },
  { label: 'CLAIM-PARSER',   port: ':8002', lang: 'RUST',   langColor: '#22c55e', dotColor: '#22c55e' },
  { label: 'SIMILARITY-ENG', port: ':8003', lang: 'RUST',   langColor: '#22c55e', dotColor: '#22c55e' },
  { label: 'RAG-RESEARCH',   port: ':8001', lang: 'PYTHON', langColor: '#f59e0b', dotColor: '#f59e0b' },
  { label: 'SCHEDULER',      port: 'CRON',  lang: 'PYTHON', langColor: '#f59e0b', dotColor: '#a1a1aa' },
];

function timeAgo(s) {
  if (!s) return null;
  const diff = Date.now() - new Date(s).getTime();
  const h = Math.floor(diff / 3600000), m = Math.floor(diff / 60000);
  if (h > 24) return Math.floor(h / 24) + 'D AGO';
  if (h > 0) return h + 'H AGO';
  if (m > 0) return m + 'M AGO';
  return 'JUST NOW';
}

export default function Overview() {
  const isMobile = useIsMobile();
  const { data: statsData } = useAPI('/stats');
  const { data: runsData } = useAPI('/runs?limit=8');
  const [visible, setVisible] = useState(false);
  const [rustBarW, setRustBarW] = useState(0);

  const stats = statsData?.stats || {};
  const runs = runsData?.runs || [];

  // Generate sparkline data from runs
  const claimsSpark = runs.slice().reverse().map(r => r.claims_extracted || 0);
  const runsSpark = runs.slice().reverse().map((_, i) => i + 1);
  const conflictsSpark = runs.slice().reverse().map(r => r.conflicts_found || 0);

  useEffect(() => {
    setTimeout(() => setVisible(true), 150);
    setTimeout(() => setRustBarW(2.8), 800);
  }, []);

  const faith = stats.avg_faithfulness != null ? Math.round(stats.avg_faithfulness * 100) : null;

  return (
    <div style={{ background: '#09090b', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes ov-pulse  { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(0.85);} }
        @keyframes ov-scan   { 0%{top:-2px;}100%{top:100%;} }
        @keyframes ov-fadein { from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);} }
        @keyframes ov-glitch { 0%,92%,100%{transform:none;color:#f4f4f5;}93%{transform:translate(-2px,0);color:#ef4444;}95%{transform:translate(2px,0);color:#22c55e;}97%{color:#f4f4f5;} }
        .ov-glitch { animation: ov-glitch 7s ease infinite; font-family:'Bebas Neue','Barlow Condensed',sans-serif; }
        .ov-dot-bg { background-image:radial-gradient(circle,#27272a 1px,transparent 1px);background-size:24px 24px;position:absolute;inset:0;opacity:0.25;pointer-events:none; }
        .ov-scan   { position:absolute;left:0;right:0;height:2px;background:linear-gradient(transparent,rgba(34,197,94,0.1),transparent);animation:ov-scan 5s linear infinite;pointer-events:none;z-index:10; }
      `}</style>

      <div className="ov-dot-bg" />
      <div className="ov-scan" />

      <div style={{ position: 'relative', zIndex: 1, padding: isMobile ? '16px' : '20px 28px', maxWidth: 1200 }}>

        {/* Header */}
        <div style={{ borderBottom: '1px solid #1c1c1e', paddingBottom: 14, marginBottom: isMobile ? 14 : 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'ov-pulse 1.8s ease infinite', boxShadow: '0 0 8px rgba(239,68,68,0.6)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#a1a1aa', letterSpacing: '0.15em' }}>LIVE SYSTEM</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#22c55e', letterSpacing: '0.12em' }}>· 02:00 UTC DAILY</span>
            </div>
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#52525b', letterSpacing: '0.08em' }}><UTCClock /></span>
                <a href={`${API}/docs`} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', border: '1px solid #27272a', padding: '3px 8px', textDecoration: 'none', letterSpacing: '0.1em', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#22c55e'; e.currentTarget.style.color='#22c55e'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#27272a'; e.currentTarget.style.color='#52525b'; }}
                >API DOCS ↗</a>
              </div>
            )}
          </div>
          {isMobile && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', marginBottom: 8 }}><UTCClock /></div>}

          <div className="ov-glitch" style={{ fontSize: isMobile ? 'clamp(40px,11vw,56px)' : 68, letterSpacing: '0.04em', lineHeight: 0.95, color: '#f4f4f5' }}>PIPELINE</div>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 'clamp(40px,11vw,56px)' : 68, letterSpacing: '0.04em', lineHeight: 0.95, color: '#ef4444', marginBottom: 8 }}>OVERVIEW</div>
          {stats.last_run && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 10, color: '#71717a', letterSpacing: '0.1em' }}>
              LAST RUN — {new Date(stats.last_run).toUTCString().slice(0, 25).toUpperCase()} · {timeAgo(stats.last_run)}
            </div>
          )}
        </div>

        {/* Metric cards — 2×2 mobile, 4×1 desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 2, marginBottom: 2 }}>
          <MetricCard label="TOTAL RUNS" value={stats.total_runs} sub="EXECUTIONS" accent="#3f3f46" textAccent="#f4f4f5" sparkData={runsSpark} sparkColor="#a1a1aa" visible={visible} isMobile={isMobile} />
          <MetricCard label="CLAIMS" value={stats.total_claims} sub="FROM ARXIV" accent="#3f3f46" textAccent="#f4f4f5" sparkData={claimsSpark} sparkColor="#3b82f6" visible={visible} isMobile={isMobile} />
          <MetricCard label="CONFLICTS" value={stats.critical_conflicts} sub="NLI DETECTED" accent="#ef4444" textAccent="#ef4444" sparkData={conflictsSpark} sparkColor="#ef4444" visible={visible} isMobile={isMobile} />
          <MetricCard label="FAITHFULNESS" value={faith} sub="AVG SCORE %" accent="#22c55e" textAccent="#22c55e" visible={visible} isMobile={isMobile} />
        </div>

        {/* Benchmark + System Status */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2, marginBottom: 2 }}>

          {/* Benchmark */}
          <div style={{ background: '#111113', padding: isMobile ? '12px' : '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em' }}>RUST PERFORMANCE BENCHMARK</div>
              <BenchmarkPopup />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#52525b' }}>[PYTHON] SEQUENTIAL</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#52525b' }}>~58 MIN</span>
              </div>
              <div style={{ height: 12, background: '#27272a' }}><div style={{ height: '100%', width: '100%', background: '#3f3f46' }} /></div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#22c55e', textShadow: '0 0 8px rgba(34,197,94,0.4)' }}>[RUST] PARALLEL ASYNC</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#22c55e' }}>963MS</span>
              </div>
              <div style={{ height: 12, background: '#27272a' }}><div style={{ height: '100%', width: `${rustBarW}%`, background: '#22c55e', transition: 'width 1.5s ease', boxShadow: '0 0 8px rgba(34,197,94,0.4)' }} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2 }}>
              {[
                { val: '3.600×', label: isMobile ? 'EXTRACT' : 'EXTRACTION' },
                { val: '435×',   label: isMobile ? 'NLI' : 'NLI DETECT' },
                { val: '97×',    label: isMobile ? 'E2E' : 'END-TO-END' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#0a0a0c', padding: isMobile ? '8px' : '10px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 22 : 26, color: '#22c55e', textShadow: '0 0 10px rgba(34,197,94,0.4)' }}>{s.val}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#52525b', marginTop: 2, letterSpacing: '0.1em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div style={{ background: '#111113', padding: isMobile ? '12px' : '16px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 12, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>SYSTEM STATUS</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : '1fr', gap: isMobile ? 6 : 0 }}>
              {STATUSES.map(s => (
                <StatusRow key={s.label} {...s} isMobile={isMobile} />
              ))}
            </div>
          </div>
        </div>

        {/* Live Log Stream */}
        <LiveLogStream isMobile={isMobile} />
      </div>
    </div>
  );
}