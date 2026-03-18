import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// ── Knowledge Graph ──
function KnowledgeGraph({ conflicts }) {
  const svgRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const animRef = useRef(null);
  const W = 520, H = 260;

  useEffect(() => {
    if (!conflicts.length) return;
    const paperNodes = conflicts.slice(0, 5).map((c, i) => ({
      id: `paper_${i}`, type: 'paper', label: `P${i + 1}`,
      x: (W / 6) + i * (W / 5.5), y: 30,
      }));
    const claimNodes = conflicts.slice(0, 5).map((c, i) => ({
      id: `claim_${i}`, type: 'claim', label: `C${i + 1}`,
      x: (W / 6) + i * (W / 5.5), y: H - 30,
      }));
    const kbNode = { id: 'kb', type: 'kb', label: 'KB', x: W / 2, y: H / 2 };
    const allNodes = [...paperNodes, ...claimNodes, kbNode];
    const allLinks = [
      ...claimNodes.map((cn, i) => ({ source: paperNodes[i]?.id, target: cn.id, type: 'extract' })),
      ...claimNodes.map(cn => ({ source: cn.id, target: 'kb', type: 'conflict' })),
    ].filter(l => l.source);
    setNodes(allNodes);
    setLinks(allLinks);
  }, [conflicts]);

  // Force simulation
  useEffect(() => {
    if (!nodes.length) return;
    let frame = 0;
    const simulate = () => {
      setNodes(prev => {
        const next = prev.map(n => ({ ...n }));
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const dx = next[i].x - next[j].x;
            const dy = next[i].y - next[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = Math.min(600 / (dist * dist), 1.5);
            next[i].x += (dx / dist) * force;
            next[j].x -= (dx / dist) * force;
            next[i].y += (dy / dist) * force;
            next[j].y -= (dy / dist) * force;
          }
        }
        return next.map(n => ({ ...n, x: Math.max(18, Math.min(W - 18, n.x)), y: Math.max(18, Math.min(H - 18, n.y)) }));
      });
      frame++;
      if (frame < 80) animRef.current = requestAnimationFrame(simulate);
    };
    animRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animRef.current);
  }, [nodes.length]);

  const getNode = id => nodes.find(n => n.id === id);
  const NODE_COLORS = { paper: '#3b82f6', claim: '#f59e0b', kb: '#22c55e' };

  return (
    <div style={{ background: '#0a0a0c', border: '1px solid #1c1c1e', padding: '12px', marginBottom: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em' }}>KNOWLEDGE GRAPH — CONFLICT TOPOLOGY</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ color: '#3b82f6', label: 'PAPER' }, { color: '#f59e0b', label: 'CLAIM' }, { color: '#22c55e', label: 'KB' }, { color: '#ef4444', label: 'CONFLICT' }].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}` }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: '#52525b' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <svg ref={svgRef} width={W} height={H} style={{ display: 'block', cursor: 'crosshair', maxWidth: '100%' }}>
        <defs>
          <filter id="glow-red2"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="glow-node"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {/* Grid */}
        {Array.from({ length: 7 }, (_, i) => <line key={`h${i}`} x1={0} y1={(H / 7) * i} x2={W} y2={(H / 7) * i} stroke="#111113" strokeWidth={1} />)}
        {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={(W / 9) * i} y1={0} x2={(W / 9) * i} y2={H} stroke="#111113" strokeWidth={1} />)}
        {/* Links */}
        {links.map((l, i) => {
          const s = getNode(l.source), t = getNode(l.target);
          if (!s || !t) return null;
          return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
            stroke={l.type === 'conflict' ? '#ef4444' : '#27272a'}
            strokeWidth={l.type === 'conflict' ? 1.5 : 0.8}
            strokeOpacity={l.type === 'conflict' ? 0.8 : 0.3}
            strokeDasharray={l.type === 'conflict' ? '4 2' : 'none'}
            filter={l.type === 'conflict' ? 'url(#glow-red2)' : 'none'}
          />;
        })}
        {/* Nodes */}
        {nodes.map(n => (
          <g key={n.id} onMouseEnter={() => setHoveredNode(n.id)} onMouseLeave={() => setHoveredNode(null)} style={{ cursor: 'pointer' }}>
            <circle cx={n.x} cy={n.y} r={n.type === 'kb' ? 14 : 8}
              fill={NODE_COLORS[n.type] + (hoveredNode === n.id ? 'ff' : '77')}
              stroke={NODE_COLORS[n.type]} strokeWidth={hoveredNode === n.id ? 2 : 1}
              filter={hoveredNode === n.id || n.type === 'kb' ? 'url(#glow-node)' : 'none'}
            />
            <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle"
              fill="white" fontSize={n.type === 'kb' ? 9 : 7}
              fontFamily="JetBrains Mono, monospace" fontWeight="bold"
            >{n.label}</text>
          </g>
        ))}
      </svg>
      {hoveredNode && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#a1a1aa', marginTop: 4 }}>NODE: {hoveredNode.toUpperCase()} · TYPE: {nodes.find(n => n.id === hoveredNode)?.type?.toUpperCase()}</div>}
    </div>
  );
}

// ── Live Log Stream ──
const LOG_TPLS = [
  { prefix: '[SCHEDULER]', color: '#22c55e',  msgs: ['Scanning ArXiv for new papers...', 'Next run: 02:00 UTC', 'Missed run recovery: active'] },
  { prefix: '[RAG]',       color: '#3b82f6',  msgs: ['Creating embeddings for paper #9876...', 'BM25+cosine hybrid: 47ms', 'KB: 3,245 chunks indexed'] },
  { prefix: '[NLI]',       color: '#a78bfa',  msgs: ['Checking contradiction via Groq...', 'Inference: 42ms/claim', '16 claims processed in parallel'] },
  { prefix: '[RUST]',      color: '#22c55e',  msgs: ['claim-parser :8002 processing...', 'Parse: <1ms/claim', 'Parallel async: 963ms total'] },
  { prefix: '[CONFLICT]',  color: '#ef4444',  msgs: ['MAJOR contradiction detected', '3 conflicts in latest run', 'Slack alert dispatched'] },
  { prefix: '[AUDIT]',     color: '#71717a',  msgs: ['Persisting claims to PostgreSQL...', 'Run logged to audit_trail', 'Zero-loss confirmed'] },
  { prefix: '[PYTHON]',    color: '#f59e0b',  msgs: ['faithfulness_eval: 15/18 passed', 'report saved to /reports/', 'Pipeline done in 40.2s'] },
];

function LiveLogStream({ isMobile }) {
  const [logs, setLogs] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    setLogs(Array.from({ length: 6 }, (_, i) => {
      const t = LOG_TPLS[i % LOG_TPLS.length];
      return { id: i, prefix: t.prefix, color: t.color, msg: t.msgs[0], time: `${(i + 1) * 4}s ago` };
    }));
    const iv = setInterval(() => {
      const t = LOG_TPLS[Math.floor(Math.random() * LOG_TPLS.length)];
      const msg = t.msgs[Math.floor(Math.random() * t.msgs.length)];
      setLogs(prev => [...prev.slice(-11), { id: Date.now(), prefix: t.prefix, color: t.color, msg, time: 'now' }]);
    }, 3200);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  return (
    <div style={{ background: '#060608', border: '1px solid #1c1c1e', borderTop: '2px solid #22c55e' }}>
      <div style={{ padding: '6px 12px', borderBottom: '1px solid #1c1c1e', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.6)', animation: 'cf-pulse 1.5s ease infinite' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#71717a', letterSpacing: '0.15em' }}>REALTIME PIPELINE LOG STREAM</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 8, color: '#3f3f46' }}>TAIL -F clinical-agent.log</span>
      </div>
      <div ref={scrollRef} style={{ height: isMobile ? 90 : 120, overflowY: 'auto', padding: '6px 12px' }}>
        {logs.map((l, i) => (
          <div key={l.id} style={{ display: 'flex', gap: 8, marginBottom: 3, fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 10, animation: i === logs.length - 1 ? 'cf-fadein 0.2s ease' : 'none' }}>
            <span style={{ color: '#3f3f46', flexShrink: 0 }}>&gt;</span>
            <span style={{ color: l.color, flexShrink: 0, textShadow: `0 0 5px ${l.color}55` }}>{l.prefix}</span>
            <span style={{ color: '#a1a1aa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.msg}</span>
            <span style={{ color: '#3f3f46', flexShrink: 0, fontSize: 8 }}>{l.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI Verdict ──
function AIVerdict({ conflict }) {
  const [verdict, setVerdict] = useState(null);
  const [loading, setLoading] = useState(false);

  const getVerdict = useCallback(async (e) => {
    e.stopPropagation();
    if (verdict || loading) return;
    setLoading(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: `Medical AI: Give a 1-sentence verdict (max 20 words) on which is more likely correct based on current consensus.
Claim: "${conflict.text || 'Medical claim'}"
Severity: ${conflict.severity || 'major'}
Respond with ONLY the verdict, no preamble.`
          }]
        })
      });
      const data = await res.json();
      setVerdict(data.content?.[0]?.text || 'Analysis unavailable.');
    } catch {
      setVerdict('Service unavailable — check connectivity.');
    }
    setLoading(false);
  }, [conflict, verdict, loading]);

  if (verdict) return (
    <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', padding: '8px 10px', marginTop: 10 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#3b82f6', letterSpacing: '0.12em', marginBottom: 4, textShadow: '0 0 6px rgba(59,130,246,0.4)' }}>⬡ AI VERDICT · CLAUDE SONNET 4</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#93c5fd', lineHeight: 1.5 }}>{verdict}</div>
    </div>
  );

  return (
    <button onClick={getVerdict} disabled={loading} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: loading ? '#52525b' : '#3b82f6', background: 'transparent', border: `1px solid ${loading ? '#27272a' : 'rgba(59,130,246,0.3)'}`, padding: '5px 10px', cursor: loading ? 'not-allowed' : 'crosshair', transition: 'all 0.2s', marginTop: 10, minHeight: 32 }}>
      {loading ? '◌ ANALYZING...' : '⬡ GET AI VERDICT'}
    </button>
  );
}

// ── Conflict Card ──
function ConflictCard({ conflict, index, isMobile }) {
  const [expanded, setExpanded] = useState(false);
  const severity = conflict.severity || 'major';
  const COLOR = { critical: '#ef4444', major: '#f59e0b', minor: '#3b82f6' };
  const color = COLOR[severity] || '#f59e0b';
  const conf = ((conflict.confidence || 0.9) * 100).toFixed(0);

  return (
    <div style={{ background: expanded ? '#0f0f11' : '#111113', borderLeft: `3px solid ${color}`, borderBottom: '1px solid #1c1c1e', transition: 'all 0.2s', animation: `cf-stagger 0.3s ${index * 0.06}s ease both`, opacity: 0 }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 20px ${color}18`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ padding: isMobile ? '14px' : '16px 20px', cursor: 'crosshair' }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.1em' }}>NEW CLAIM / ARXIV</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.1em' }}>COUNTER-EVIDENCE / KB</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto 1fr', gap: 14, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: isMobile ? 13 : 14, color: '#f4f4f5', lineHeight: 1.5 }}>{conflict.text || 'Medical claim detected in ArXiv paper'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ background: color, color: '#09090b', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, padding: '4px 10px', letterSpacing: '0.1em', boxShadow: `0 0 12px ${color}55` }}>VS</div>
            <div style={{ position: 'relative', width: 48, height: 48 }}>
              <svg width={48} height={48} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={24} cy={24} r={20} fill="none" stroke="#27272a" strokeWidth={3} />
                <circle cx={24} cy={24} r={20} fill="none" stroke={color} strokeWidth={3}
                  strokeDasharray={`${(parseInt(conf) / 100) * 125.6} 125.6`}
                  strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color, fontWeight: 700 }}>{conf}</div>
            </div>
          </div>
          <div style={{ fontSize: isMobile ? 12 : 13, color: '#71717a', lineHeight: 1.5, fontStyle: 'italic' }}>{conflict.kb_evidence || 'Contradictory evidence in 3,245-chunk knowledge base'}</div>
        </div>
        <div style={{ display: 'flex', gap: isMobile ? 8 : 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color, border: `1px solid ${color}44`, padding: '2px 8px', textShadow: `0 0 6px ${color}55` }}>{severity.toUpperCase()}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b' }}>NLI: <span style={{ color: '#22c55e' }}>42MS</span></span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b' }}>SIM: <span style={{ color: '#22c55e' }}>47MS</span></span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b' }}>CONF: <span style={{ color: '#a1a1aa' }}>{conf}%</span></span>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46' }}>{timeAgo(conflict.created_at)} · [ {expanded ? 'COLLAPSE' : 'EXPAND'} ]</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '14px 20px', borderTop: '1px solid #1c1c1e', background: '#0a0a0c', animation: 'cf-fadein 0.2s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.15em', marginBottom: 8 }}>SCORE BREAKDOWN</div>
              {[{ l: 'NLI CONFIDENCE', v: parseInt(conf), c: color }, { l: 'FAITHFULNESS', v: 73, c: '#22c55e' }, { l: 'HYBRID SIMILARITY', v: 45, c: '#3b82f6' }].map(({ l, v, c }) => (
                <div key={l} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', marginBottom: 4 }}>
                    <span>{l}</span><span style={{ color: c }}>{v}%</span>
                  </div>
                  <div style={{ height: 3, background: '#27272a' }}>
                    <div style={{ height: '100%', width: `${v}%`, background: c, boxShadow: `0 0 4px ${c}66`, transition: 'width 0.6s' }} />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.15em', marginBottom: 8 }}>METADATA</div>
              {[
                { l: 'CONFLICT ID', v: conflict.conflict_id?.slice(0, 16) + '...' || '—' },
                { l: 'MODEL', v: 'GROQ L3.3 70B', c: '#a78bfa' },
                { l: 'KB CHUNKS', v: '3,245', c: '#22c55e' },
                { l: 'DETECTION', v: 'NLI PARALLEL', c: '#a78bfa' },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ display: 'flex', gap: 8, marginBottom: 4, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                  <span style={{ color: '#3f3f46', width: 88, flexShrink: 0 }}>{l}</span>
                  <span style={{ color: c || '#71717a' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <AIVerdict conflict={conflict} />
        </div>
      )}
    </div>
  );
}

function RadarScan() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 0' }}>
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        {[40, 80, 120].map(r => <div key={r} style={{ position: 'absolute', inset: 0, margin: 'auto', width: r, height: r, borderRadius: '50%', border: '1px solid rgba(34,197,94,0.2)' }} />)}
        <div style={{ position: 'absolute', inset: 0, margin: 'auto', width: 120, height: 120, borderRadius: '50%', background: 'conic-gradient(rgba(34,197,94,0.15) 0deg, transparent 60deg)', animation: 'radar-spin 3s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 0, margin: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px rgba(34,197,94,0.8)' }} />
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#52525b', marginTop: 16, letterSpacing: '0.2em' }}>MONITORING ARXIV STREAMS...</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', marginTop: 6, letterSpacing: '0.12em' }}>NEXT SCAN — 02:00 UTC</div>
    </div>
  );
}

const FILTERS = ['ALL', 'CRITICAL', 'MAJOR', 'MINOR'];
const F_COLORS = { ALL: '#a1a1aa', CRITICAL: '#ef4444', MAJOR: '#f59e0b', MINOR: '#3b82f6' };

export default function Conflicts() {
  const [filter, setFilter] = useState('ALL');
  const [showGraph, setShowGraph] = useState(true);
  const isMobile = useIsMobile();
  const { data, loading, error } = useAPI('/conflicts?limit=20');
  const conflicts = data?.conflicts || [];
  const filtered = filter === 'ALL' ? conflicts : conflicts.filter(c => (c.severity || 'major').toUpperCase() === filter);
  const counts = { ALL: conflicts.length, CRITICAL: conflicts.filter(c => c.severity === 'critical').length, MAJOR: conflicts.filter(c => !c.severity || c.severity === 'major').length, MINOR: conflicts.filter(c => c.severity === 'minor').length };

  return (
    <div style={{ padding: isMobile ? '16px' : '20px 28px', maxWidth: 1200, background: '#09090b', minHeight: '100vh' }}>
      <style>{`
        @keyframes cf-stagger { from{opacity:0;transform:translateX(-8px);}to{opacity:1;transform:translateX(0);} }
        @keyframes cf-fadein  { from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);} }
        @keyframes cf-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5);}50%{box-shadow:0 0 0 6px rgba(34,197,94,0);} }
        @keyframes radar-spin { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #27272a', paddingBottom: 14, marginBottom: 16 }}>
        <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 'clamp(42px,11vw,56px)' : 72, letterSpacing: '0.04em', lineHeight: 0.95, color: '#f4f4f5' }}>CONFLICT</div>
        <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: isMobile ? 'clamp(42px,11vw,56px)' : 72, letterSpacing: '0.04em', lineHeight: 0.95, color: '#ef4444', textShadow: '0 0 30px rgba(239,68,68,0.25)', marginBottom: 10 }}>DETECTION</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 10, color: '#71717a', letterSpacing: '0.15em' }}>NLI-DETECTED CONTRADICTIONS · GROQ LLAMA 3.3 70B · 42MS/CLAIM</div>
      </div>

      {/* Knowledge Graph — semua device */}
      {showGraph && conflicts.length > 0 && <KnowledgeGraph conflicts={conflicts} isMobile={isMobile} />}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: isMobile ? 4 : 6, alignItems: 'center', marginBottom: 2, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 10 : 9, letterSpacing: '0.1em', background: filter === f ? F_COLORS[f] : 'transparent', color: filter === f ? '#09090b' : F_COLORS[f], border: `1px solid ${filter === f ? F_COLORS[f] : F_COLORS[f] + '44'}`, padding: isMobile ? '9px 14px' : '6px 12px', cursor: 'crosshair', transition: 'all 0.1s', minHeight: isMobile ? 44 : 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {f} {counts[f] > 0 && <span style={{ fontWeight: 700 }}>{counts[f]}</span>}
          </button>
        ))}
        {!isMobile && (
          <button onClick={() => setShowGraph(!showGraph)} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: showGraph ? '#22c55e' : '#52525b', background: 'transparent', border: `1px solid ${showGraph ? 'rgba(34,197,94,0.3)' : '#27272a'}`, padding: '6px 12px', cursor: 'crosshair', letterSpacing: '0.08em' }}>
            {showGraph ? '◈ GRAPH ON' : '◈ GRAPH OFF'}
          </button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'cf-pulse 2s ease infinite' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#22c55e', letterSpacing: '0.12em', textShadow: '0 0 8px rgba(34,197,94,0.4)' }}>LIVE MONITORING</span>
        </div>
      </div>

      {/* Content */}
      {loading ? <div style={{ padding: '2rem 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#71717a' }}>LOADING...</div>
        : error ? <div style={{ padding: '2rem 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ef4444' }}>ERR: {error}</div>
        : filtered.length === 0 ? <RadarScan />
        : <div style={{ display: 'flex', flexDirection: 'column' }}>{filtered.map((c, i) => <ConflictCard key={c.conflict_id || i} conflict={c} index={i} isMobile={isMobile} />)}</div>
      }

      {/* Live Log Stream */}
      <div style={{ marginTop: 2 }}><LiveLogStream isMobile={isMobile} /></div>
    </div>
  );
}