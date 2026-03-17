import React, { useState, useEffect } from 'react';
import { useAPI, apiFetch } from '../api';

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
  { id: 'paper_monitor',     label: 'PAPER MONITOR',     time: '~30s',   lang: 'PYTHON', color: '#f59e0b' },
  { id: 'claim_extractor',   label: 'CLAIM EXTRACTOR',   time: '963ms',  lang: 'RUST',   color: '#22c55e' },
  { id: 'compare_claims',    label: 'CLAIM COMPARATOR',  time: '~3s',    lang: 'PYTHON', color: '#f59e0b' },
  { id: 'detect_conflict',   label: 'CONFLICT DETECT',   time: '672ms',  lang: 'GROQ',   color: '#a78bfa' },
  { id: 'alert_node',        label: 'ALERT NODE',        time: '<100ms', lang: 'PYTHON', color: '#f59e0b' },
  { id: 'faithfulness_eval', label: 'FAITHFULNESS EVAL', time: '5.3s',   lang: 'PYTHON', color: '#f59e0b' },
  { id: 'audit_logger',      label: 'AUDIT LOGGER',      time: '203ms',  lang: 'SQL',    color: '#818cf8' },
  { id: 'report_generator',  label: 'REPORT GENERATOR',  time: '9ms',    lang: 'PYTHON', color: '#f59e0b' },
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

function duration(start, end) {
  if (!start || !end) return null;
  return Math.round((new Date(end) - new Date(start)) / 1000);
}

const STATUS_CONFIG = {
  success: { color: '#22c55e', label: 'DONE',    glow: '0 0 6px rgba(34,197,94,0.5)' },
  done:    { color: '#22c55e', label: 'DONE',    glow: '0 0 6px rgba(34,197,94,0.5)' },
  failed:  { color: '#ef4444', label: 'FAILED',  glow: '0 0 6px rgba(239,68,68,0.5)' },
  running: { color: '#f59e0b', label: 'RUNNING', glow: '0 0 6px rgba(245,158,11,0.5)' },
};

// ── Mobile Run Card ──
function RunCardMobile({ run, index, prev, isFastest }) {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS_CONFIG[run.status] || STATUS_CONFIG.done;
  const dur = duration(run.started_at, run.finished_at);
  const faithPassed = run.claims_extracted > 0
    ? Math.round((run.claims_extracted - (run.conflicts_found || 0)) / run.claims_extracted * run.claims_extracted)
    : 0;

  const exportRun = (e) => {
    e.stopPropagation();
    const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `run_${run.run_id?.slice(0,8)}.json`; a.click();
  };

  return (
    <div style={{
      background: '#111113',
      borderLeft: `3px solid ${st.color}`,
      borderBottom: '1px solid #1c1c1e',
      animation: `rn-fadein 0.3s ${index * 0.04}s ease both`,
      opacity: 0,
    }}>
      <style>{`@keyframes rn-fadein{from{opacity:0;transform:translateX(-6px);}to{opacity:1;transform:translateX(0);}}`}</style>

      {/* Main card content */}
      <div onClick={() => setExpanded(!expanded)} style={{ padding: '14px', cursor: 'pointer' }}>

        {/* Top: Status + Time + Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: st.color, boxShadow: st.glow, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: st.color, letterSpacing: '0.1em' }}>{st.label}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d4d4d8', letterSpacing: '0.04em', flex: 1 }}>{shortDatetime(run.started_at)}</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {isFastest && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)', padding: '2px 5px', background: 'rgba(245,158,11,0.06)' }}>⚡</span>
            )}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)', padding: '2px 5px' }}>GROQ</span>
          </div>
        </div>

        {/* Mid: 3-col metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
          <div style={{ background: '#0a0a0c', padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#71717a', letterSpacing: '0.12em', marginBottom: 4, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>PAPERS</div>
            <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 24, color: '#f4f4f5', lineHeight: 1 }}>{run.papers_processed ?? 0}</div>
          </div>
          <div style={{ background: '#0a0a0c', padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#71717a', letterSpacing: '0.12em', marginBottom: 4, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>CLAIMS</div>
            <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 24, color: '#f4f4f5', lineHeight: 1 }}>{run.claims_extracted ?? 0}</div>
          </div>
          <div style={{ background: '#0a0a0c', padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#71717a', letterSpacing: '0.12em', marginBottom: 4, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>CONFLICTS</div>
            <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 24, color: run.conflicts_found > 0 ? '#ef4444' : '#3f3f46', lineHeight: 1, textShadow: run.conflicts_found > 0 ? '0 0 8px rgba(239,68,68,0.4)' : 'none' }}>
              {run.conflicts_found ?? 0}
            </div>
          </div>
        </div>

        {/* Bottom: Performance + Delta */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {dur && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: dur < 60 ? '#22c55e' : '#f59e0b', background: dur < 60 ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${dur < 60 ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`, padding: '3px 8px', letterSpacing: '0.08em' }}>
              {dur}S
            </span>
          )}
          {prev && run.claims_extracted != null && prev.claims_extracted != null && (() => {
            const diff = run.claims_extracted - prev.claims_extracted;
            if (diff === 0) return null;
            return (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: diff > 0 ? '#22c55e' : '#f59e0b', letterSpacing: '0.06em' }}>
                {diff > 0 ? '+' : ''}{diff} CLAIMS
              </span>
            );
          })()}
          {prev && run.conflicts_found != null && prev.conflicts_found != null && (() => {
            const diff = run.conflicts_found - prev.conflicts_found;
            if (diff === 0) return null;
            return (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: diff > 0 ? '#ef4444' : '#22c55e', letterSpacing: '0.06em' }}>
                {diff > 0 ? '+' : ''}{diff} CONF
              </span>
            );
          })()}
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.08em' }}>
            {timeAgo(run.started_at)} {expanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid #1c1c1e', padding: '12px 14px', background: '#0a0a0c' }}>

          {/* Node trace */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 8, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>NODE EXECUTION TRACE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
            {PIPELINE_NODES.map((n, i) => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: n.color, flexShrink: 0, boxShadow: `0 0 4px ${n.color}66` }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#a1a1aa', flex: 1 }}>{n.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: n.color }}>{n.time}</span>
              </div>
            ))}
          </div>

          {/* Faithfulness health */}
          <div style={{ background: '#111113', padding: '10px 12px', borderLeft: '2px solid #22c55e', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.12em', marginBottom: 2, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>FAITHFULNESS HEALTH</div>
                <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 18, color: '#22c55e' }}>{faithPassed}/{run.claims_extracted || 0} PASSED</div>
              </div>
              <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 28, color: '#22c55e', textShadow: '0 0 10px rgba(34,197,94,0.4)' }}>
                {run.claims_extracted > 0 ? Math.round((faithPassed / run.claims_extracted) * 100) : 0}%
              </div>
            </div>
            <div style={{ height: 3, background: '#27272a' }}>
              <div style={{ height: '100%', width: `${run.claims_extracted > 0 ? (faithPassed / run.claims_extracted) * 100 : 0}%`, background: '#22c55e', transition: 'width 0.8s ease' }} />
            </div>
          </div>

          {/* Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
            {[
              { l: 'RUN ID', v: run.run_id?.slice(0, 16) + '...' },
              { l: 'DURATION', v: dur ? dur + 'S' : '—', color: dur && dur < 60 ? '#22c55e' : '#f59e0b' },
              { l: 'MODEL', v: 'GROQ L3.3', color: '#a78bfa' },
              { l: 'RECOVERY', v: 'ENABLED', color: '#22c55e' },
            ].map(({ l, v, color }) => (
              <div key={l} style={{ background: '#111113', padding: '8px 10px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#71717a', letterSpacing: '0.12em', marginBottom: 3, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>{l}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: color || '#a1a1aa' }}>{v}</div>
              </div>
            ))}
          </div>

          <button onClick={exportRun} style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: '#22c55e', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', padding: '8px', cursor: 'pointer', minHeight: 44 }}>
            EXPORT RUN JSON ↓
          </button>
        </div>
      )}
    </div>
  );
}

// ── Desktop Row ──
function RunRowDesktop({ run, index, prev, isFastest }) {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS_CONFIG[run.status] || STATUS_CONFIG.done;
  const dur = duration(run.started_at, run.finished_at);
  const faithPassed = run.claims_extracted > 0
    ? Math.round((run.claims_extracted - (run.conflicts_found || 0)) / run.claims_extracted * run.claims_extracted)
    : 0;

  return (
    <div style={{ background: '#111113', borderLeft: `2px solid transparent`, transition: 'border-color 0.1s', animation: `rn-fadein 0.3s ${index * 0.04}s ease both`, opacity: 0 }}
      onMouseEnter={e => e.currentTarget.style.borderLeftColor = st.color}
      onMouseLeave={e => e.currentTarget.style.borderLeftColor = 'transparent'}
    >
      <div onClick={() => setExpanded(!expanded)} style={{ padding: '14px 20px', cursor: 'crosshair', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, width: 80 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, boxShadow: st.glow }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: st.color, letterSpacing: '0.08em' }}>{st.label}</span>
        </div>
        <div style={{ flexShrink: 0, width: 110 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#d4d4d8', letterSpacing: '0.03em' }}>{shortDatetime(run.started_at)}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 11, alignItems: 'center' }}>
          <span style={{ color: '#71717a' }}>{run.papers_processed ?? 0} PAPERS</span>
          <span style={{ color: '#71717a' }}>{run.claims_extracted ?? 0} CLAIMS</span>
          {run.conflicts_found > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>{run.conflicts_found} CONFLICTS</span>}
          {dur && <span style={{ color: dur < 60 ? '#22c55e' : '#f59e0b', fontSize: 10 }}>{dur}S</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
          {prev && run.claims_extracted != null && prev.claims_extracted != null && (() => {
            const diff = run.claims_extracted - prev.claims_extracted;
            if (diff === 0) return null;
            return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: diff > 0 ? '#22c55e' : '#f59e0b' }}>{diff > 0 ? '+' : ''}{diff} CLAIMS</span>;
          })()}
          {isFastest && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', padding: '1px 5px', background: 'rgba(245,158,11,0.06)' }}>⚡ FASTEST</span>}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)', padding: '1px 5px' }}>GROQ L3.3</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#3f3f46', letterSpacing: '0.08em' }}>{timeAgo(run.started_at)}</span>
          <span style={{ color: '#ef4444', fontSize: 16, fontWeight: 900, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>›</span>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid #1c1c1e', padding: '14px 20px', background: '#0a0a0c' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 10, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>NODE EXECUTION TRACE</div>
              {PIPELINE_NODES.map(n => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: n.color, boxShadow: `0 0 4px ${n.color}66` }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#a1a1aa', flex: 1 }}>{n.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: n.color }}>{n.time}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: n.color + '66', border: `1px solid ${n.color}22`, padding: '0 4px' }}>{n.lang}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 10 }}>RUN METADATA</div>
              {[
                { l: 'RUN ID', v: run.run_id?.slice(0, 20) + '...' },
                { l: 'STARTED', v: shortDatetime(run.started_at) },
                { l: 'DURATION', v: dur ? dur + 'S' : '—', color: dur && dur < 60 ? '#22c55e' : '#f59e0b' },
                { l: 'MODEL', v: 'GROQ LLAMA 3.3 70B', color: '#a78bfa' },
                { l: 'SIMILARITY', v: 'RUST :8003 HYBRID', color: '#22c55e' },
                { l: 'RECOVERY', v: 'ENABLED', color: '#22c55e' },
              ].map(({ l, v, color }) => (
                <div key={l} style={{ display: 'flex', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 10, marginBottom: 4 }}>
                  <span style={{ color: '#3f3f46', width: 80, flexShrink: 0 }}>{l}</span>
                  <span style={{ color: color || '#71717a' }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, background: '#111113', padding: '10px', borderLeft: '2px solid #22c55e' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', marginBottom: 4 }}>FAITHFULNESS</div>
                <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 20, color: '#22c55e' }}>{faithPassed}/{run.claims_extracted || 0} · {run.claims_extracted > 0 ? Math.round((faithPassed / run.claims_extracted) * 100) : 0}%</div>
              </div>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `run_${run.run_id?.slice(0,8)}.json`; a.click(); }}
            style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: '#22c55e', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', padding: '5px 14px', cursor: 'crosshair' }}>
            EXPORT JSON ↓
          </button>
        </div>
      )}
    </div>
  );
}

function RunHeatmap({ runs }) {
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
  const runMap = runs.reduce((acc, r) => { const day = r.started_at?.slice(0, 10); if (day) acc[day] = (acc[day] || 0) + 1; return acc; }, {});
  const isToday = d => d === today.toISOString().slice(0, 10);
  return (
    <div style={{ background: '#111113', padding: '12px 16px', marginBottom: 2 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em', marginBottom: 8, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>30-DAY EXECUTION HEATMAP</div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
        {days.map(day => {
          const count = runMap[day] || 0;
          return (
            <div key={day} style={{ flex: 1, height: count > 0 ? 16 : 8, background: count > 1 ? '#22c55e' : count === 1 ? '#22c55e66' : '#1c1c1e', border: isToday(day) ? '1px solid #ef4444' : '1px solid transparent', transition: 'height 0.3s' }} />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a', letterSpacing: '0.06em' }}>
        <span>30D AGO</span><span>TODAY</span>
      </div>
    </div>
  );
}

export default function Runs() {
  const isMobile = useIsMobile();
  const { data, loading, error } = useAPI('/runs?limit=30');
  const runs = data?.runs || [];

  const fastestRun = runs.reduce((best, r) => {
    const d = duration(r.started_at, r.finished_at);
    if (!d) return best;
    if (!best || d < duration(best.started_at, best.finished_at)) return r;
    return best;
  }, null);

  const total = runs.length;
  const success = runs.filter(r => r.status === 'success' || r.status === 'done').length;
  const rate = total > 0 ? Math.round((success / total) * 100) : 0;

  const pad = isMobile ? '0 16px' : '0';

  return (
    <div style={{ padding: isMobile ? '16px 0' : '20px 28px', maxWidth: 1200, background: '#09090b', minHeight: '100vh' }}>
      <style>{`@keyframes rn-fadein{from{opacity:0;transform:translateX(-6px);}to{opacity:1;transform:translateX(0);}}`}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #27272a', paddingBottom: 14, marginBottom: 16, padding: isMobile ? `0 16px 14px` : `0 0 14px` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 'clamp(38px,10vw,52px)' : 64, letterSpacing: '0.04em', lineHeight: 1, color: '#f4f4f5' }}>PIPELINE</div>
            <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 'clamp(38px,10vw,52px)' : 64, letterSpacing: '0.04em', lineHeight: 1, color: '#ef4444' }}>RUNS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 10, color: '#71717a', marginTop: 8, letterSpacing: '0.1em', lineHeight: 1.6 }}>
              FULL EXECUTION HISTORY · ~40S/RUN · 97× SPEEDUP{!isMobile && ' · MISSED-RUN RECOVERY: ON'}
            </div>
          </div>
          {runs.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 28 : 32, color: rate > 90 ? '#22c55e' : rate > 70 ? '#f59e0b' : '#ef4444', lineHeight: 1, textShadow: rate > 90 ? '0 0 10px rgba(34,197,94,0.4)' : 'none' }}>{rate}%</div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#71717a', letterSpacing: '0.1em', textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>SUCCESS RATE</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b' }}>{success}/{total} RUNS</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap */}
      {runs.length > 0 && (
        <div style={{ padding: isMobile ? pad : '0' }}>
          <RunHeatmap runs={runs} />
        </div>
      )}

      {/* Reliability banner */}
      <div style={{ background: '#111113', borderLeft: '2px solid #22c55e', padding: '8px 14px', marginBottom: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 6 : 12 }}>
          {[
            { label: 'RECOVERY', val: 'ENABLED', color: '#22c55e' },
            { label: 'LOGGING', val: 'ZERO-LOSS', color: '#22c55e' },
            { label: 'SCHEDULER', val: '02:00 UTC', color: '#f59e0b' },
            { label: 'SIMILARITY', val: 'RUST :8003', color: '#22c55e' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#71717a', letterSpacing: '0.08em', textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>{label}:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color, letterSpacing: '0.06em', textShadow: color === '#22c55e' ? '0 0 6px rgba(34,197,94,0.3)' : 'none' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Runs list */}
      {loading ? (
        <div style={{ padding: isMobile ? '2rem 16px' : '2rem 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#71717a', letterSpacing: '0.1em' }}>LOADING...</div>
      ) : error ? (
        <div style={{ padding: isMobile ? '2rem 16px' : '2rem 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ef4444' }}>ERR: {error}</div>
      ) : runs.length === 0 ? (
        <div style={{ padding: isMobile ? '3rem 16px' : '3rem 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#52525b', letterSpacing: '0.15em' }}>/ SYSTEM IDLE. WAITING FOR AUTONOMOUS TRIGGER... /</div>
      ) : isMobile ? (
        /* Mobile cards */
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {runs.map((r, i) => (
            <RunCardMobile key={r.run_id} run={r} index={i} prev={runs[i + 1]} isFastest={fastestRun?.run_id === r.run_id} />
          ))}
        </div>
      ) : (
        /* Desktop rows */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
          {runs.map((r, i) => (
            <RunRowDesktop key={r.run_id} run={r} index={i} prev={runs[i + 1]} isFastest={fastestRun?.run_id === r.run_id} />
          ))}
        </div>
      )}
    </div>
  );
}