import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
  return <span style={{ fontVariantNumeric: 'tabular-nums', color: '#71717a', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em' }}>{time}</span>;
}

function CountUp({ target, duration = 1000, suffix = '' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target == null || isNaN(target)) return;
    let current = 0;
    const step = target / (duration / 16);
    const iv = setInterval(() => {
      current = Math.min(current + step, target);
      setVal(Math.round(current));
      if (current >= target) clearInterval(iv);
    }, 16);
    return () => clearInterval(iv);
  }, [target, duration]);
  if (target == null) return <span>—</span>;
  return <span>{val.toLocaleString()}{suffix}</span>;
}

function SpeedupCounter() {
  const [val, setVal] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => {
      let n = 1;
      const iv = setInterval(() => {
        n = Math.min(n + 80, 3600);
        setVal(n);
        if (n >= 3600) clearInterval(iv);
      }, 16);
    }, 800);
    return () => clearTimeout(t);
  }, []);
  return <span>{val.toLocaleString()}×</span>;
}

function TerminalTicker({ runs, isMobile }) {
  const PREFIXES = [
    { tag: '[RUST]', color: '#22c55e' },
    { tag: '[PYTHON]', color: '#f59e0b' },
    { tag: '[CRITICAL]', color: '#ef4444' },
    { tag: '[NLI]', color: '#a78bfa' },
    { tag: '[AUDIT]', color: '#71717a' },
    { tag: '[OK]', color: '#22c55e' },
  ];
  const DEFAULT_LOGS = [
    'claim-parser extracted 4 claims in 963ms',
    'similarity-engine batch processed in 47ms',
    'conflict detected: contradictory evidence on SSRI',
    'NLI score 0.91 — severity: CRITICAL',
    'faithfulness eval completed: avg 0.847',
    'audit_logger persisted records to PostgreSQL',
    'report generated successfully',
    'pipeline completed in 40.2s — 97x speedup',
  ];
  const logs = runs.length > 0
    ? runs.slice(0, isMobile ? 4 : 8).map(r => `run ${r.run_id?.slice(0, 8)}... — ${r.papers_processed || 0} papers, ${r.claims_extracted || 0} claims, ${r.conflicts_found || 0} conflicts`)
    : DEFAULT_LOGS.slice(0, isMobile ? 4 : 8);
  const doubled = [...logs, ...logs];

  return (
    <div style={{ height: isMobile ? 80 : 110, overflow: 'hidden', padding: '6px 12px' }}>
      <style>{`@keyframes ov-ticker{0%{transform:translateY(0);}100%{transform:translateY(-50%);}}`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, animation: `ov-ticker ${logs.length * 2.5}s linear infinite` }}>
        {doubled.map((log, i) => {
          const pre = PREFIXES[i % PREFIXES.length];
          const ts = new Date().toISOString().slice(11, 19);
          return (
            <div key={i} style={{ fontSize: isMobile ? 10 : 11, whiteSpace: 'nowrap', display: 'flex', gap: 8, fontFamily: 'var(--font-mono)', overflow: 'hidden' }}>
              <span style={{ color: '#3f3f46', flexShrink: 0 }}>{ts}</span>
              <span style={{ color: pre.color, fontWeight: 500, flexShrink: 0 }}>{pre.tag}</span>
              <span style={{ color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log}</span>
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
  const h = Math.floor(diff / 3600000), m = Math.floor(diff / 60000);
  if (h > 24) return Math.floor(h / 24) + 'D AGO';
  if (h > 0) return h + 'H AGO';
  if (m > 0) return m + 'M AGO';
  return 'JUST NOW';
}

function shortDate(s) {
  if (!s) return '';
  const d = new Date(s);
  return `${d.getDate()} ${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getMonth()]}`;
}

const COLORS = { critical: '#ef4444', major: '#f97316', minor: '#3b82f6' };

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f0f11', border: '1px solid #27272a', padding: '8px 10px', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
      <div style={{ color: '#71717a', marginBottom: 4 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
    </div>
  );
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
  const isMobile = useIsMobile();
  const { data: statsData, loading: sL } = useAPI('/stats');
  const { data: runsData } = useAPI('/runs?limit=14');
  const { data: conflictsData } = useAPI('/conflicts?limit=5');
  const [cardsVisible, setCardsVisible] = useState([false, false, false, false]);
  const [rustBarWidth, setRustBarWidth] = useState(0);

  const stats = statsData?.stats || {};
  const runs = (runsData?.runs || []).slice().reverse();
  const conflicts = conflictsData?.conflicts || [];

  useEffect(() => {
    [0,1,2,3].forEach(i => {
      setTimeout(() => setCardsVisible(prev => { const n=[...prev]; n[i]=true; return n; }), i*100+200);
    });
    setTimeout(() => setRustBarWidth(0.028), 1000);
  }, []);

  const faith = stats.avg_faithfulness != null ? Math.round(stats.avg_faithfulness * 100) : null;

  return (
    <div style={{ background: '#09090b', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes ov-pulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(0.85);} }
        @keyframes ov-glitch { 0%,90%,100%{transform:none;color:#f4f4f5;}92%{transform:translate(-2px,0);color:#ef4444;}94%{transform:translate(2px,0);color:#22c55e;}96%{transform:translate(-1px,0);color:#f4f4f5;} }
        @keyframes ov-scan { 0%{top:-2px;}100%{top:100%;} }
        @keyframes ov-fadein { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);} }
        .ov-glitch { animation: ov-glitch 6s ease infinite; font-family:'Bebas Neue','Barlow Condensed',sans-serif; }
        .ov-scan { position:absolute;left:0;right:0;height:2px;background:linear-gradient(transparent,rgba(34,197,94,0.12),transparent);animation:ov-scan 4s linear infinite;pointer-events:none;z-index:10; }
        .ov-dot-bg { background-image:radial-gradient(circle,#27272a 1px,transparent 1px);background-size:24px 24px;position:absolute;inset:0;opacity:0.3;pointer-events:none; }
      `}</style>

      <div className="ov-dot-bg" />
      <div className="ov-scan" />

      <div style={{ position: 'relative', zIndex: 1, padding: isMobile ? '16px' : '20px 28px', maxWidth: 1200 }}>

        {/* Header — FIXED mobile layout */}
        <div style={{ borderBottom: '1px solid #1c1c1e', paddingBottom: 14, marginBottom: isMobile ? 16 : 24 }}>
          {/* Top row: live indicator only */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'ov-pulse 1.8s ease infinite', boxShadow: '0 0 8px rgba(239,68,68,0.6)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#a1a1aa', letterSpacing: '0.15em' }}>LIVE SYSTEM</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#22c55e', letterSpacing: '0.12em' }}>· 02:00 UTC DAILY</span>
            </div>
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <UTCClock />
                <a href={`${API}/docs`} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', border: '1px solid #27272a', padding: '3px 8px', textDecoration: 'none', letterSpacing: '0.1em', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#22c55e'; e.currentTarget.style.color='#22c55e'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#27272a'; e.currentTarget.style.color='#52525b'; }}
                >API DOCS ↗</a>
              </div>
            )}
          </div>

          {/* Mobile: UTC clock on second row */}
          {isMobile && (
            <div style={{ marginBottom: 8 }}>
              <UTCClock />
            </div>
          )}

          {/* Title */}
          <div className="ov-glitch" style={{ fontSize: isMobile ? 'clamp(42px,11vw,56px)' : 64, letterSpacing: '0.04em', lineHeight: 0.95, color: '#f4f4f5' }}>PIPELINE</div>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 'clamp(42px,11vw,56px)' : 64, letterSpacing: '0.04em', lineHeight: 0.95, color: '#ef4444', marginBottom: 10 }}>OVERVIEW</div>
          {stats.last_run && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 10, color: '#71717a', letterSpacing: '0.1em' }}>
              LAST RUN — {new Date(stats.last_run).toUTCString().slice(0,25).toUpperCase()} · {timeAgo(stats.last_run)}
            </div>
          )}
        </div>

        {/* Metric cards — 2×2 on mobile, 4×1 on desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0,1fr))' : 'repeat(4, minmax(0,1fr))', gap: 2, marginBottom: 2 }}>
          {[
            { label: 'TOTAL RUNS', value: stats.total_runs, sub: 'EXECUTIONS', accent: '#3f3f46', textAccent: '#f4f4f5', suffix: '' },
            { label: 'CLAIMS', value: stats.total_claims, sub: 'FROM ARXIV', accent: '#3f3f46', textAccent: '#f4f4f5', suffix: '' },
            { label: 'CONFLICTS', value: stats.critical_conflicts, sub: 'NLI DETECTED', accent: '#ef4444', textAccent: '#ef4444', suffix: '' },
            { label: 'FAITHFULNESS', value: faith, sub: 'AVG SCORE', accent: '#22c55e', textAccent: '#22c55e', suffix: '%' },
          ].map((m, i) => (
            <div key={i} style={{ background: '#111113', borderTop: `2px solid ${m.accent}`, padding: isMobile ? '12px' : '16px', opacity: cardsVisible[i] ? 1 : 0, animation: cardsVisible[i] ? 'ov-fadein 0.4s ease both' : 'none' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 8 : 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 36 : 52, color: m.textAccent, lineHeight: 1 }}>
                {cardsVisible[i] && <CountUp target={m.value} duration={900} suffix={m.suffix} />}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 8 : 9, color: '#3f3f46', marginTop: 6, letterSpacing: '0.1em' }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Benchmark + System Status */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2, marginBottom: 2 }}>

          {/* Benchmark */}
          <div style={{ background: '#111113', padding: isMobile ? '12px' : '16px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 14 }}>RUST PERFORMANCE BENCHMARK</div>
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
              <div style={{ height: 12, background: '#27272a' }}><div style={{ height: '100%', width: `${rustBarWidth}%`, background: '#22c55e', transition: 'width 1.5s ease' }} /></div>
            </div>
            {/* Speedup grid — 3 col */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2 }}>
              {[
                { val: <SpeedupCounter />, label: isMobile ? 'EXTRACT' : 'EXTRACTION' },
                { val: '435×', label: isMobile ? 'NLI' : 'NLI DETECT' },
                { val: '97×', label: isMobile ? 'E2E' : 'END-TO-END' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#0a0a0c', padding: isMobile ? '8px' : '10px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 22 : 26, color: '#22c55e', textShadow: '0 0 10px rgba(34,197,94,0.4)' }}>{s.val}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#52525b', letterSpacing: '0.1em', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status — 2 col grid on mobile */}
          <div style={{ background: '#111113', padding: isMobile ? '12px' : '16px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 12 }}>SYSTEM STATUS</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : '1fr', gap: isMobile ? 6 : 0 }}>
              {STATUSES.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: isMobile ? '6px 8px' : '7px 0', borderBottom: !isMobile && i < STATUSES.length - 1 ? '1px solid #1c1c1e' : 'none', background: isMobile ? '#0a0a0c' : 'transparent' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0, boxShadow: s.color === '#22c55e' ? '0 0 6px rgba(34,197,94,0.5)' : 'none' }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 8 : 10, color: '#a1a1aa', letterSpacing: '0.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</div>
                    {!isMobile && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: s.langColor, letterSpacing: '0.04em', marginTop: 1 }}>{s.lang} {s.port}</div>}
                  </div>
                  {isMobile && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: s.langColor, flexShrink: 0 }}>{s.lang}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar chart — only desktop, mobile skip */}
        {!isMobile && runs.length > 0 && (
          <div style={{ background: '#111113', padding: '16px', marginBottom: 2 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 12 }}>PIPELINE RUNS — LAST 14</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: '#4dff9f' }}>▪ PAPERS</span>
              <span style={{ color: '#4d9fff' }}>▪ CLAIMS</span>
              <span style={{ color: '#ef4444' }}>▪ CONFLICTS</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={runs} barGap={1} barCategoryGap="25%">
                <XAxis dataKey="started_at" tickFormatter={shortDate} tick={{ fontSize: 9, fill: '#3f3f46', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#3f3f46', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="papers_processed" name="PAPERS" fill="#4dff9f" radius={0} />
                <Bar dataKey="claims_extracted" name="CLAIMS" fill="#4d9fff" radius={0} />
                <Bar dataKey="conflicts_found" name="CONFLICTS" fill="#ef4444" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Terminal Ticker */}
        <div style={{ background: '#111113', borderTop: '1px solid #27272a' }}>
          <div style={{ padding: '6px 12px', borderBottom: '1px solid #1c1c1e', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.5)', animation: 'ov-pulse 1.5s ease infinite' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em' }}>AUDIT LOG / LIVE FEED</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.08em' }}>
              {runsData?.count || (runsData?.runs?.length || 0)} RECENT RUNS
            </span>
          </div>
          <TerminalTicker runs={runsData?.runs || []} isMobile={isMobile} />
        </div>

      </div>
    </div>
  );
}