import React, { useState, useEffect, useCallback } from 'react';
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

function pct(v, dec = 0) {
  return v != null ? (v * 100).toFixed(dec) + '%' : '—';
}

function shortDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase();
}

const STATUS_CONFIG = {
  CONFLICT:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: '#ef4444', label: 'CONFLICT' },
  CONFIRMED: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: '#22c55e', label: 'CONFIRMED' },
  NEW:       { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: '#3b82f6', label: 'NEW' },
  UNCERTAIN: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: '#f59e0b', label: 'UNCERTAIN' },
};

// ── Mobile Card Component ──
function ClaimCard({ claim, index }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const st = STATUS_CONFIG[claim.status] || STATUS_CONFIG.NEW;
  const isLong = claim.text?.length > 120;

  const copy = () => {
    navigator.clipboard.writeText(claim.text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{
      background: '#111113',
      borderLeft: `3px solid ${st.border}`,
      borderBottom: '1px solid #1c1c1e',
      padding: '14px 14px 12px',
      animation: `cl-fadein 0.3s ${index * 0.04}s ease both`,
      opacity: 0,
    }}>
      <style>{`@keyframes cl-fadein{from{opacity:0;transform:translateX(-6px);}to{opacity:1;transform:translateX(0);}}`}</style>

      {/* Claim text */}
      <div style={{ marginBottom: 10 }}>
        <div style={{
          fontSize: 14,
          color: '#f4f4f5',
          lineHeight: 1.6,
          fontWeight: 400,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : 3,
          WebkitBoxOrient: 'vertical',
        }}>
          {claim.text}
        </div>
        {isLong && (
          <button onClick={() => setExpanded(!expanded)} style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: '#52525b', background: 'none', border: 'none',
            cursor: 'pointer', marginTop: 4, padding: 0,
            letterSpacing: '0.08em',
          }}>
            {expanded ? '[ SHOW LESS ]' : '[ SHOW MORE ]'}
          </button>
        )}
      </div>

      {/* Tags row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: '#22c55e', background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.2)',
          padding: '2px 6px', letterSpacing: '0.06em',
          textShadow: '0 0 6px rgba(34,197,94,0.3)',
        }}>[RUST-ENGINE: &lt;50MS]</span>

        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: st.color, background: st.bg,
          border: `1px solid ${st.border}33`,
          padding: '2px 6px', letterSpacing: '0.08em',
        }}>{st.label}</span>

        {claim.severity && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: claim.severity === 'critical' ? '#ef4444' : claim.severity === 'major' ? '#f97316' : '#71717a',
            letterSpacing: '0.06em',
          }}>{claim.severity.toUpperCase()}</span>
        )}

        {claim.topic_tags?.slice(0, 2).map(t => (
          <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#52525b', background: '#1c1c1e', padding: '2px 5px' }}>{t}</span>
        ))}

        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', marginLeft: 'auto' }}>
          {timeAgo(claim.created_at)}
        </span>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {/* Confidence */}
        <div style={{ background: '#0a0a0c', padding: '8px 10px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#71717a', letterSpacing: '0.12em', marginBottom: 4, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>CONFIDENCE</div>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 22, color: claim.confidence > 0.8 ? '#22c55e' : claim.confidence > 0.6 ? '#f59e0b' : '#ef4444', lineHeight: 1, textShadow: claim.confidence > 0.8 ? '0 0 8px rgba(34,197,94,0.4)' : 'none' }}>
            {pct(claim.confidence)}
          </div>
          <div style={{ height: 2, background: '#27272a', marginTop: 4 }}>
            <div style={{ height: '100%', width: `${(claim.confidence || 0) * 100}%`, background: claim.confidence > 0.8 ? '#22c55e' : claim.confidence > 0.6 ? '#f59e0b' : '#ef4444', transition: 'width 0.6s ease' }} />
          </div>
        </div>

        {/* Faithfulness */}
        <div style={{ background: '#0a0a0c', padding: '8px 10px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#71717a', letterSpacing: '0.12em', marginBottom: 4, textShadow: '0 0 4px rgba(113,113,122,0.3)' }}>FAITHFULNESS</div>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 22, color: claim.faithfulness_score != null ? '#22c55e' : '#3f3f46', lineHeight: 1 }}>
            {pct(claim.faithfulness_score)}
          </div>
          <div style={{ height: 2, background: '#27272a', marginTop: 4 }}>
            <div style={{ height: '100%', width: `${(claim.faithfulness_score || 0) * 100}%`, background: '#22c55e', transition: 'width 0.6s ease' }} />
          </div>
        </div>
      </div>

      {/* Copy button */}
      <button onClick={copy} style={{
        marginTop: 10, width: '100%',
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: copied ? '#22c55e' : '#3f3f46',
        background: 'transparent',
        border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : '#1c1c1e'}`,
        padding: '6px', cursor: 'pointer',
        letterSpacing: '0.1em', transition: 'all 0.2s',
        minHeight: 36,
      }}>
        {copied ? '✓ COPIED TO CLIPBOARD' : 'TAP TO COPY CLAIM'}
      </button>
    </div>
  );
}

// ── Desktop Row Component ──
function ClaimRow({ claim, index, selected, onSelect, focused }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = React.useRef(null);
  const st = STATUS_CONFIG[claim.status] || STATUS_CONFIG.NEW;

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
      animation: `cl-fadein 0.3s ${index * 0.04}s ease both`,
      opacity: 0,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 110px 70px 70px 70px 90px', gap: 0, padding: '10px 0', cursor: 'pointer', alignItems: 'center' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ paddingLeft: 12 }} onClick={e => { e.stopPropagation(); onSelect(claim.claim_id); }}>
          <div style={{ width: 14, height: 14, border: `1px solid ${selected ? st.color : '#3f3f46'}`, background: selected ? st.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s' }}>
            {selected && <div style={{ width: 6, height: 6, background: '#09090b' }} />}
          </div>
        </div>
        <div style={{ paddingRight: 12, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: '#d4d4d8', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded ? 'normal' : 'nowrap', marginBottom: 4 }}>{claim.text}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', padding: '1px 6px', letterSpacing: '0.08em' }}>[RUST-ENGINE: &lt;50MS]</span>
            {claim.topic_tags?.slice(0, 2).map(t => (
              <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', background: '#1c1c1e', padding: '1px 5px' }}>{t}</span>
            ))}
          </div>
        </div>
        <div><span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: st.color, background: st.bg, border: `1px solid ${st.border}33`, padding: '3px 7px' }}>{st.label}</span></div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#71717a', marginBottom: 3 }}>{pct(claim.confidence)}</div>
          <div style={{ height: 3, background: '#27272a', width: 48 }}><div style={{ height: '100%', width: `${(claim.confidence || 0) * 100}%`, background: st.color, transition: 'width 0.6s' }} /></div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: claim.faithfulness_score != null ? '#22c55e' : '#3f3f46' }}>{pct(claim.faithfulness_score)}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.06em' }}>{timeAgo(claim.created_at)}</div>
        <div style={{ display: 'flex', gap: 4, paddingRight: 12 }} onClick={e => e.stopPropagation()}>
          <button onClick={copy} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: copied ? '#22c55e' : '#3f3f46', background: 'none', border: 'none', cursor: 'crosshair', letterSpacing: '0.08em', transition: 'color 0.2s' }}>
            {copied ? 'COPIED' : 'COPY'}
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid #1c1c1e', padding: '10px 44px', background: '#0a0a0c', fontSize: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.15em', marginBottom: 4 }}>CLAIM ID</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#71717a', wordBreak: 'break-all' }}>{claim.claim_id}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.15em', marginBottom: 4 }}>EXTRACTED</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#71717a' }}>{shortDate(claim.created_at)}</div>
            </div>
          </div>
          {claim.topic_tags?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.15em', marginBottom: 4 }}>TOPIC TAGS</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {claim.topic_tags.map(t => <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', background: '#1c1c1e', border: '1px solid #27272a', padding: '2px 8px' }}>{t}</span>)}
              </div>
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

function TerminalEmptyState({ isMobile }) {
  const [lines, setLines] = useState([]);
  const LINES = [
    { text: '[SYSTEM STATUS: IDLE]', color: '#22c55e' },
    { text: 'Pipeline not currently running...', color: '#71717a' },
    { text: 'Awaiting next run at 02:00 UTC', color: '#52525b' },
    { text: '> claim_extractor.py standing by', color: '#71717a' },
    { text: '> rust claim-parser :8002 online', color: '#22c55e' },
    { text: '█', color: '#22c55e', blink: true },
  ];
  useEffect(() => { LINES.forEach((l, i) => { setTimeout(() => setLines(p => [...p, l]), i * 180); }); }, []);
  return (
    <div style={{ background: '#0a0a0c', border: '1px solid #1c1c1e', borderLeft: '2px solid #22c55e', padding: '20px 16px', fontFamily: 'var(--font-mono)', maxWidth: isMobile ? '100%' : 480 }}>
      <style>{`@keyframes em-blink{0%,100%{opacity:1;}50%{opacity:0;}}`}</style>
      <div style={{ fontSize: 9, color: '#52525b', letterSpacing: '0.15em', marginBottom: 10 }}>TERMINAL — claim_extractor.py</div>
      {lines.map((l, i) => <div key={i} style={{ fontSize: isMobile ? 11 : 12, color: l.color, marginBottom: 3, animation: l.blink ? 'em-blink 1s ease infinite' : 'none' }}>{l.text}</div>)}
    </div>
  );
}

const STATUSES = ['ALL', 'CONFLICT', 'CONFIRMED', 'NEW', 'UNCERTAIN'];
const STATUS_COLORS = { ALL: '#a1a1aa', CONFLICT: '#ef4444', CONFIRMED: '#22c55e', NEW: '#3b82f6', UNCERTAIN: '#f59e0b' };

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

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === 'ALL' ? allClaims.length : allClaims.filter(c => c.status === s).length;
    return acc;
  }, {});

  const toggleSelect = useCallback((id) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const exportSelected = () => {
    const items = claims.filter(c => selected.has(c.claim_id));
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'claims_export.json'; a.click();
  };

  useEffect(() => {
    if (isMobile) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') setFocusedIdx(i => Math.min(i + 1, claims.length - 1));
      if (e.key === 'ArrowUp') setFocusedIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [claims.length, isMobile]);

  return (
    <div style={{ padding: isMobile ? '16px 0' : '20px 28px', maxWidth: 1200, background: '#09090b', minHeight: '100vh' }}>
      <style>{`@keyframes cl-fadein{from{opacity:0;transform:translateX(-6px);}to{opacity:1;transform:translateX(0);}}`}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #27272a', paddingBottom: 14, marginBottom: 16, padding: isMobile ? '0 16px 14px' : '0 0 14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 'clamp(38px,10vw,52px)' : 64, letterSpacing: '0.04em', lineHeight: 1, color: '#f4f4f5' }}>EXTRACTED</div>
            <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 'clamp(38px,10vw,52px)' : 64, letterSpacing: '0.04em', lineHeight: 1, color: '#ef4444' }}>CLAIMS</div>
          </div>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 52 : 80, color: '#1c1c1e', lineHeight: 1, letterSpacing: '-0.02em' }}>
            <FlipCounter value={allClaims.length} />
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 10, color: '#71717a', marginTop: 8, letterSpacing: '0.1em', lineHeight: 1.6 }}>
          MODEL: GROQ LLAMA 3.3 70B · SPEED: 963MS · RUST PARSER: &lt;1MS/CLAIM
        </div>
      </div>

      {/* Sticky filter tabs */}
      <div style={{
        position: 'sticky', top: isMobile ? 52 : 0, zIndex: 20,
        background: '#09090b', paddingBottom: 8,
        padding: isMobile ? '0 16px 8px' : '0 0 8px',
        borderBottom: '1px solid #1c1c1e',
      }}>
        <div style={{ display: 'flex', gap: isMobile ? 4 : 6, overflowX: 'auto', paddingBottom: 4 }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)} style={{
              fontFamily: 'var(--font-mono)',
              fontSize: isMobile ? 10 : 9,
              letterSpacing: '0.1em',
              background: status === s ? STATUS_COLORS[s] : 'transparent',
              color: status === s ? '#09090b' : STATUS_COLORS[s],
              border: `1px solid ${status === s ? STATUS_COLORS[s] : STATUS_COLORS[s] + '44'}`,
              padding: isMobile ? '8px 12px' : '5px 10px',
              cursor: 'crosshair',
              transition: 'all 0.1s',
              flexShrink: 0,
              minHeight: isMobile ? 44 : 'auto',
              display: 'flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap',
            }}>
              {s}
              {counts[s] > 0 && (
                <span style={{ fontSize: isMobile ? 10 : 9, fontWeight: 700, background: 'rgba(0,0,0,0.2)', padding: '0 4px' }}>{counts[s]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search — mobile full width */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <input type="text" placeholder="SEARCH CLAIMS..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: '#111113', border: '1px solid #27272a', color: '#d4d4d8', padding: '8px 12px', outline: 'none', letterSpacing: '0.05em', flex: 1, minHeight: isMobile ? 44 : 'auto' }}
          />
          {selected.size > 0 && !isMobile && (
            <button onClick={exportSelected} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', padding: '5px 12px', cursor: 'crosshair' }}>
              EXPORT {selected.size} ↓
            </button>
          )}
        </div>

        {!isMobile && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#3f3f46', letterSpacing: '0.1em', marginTop: 6 }}>
            {claims.length} CLAIMS · ↑↓ NAVIGATE · SPACE EXPAND
          </div>
        )}
        {isMobile && claims.length > 0 && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.08em', marginTop: 6 }}>
            {claims.length} CLAIMS
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: isMobile ? '0' : '0' }}>
        {loading ? (
          <div style={{ padding: isMobile ? '2rem 16px' : '2rem 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#71717a', letterSpacing: '0.1em' }}>LOADING...</div>
        ) : error ? (
          <div style={{ padding: isMobile ? '2rem 16px' : '2rem 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ef4444' }}>ERR: {error}</div>
        ) : claims.length === 0 ? (
          <div style={{ padding: isMobile ? '1.5rem 16px' : '1.5rem 0' }}>
            <TerminalEmptyState isMobile={isMobile} />
          </div>
        ) : isMobile ? (
          /* ── MOBILE: Card layout ── */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {claims.map((c, i) => <ClaimCard key={c.claim_id} claim={c} index={i} />)}
          </div>
        ) : (
          /* ── DESKTOP: Table layout ── */
          <div style={{ border: '1px solid #1c1c1e' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 110px 70px 70px 70px 90px', borderBottom: '2px solid #27272a', padding: '6px 0', background: '#0a0a0c' }}>
              <div style={{ paddingLeft: 12 }}>
                <div onClick={() => { if (selected.size === claims.length) setSelected(new Set()); else setSelected(new Set(claims.map(c => c.claim_id))); }}
                  style={{ width: 14, height: 14, border: `1px solid ${selected.size === claims.length && claims.length > 0 ? '#22c55e' : '#3f3f46'}`, background: selected.size === claims.length && claims.length > 0 ? '#22c55e' : 'transparent', cursor: 'crosshair' }}
                />
              </div>
              {['CLAIM TEXT', 'STATUS', 'CONF', 'FAITH', 'AGE', 'ACTIONS'].map(h => (
                <div key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.15em', paddingRight: 12, display: 'flex', alignItems: 'center' }}>{h}</div>
              ))}
            </div>
            {claims.map((c, i) => (
              <ClaimRow key={c.claim_id} claim={c} index={i} selected={selected.has(c.claim_id)} onSelect={toggleSelect} focused={focusedIdx === i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}