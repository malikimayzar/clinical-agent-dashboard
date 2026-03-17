import React, { useState, useEffect, useRef } from 'react';

const KB_PAPERS = [
  { id: 1, title: 'Major Depressive Disorder & SSRIs',       chunks: 280, tier: 1, topic: 'Mental Health',       date: '2024-01' },
  { id: 2, title: 'Alzheimer\'s Disease Subtypes',           chunks: 310, tier: 1, topic: 'Neurology',           date: '2024-02' },
  { id: 3, title: 'Cancer Immunotherapy Trials',             chunks: 290, tier: 1, topic: 'Oncology',            date: '2024-02' },
  { id: 4, title: 'Drug-Drug Interaction Prediction',        chunks: 245, tier: 2, topic: 'Pharmacology',        date: '2024-03' },
  { id: 5, title: 'COVID-19 Treatment Evidence',             chunks: 320, tier: 1, topic: 'Infectious Disease',  date: '2024-03' },
  { id: 6, title: 'Antibiotic Resistance Mechanisms',        chunks: 265, tier: 2, topic: 'Microbiology',        date: '2024-04' },
  { id: 7, title: 'Neural Networks in Diagnostics',          chunks: 198, tier: 2, topic: 'AI in Medicine',      date: '2024-04' },
  { id: 8, title: 'Cardiovascular Risk Biomarkers',          chunks: 275, tier: 1, topic: 'Cardiology',          date: '2024-05' },
  { id: 9, title: 'Gut Microbiome & Mental Health',          chunks: 220, tier: 2, topic: 'Gastroenterology',    date: '2024-05' },
  { id: 10, title: 'CRISPR Gene Therapy Advances',           chunks: 195, tier: 3, topic: 'Genetics',            date: '2024-06' },
  { id: 11, title: 'Chronic Pain Management Protocols',      chunks: 180, tier: 2, topic: 'Pain Medicine',       date: '2024-07' },
  { id: 12, title: 'Pediatric Vaccination Efficacy',         chunks: 167, tier: 1, topic: 'Immunology',          date: '2024-08' },
  { id: 13, title: 'Diabetes Type 2 Lifestyle Interventions',chunks: 155, tier: 2, topic: 'Endocrinology',       date: '2024-09' },
  { id: 14, title: 'Stroke Rehabilitation Outcomes',         chunks: 145, tier: 3, topic: 'Neurology',           date: '2024-10' },
];

const TIER_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#eab308' };
const TIER_LABELS = { 1: 'HIGH IMPACT', 2: 'SPECIALIZED', 3: 'EMERGING' };

function getCumulative() {
  let cum = 0;
  return KB_PAPERS.map(p => ({ ...p, cumulative: (cum += p.chunks) }));
}

export default function KBGrowthChart() {
  const data = getCumulative();
  const [hovered, setHovered] = useState(null);
  const [sliderVal, setSliderVal] = useState(data.length);
  const [animating, setAnimating] = useState(false);
  const canvasRef = useRef(null);

  const visible = data.slice(0, sliderVal);
  const total = visible.reduce((s, p) => s + p.chunks, 0);

  const startAnimation = () => {
    setAnimating(true);
    setSliderVal(0);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setSliderVal(i);
      if (i >= data.length) { clearInterval(iv); setAnimating(false); }
    }, 300);
  };

  const maxChunks = data[data.length - 1].cumulative;
  const chartH = 140;
  const chartW = 100;

  return (
    <div style={{ background: '#09090b', border: '1px solid #1c1c1e', padding: 20 }}>
      <style>{`
        @keyframes kb-fadein { from{opacity:0;transform:scaleY(0);}to{opacity:1;transform:scaleY(1);} }
        @keyframes kb-pulse { 0%,100%{opacity:1;}50%{opacity:0.5;} }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.2em', marginBottom: 4 }}>POSTGRESQL + PGVECTOR</div>
          <div style={{ fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontSize: 24, color: '#f4f4f5', letterSpacing: '0.04em' }}>KNOWLEDGE BASE GROWTH</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#52525b', marginTop: 4, letterSpacing: '0.1em' }}>
            {total.toLocaleString()} CHUNKS · {visible.length} PAPERS · VECTOR(768) INDEX
          </div>
        </div>
        <button onClick={startAnimation} disabled={animating} style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em',
          color: animating ? '#3f3f46' : '#22c55e',
          background: animating ? 'transparent' : 'rgba(34,197,94,0.08)',
          border: '1px solid ' + (animating ? '#27272a' : 'rgba(34,197,94,0.3)'),
          padding: '4px 14px', cursor: animating ? 'default' : 'crosshair',
        }}>{animating ? '● BUILDING...' : '▶ REPLAY GROWTH'}</button>
      </div>

      {/* Bar chart */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: chartH, marginBottom: 8, padding: '0 4px' }}>
        {data.map((p, i) => {
          const isVisible = i < sliderVal;
          const heightPct = (p.cumulative / maxChunks) * 100;
          const isHov = hovered === p.id;
          const tc = TIER_COLORS[p.tier];

          return (
            <div key={p.id}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'crosshair', position: 'relative' }}
            >
              {/* Tooltip */}
              {isHov && isVisible && (
                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', background: '#0a0a0c', border: `1px solid ${tc}44`, padding: '8px 10px', whiteSpace: 'nowrap', zIndex: 10, marginBottom: 6, animation: 'kb-fadein 0.15s ease' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#f4f4f5', marginBottom: 3, letterSpacing: '0.05em' }}>{p.title}</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: tc }}>{TIER_LABELS[p.tier]}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#52525b' }}>{p.chunks} CHUNKS</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#3f3f46' }}>{p.cumulative.toLocaleString()} TOTAL</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#52525b', marginTop: 2 }}>{p.topic} · {p.date}</div>
                </div>
              )}

              {/* Bar */}
              <div style={{
                width: '100%',
                height: isVisible ? `${heightPct}%` : '0%',
                background: isHov ? tc : `${tc}66`,
                border: isHov ? `1px solid ${tc}` : '1px solid transparent',
                transition: 'height 0.4s ease, background 0.15s',
                transformOrigin: 'bottom',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {isHov && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.05)' }} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div style={{ display: 'flex', gap: 3, paddingBottom: 12, borderBottom: '1px solid #1c1c1e' }}>
        {data.map((p, i) => (
          <div key={p.id} style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 7, color: i < sliderVal ? '#52525b' : '#1c1c1e', letterSpacing: '0.04em', transition: 'color 0.3s' }}>
            P{p.id}
          </div>
        ))}
      </div>

      {/* Slider */}
      <div style={{ padding: '14px 0 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#52525b', letterSpacing: '0.1em' }}>TIME TRAVEL — PAPER {sliderVal}/{data.length}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#22c55e', letterSpacing: '0.1em' }}>{total.toLocaleString()} CHUNKS INDEXED</span>
        </div>
        <input type="range" min={0} max={data.length} value={sliderVal} onChange={e => setSliderVal(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#22c55e', cursor: 'crosshair' }}
        />
      </div>

      {/* Tier legend + visible papers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.15em', marginBottom: 8 }}>TIER LEGEND</div>
          {[1, 2, 3].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, background: `${TIER_COLORS[t]}66`, border: `1px solid ${TIER_COLORS[t]}` }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: TIER_COLORS[t], letterSpacing: '0.08em' }}>TIER {t} — {TIER_LABELS[t]}</span>
            </div>
          ))}
        </div>
        <div style={{ maxHeight: 80, overflowY: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.15em', marginBottom: 6 }}>INDEXED PAPERS</div>
          {visible.map(p => (
            <div key={p.id} style={{ display: 'flex', gap: 8, marginBottom: 3, animation: 'kb-fadein 0.2s ease' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: TIER_COLORS[p.tier], width: 12, flexShrink: 0 }}>T{p.tier}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#71717a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#3f3f46', flexShrink: 0 }}>{p.chunks}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Performance badge */}
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#818cf8', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)', padding: '2px 8px', letterSpacing: '0.1em' }}>
          [LATENCY: &lt;10MS | ENGINE: POSTGRESQL 16 + PGVECTOR + IVFFLAT INDEX]
        </span>
      </div>
    </div>
  );
}