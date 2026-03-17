import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAPI } from '../api';
import { MetricCard, SectionTitle, Spinner, ErrorState, EmptyState, SeverityPill, StatusBadge, pct, shortDate, shortDatetime, timeAgo, truncate } from '../components/UI';

function BrutalTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--black)', border: '1px solid var(--border3)', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
      <div style={{ color: 'var(--white3)', marginBottom: 4, letterSpacing: '0.08em' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, letterSpacing: '0.05em' }}>{p.name.toUpperCase()}: {p.value}</div>
      ))}
    </div>
  );
}

export default function Overview() {
  const { data: statsData, loading: sL, error: sE } = useAPI('/stats');
  const { data: runsData, loading: rL } = useAPI('/runs?limit=14');
  const { data: conflictsData, loading: cL } = useAPI('/conflicts?limit=6');

  const stats = statsData?.stats || {};
  const runs = (runsData?.runs || []).slice().reverse();
  const conflicts = conflictsData?.conflicts || [];

  return (
    <div style={{ padding: '2.5rem', maxWidth: 1200 }}>

      {/* Hero header */}
      <div className="fade-in" style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 10, height: 10,
            background: 'var(--red)',
            borderRadius: '50%',
            animation: 'pulse-red 2s ease infinite',
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--white3)', letterSpacing: '0.2em' }}>
            LIVE SYSTEM · 02:00 UTC DAILY
          </span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 72,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          textTransform: 'uppercase',
          lineHeight: 0.9,
          color: 'var(--white)',
        }}>
          Pipeline<br />
          <span style={{ color: 'var(--red)', WebkitTextStroke: '0px' }}>Overview</span>
        </h1>
        {stats.last_run && (
          <div style={{ marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--white3)', letterSpacing: '0.1em' }}>
            LAST RUN — {shortDatetime(stats.last_run)} · {timeAgo(stats.last_run)}
          </div>
        )}
      </div>

      {/* Metrics */}
      {sL ? <Spinner /> : sE ? <ErrorState msg={sE} /> : (
        <div className="fade-in-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 2, marginBottom: '3rem' }}>
          <MetricCard label="Total Runs" value={stats.total_runs ?? '—'} sub="EXECUTIONS" index={1} />
          <MetricCard label="Claims" value={stats.total_claims?.toLocaleString() ?? '—'} sub="EXTRACTED" index={2} />
          <MetricCard label="Conflicts" value={stats.total_conflicts ?? '—'} accent="var(--red)" sub={`${stats.critical_conflicts || 0} CRITICAL`} index={3} />
          <MetricCard label="Faithfulness" value={pct(stats.avg_faithfulness, 0)} accent="#4dff9f" sub="AVG SCORE" index={4} />
        </div>
      )}

      {/* Charts */}
      <div className="fade-in-2" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 2, marginBottom: '3rem' }}>
        {/* Bar chart */}
        <div style={{ background: 'var(--black2)', padding: '1.5rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--white3)', letterSpacing: '0.2em', marginBottom: '1.5rem' }}>
            PIPELINE RUNS / LAST 14
          </div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 16, fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
            <span style={{ color: '#4dff9f' }}>▪ PAPERS</span>
            <span style={{ color: '#4d9fff' }}>▪ CLAIMS</span>
            <span style={{ color: 'var(--red)' }}>▪ CONFLICTS</span>
          </div>
          {rL ? <Spinner /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={runs} barGap={1} barCategoryGap="25%">
                <XAxis dataKey="started_at" tickFormatter={shortDate} tick={{ fontSize: 9, fill: 'var(--white4)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--white4)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip content={<BrutalTooltip />} />
                <Bar dataKey="papers_processed" name="papers" fill="#4dff9f" radius={0} />
                <Bar dataKey="claims_extracted" name="claims" fill="#4d9fff" radius={0} />
                <Bar dataKey="conflicts_found" name="conflicts" fill="#e8000a" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stats sidebar */}
        <div style={{ background: 'var(--black2)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--white3)', letterSpacing: '0.2em', marginBottom: '1.5rem' }}>SYSTEM STATUS</div>
          {[
            { label: 'API', val: 'ONLINE', color: '#4dff9f' },
            { label: 'PIPELINE', val: 'ACTIVE', color: '#4dff9f' },
            { label: 'SCHEDULER', val: '02:00 UTC', color: 'var(--white2)' },
            { label: 'NLI ENGINE', val: 'GROQ', color: 'var(--white2)' },
            { label: 'SIMILARITY', val: 'RUST :8003', color: '#4dff9f' },
            { label: 'KB CHUNKS', val: '3,245', color: 'var(--white2)' },
          ].map((s, i) => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--white3)', letterSpacing: '0.1em' }}>{s.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: s.color, letterSpacing: '0.05em' }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent conflicts table */}
      <div className="fade-in-3">
        <SectionTitle count={conflictsData?.count}>Recent Conflicts</SectionTitle>
        {cL ? <Spinner /> : conflicts.length === 0 ? <EmptyState msg="No conflicts detected" /> : (
          <div style={{ background: 'var(--black2)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 90px', gap: 0, borderBottom: '2px solid var(--white4)', padding: '8px 16px' }}>
              {['CLAIM', 'SEVERITY', 'CONF', 'FAITH', 'DATE'].map(h => (
                <div key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--white4)', letterSpacing: '0.15em' }}>{h}</div>
              ))}
            </div>
            {conflicts.map((c, i) => (
              <div key={c.claim_id} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 80px 80px 90px',
                gap: 0,
                padding: '12px 16px',
                borderBottom: i < conflicts.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--black3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--white2)', paddingRight: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{truncate(c.text, 60)}</div>
                <div><SeverityPill severity={c.severity} /></div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--white3)' }}>{c.confidence != null ? (c.confidence * 100).toFixed(0) + '%' : '—'}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4dff9f' }}>{pct(c.faithfulness_score)}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--white4)' }}>{shortDate(c.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}