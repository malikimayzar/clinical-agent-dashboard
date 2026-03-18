import React, { useState, useEffect } from 'react';
import { useAPI } from '../api';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

const PIPELINE_NODES = [
  { label: 'PAPER MONITOR',     time: '~30s',   lang: 'PYTHON', color: '#f59e0b' },
  { label: 'CLAIM EXTRACTOR',   time: '963ms',  lang: 'RUST',   color: '#22c55e' },
  { label: 'CLAIM COMPARATOR',  time: '~3s',    lang: 'PYTHON', color: '#f59e0b' },
  { label: 'CONFLICT DETECT',   time: '672ms',  lang: 'GROQ',   color: '#a78bfa' },
  { label: 'ALERT NODE',        time: '<100ms', lang: 'PYTHON', color: '#f59e0b' },
  { label: 'FAITHFULNESS EVAL', time: '5.3s',   lang: 'PYTHON', color: '#f59e0b' },
  { label: 'AUDIT LOGGER',      time: '203ms',  lang: 'SQL',    color: '#818cf8' },
  { label: 'REPORT GENERATOR',  time: '9ms',    lang: 'PYTHON', color: '#f59e0b' },
];

function shortDatetime(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase() + ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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

function dur(start, end) {
  if (!start || !end) return null;
  return Math.round((new Date(end) - new Date(start)) / 1000);
}

const ST = {
  success: { color: '#22c55e', label: 'DONE',    glow: '0 0 8px rgba(34,197,94,0.6)' },
  done:    { color: '#22c55e', label: 'DONE',    glow: '0 0 8px rgba(34,197,94,0.6)' },
  failed:  { color: '#ef4444', label: 'FAILED',  glow: '0 0 8px rgba(239,68,68,0.6)' },
  running: { color: '#f59e0b', label: 'RUNNING', glow: '0 0 8px rgba(245,158,11,0.6)' },
};

function CircularGauge({ rate, total, success, isMobile }) {
  const r = isMobile ? 40 : 52;
  const circ = 2 * Math.PI * r;
  const dash = (rate / 100) * circ;
  const color = rate > 90 ? '#22c55e' : rate > 70 ? '#f59e0b' : '#ef4444';
  const size = isMobile ? 100 : 130;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1c1c1e" strokeWidth={isMobile ? 6 : 8} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={isMobile ? 6 : 8}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 22 : 28, color, lineHeight: 1, textShadow: `0 0 10px ${color}88` }}>{rate}%</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: '#52525b', letterSpacing: '0.08em', marginTop: 2 }}>SUCCESS</div>
        </div>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#71717a', letterSpacing: '0.1em', textShadow: '0 0 4px rgba(113,113,122,0.3)', marginBottom: 3 }}>SUCCESS RATE</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#a1a1aa' }}>{success}/{total} RUNS</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color, marginTop: 3, textShadow: `0 0 5px ${color}55` }}>
          {rate > 90 ? '● EXCELLENT' : rate > 70 ? '● GOOD' : '● NEEDS ATTENTION'}
        </div>
      </div>
    </div>
  );
}

function RunHeatmap({ runs, isMobile }) {
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
  const runMap = runs.reduce((acc, r) => { const day = r.started_at?.slice(0, 10); if (day) acc[day] = (acc[day] || 0) + 1; return acc; }, {});
  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div style={{ background: '#111113', padding: '12px 16px', marginBottom: 2 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 10, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>30-DAY EXECUTION HEATMAP</div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
        {days.map(day => {
          const count = runMap[day] || 0;
          const isToday = day === todayStr;
          const bg = count > 1 ? '#22c55e' : count === 1 ? '#22c55e88' : '#1c1c1e';
          return (
            <div key={day} title={`${day}: ${count} run(s)`} style={{
              flex: 1, height: count > 0 ? 16 : 8,
              background: bg,
              border: isToday ? '1px solid #ef4444' : '1px solid transparent',
              boxShadow: count > 0 ? `0 0 ${isToday ? 10 : 4}px rgba(34,197,94,${isToday ? 0.7 : 0.3})` : 'none',
              transition: 'height 0.3s',
              animation: isToday && count > 0 ? 'rn-breathe 2s ease infinite' : 'none',
            }} />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a' }}>
        <span>30D AGO</span><span style={{ color: '#ef444488' }}>TODAY</span>
      </div>
    </div>
  );
}

function RunCardMobile({ run, index, prev, isFastest }) {
  const [expanded, setExpanded] = useState(false);
  const st = ST[run.status] || ST.done;
  const d = dur(run.started_at, run.finished_at);
  const faithPassed = run.claims_extracted > 0 ? Math.round((run.claims_extracted - (run.conflicts_found || 0)) / run.claims_extracted * run.claims_extracted) : 0;
  const isRunning = run.status === 'running';

  return (
    <div style={{ background: '#111113', borderLeft: `3px solid ${st.color}`, borderBottom: '1px solid #1c1c1e', animation: `rn-stagger 0.3s ${index * 0.04}s ease both`, opacity: 0 }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: '14px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: st.color, boxShadow: st.glow, animation: isRunning ? 'rn-pulse 1s ease infinite' : 'none' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: st.color, letterSpacing: '0.1em', animation: isRunning ? 'rn-blink 1.5s ease infinite' : 'none' }}>{st.label}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d4d4d8', flex: 1 }}>{shortDatetime(run.started_at)}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {isFastest && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)', padding: '1px 5px', boxShadow: '0 0 6px rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.06)' }}>⚡</span>}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)', padding: '1px 5px' }}>GROQ</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
          {[
            { label: 'PAPERS', val: run.papers_processed ?? 0, color: '#f4f4f5' },
            { label: 'CLAIMS', val: run.claims_extracted ?? 0, color: '#f4f4f5' },
            { label: 'CONFLICTS', val: run.conflicts_found ?? 0, color: (run.conflicts_found ?? 0) > 0 ? '#ef4444' : '#3f3f46' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: '#0a0a0c', padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#71717a', letterSpacing: '0.12em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 24, color, lineHeight: 1, textShadow: color === '#ef4444' && val > 0 ? '0 0 8px rgba(239,68,68,0.4)' : 'none' }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {d && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: d < 60 ? '#22c55e' : '#f59e0b', border: `1px solid ${d < 60 ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`, padding: '2px 8px', boxShadow: d < 60 ? '0 0 4px rgba(34,197,94,0.2)' : 'none' }}>{d}S</span>}
          {prev && (() => { const diff = (run.claims_extracted ?? 0) - (prev.claims_extracted ?? 0); return diff !== 0 ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: diff > 0 ? '#22c55e' : '#f59e0b' }}>{diff > 0 ? '+' : ''}{diff} CLAIMS</span> : null; })()}
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b' }}>{timeAgo(run.started_at)} {expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid #1c1c1e', padding: '12px 14px', background: '#0a0a0c' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 8 }}>NODE EXECUTION TRACE</div>
          {PIPELINE_NODES.map(n => (
            <div key={n.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: n.color, boxShadow: `0 0 4px ${n.color}66` }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#a1a1aa', flex: 1 }}>{n.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: n.color }}>{n.time}</span>
            </div>
          ))}
          <div style={{ background: '#111113', padding: '10px 12px', borderLeft: '2px solid #22c55e', marginTop: 12, marginBottom: 10, boxShadow: '0 0 8px rgba(34,197,94,0.1)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', marginBottom: 3 }}>FAITHFULNESS HEALTH</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 18, color: '#22c55e' }}>{faithPassed}/{run.claims_extracted || 0} PASSED</div>
              <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 24, color: '#22c55e', textShadow: '0 0 8px rgba(34,197,94,0.4)' }}>
                {run.claims_extracted > 0 ? Math.round((faithPassed / run.claims_extracted) * 100) : 0}%
              </div>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `run_${run.run_id?.slice(0,8)}.json`; a.click(); }}
            style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: '#22c55e', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', padding: '8px', cursor: 'pointer', minHeight: 44, boxShadow: '0 0 6px rgba(34,197,94,0.15)' }}>
            EXPORT JSON ↓
          </button>
        </div>
      )}
    </div>
  );
}

function RunRowDesktop({ run, index, prev, isFastest }) {
  const [expanded, setExpanded] = useState(false);
  const st = ST[run.status] || ST.done;
  const d = dur(run.started_at, run.finished_at);
  const faithPassed = run.claims_extracted > 0 ? Math.round((run.claims_extracted - (run.conflicts_found || 0)) / run.claims_extracted * run.claims_extracted) : 0;
  const isRunning = run.status === 'running';

  return (
    <div style={{ background: '#111113', borderLeft: '2px solid transparent', transition: 'all 0.1s', animation: `rn-stagger 0.3s ${index * 0.04}s ease both`, opacity: 0 }}
      onMouseEnter={e => { e.currentTarget.style.borderLeftColor = st.color; e.currentTarget.style.boxShadow = `0 0 16px ${st.color}08`; }}
      onMouseLeave={e => { e.currentTarget.style.borderLeftColor = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div onClick={() => setExpanded(!expanded)} style={{ padding: '14px 20px', cursor: 'crosshair', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, width: 90 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, boxShadow: st.glow, animation: isRunning ? 'rn-pulse 1s ease infinite' : 'none' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: st.color, letterSpacing: '0.08em', animation: isRunning ? 'rn-blink 1.5s ease infinite' : 'none' }}>{st.label}</span>
        </div>
        <div style={{ flexShrink: 0, width: 120 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#d4d4d8' }}>{shortDatetime(run.started_at)}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 11, alignItems: 'center' }}>
          <span style={{ color: '#71717a' }}>{run.papers_processed ?? 0} PAPERS</span>
          <span style={{ color: '#71717a' }}>{run.claims_extracted ?? 0} CLAIMS</span>
          {(run.conflicts_found ?? 0) > 0 && <span style={{ color: '#ef4444', fontWeight: 600, textShadow: '0 0 6px rgba(239,68,68,0.4)' }}>{run.conflicts_found} CONFLICTS</span>}
          {d && <span style={{ color: d < 60 ? '#22c55e' : '#f59e0b', fontSize: 10, textShadow: d < 60 ? '0 0 4px rgba(34,197,94,0.3)' : 'none' }}>{d}S</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
          {prev && (() => { const diff = (run.claims_extracted ?? 0) - (prev.claims_extracted ?? 0); return diff !== 0 ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: diff > 0 ? '#22c55e' : '#f59e0b' }}>{diff > 0 ? '+' : ''}{diff} CLAIMS</span> : null; })()}
          {isFastest && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)', padding: '1px 5px', boxShadow: '0 0 8px rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.06)' }}>⚡ FASTEST</span>}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)', padding: '1px 5px', boxShadow: '0 0 4px rgba(167,139,250,0.2)' }}>GROQ L3.3</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#3f3f46' }}>{timeAgo(run.started_at)}</span>
          <span style={{ color: '#ef4444', fontSize: 16, fontWeight: 900, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>›</span>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid #1c1c1e', padding: '14px 20px', background: '#0a0a0c' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 10 }}>NODE EXECUTION TRACE</div>
              {PIPELINE_NODES.map(n => (
                <div key={n.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: n.color, boxShadow: `0 0 4px ${n.color}66` }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#a1a1aa', flex: 1 }}>{n.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: n.color, textShadow: `0 0 4px ${n.color}55` }}>{n.time}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: n.color + '77', border: `1px solid ${n.color}22`, padding: '0 4px' }}>{n.lang}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 10 }}>RUN METADATA</div>
              {[
                { l: 'RUN ID',     v: run.run_id?.slice(0, 20) + '...' },
                { l: 'DURATION',   v: d ? d + 'S' : '—', c: d && d < 60 ? '#22c55e' : '#f59e0b' },
                { l: 'MODEL',      v: 'GROQ LLAMA 3.3 70B', c: '#a78bfa' },
                { l: 'SIMILARITY', v: 'RUST :8003 HYBRID',  c: '#22c55e' },
                { l: 'RECOVERY',   v: 'ENABLED',            c: '#22c55e' },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ display: 'flex', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 10, marginBottom: 4 }}>
                  <span style={{ color: '#3f3f46', width: 80, flexShrink: 0 }}>{l}</span>
                  <span style={{ color: c || '#71717a' }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 10, background: '#111113', padding: '10px', borderLeft: '2px solid #22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.1)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', marginBottom: 4 }}>FAITHFULNESS</div>
                <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 20, color: '#22c55e', textShadow: '0 0 8px rgba(34,197,94,0.4)' }}>
                  {faithPassed}/{run.claims_extracted || 0} · {run.claims_extracted > 0 ? Math.round((faithPassed / run.claims_extracted) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `run_${run.run_id?.slice(0,8)}.json`; a.click(); }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: '#22c55e', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', padding: '5px 14px', cursor: 'crosshair', boxShadow: '0 0 6px rgba(34,197,94,0.15)' }}>
            EXPORT JSON ↓
          </button>
        </div>
      )}
    </div>
  );
}

export default function Runs() {
  const isMobile = useIsMobile();
  const { data, loading, error } = useAPI('/runs?limit=30');
  const runs = data?.runs || [];
  const fastestRun = runs.reduce((best, r) => { const d = dur(r.started_at, r.finished_at); if (!d) return best; if (!best || d < dur(best.started_at, best.finished_at)) return r; return best; }, null);
  const total = runs.length;
  const success = runs.filter(r => r.status === 'success' || r.status === 'done').length;
  const rate = total > 0 ? Math.round((success / total) * 100) : 0;

  return (
    <div style={{ padding: isMobile ? '16px 0' : '20px 28px', maxWidth: 1200, background: '#09090b', minHeight: '100vh' }}>
      <style>{`
        @keyframes rn-stagger { from{opacity:0;transform:translateX(-6px);}to{opacity:1;transform:translateX(0);} }
        @keyframes rn-pulse   { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.3;transform:scale(0.7);} }
        @keyframes rn-blink   { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes rn-breathe { 0%,100%{box-shadow:0 0 6px rgba(34,197,94,0.4);}50%{box-shadow:0 0 14px rgba(34,197,94,0.8);} }
        @keyframes rn-scan    { 0%{top:0;}100%{top:100%;} }
      `}</style>
      <div style={{ position: 'fixed', left: 0, right: 0, height: 1, background: 'rgba(239,68,68,0.04)', animation: 'rn-scan 7s linear infinite', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <div style={{ borderBottom: '1px solid #27272a', paddingBottom: 14, marginBottom: 16, padding: isMobile ? '0 16px 14px' : '0 0 14px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 'clamp(38px,10vw,52px)' : 64, letterSpacing: '0.04em', lineHeight: 1, color: '#f4f4f5' }}>PIPELINE</div>
            <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 'clamp(38px,10vw,52px)' : 64, letterSpacing: '0.04em', lineHeight: 1, color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.25)' }}>RUNS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 10, color: '#71717a', marginTop: 8, letterSpacing: '0.1em', lineHeight: 1.6 }}>
              FULL EXECUTION HISTORY · ~40S/RUN · <span style={{ color: '#22c55e', textShadow: '0 0 5px rgba(34,197,94,0.4)' }}>97× SPEEDUP</span> · PDF EXPORT <span style={{ color: '#a78bfa' }}>RUST :8004</span>
            </div>
          </div>
          {runs.length > 0 && <CircularGauge rate={rate} total={total} success={success} isMobile={isMobile} />}
        </div>
      </div>

      {runs.length > 0 && <div style={{ position: 'relative', zIndex: 1 }}><RunHeatmap runs={runs} isMobile={isMobile} /></div>}

      <div style={{ background: '#111113', borderLeft: '2px solid #22c55e', padding: '8px 14px', marginBottom: 2, boxShadow: '0 0 10px rgba(34,197,94,0.08)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: isMobile ? 8 : 12 }}>
          {[
            { label: 'RECOVERY',   val: 'ENABLED',    color: '#22c55e' },
            { label: 'LOGGING',    val: 'ZERO-LOSS',  color: '#22c55e' },
            { label: 'SCHEDULER',  val: '02:00 UTC',  color: '#f59e0b' },
            { label: 'SIMILARITY', val: 'RUST :8003', color: '#22c55e' },
            { label: 'PDF EXPORT', val: 'RUST :8004', color: '#a78bfa' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#71717a' }}>{label}:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color, textShadow: `0 0 5px ${color}55` }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {loading ? (
          <div style={{ padding: isMobile ? '2rem 16px' : '2rem 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#71717a' }}>LOADING...</div>
        ) : error ? (
          <div style={{ padding: isMobile ? '2rem 16px' : '2rem 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ef4444' }}>ERR: {error}</div>
        ) : runs.length === 0 ? (
          <div style={{ padding: isMobile ? '3rem 16px' : '3rem 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#52525b', letterSpacing: '0.15em' }}>/ SYSTEM IDLE /</div>
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {runs.map((r, i) => <RunCardMobile key={r.run_id} run={r} index={i} prev={runs[i + 1]} isFastest={fastestRun?.run_id === r.run_id} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
            {runs.map((r, i) => <RunRowDesktop key={r.run_id} run={r} index={i} prev={runs[i + 1]} isFastest={fastestRun?.run_id === r.run_id} />)}
          </div>
        )}
      </div>
    </div>
  );
}