import React, { useState, useEffect, useCallback } from 'react';

const API = 'https://clinical-agent-api-production.up.railway.app';

const ENDPOINTS = [
  { id: 'api',      label: 'FASTAPI REST',    url: '/',        lang: 'PYTHON', port: ':8000' },
  { id: 'health',   label: 'HEALTH CHECK',    url: '/health',  lang: 'PYTHON', port: ':8000' },
  { id: 'stats',    label: 'STATS',           url: '/stats',   lang: 'SQL',    port: ':5432' },
  { id: 'runs',     label: 'RUNS',            url: '/runs?limit=1', lang: 'SQL', port: ':5432' },
  { id: 'claims',   label: 'CLAIMS',          url: '/claims?limit=1', lang: 'SQL', port: ':5432' },
  { id: 'conflicts',label: 'CONFLICTS',       url: '/conflicts?limit=1', lang: 'SQL', port: ':5432' },
];

const LANG_COLORS = { PYTHON: '#f59e0b', SQL: '#818cf8', RUST: '#22c55e' };

function latencyColor(ms) {
  if (ms == null) return '#3f3f46';
  if (ms < 100) return '#22c55e';
  if (ms < 500) return '#f59e0b';
  return '#ef4444';
}

function latencyLabel(ms) {
  if (ms == null) return '—';
  if (ms < 100) return 'FAST';
  if (ms < 500) return 'OK';
  return 'SLOW';
}

export default function APILatencyBadge({ compact = false }) {
  const [latencies, setLatencies] = useState({});
  const [pinging, setPinging] = useState(false);
  const [lastPing, setLastPing] = useState(null);
  const [history, setHistory] = useState({});

  const ping = useCallback(async () => {
    setPinging(true);
    const results = {};
    await Promise.all(ENDPOINTS.map(async (ep) => {
      const start = performance.now();
      try {
        await fetch(API + ep.url);
        const ms = Math.round(performance.now() - start);
        results[ep.id] = { ms, ok: true };
      } catch {
        results[ep.id] = { ms: null, ok: false };
      }
    }));
    setLatencies(results);
    setHistory(prev => {
      const next = { ...prev };
      Object.entries(results).forEach(([id, { ms }]) => {
        if (!next[id]) next[id] = [];
        next[id] = [...next[id].slice(-9), ms];
      });
      return next;
    });
    setLastPing(new Date());
    setPinging(false);
  }, []);

  useEffect(() => { ping(); }, []);

  const avgLatency = () => {
    const vals = Object.values(latencies).map(l => l.ms).filter(Boolean);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };

  if (compact) {
    const avg = avgLatency();
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'crosshair' }} onClick={ping}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: latencyColor(avg) }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: latencyColor(avg), letterSpacing: '0.1em' }}>
          API: {avg != null ? avg + 'MS' : '—'}
        </span>
      </div>
    );
  }

  return (
    <div style={{ background: '#09090b', border: '1px solid #1c1c1e', padding: 20 }}>
      <style>{`
        @keyframes ping-spin { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
        @keyframes bar-grow { from{width:0;}to{width:100%;} }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.2em', marginBottom: 4 }}>REALTIME DIAGNOSTICS</div>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 24, color: '#f4f4f5', letterSpacing: '0.04em' }}>API LATENCY MONITOR</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {avgLatency() != null && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 32, color: latencyColor(avgLatency()), lineHeight: 1 }}>{avgLatency()}MS</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#52525b', letterSpacing: '0.1em' }}>AVG LATENCY</div>
            </div>
          )}
          <button onClick={ping} disabled={pinging} style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em',
            color: pinging ? '#3f3f46' : '#22c55e',
            background: pinging ? 'transparent' : 'rgba(34,197,94,0.08)',
            border: '1px solid ' + (pinging ? '#27272a' : 'rgba(34,197,94,0.3)'),
            padding: '4px 14px', cursor: pinging ? 'default' : 'crosshair',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {pinging && <div style={{ width: 8, height: 8, border: '1px solid #22c55e', borderTop: '1px solid transparent', borderRadius: '50%', animation: 'ping-spin 0.6s linear infinite' }} />}
            {pinging ? 'PINGING...' : '↻ PING ALL'}
          </button>
        </div>
      </div>

      {/* Endpoint rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {ENDPOINTS.map(ep => {
          const result = latencies[ep.id];
          const ms = result?.ms;
          const ok = result?.ok !== false;
          const color = latencyColor(ms);
          const hist = history[ep.id] || [];
          const maxHist = Math.max(...hist.filter(Boolean), 1);

          return (
            <div key={ep.id} style={{ background: '#111113', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Status dot */}
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ms != null ? color : '#3f3f46', flexShrink: 0 }} />

              {/* Endpoint info */}
              <div style={{ width: 120, flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#a1a1aa', letterSpacing: '0.06em' }}>{ep.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#3f3f46', letterSpacing: '0.06em' }}>{ep.url}</div>
              </div>

              {/* Lang badge */}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: LANG_COLORS[ep.lang], border: `1px solid ${LANG_COLORS[ep.lang]}33`, padding: '1px 5px', letterSpacing: '0.08em', flexShrink: 0 }}>{ep.lang}</span>

              {/* Latency bar */}
              <div style={{ flex: 1, height: 4, background: '#1c1c1e', position: 'relative' }}>
                {ms != null && (
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min((ms / 1000) * 100, 100)}%`, background: color, transition: 'width 0.5s ease' }} />
                )}
              </div>

              {/* History sparkline */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 16, flexShrink: 0 }}>
                {[...Array(10)].map((_, i) => {
                  const v = hist[i];
                  const h = v ? Math.max(2, (v / maxHist) * 16) : 2;
                  return (
                    <div key={i} style={{ width: 3, height: h, background: v ? latencyColor(v) + '88' : '#1c1c1e', transition: 'height 0.3s' }} />
                  );
                })}
              </div>

              {/* Latency value */}
              <div style={{ width: 60, textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color, letterSpacing: '0.05em', fontWeight: 500 }}>
                  {ms != null ? ms + 'MS' : pinging ? '...' : '—'}
                </span>
              </div>

              {/* Label */}
              <div style={{ width: 32, flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color, letterSpacing: '0.1em' }}>{ms != null ? latencyLabel(ms) : ''}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Last ping timestamp */}
      {lastPing && (
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#27272a', letterSpacing: '0.1em' }}>
            LAST PING: {lastPing.toUTCString().slice(0, 25).toUpperCase()}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#22c55e', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', padding: '2px 8px', letterSpacing: '0.1em' }}>
            [LATENCY: REALTIME | ENGINE: FASTAPI + RAILWAY]
          </span>
        </div>
      )}
    </div>
  );
}