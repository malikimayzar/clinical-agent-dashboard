import React from 'react';
import LangGraphVisualizer from '../components/LangGraphVisualizer';
import KBGrowthChart from '../components/KBGrowthChart';
import APILatencyBadge from '../components/APILatencyBadge';

export default function System() {
  return (
    <div style={{ padding: '20px 16px', maxWidth: 1200, background: '#09090b', minHeight: '100vh' }}>
      <style>{`@keyframes ca-fadein{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}`}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #1c1c1e', paddingBottom: 14, marginBottom: 24 }}>
        <div style={{
          fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif",
          fontSize: 'clamp(40px, 10vw, 64px)',
          letterSpacing: '0.04em', lineHeight: 1, color: '#f4f4f5',
        }}>SYSTEM</div>
        <div style={{
          fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif",
          fontSize: 'clamp(40px, 10vw, 64px)',
          letterSpacing: '0.04em', lineHeight: 1, color: '#ef4444',
        }}>INTERNALS</div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: '#71717a', marginTop: 10, letterSpacing: '0.15em',
        }}>
          PIPELINE ARCHITECTURE · KNOWLEDGE BASE · API DIAGNOSTICS
        </div>
      </div>

      {/* LangGraph — full width */}
      <div style={{ marginBottom: 2, animation: 'ca-fadein 0.3s ease both' }}>
        <LangGraphVisualizer />
      </div>

      {/* KB Growth — full width on mobile, 2 col on desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
        gap: 2,
        marginBottom: 2,
        animation: 'ca-fadein 0.3s 0.1s ease both',
      }}>
        <KBGrowthChart />
        <APILatencyBadge />
      </div>
    </div>
  );
}