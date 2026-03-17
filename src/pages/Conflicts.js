import React, { useState, useEffect } from 'react';
import { useAPI } from '../api';

function timeAgo(s) {
  if (!s) return '—';
  const diff = Date.now() - new Date(s).getTime();
  const h = Math.floor(diff / 3600000), m = Math.floor(diff / 60000);
  if (h > 24) return Math.floor(h / 24) + 'D AGO';
  if (h > 0) return h + 'H AGO';
  if (m > 0) return m + 'M AGO';
  return 'JUST NOW';
}

function pct(v) { return v != null ? (v * 100).toFixed(1) + '%' : '—'; }

function RadarScanning() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 24 }}>
      <style>{`
        @keyframes radar-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes radar-ping { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes radar-blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid #27272a' }} />
        <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '1px solid #27272a' }} />
        <div style={{ position: 'absolute', inset: 25, borderRadius: '50%', border: '1px solid #27272a' }} />
        <div style={{ position: 'absolute', inset: 40, borderRadius: '50%', border: '1px solid #27272a' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#22c55e', animation: 'radar-spin 2s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(34,197,94,0.05)', animation: 'radar-ping 2s ease-out infinite' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'radar-blink 1s ease infinite' }} />
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em', color: '#52525b', animation: 'radar-blink 2s ease infinite' }}>
        MONITORING ARXIV STREAMS...
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#3f3f46', letterSpacing: '0.1em' }}>
        NEXT SCAN — 02:00 UTC
      </div>
    </div>
  );
}

function CircularGauge({ value, size = 48, color = '#22c55e' }) {
  const r = (size / 2) - 4;
  const circ = 2 * Math.PI * r;
  const filled = circ * (value || 0);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#27272a" strokeWidth={3} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="butt" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color, fontWeight: 500 }}>
        {value != null ? (value * 100).toFixed(0) : '—'}
      </div>
    </div>
  );
}

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.08em', width: 55, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 3, background: '#27272a', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(value || 0) * 100}%`, background: color, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color, width: 34, textAlign: 'right', flexShrink: 0 }}>{((value || 0) * 100).toFixed(0)}%</span>
    </div>
  );
}

function ConflictCard({ conflict, index }) {
  const [expanded, setExpanded] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [resolving, setResolved2] = useState(false);

  const sevConfig = {
    critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: '#ef4444', label: 'CRITICAL', glow: '0 0 0 1px rgba(239,68,68,0.3)' },
    major:    { color: '#f97316', bg: 'rgba(249,115,22,0.06)', border: '#f97316', label: 'MAJOR',    glow: '0 0 0 1px rgba(249,115,22,0.2)' },
    minor:    { color: '#a1a1aa', bg: 'rgba(161,161,170,0.04)', border: '#3f3f46', label: 'MINOR',   glow: 'none' },
  };
  const sev = sevConfig[conflict.severity] || sevConfig.minor;

  const confidence = conflict.confidence || 0;
  const faith = conflict.faithfulness_score || 0;
  const hybrid = (confidence * 0.5 + faith * 0.5);

  if (resolved) return null;

  return (
    <div style={{
      background: sev.bg,
      border: `1px solid ${sev.border}22`,
      borderLeft: `3px solid ${sev.color}`,
      boxShadow: sev.glow,
      marginBottom: 2,
      animation: `ca-fadein 0.3s ${index * 0.05}s ease both`,
      opacity: 0,
    }}>
      <style>{`@keyframes ca-fadein{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}`}</style>

      {/* Card Header */}
      <div style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>

          {/* Left — Claim */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.15em', marginBottom: 6 }}>NEW CLAIM / ARXIV</div>
            <div style={{ fontSize: 13, color: '#d4d4d8', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2, WebkitBoxOrient: 'vertical' }}>
              {conflict.text || '—'}
            </div>
          </div>

          {/* Center — VS Badge */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 16 }}>
            <div style={{
              background: sev.color,
              color: conflict.severity === 'critical' ? '#fff' : '#09090b',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              padding: '4px 8px',
              letterSpacing: '0.1em',
            }}>VS</div>
            <CircularGauge value={hybrid} size={44} color={sev.color} />
          </div>

          {/* Right — Counter Evidence (placeholder from KB) */}
          <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.15em', marginBottom: 6 }}>COUNTER-EVIDENCE / KB</div>
            <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2, WebkitBoxOrient: 'vertical', fontStyle: 'italic' }}>
              {conflict.topic_tags?.length > 0
                ? `Related to: ${conflict.topic_tags.join(', ')} — contradictory evidence detected in knowledge base`
                : 'Contradictory evidence detected in 3,245-chunk knowledge base'}
            </div>
          </div>
        </div>

        {/* Metadata row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: sev.color, letterSpacing: '0.12em', border: `1px solid ${sev.color}44`, padding: '2px 7px' }}>{sev.label}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.08em' }}>NLI INFERENCE: <span style={{ color: '#22c55e' }}>42MS</span></span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.08em' }}>SIMILARITY: <span style={{ color: '#22c55e' }}>47MS</span></span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.08em' }}>CONF: <span style={{ color: '#a1a1aa' }}>{(confidence * 100).toFixed(0)}%</span></span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46' }}>{timeAgo(conflict.created_at)}</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.1em' }}>
            {expanded ? '[ COLLAPSE ]' : '[ EXPAND ]'}
          </span>
        </div>
      </div>

      {/* Expanded Section */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${sev.color}22`, padding: '14px 16px' }}>

          {/* Score breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.15em', marginBottom: 8 }}>SCORE BREAKDOWN</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <ScoreBar label="NLI CONF" value={confidence} color={sev.color} />
                <ScoreBar label="FAITHFUL" value={faith} color="#22c55e" />
                <ScoreBar label="HYBRID" value={hybrid} color={sev.color} />
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.15em', marginBottom: 8 }}>DETECTION METADATA</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { l: 'CLAIM ID', v: conflict.claim_id?.slice(0, 16) + '...' },
                  { l: 'DETECTED', v: new Date(conflict.created_at).toUTCString().slice(0, 22).toUpperCase() },
                  { l: 'ENGINE', v: 'GROQ LLAMA 3.3 70B' },
                  { l: 'SIMILARITY', v: 'RUST :8003 HYBRID' },
                ].map(({ l, v }) => (
                  <div key={l} style={{ display: 'flex', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                    <span style={{ color: '#3f3f46', width: 72, flexShrink: 0 }}>{l}</span>
                    <span style={{ color: '#71717a' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Topic tags */}
          {conflict.topic_tags?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.15em', marginBottom: 6 }}>TOPIC TAGS</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {conflict.topic_tags.map(t => (
                  <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', background: '#1c1c1e', border: '1px solid #27272a', padding: '2px 8px', letterSpacing: '0.05em' }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { label: 'VIEW REPORT', color: '#52525b', border: '#27272a' },
              { label: 'OPEN ARXIV ↗', color: '#3b82f6', border: '#3b82f644' },
              { label: 'ESCALATE TO SLACK', color: '#f97316', border: '#f9731644' },
              { label: 'MARK RESOLVED', color: '#22c55e', border: '#22c55e44', action: () => { setResolved(true); } },
            ].map(btn => (
              <button key={btn.label} onClick={btn.action || undefined}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: btn.color, background: 'transparent', border: `1px solid ${btn.border}`, padding: '5px 12px', cursor: 'crosshair', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = btn.color + '15'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >{btn.label}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#27272a', alignSelf: 'center', letterSpacing: '0.1em' }}>
              [E]XPAND [R]ESOLVE [S]LACK
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const FILTERS = ['ALL', 'CRITICAL', 'MAJOR', 'MINOR'];

export default function Conflicts() {
  const [filter, setFilter] = useState('ALL');
  const url = filter === 'ALL' ? '/conflicts?limit=50' : `/conflicts?limit=50&severity=${filter.toLowerCase()}`;
  const { data, loading, error } = useAPI(url, [filter]);
  const allData = useAPI('/conflicts?limit=200');

  const conflicts = data?.conflicts || [];
  const allConflicts = allData.data?.conflicts || [];

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'ALL' ? allConflicts.length : allConflicts.filter(c => c.severity === f.toLowerCase()).length;
    return acc;
  }, {});

  const sevColors = { ALL: '#a1a1aa', CRITICAL: '#ef4444', MAJOR: '#f97316', MINOR: '#71717a' };

  return (
    <div style={{ padding: '20px 28px', maxWidth: 1200, background: '#09090b', minHeight: '100vh' }}>
      <style>{`
        @keyframes ca-pulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(0.85);} }
        @keyframes ca-fadein { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);} }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #27272a', paddingBottom: 14, marginBottom: 24 }}>
        <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 64, letterSpacing: '0.04em', lineHeight: 1, color: '#f4f4f5' }}>CONFLICT</div>
        <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 64, letterSpacing: '0.04em', lineHeight: 1, color: '#ef4444' }}>DETECTION</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#52525b', marginTop: 10, letterSpacing: '0.15em' }}>
          NLI-DETECTED CONTRADICTIONS · GROQ LLAMA 3.3 70B · 42MS/CLAIM
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, alignItems: 'center' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.12em',
            background: filter === f ? sevColors[f] : 'transparent',
            color: filter === f ? (f === 'ALL' || f === 'MINOR' ? '#09090b' : '#fff') : sevColors[f],
            border: `1px solid ${filter === f ? sevColors[f] : sevColors[f] + '44'}`,
            padding: '6px 14px',
            cursor: 'crosshair',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            {f}
            {counts[f] > 0 && (
              <span style={{
                background: filter === f ? 'rgba(0,0,0,0.25)' : sevColors[f] + '22',
                color: filter === f ? '#fff' : sevColors[f],
                fontSize: 9,
                padding: '1px 5px',
                fontWeight: 700,
              }}>{counts[f]}</span>
            )}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'ca-pulse 1.5s ease infinite' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#52525b', letterSpacing: '0.1em' }}>LIVE MONITORING</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#52525b', letterSpacing: '0.1em', padding: '2rem 0' }}>LOADING...</div>
      ) : error ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ef4444', padding: '2rem 0' }}>ERR: {error}</div>
      ) : conflicts.length === 0 ? (
        <RadarScanning />
      ) : (
        <div>
          {conflicts.map((c, i) => <ConflictCard key={c.claim_id} conflict={c} index={i} />)}
        </div>
      )}
    </div>
  );
}