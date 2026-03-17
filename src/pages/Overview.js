import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAPI } from '../api';
import { MetricCard, Card, SectionHeader, Spinner, ErrorState, pct, shortDate, timeAgo, SeverityPill } from '../components/UI';

const COLORS = { critical: '#ff4d4d', major: '#f5a623', minor: '#4d9fff' };

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, padding: '8px 12px', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
      <div style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

export default function Overview() {
  const { data: statsData, loading: sL, error: sE } = useAPI('/stats');
  const { data: runsData, loading: rL } = useAPI('/runs?limit=14');
  const { data: conflictsData, loading: cL } = useAPI('/conflicts?limit=5');

  const stats = statsData?.stats || {};
  const runs = (runsData?.runs || []).slice().reverse();
  const conflicts = conflictsData?.conflicts || [];

  const sevCount = conflicts.reduce((acc, c) => {
    acc[c.severity] = (acc[c.severity] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(sevCount).map(([k, v]) => ({ name: k, value: v }));

  return (
    <div style={{ padding: '2rem', maxWidth: 1100 }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--accent)',
            animation: 'pulse 2s ease infinite',
            boxShadow: '0 0 8px var(--accent)'
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '0.1em' }}>LIVE · runs daily 02:00 UTC</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 38, fontWeight: 400, color: 'var(--text)', lineHeight: 1.1 }}>
          Pipeline Overview
        </h1>
        {stats.last_run && (
          <p style={{ color: 'var(--text3)', fontSize: 13, fontFamily: 'var(--font-mono)', marginTop: 6 }}>
            last run {timeAgo(stats.last_run)} · {shortDate(stats.last_run)}
          </p>
        )}
      </div>

      {/* Metrics */}
      {sL ? <div style={{ marginBottom: '2rem' }}><Spinner /></div> :
       sE ? <ErrorState msg={sE} /> : (
        <div className="fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, marginBottom: '2rem' }}>
          <MetricCard label="Total Runs" value={stats.total_runs ?? '—'} sub="pipeline executions" />
          <MetricCard label="Claims Extracted" value={stats.total_claims?.toLocaleString() ?? '—'} sub="from ArXiv papers" />
          <MetricCard label="Conflicts Found" value={stats.total_conflicts ?? '—'} accent="var(--red)" sub={`${stats.critical_conflicts || 0} critical`} />
          <MetricCard label="Avg Faithfulness" value={pct(stats.avg_faithfulness)} accent="var(--accent)" sub="sentence-transformers" />
        </div>
      )}

      {/* Charts row */}
      <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: '2rem' }}>
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>Pipeline runs — last 14</div>
          {rL ? <Spinner /> : (
            <>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: '#4dff9f' }}>▪ papers</span>
                <span style={{ color: 'var(--blue)' }}>▪ claims</span>
                <span style={{ color: 'var(--red)' }}>▪ conflicts</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={runs} barGap={2} barCategoryGap="30%">
                  <XAxis dataKey="started_at" tickFormatter={shortDate} tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="papers_processed" name="papers" fill="#4dff9f" radius={[2,2,0,0]} />
                  <Bar dataKey="claims_extracted" name="claims" fill="#4d9fff" radius={[2,2,0,0]} />
                  <Bar dataKey="conflicts_found" name="conflicts" fill="#ff4d4d" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>Conflict severity</div>
          {cL ? <Spinner /> : pieData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <PieChart width={140} height={140}>
                <Pie data={pieData} cx={65} cy={65} innerRadius={45} outerRadius={65} dataKey="value" strokeWidth={0}>
                  {pieData.map((e, i) => <Cell key={i} fill={COLORS[e.name] || '#555'} />)}
                </Pie>
              </PieChart>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                {pieData.map(e => (
                  <div key={e.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[e.name] || '#555', display: 'inline-block' }} />
                      <span style={{ color: 'var(--text2)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{e.name}</span>
                    </div>
                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>{e.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--font-mono)', textAlign: 'center', paddingTop: 40 }}>no conflict data</div>}
        </Card>
      </div>

      {/* Recent conflicts */}
      <div className="fade-up-3">
        <SectionHeader title="Recent conflicts" count={conflictsData?.count} />
        <Card>
          {cL ? <div style={{ padding: '2rem' }}><Spinner /></div> : conflicts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>no conflicts found</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['claim', 'severity', 'confidence', 'faithfulness', 'date'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {conflicts.map((c, i) => (
                  <tr key={c.claim_id} style={{ borderBottom: i < conflicts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '10px 14px', color: 'var(--text2)', maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.text || '—'}</td>
                    <td style={{ padding: '10px 14px' }}><SeverityPill severity={c.severity} /></td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text2)' }}>{c.confidence != null ? (c.confidence * 100).toFixed(0) + '%' : '—'}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{pct(c.faithfulness_score)}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{shortDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}