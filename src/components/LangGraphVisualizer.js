import React, { useState, useEffect } from 'react';

const NODES = [
  { id: 'paper_monitor',    label: 'PAPER MONITOR',    sub: 'arxiv fetch',      time: '~30s',   lang: 'PYTHON' },
  { id: 'claim_extractor',  label: 'CLAIM EXTRACTOR',  sub: 'groq + rust',      time: '963ms',  lang: 'RUST'   },
  { id: 'compare_claims',   label: 'CLAIM COMPARATOR', sub: 'rag retrieval',    time: '~3s',    lang: 'PYTHON' },
  { id: 'detect_conflict',  label: 'CONFLICT DETECT',  sub: 'groq nli parallel',time: '672ms',  lang: 'GROQ'   },
  { id: 'alert_node',       label: 'ALERT NODE',       sub: 'slack webhook',    time: '<100ms', lang: 'PYTHON' },
  { id: 'faithfulness_eval',label: 'FAITHFULNESS EVAL',sub: 'sentence-transformers','time': '5.3s', lang: 'PYTHON' },
  { id: 'audit_logger',     label: 'AUDIT LOGGER',     sub: 'postgresql write', time: '203ms',  lang: 'SQL'    },
  { id: 'report_generator', label: 'REPORT GENERATOR', sub: 'markdown export',  time: '9ms',    lang: 'PYTHON' },
];

const LANG_COLORS = { RUST: '#22c55e', PYTHON: '#f59e0b', GROQ: '#a78bfa', SQL: '#818cf8' };

const NODE_TIMINGS = [0, 300, 1400, 2200, 3100, 3500, 5000, 5800];

export default function LangGraphVisualizer({ activeNodeId, isReplaying }) {
  const [completedNodes, setCompletedNodes] = useState(new Set());
  const [replayActive, setReplayActive] = useState(false);
  const [currentNode, setCurrentNode] = useState(null);
  const [replaySpeed, setReplaySpeed] = useState(1);

  const startReplay = () => {
    setCompletedNodes(new Set());
    setCurrentNode(null);
    setReplayActive(true);

    NODES.forEach((node, i) => {
      setTimeout(() => {
        setCurrentNode(node.id);
        setTimeout(() => {
          setCompletedNodes(prev => new Set([...prev, node.id]));
          if (i === NODES.length - 1) {
            setReplayActive(false);
            setCurrentNode(null);
          }
        }, 600 / replaySpeed);
      }, (NODE_TIMINGS[i] / replaySpeed));
    });
  };

  const resetReplay = () => {
    setCompletedNodes(new Set());
    setCurrentNode(null);
    setReplayActive(false);
  };

  const getNodeState = (nodeId) => {
    if (currentNode === nodeId) return 'active';
    if (completedNodes.has(nodeId)) return 'done';
    if (replayActive) return 'pending';
    return 'idle';
  };

  return (
    <div style={{ background: '#09090b', border: '1px solid #1c1c1e', padding: 20 }}>
      <style>{`
        @keyframes lg-pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(34,197,94,0.4);}50%{opacity:0.8;box-shadow:0 0 0 6px rgba(34,197,94,0);} }
        @keyframes lg-fadein { from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);} }
        @keyframes lg-scan { 0%{background-position:0 0;}100%{background-position:0 100%;} }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.2em', marginBottom: 4 }}>LANGGRAPH STATEGRAPH</div>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 24, color: '#f4f4f5', letterSpacing: '0.04em' }}>8-NODE PIPELINE</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Speed selector */}
          <div style={{ display: 'flex', gap: 1 }}>
            {[1, 2, 4].map(s => (
              <button key={s} onClick={() => setReplaySpeed(s)} style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
                background: replaySpeed === s ? '#22c55e' : 'transparent',
                color: replaySpeed === s ? '#09090b' : '#52525b',
                border: '1px solid ' + (replaySpeed === s ? '#22c55e' : '#27272a'),
                padding: '3px 8px', cursor: 'crosshair',
              }}>{s}×</button>
            ))}
          </div>
          <button onClick={resetReplay} disabled={replayActive} style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em',
            color: '#52525b', background: 'transparent',
            border: '1px solid #27272a', padding: '4px 10px', cursor: 'crosshair',
          }}>RESET</button>
          <button onClick={startReplay} disabled={replayActive} style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em',
            color: replayActive ? '#3f3f46' : '#22c55e',
            background: replayActive ? 'transparent' : 'rgba(34,197,94,0.08)',
            border: '1px solid ' + (replayActive ? '#27272a' : 'rgba(34,197,94,0.4)'),
            padding: '4px 14px', cursor: replayActive ? 'default' : 'crosshair',
          }}>{replayActive ? '● RUNNING...' : '▶ REPLAY PIPELINE'}</button>
        </div>
      </div>

      {/* Pipeline flow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
        {NODES.map((node, i) => {
          const state = getNodeState(node.id);
          const isActive = state === 'active';
          const isDone = state === 'done';
          const isPending = state === 'pending';

          return (
            <React.Fragment key={node.id}>
              {/* Node */}
              <div style={{
                flexShrink: 0,
                width: 110,
                background: isActive ? 'rgba(34,197,94,0.08)' : isDone ? 'rgba(34,197,94,0.04)' : '#111113',
                border: `1px solid ${isActive ? '#22c55e' : isDone ? 'rgba(34,197,94,0.3)' : '#27272a'}`,
                padding: '10px 10px',
                transition: 'all 0.3s',
                animation: isActive ? 'lg-pulse 1s ease infinite' : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Node number */}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: isActive ? '#22c55e' : isDone ? '#22c55e66' : '#27272a', letterSpacing: '0.1em', marginBottom: 6 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>

                {/* Status indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: isActive ? '#22c55e' : isDone ? '#22c55e' : isPending ? '#3f3f46' : '#27272a',
                    flexShrink: 0,
                    boxShadow: isActive ? '0 0 6px #22c55e' : 'none',
                  }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.08em', color: LANG_COLORS[node.lang] || '#52525b' }}>{node.lang}</span>
                </div>

                {/* Label */}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, color: isActive ? '#f4f4f5' : isDone ? '#a1a1aa' : '#52525b', letterSpacing: '0.05em', lineHeight: 1.3, marginBottom: 4 }}>
                  {node.label}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: isActive ? '#52525b' : '#27272a', letterSpacing: '0.04em' }}>
                  {node.sub}
                </div>

                {/* Timing */}
                <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: isDone || isActive ? '#22c55e' : '#27272a', letterSpacing: '0.06em' }}>
                  {node.time}
                </div>

                {/* Done checkmark */}
                {isDone && (
                  <div style={{ position: 'absolute', top: 6, right: 6, fontFamily: 'var(--font-mono)', fontSize: 9, color: '#22c55e' }}>✓</div>
                )}

                {/* Active scanline */}
                {isActive && (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 0%, rgba(34,197,94,0.05) 50%, transparent 100%)', backgroundSize: '100% 40px', animation: 'lg-scan 1s linear infinite', pointerEvents: 'none' }} />
                )}
              </div>

              {/* Arrow connector */}
              {i < NODES.length - 1 && (
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 2px' }}>
                  <div style={{ width: 16, height: 1, background: isDone ? '#22c55e44' : '#27272a' }} />
                  <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `4px solid ${isDone ? '#22c55e44' : '#27272a'}` }} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 2, marginTop: 12 }}>
        {[
          { label: 'TOTAL NODES', value: '8' },
          { label: 'END-TO-END', value: '~40S' },
          { label: 'SPEEDUP', value: '97×' },
          { label: 'BASELINE', value: '~65MIN' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111113', padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.12em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 20, color: '#f4f4f5' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Performance badge */}
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#22c55e', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', padding: '2px 8px', letterSpacing: '0.1em' }}>
          [LATENCY: &lt;10MS OVERHEAD | ENGINE: LANGGRAPH + PYTHON]
        </span>
      </div>
    </div>
  );
}