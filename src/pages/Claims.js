import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase();
}

const STATUS_CONFIG = {
  CONFLICT:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  glow: '0 0 8px rgba(239,68,68,0.5)',  label: 'CONFLICT' },
  CONFIRMED: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  glow: '0 0 8px rgba(34,197,94,0.5)',  label: 'CONFIRMED' },
  NEW:       { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', glow: '0 0 8px rgba(59,130,246,0.5)', label: 'NEW' },
  UNCERTAIN: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', glow: '0 0 8px rgba(245,158,11,0.5)', label: 'UNCERTAIN' },
};

// ── AI Verdict Tooltip ──
function AIVerdictTooltip({ claim, visible }) {
  const [verdict, setVerdict] = useState(null);
  const [typing, setTyping] = useState('');
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!visible || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 80,
        messages: [{
          role: 'user',
          content: `Medical verdict in max 15 words: "${claim.text}". Status: ${claim.status}. Just the verdict sentence.`
        }]
      })
    })
      .then(r => r.json())
      .then(d => {
        const text = d.content?.[0]?.text || 'Analysis unavailable.';
        setVerdict(text);
        let i = 0;
        const iv = setInterval(() => {
          i++;
          setTyping(text.slice(0, i));
          if (i >= text.length) clearInterval(iv);
        }, 25);
      })
      .catch(() => { setVerdict('Service unavailable.'); setTyping('Service unavailable.'); })
      .finally(() => setLoading(false));
  }, [visible]);

  if (!visible) return null;

  return (
    <div style={{ position: 'absolute', left: 0, top: '110%', zIndex: 50, background: '#0a0a0c', border: '1px solid rgba(59,130,246,0.3)', padding: '8px 12px', minWidth: 220, maxWidth: 320, boxShadow: '0 8px 24px rgba(0,0,0,0.8), 0 0 12px rgba(59,130,246,0.1)', animation: 'cl-fadein 0.15s ease', pointerEvents: 'none' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#3b82f6', letterSpacing: '0.12em', marginBottom: 4, textShadow: '0 0 6px rgba(59,130,246,0.4)' }}>⬡ AI VERDICT · CLAUDE SONNET 4</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#93c5fd', lineHeight: 1.5 }}>
        {loading ? <span style={{ animation: 'cl-blink 0.7s ease infinite' }}>ANALYZING▋</span> : (typing || '') + (verdict && typing.length < verdict.length ? '▋' : '')}
      </div>
    </div>
  );
}

// ── Laser Progress Bar ──
function LaserBar({ value, color, width = 56 }) {
  if (value == null) return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46' }}>—</span>;
  const pv = Math.min(value * 100, 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color }}>{pv.toFixed(0)}%</span>
      <div style={{ height: 2, background: '#27272a', width }}>
        <div style={{ height: '100%', width: `${pv}%`, background: color, boxShadow: `0 0 5px ${color}`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ── Mobile Card ──
function ClaimCardMobile({ claim, index }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ripple, setRipple] = useState(false);
  const st = STATUS_CONFIG[claim.status] || STATUS_CONFIG.NEW;

  const handleClick = () => { setRipple(true); setTimeout(() => setRipple(false), 400); setExpanded(!expanded); };
  const copy = (e) => { e.stopPropagation(); navigator.clipboard.writeText(claim.text || ''); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div style={{ background: '#111113', borderLeft: `3px solid ${st.color}`, borderBottom: '1px solid #1c1c1e', animation: `cl-stagger 0.3s ${index * 0.04}s ease both`, opacity: 0, position: 'relative', overflow: 'hidden' }}>
      {ripple && <div style={{ position: 'absolute', inset: 0, background: `${st.color}08`, animation: 'cl-ripple 0.4s ease' }} />}
      <div onClick={handleClick} style={{ padding: '14px', cursor: 'pointer' }}>
        <div style={{ fontSize: 13, color: '#f4f4f5', lineHeight: 1.6, marginBottom: 10 }}>{claim.text}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', padding: '2px 6px', textShadow: '0 0 5px rgba(34,197,94,0.3)' }}>[RUST: &lt;50MS]</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: st.color, background: st.bg, border: `1px solid ${st.color}33`, padding: '2px 6px', boxShadow: st.glow }}>{st.label}</span>
          {claim.topic_tags?.slice(0, 2).map(t => <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#52525b', background: '#1c1c1e', padding: '2px 5px' }}>{t}</span>)}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', marginLeft: 'auto' }}>{timeAgo(claim.created_at)}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div style={{ background: '#0a0a0c', padding: '8px 10px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#71717a', marginBottom: 4, letterSpacing: '0.1em' }}>CONFIDENCE</div>
            <LaserBar value={claim.confidence} color={claim.confidence > 0.8 ? '#22c55e' : '#f59e0b'} width={80} />
          </div>
          <div style={{ background: '#0a0a0c', padding: '8px 10px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#71717a', marginBottom: 4, letterSpacing: '0.1em' }}>FAITHFULNESS</div>
            <LaserBar value={claim.faithfulness_score} color="#22c55e" width={80} />
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid #1c1c1e', padding: '10px 14px', background: '#0a0a0c' }}>
          <button onClick={copy} style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: copied ? '#22c55e' : '#3f3f46', background: 'transparent', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : '#1c1c1e'}`, padding: '8px', cursor: 'pointer', minHeight: 40, transition: 'all 0.2s' }}>
            {copied ? '✓ COPIED' : 'TAP TO COPY'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Desktop Row ──
function ClaimRowDesktop({ claim, index, selected, onSelect, focused }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [ripple, setRipple] = useState(false);
  const ref = useRef(null);
  const st = STATUS_CONFIG[claim.status] || STATUS_CONFIG.NEW;

  useEffect(() => { if (focused && ref.current) ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [focused]);

  const handleClick = () => { setRipple(true); setTimeout(() => setRipple(false), 500); setExpanded(!expanded); };
  const copy = (e) => { e.stopPropagation(); navigator.clipboard.writeText(claim.text || ''); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div ref={ref} style={{ background: focused ? '#111113' : hovered ? '#0f0f11' : 'transparent', borderLeft: `2px solid ${focused || hovered ? st.color : 'transparent'}`, borderBottom: '1px solid #1c1c1e', transition: 'all 0.1s', position: 'relative', overflow: 'hidden', boxShadow: hovered ? `0 0 20px ${st.color}08` : 'none', animation: `cl-stagger 0.3s ${index * 0.03}s ease both`, opacity: 0 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    >
      {ripple && <div style={{ position: 'absolute', inset: 0, background: `${st.color}06`, animation: 'cl-ripple 0.5s ease', pointerEvents: 'none' }} />}
      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 110px 80px 80px 70px 80px', alignItems: 'center', padding: '10px 0', cursor: 'pointer' }} onClick={handleClick}>
        <div style={{ paddingLeft: 12 }} onClick={e => { e.stopPropagation(); onSelect(claim.claim_id); }}>
          <div style={{ width: 14, height: 14, border: `1px solid ${selected ? st.color : '#3f3f46'}`, background: selected ? st.color : 'transparent', transition: 'all 0.1s', boxShadow: selected ? st.glow : 'none' }}>
            {selected && <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 6, height: 6, background: '#09090b' }} /></div>}
          </div>
        </div>
        <div style={{ paddingRight: 12, minWidth: 0, position: 'relative' }}>
          <div style={{ fontSize: 13, color: hovered ? '#f4f4f5' : '#d4d4d8', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded ? 'normal' : 'nowrap', marginBottom: 4, transition: 'color 0.1s' }}>{claim.text}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', padding: '1px 5px', textShadow: '0 0 5px rgba(34,197,94,0.3)' }}>[RUST: &lt;50MS]</span>
            {claim.topic_tags?.slice(0, 2).map(t => <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', background: '#1c1c1e', padding: '1px 5px' }}>{t}</span>)}
          </div>
          <AIVerdictTooltip claim={claim} visible={hovered && !expanded} />
        </div>
        <div><span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', color: st.color, background: st.bg, border: `1px solid ${st.color}33`, padding: '3px 7px', boxShadow: hovered ? st.glow : 'none', transition: 'box-shadow 0.2s' }}>{st.label}</span></div>
        <div><LaserBar value={claim.confidence} color={claim.confidence > 0.8 ? '#22c55e' : '#f59e0b'} width={56} /></div>
        <div><LaserBar value={claim.faithfulness_score} color="#22c55e" width={56} /></div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46' }}>{timeAgo(claim.created_at)}</div>
        <div onClick={e => e.stopPropagation()} style={{ paddingRight: 12 }}>
          <button onClick={copy} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: copied ? '#22c55e' : '#3f3f46', background: 'none', border: 'none', cursor: 'crosshair', letterSpacing: '0.08em', transition: 'color 0.2s' }}>
            {copied ? 'COPIED' : 'COPY'}
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid #1c1c1e', padding: '10px 44px', background: '#0a0a0c', animation: 'cl-fadein 0.2s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
            <div><div style={{ fontSize: 9, color: '#3f3f46', marginBottom: 4 }}>CLAIM ID</div><div style={{ color: '#71717a', wordBreak: 'break-all' }}>{claim.claim_id}</div></div>
            <div><div style={{ fontSize: 9, color: '#3f3f46', marginBottom: 4 }}>EXTRACTED</div><div style={{ color: '#71717a' }}>{shortDate(claim.created_at)}</div></div>
          </div>
          {claim.topic_tags?.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {claim.topic_tags.map(t => <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', background: '#1c1c1e', border: '1px solid #27272a', padding: '2px 8px' }}>{t}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FlipCounter({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return;
    let cur = 0;
    const step = Math.ceil(value / 20);
    const iv = setInterval(() => { cur = Math.min(cur + step, value); setDisplay(cur); if (cur >= value) clearInterval(iv); }, 30);
    return () => clearInterval(iv);
  }, [value]);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{display}</span>;
}

function TerminalEmpty({ isMobile }) {
  const [lines, setLines] = useState([]);
  const LINES = [
    { text: '[SYSTEM: IDLE]', color: '#22c55e' },
    { text: 'No claims in database yet...', color: '#71717a' },
    { text: '> claim_extractor.py standby', color: '#71717a' },
    { text: '> rust claim-parser :8002 online', color: '#22c55e' },
    { text: '█', color: '#22c55e', blink: true },
  ];
  useEffect(() => { LINES.forEach((l, i) => setTimeout(() => setLines(p => [...p, l]), i * 180)); }, []);
  return (
    <div style={{ background: '#0a0a0c', border: '1px solid #1c1c1e', borderLeft: '2px solid #22c55e', padding: '20px 16px', fontFamily: 'var(--font-mono)', maxWidth: isMobile ? '100%' : 480 }}>
      <div style={{ fontSize: 9, color: '#52525b', letterSpacing: '0.15em', marginBottom: 10 }}>TERMINAL — claim_extractor.py</div>
      {lines.map((l, i) => <div key={i} style={{ fontSize: 12, color: l.color, marginBottom: 3, animation: l.blink ? 'cl-blink 1s ease infinite' : 'none' }}>{l.text}</div>)}
    </div>
  );
}

const STATUSES = ['ALL', 'CONFLICT', 'CONFIRMED', 'NEW', 'UNCERTAIN'];
const S_COLORS = { ALL: '#a1a1aa', CONFLICT: '#ef4444', CONFIRMED: '#22c55e', NEW: '#3b82f6', UNCERTAIN: '#f59e0b' };
const S_GLOW   = { ALL: 'none', CONFLICT: '0 0 8px rgba(239,68,68,0.3)', CONFIRMED: '0 0 8px rgba(34,197,94,0.3)', NEW: '0 0 8px rgba(59,130,246,0.3)', UNCERTAIN: '0 0 8px rgba(245,158,11,0.3)' };

export default function Claims() {
  const isMobile = useIsMobile();
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [focusedIdx, setFocusedIdx] = useState(-1);

  const url = status === 'ALL' ? '/claims?limit=60' : `/claims?limit=60&status=${status}`;
  const { data, loading, error } = useAPI(url, [status]);
  const allData = useAPI('/claims?limit=200');
  const claims = (data?.claims || []).filter(c => !search || c.text?.toLowerCase().includes(search.toLowerCase()));
  const allClaims = allData.data?.claims || [];
  const counts = STATUSES.reduce((acc, s) => { acc[s] = s === 'ALL' ? allClaims.length : allClaims.filter(c => c.status === s).length; return acc; }, {});

  const toggleSelect = useCallback((id) => { setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }, []);
  const exportSelected = () => { const items = claims.filter(c => selected.has(c.claim_id)); const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'claims_export.json'; a.click(); };

  useEffect(() => {
    if (isMobile) return;
    const handler = (e) => { if (e.key === 'ArrowDown') setFocusedIdx(i => Math.min(i + 1, claims.length - 1)); if (e.key === 'ArrowUp') setFocusedIdx(i => Math.max(i - 1, 0)); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [claims.length, isMobile]);

  return (
    <div style={{ padding: isMobile ? '16px 0' : '20px 28px', maxWidth: 1200, background: '#09090b', minHeight: '100vh' }}>
      <style>{`
        @keyframes cl-stagger { from{opacity:0;transform:translateX(-6px);}to{opacity:1;transform:translateX(0);} }
        @keyframes cl-fadein  { from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);} }
        @keyframes cl-blink   { 0%,100%{opacity:1;}50%{opacity:0;} }
        @keyframes cl-ripple  { 0%{opacity:0.5;}100%{opacity:0;} }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #27272a', paddingBottom: 14, marginBottom: 14, padding: isMobile ? '0 16px 14px' : '0 0 14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 'clamp(38px,10vw,52px)' : 64, letterSpacing: '0.04em', lineHeight: 1, color: '#f4f4f5' }}>EXTRACTED</div>
            <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 'clamp(38px,10vw,52px)' : 64, letterSpacing: '0.04em', lineHeight: 1, color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.2)' }}>CLAIMS</div>
          </div>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 52 : 80, color: '#1c1c1e', lineHeight: 1 }}>
            <FlipCounter value={allClaims.length} />
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 10, color: '#71717a', marginTop: 8, letterSpacing: '0.1em', lineHeight: 1.6 }}>
          MODEL: GROQ LLAMA 3.3 70B · SPEED: <span style={{ color: '#22c55e', textShadow: '0 0 6px rgba(34,197,94,0.4)' }}>963MS</span> · RUST PARSER: <span style={{ color: '#22c55e', textShadow: '0 0 6px rgba(34,197,94,0.4)' }}>&lt;1MS/CLAIM</span>
        </div>
      </div>

      {/* Sticky filters */}
      <div style={{ position: 'sticky', top: isMobile ? 52 : 0, zIndex: 20, background: '#09090b', paddingBottom: 8, padding: isMobile ? '0 16px 8px' : '0 0 8px', borderBottom: '1px solid #1c1c1e' }}>
        <div style={{ display: 'flex', gap: isMobile ? 4 : 5, overflowX: 'auto', paddingBottom: 4 }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)} style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 10 : 9, letterSpacing: '0.08em', background: status === s ? S_COLORS[s] : 'transparent', color: status === s ? '#09090b' : S_COLORS[s], border: `1px solid ${status === s ? S_COLORS[s] : S_COLORS[s] + '44'}`, padding: isMobile ? '8px 12px' : '5px 10px', cursor: 'crosshair', transition: 'all 0.15s', flexShrink: 0, minHeight: isMobile ? 44 : 'auto', display: 'flex', alignItems: 'center', gap: 5, boxShadow: status === s ? S_GLOW[s] : 'none' }}>
              {s} {counts[s] > 0 && <span style={{ fontWeight: 700 }}>{counts[s]}</span>}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <input type="text" placeholder="SEARCH CLAIMS..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: '#111113', border: '1px solid #27272a', color: '#d4d4d8', padding: '7px 12px', outline: 'none', letterSpacing: '0.05em', flex: 1, minHeight: isMobile ? 44 : 'auto', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = '#3f3f46'} onBlur={e => e.target.style.borderColor = '#27272a'}
          />
          {selected.size > 0 && !isMobile && (
            <button onClick={exportSelected} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', padding: '5px 12px', cursor: 'crosshair', boxShadow: '0 0 8px rgba(34,197,94,0.2)' }}>EXPORT {selected.size} ↓</button>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 10, color: '#3f3f46', letterSpacing: '0.1em', marginTop: 6 }}>
          {claims.length} CLAIMS{!isMobile ? ' · ↑↓ NAVIGATE · HOVER FOR AI VERDICT' : ''}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: isMobile ? '2rem 16px' : '2rem 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#71717a' }}>LOADING...</div>
      ) : error ? (
        <div style={{ padding: isMobile ? '2rem 16px' : '2rem 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ef4444' }}>ERR: {error}</div>
      ) : claims.length === 0 ? (
        <div style={{ padding: isMobile ? '1.5rem 16px' : '1.5rem 0' }}><TerminalEmpty isMobile={isMobile} /></div>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {claims.map((c, i) => <ClaimCardMobile key={c.claim_id} claim={c} index={i} />)}
        </div>
      ) : (
        <div style={{ border: '1px solid #1c1c1e' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 110px 80px 80px 70px 80px', borderBottom: '2px solid #27272a', padding: '6px 0', background: '#0a0a0c' }}>
            <div style={{ paddingLeft: 12 }}>
              <div onClick={() => { if (selected.size === claims.length) setSelected(new Set()); else setSelected(new Set(claims.map(c => c.claim_id))); }}
                style={{ width: 14, height: 14, border: `1px solid ${selected.size === claims.length && claims.length > 0 ? '#22c55e' : '#3f3f46'}`, background: selected.size === claims.length && claims.length > 0 ? '#22c55e' : 'transparent', cursor: 'crosshair', boxShadow: selected.size > 0 ? '0 0 6px rgba(34,197,94,0.4)' : 'none' }} />
            </div>
            {['CLAIM TEXT', 'STATUS', 'CONF', 'FAITH', 'AGE', 'ACTIONS'].map(h => (
              <div key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.15em', paddingRight: 12, display: 'flex', alignItems: 'center' }}>{h}</div>
            ))}
          </div>
          {claims.map((c, i) => <ClaimRowDesktop key={c.claim_id} claim={c} index={i} selected={selected.has(c.claim_id)} onSelect={toggleSelect} focused={focusedIdx === i} />)}
        </div>
      )}
    </div>
  );
}