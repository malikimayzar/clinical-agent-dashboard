import React from 'react';

export function Spinner() {
  return (
    <div style={{
      width: 20, height: 20,
      border: '1.5px solid rgba(255,255,255,0.1)',
      borderTop: '1.5px solid var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block'
    }} />
  );
}

export function SeverityPill({ severity }) {
  const map = {
    critical: { bg: 'var(--red-bg)', color: 'var(--red)', label: 'critical' },
    major:    { bg: 'var(--amber-bg)', color: 'var(--amber)', label: 'major' },
    minor:    { bg: 'var(--blue-bg)', color: 'var(--blue)', label: 'minor' },
  };
  const s = map[severity] || { bg: 'rgba(255,255,255,0.05)', color: 'var(--text2)', label: severity || '—' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontFamily: 'var(--font-mono)',
      padding: '2px 8px', borderRadius: 999,
      border: `1px solid ${s.color}22`,
      letterSpacing: '0.04em', fontWeight: 500,
      whiteSpace: 'nowrap'
    }}>{s.label}</span>
  );
}

export function StatusPill({ status }) {
  const map = {
    CONFLICT:  { bg: 'var(--red-bg)', color: 'var(--red)' },
    CONFIRMED: { bg: 'var(--green-bg)', color: 'var(--green)' },
    NEW:       { bg: 'var(--blue-bg)', color: 'var(--blue)' },
    UNCERTAIN: { bg: 'var(--amber-bg)', color: 'var(--amber)' },
    success:   { bg: 'var(--green-bg)', color: 'var(--green)' },
    failed:    { bg: 'var(--red-bg)', color: 'var(--red)' },
    running:   { bg: 'var(--amber-bg)', color: 'var(--amber)' },
  };
  const s = map[status] || { bg: 'rgba(255,255,255,0.05)', color: 'var(--text2)' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontFamily: 'var(--font-mono)',
      padding: '2px 8px', borderRadius: 999,
      border: `1px solid ${s.color}22`,
      letterSpacing: '0.04em', fontWeight: 500,
      whiteSpace: 'nowrap'
    }}>{(status || '—').toLowerCase()}</span>
  );
}

export function MetricCard({ label, value, sub, accent, className }) {
  return (
    <div className={className} style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.1rem 1.25rem',
    }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 300, fontFamily: 'var(--font-display)', color: accent || 'var(--text)', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export function Card({ children, style, className }) {
  return (
    <div className={className} style={{
      background: 'var(--bg1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      ...style
    }}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: '1.25rem' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, fontWeight: 400, color: 'var(--text)' }}>{title}</h2>
      {count != null && <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>{count}</span>}
    </div>
  );
}

export function EmptyState({ msg }) {
  return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
      {msg || 'no data'}
    </div>
  );
}

export function ErrorState({ msg }) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
      {msg || 'error loading data'}
    </div>
  );
}

export function pct(v) {
  if (v == null) return '—';
  return (v * 100).toFixed(1) + '%';
}

export function shortDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function shortDatetime(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function truncate(s, n = 80) {
  if (!s) return '—';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export function timeAgo(s) {
  if (!s) return '—';
  const diff = Date.now() - new Date(s).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (h > 24) return Math.floor(h / 24) + 'd ago';
  if (h > 0) return h + 'h ago';
  if (m > 0) return m + 'm ago';
  return 'just now';
}