import React from 'react';

export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2rem 0' }}>
      <div style={{
        width: 16, height: 16,
        border: '2px solid var(--white4)',
        borderTop: '2px solid var(--red)',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite'
      }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--white3)', letterSpacing: '0.1em' }}>LOADING</span>
    </div>
  );
}

export function SeverityPill({ severity }) {
  const map = {
    critical: { bg: 'var(--red)', color: 'var(--white)', label: 'CRITICAL' },
    major:    { bg: 'transparent', color: '#f5a623', label: 'MAJOR', border: '1px solid #f5a623' },
    minor:    { bg: 'transparent', color: 'var(--white3)', label: 'MINOR', border: '1px solid var(--white4)' },
  };
  const s = map[severity] || { bg: 'transparent', color: 'var(--white3)', label: '—', border: '1px solid var(--white4)' };
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      border: s.border || 'none',
      fontSize: 10,
      fontFamily: 'var(--font-mono)',
      padding: '2px 7px',
      letterSpacing: '0.1em',
      fontWeight: 500,
    }}>{s.label}</span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    CONFLICT:  { color: 'var(--red)', label: 'CONFLICT' },
    CONFIRMED: { color: '#4dff9f', label: 'CONFIRMED' },
    NEW:       { color: 'var(--white2)', label: 'NEW' },
    UNCERTAIN: { color: '#f5a623', label: 'UNCERTAIN' },
    success:   { color: '#4dff9f', label: 'SUCCESS' },
    failed:    { color: 'var(--red)', label: 'FAILED' },
    running:   { color: '#f5a623', label: 'RUNNING' },
    done:      { color: '#4dff9f', label: 'DONE' },
  };
  const s = map[status] || { color: 'var(--white3)', label: status?.toUpperCase() || '—' };
  return (
    <span style={{
      color: s.color,
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.12em',
      fontWeight: 500,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

export function MetricCard({ label, value, sub, accent, index = 0 }) {
  return (
    <div className={`fade-in-${index}`} style={{
      background: 'var(--black2)',
      borderTop: `3px solid ${accent || 'var(--white4)'}`,
      padding: '1.25rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 60, height: 60,
        background: accent ? `${accent}08` : 'transparent',
      }} />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--white3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 900, color: accent || 'var(--white)', lineHeight: 0.9, letterSpacing: '-0.02em' }}>{value ?? '—'}</div>
      {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--white3)', marginTop: 10, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );
}

export function SectionTitle({ children, count, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: '1.5rem' }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 36,
        fontWeight: 900,
        color: 'var(--white)',
        letterSpacing: '-0.02em',
        textTransform: 'uppercase',
        lineHeight: 1,
      }}>{children}</h2>
      {count != null && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--white3)', borderLeft: '2px solid var(--white4)', paddingLeft: 12 }}>
          {count} records
        </span>
      )}
    </div>
  );
}

export function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '0' }} />;
}

export function EmptyState({ msg }) {
  return (
    <div style={{ padding: '3rem 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--white4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      / {msg || 'NO DATA FOUND'} /
    </div>
  );
}

export function ErrorState({ msg }) {
  return (
    <div style={{ padding: '2rem 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)', letterSpacing: '0.1em' }}>
      ERR: {msg}
    </div>
  );
}

export function pct(v, dec = 1) {
  if (v == null) return '—';
  return (v * 100).toFixed(dec) + '%';
}

export function shortDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase();
}

export function shortDatetime(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase() + ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(s) {
  if (!s) return '—';
  const diff = Date.now() - new Date(s).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (h > 24) return Math.floor(h / 24) + 'D AGO';
  if (h > 0) return h + 'H AGO';
  if (m > 0) return m + 'M AGO';
  return 'JUST NOW';
}

export function truncate(s, n = 72) {
  if (!s) return '—';
  return s.length > n ? s.slice(0, n) + '…' : s;
}