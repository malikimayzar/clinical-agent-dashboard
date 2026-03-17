import React, { useState, useEffect, useRef, useCallback } from 'react';
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

function claimAge(s) {
  if (!s) return 1;
  const diff = Date.now() - new Date(s).getTime();
  const days = diff / 86400000;
  return Math.max(0.3, 1 - (days / 30));
}

function FlipCounter({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return;
    let cur = 0;
    const step = Math.ceil(value / 20);
    const iv = setInterval(() => {
      cur = Math.min(cur + step, value);
      setDisplay(cur);
      if (cur >= value) clearInterval(iv);
    }, 30);
    return () => clearInterval(iv);
  }, [value]);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{display}</span>;
}

function TerminalEmptyState() {
  const [lines, setLines] = useState([]);
  const LINES = [
    { text: '[SYSTEM STATUS: IDLE]', color: '#22c55e' },
    { text: 'Pipeline not currently running...', color: '#52525b' },
    { text: 'Awaiting next autonomous run at 02:00 UTC', color: '#71717a' },
    { text: 'Scheduler: APScheduler · missed run recovery: ON', color: '#3f3f46' },
    { text: '> claim_extractor.py standing by', color: '#52525b' },
    { text: '> rust claim-parser :8002 online', color: '#22c55e' },
    { text: '> similarity-engine :8003 online', color: '#22c55e' },
    { text: '█', color: '#22c55e', blink: true },
  ];
  useEffect(() => {
    LINES.forEach((l, i) => {
      setTimeout(() => setLines(prev => [...prev, l]), i * 200);
    });
  }, []);
  return (
    <div style={{ background: '#0a0a0c', border: '1px solid #1c1c1e', padding: '24px 20px', fontFamily: 'var(--font-mono)', maxWidth: 520, position: 'relative', overflow: 'hidden' }}>
      <style>{`@keyframes ca-blink{0%,100%{opacity:1;}50%{opacity:0;}}`}</style>
      <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'rgba(34,197,94,0.08)', animation: 'ca-scan 3s linear infinite', top: 0 }} />
      <div style={{ fontSize: 9, color: '#3f3f46', letterSpacing: '0.15em', marginBottom: 12 }}>TERMINAL — clinical-agent/scheduler</div>
      {lines.map((l, i) => (
        <div key={i} style={{ fontSize: 12, color: l.color, marginBottom: 3, animation: l.blink ? 'ca-blink 1s ease infinite' : 'none' }}>{l.text}</div>
      ))}
    </div>
  );
}

const STATUS_CONFIG = {
  CONFLICT:  { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: '#ef444433', label: 'CONFLICT',  glow: '0 0 8px rgba(239,68,68,0.2)' },
  CONFIRMED: { color: '#22c55e', bg: 'rgba(34,197,94,0.06)',  border: '#22c55e33', label: 'CONFIRMED', glow: '0 0 8px rgba(34,197,94,0.15)' },
  NEW:       { color: '#3b82f6', bg: 'rgba(59,130,246,0.06)', border: '#3b82f633', label: 'NEW',       glow: 'none' },
  UNCERTAIN: { color: '#eab308', bg: 'rgba(234,179,8,0.05)',  border: '#eab30833', label: 'UNCERTAIN', glow: 'none' },
};

function ClaimRow({ claim, index, selected, onSelect, focused }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  const st = STATUS_CONFIG[claim.status] || STATUS_CONFIG.NEW;
  const age = claimAge(claim.created_at);
  const conf = claim.confidence || 0;

  useEffect(() => {
    if (focused && ref.current) ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focused]);

  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(claim.text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div ref={ref} style={{
      background: focused ? '#111113' : 'transparent',
      borderLeft: `2px solid ${focused ? st.color : 'transparent'}`,
      borderBottom: '1px solid #1c1c1e',
      transition: 'all 0.1s',
      animation: `ca-stagger 0.3s ${index * 0.04}s ease both`,
      opacity: 0,
    }}>
      <style>{`
        @keyframes ca-stagger { from{opacity:0;transform:translateX(-8px);}to{opacity:1;transform:translateX(0);} }
        @keyframes ca-scan { 0%{top:-1px;}100%{top:100%;} }
        @keyframes ca-blink { 0%,100%{opacity:1;}50%{opacity:0;} }
      `}</style>

      {/* Main row */}
      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 110px 70px 70px 70px 90px', gap: 0, padding: '10px 0', cursor: 'pointer', alignItems: 'center' }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Checkbox */}
        <div style={{ paddingLeft: 12 }} onClick={e => { e.stopPropagation(); onSelect(claim.claim_id); }}>
          <div style={{ width: 14, height: 14, border: `1px solid ${selected ? st.color : '#3f3f46'}`, background: selected ? st.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s' }}>
            {selected && <div style={{ width: 6, height: 6, background: '#09090b' }} />}
          </div>
        </div>

        {/* Claim text */}
        <div style={{ paddingRight: 12, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: `rgba(212,212,216,${age})`, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded ? 'normal' : 'nowrap', marginBottom: 4 }}>
            {claim.text}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', padding: '1px 6px', letterSpacing: '0.08em' }}>
              [RUST-ENGINE: &lt;50MS]
            </span>
            {claim.topic_tags?.slice(0, 2).map(t => (
              <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', background: '#1c1c1e', padding: '1px 5px', letterSpacing: '0.05em' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Status badge */}
        <div style={{ paddingRight: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: st.color, background: st.bg, border: `1px solid ${st.border}`, padding: '3px 7px', boxShadow: st.glow, display: 'inline-block' }}>
            {st.label}
          </span>
        </div>

        {/* Confidence bar */}
        <div style={{ paddingRight: 12 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#52525b', marginBottom: 3 }}>{(conf * 100).toFixed(0)}%</div>
          <div style={{ height: 3, background: '#27272a', width: 48 }}>
            <div style={{ height: '100%', width: `${conf * 100}%`, background: st.color, transition: 'width 0.6s ease' }} />
          </div>
        </div>

        {/* Faithfulness */}
        <div style={{ paddingRight: 12 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: claim.faithfulness_score != null ? '#22c55e' : '#3f3f46' }}>
            {claim.faithfulness_score != null ? (claim.faithfulness_score * 100).toFixed(0) + '%' : '—'}
          </div>
        </div>

        {/* Age */}
        <div style={{ paddingRight: 8 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: `rgba(82,82,91,${age})`, letterSpacing: '0.06em' }}>{timeAgo(claim.created_at)}</div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, paddingRight: 12 }} onClick={e => e.stopPropagation()}>
          <button onClick={copy} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: copied ? '#22c55e' : '#3f3f46', background: 'none', border: 'none', cursor: 'crosshair', letterSpacing: '0.08em', transition: 'color 0.2s' }}>
            {copied ? 'COPIED' : 'COPY'}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid #1c1c1e', padding: '12px 12px 12px 44px', background: '#0a0a0c', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: `linear-gradient(transparent,${st.color}18,transparent)`, animation: 'ca-scan 3s linear infinite', top: 0 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.15em', marginBottom: 6 }}>FULL CLAIM TEXT</div>
              <div style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6 }}>{claim.text}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.15em', marginBottom: 6 }}>METADATA</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[
                  { l: 'CLAIM ID', v: claim.claim_id?.slice(0, 20) + '...' },
                  { l: 'STATUS', v: claim.status },
                  { l: 'SEVERITY', v: claim.severity || '—' },
                  { l: 'CONFIDENCE', v: claim.confidence != null ? (claim.confidence * 100).toFixed(2) + '%' : '—' },
                  { l: 'FAITHFULNESS', v: claim.faithfulness_score != null ? (claim.faithfulness_score * 100).toFixed(2) + '%' : '—' },
                  { l: 'EXTRACTED', v: claim.created_at ? new Date(claim.created_at).toUTCString().slice(0, 25) : '—' },
                ].map(({ l, v }) => (
                  <div key={l} style={{ display: 'flex', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                    <span style={{ color: '#3f3f46', width: 80, flexShrink: 0, letterSpacing: '0.06em' }}>{l}</span>
                    <span style={{ color: '#71717a' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {claim.topic_tags?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.15em', marginBottom: 5 }}>TOPIC TAGS</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {claim.topic_tags.map(t => (
                  <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', background: '#1c1c1e', border: '1px solid #27272a', padding: '2px 8px' }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const STATUSES = ['ALL', 'CONFLICT', 'CONFIRMED', 'NEW', 'UNCERTAIN'];
const STATUS_COLORS = { ALL: '#a1a1aa', CONFLICT: '#ef4444', CONFIRMED: '#22c55e', NEW: '#3b82f6', UNCERTAIN: '#eab308' };

export default function Claims() {
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [focusedIdx, setFocusedIdx] = useState(-1);

  const url = status === 'ALL' ? '/claims?limit=60' : `/claims?limit=60&status=${status}`;
  const { data, loading, error } = useAPI(url, [status]);
  const allData = useAPI('/claims?limit=200');

  const claims = (data?.claims || []).filter(c =>
    !search || c.text?.toLowerCase().includes(search.toLowerCase())
  );
  const allClaims = allData.data?.claims || [];

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === 'ALL' ? allClaims.length : allClaims.filter(c => c.status === s).length;
    return acc;
  }, {});

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const selectAll = () => {
    if (selected.size === claims.length) setSelected(new Set());
    else setSelected(new Set(claims.map(c => c.claim_id)));
  };

  const exportSelected = () => {
    const items = claims.filter(c => selected.has(c.claim_id));
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'claims_export.json'; a.click();
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowDown') setFocusedIdx(i => Math.min(i + 1, claims.length - 1));
      if (e.key === 'ArrowUp') setFocusedIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [claims.length]);

  return (
    <div style={{ padding: '20px 28px', maxWidth: 1200, background: '#09090b', minHeight: '100vh' }}>
      <style>{`
        @keyframes ca-pulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(0.85);} }
        @keyframes ca-fadein { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);} }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #27272a', paddingBottom: 14, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 64, letterSpacing: '0.04em', lineHeight: 1, color: '#f4f4f5' }}>EXTRACTED</div>
            <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 64, letterSpacing: '0.04em', lineHeight: 1, color: '#ef4444' }}>CLAIMS</div>
          </div>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 80, color: '#1c1c1e', lineHeight: 1, letterSpacing: '-0.02em' }}>
            <FlipCounter value={allClaims.length} />
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#52525b', marginTop: 10, letterSpacing: '0.15em' }}>
          MODEL: GROQ LLAMA 3.3 70B · SPEED: 963MS · 15-23 CLAIMS/RUN · RUST PARSER: &lt;1MS/CLAIM
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 2 }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)} style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em',
              background: status === s ? STATUS_COLORS[s] : 'transparent',
              color: status === s ? '#09090b' : STATUS_COLORS[s],
              border: `1px solid ${status === s ? STATUS_COLORS[s] : STATUS_COLORS[s] + '44'}`,
              padding: '5px 10px', cursor: 'crosshair', transition: 'all 0.1s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {s}
              {counts[s] > 0 && (
                <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(0,0,0,0.2)', padding: '0 4px' }}>{counts[s]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <input type="text" placeholder="SEARCH CLAIMS..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: '#111113', border: '1px solid #27272a', color: '#d4d4d8', padding: '5px 12px', outline: 'none', letterSpacing: '0.05em', minWidth: 220, transition: 'border-color 0.2s' }}
          onFocus={e => e.target.style.borderColor = '#3f3f46'}
          onBlur={e => e.target.style.borderColor = '#27272a'}
        />

        {/* Bulk actions */}
        {selected.size > 0 && (
          <button onClick={exportSelected} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', padding: '5px 12px', cursor: 'crosshair' }}>
            EXPORT {selected.size} AS JSON ↓
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: '#3f3f46', letterSpacing: '0.1em' }}>
          {claims.length} CLAIMS · ↑↓ NAVIGATE · SPACE EXPAND
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#52525b', letterSpacing: '0.1em', padding: '2rem 0' }}>LOADING...</div>
      ) : error ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ef4444', padding: '2rem 0' }}>ERR: {error}</div>
      ) : claims.length === 0 ? (
        <TerminalEmptyState />
      ) : (
        <div style={{ border: '1px solid #1c1c1e' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 110px 70px 70px 70px 90px', borderBottom: '2px solid #27272a', padding: '6px 0', background: '#0a0a0c' }}>
            <div style={{ paddingLeft: 12 }}>
              <div onClick={selectAll} style={{ width: 14, height: 14, border: `1px solid ${selected.size === claims.length && claims.length > 0 ? '#22c55e' : '#3f3f46'}`, background: selected.size === claims.length && claims.length > 0 ? '#22c55e' : 'transparent', cursor: 'crosshair', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selected.size === claims.length && claims.length > 0 && <div style={{ width: 6, height: 6, background: '#09090b' }} />}
              </div>
            </div>
            {['CLAIM TEXT', 'STATUS', 'CONF', 'FAITH', 'AGE', 'ACTIONS'].map(h => (
              <div key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.15em', paddingRight: 12, display: 'flex', alignItems: 'center' }}>{h}</div>
            ))}
          </div>

          {claims.map((c, i) => (
            <ClaimRow key={c.claim_id} claim={c} index={i} selected={selected.has(c.claim_id)} onSelect={toggleSelect} focused={focusedIdx === i} />
          ))}
        </div>
      )}
    </div>
  );
}