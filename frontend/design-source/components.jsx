// Shared components and icons
const { useState, useEffect, useRef, useMemo } = React;

// ——— Tiny icon set (stroke 1.25px, editorial feel) ———
const Icon = ({ name, size = 14 }) => {
  const s = size;
  const stroke = { stroke: 'currentColor', strokeWidth: 1.25, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    arrow: <path {...stroke} d="M4 10h12M11 5l5 5-5 5" />,
    check: <path {...stroke} d="M4 10l4 4 8-10" />,
    x: <path {...stroke} d="M5 5l10 10M15 5L5 15" />,
    heart: <path {...stroke} d="M10 16s-6-4-6-8.5A3.5 3.5 0 0110 5a3.5 3.5 0 016 2.5C16 12 10 16 10 16z" />,
    link: <path {...stroke} d="M9 11a3 3 0 004 0l3-3a3 3 0 10-4-4l-1 1M11 9a3 3 0 00-4 0l-3 3a3 3 0 104 4l1-1" />,
    share: <path {...stroke} d="M5 10v5a1 1 0 001 1h8a1 1 0 001-1v-5M10 3v10M6 7l4-4 4 4" />,
    dot: <circle cx="10" cy="10" r="2" fill="currentColor" />,
    plus: <path {...stroke} d="M10 4v12M4 10h12" />,
    clock: <g {...stroke}><circle cx="10" cy="10" r="6.5" /><path d="M10 7v3l2 1.5" /></g>,
    globe: <g {...stroke}><circle cx="10" cy="10" r="6.5" /><path d="M3.5 10h13M10 3.5c2 2 2 11 0 13M10 3.5c-2 2-2 11 0 13" /></g>,
    pin: <g {...stroke}><path d="M10 17s5-4 5-9a5 5 0 10-10 0c0 5 5 9 5 9z" /><circle cx="10" cy="8" r="1.5" /></g>,
    wallet: <g {...stroke}><rect x="3" y="6" width="14" height="10" rx="1" /><path d="M3 9h14M13 12h1" /></g>,
    spark: <path {...stroke} d="M10 3v4M10 13v4M3 10h4M13 10h4M5 5l2.5 2.5M12.5 12.5L15 15M5 15l2.5-2.5M12.5 7.5L15 5" />
  };
  return <svg width={s} height={s} viewBox="0 0 20 20" style={{ display: 'inline-block', verticalAlign: 'middle' }}>{paths[name]}</svg>;
};

// ——— Dotted ticks for scores ———
const DottedScore = ({ score, total = 20 }) => {
  const filled = Math.round((score / 100) * total);
  return (
    <div className="dotted-marks" aria-label={`${score} out of 100`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={i < filled ? '' : 'off'} />
      ))}
    </div>
  );
};

// ——— Compat bar (two-tone) ———
const CompatBar = ({ left, right, score }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--rule)' }}>
    <div style={{ flex: '0 0 38%', display: 'flex', alignItems: 'baseline', gap: 8, fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-2)' }}>
      <span>{left}</span>
      <span style={{ color: 'var(--ink-4)' }}>×</span>
      <span>{right}</span>
    </div>
    <div style={{ flex: 1, height: 2, background: 'var(--rule)', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${score}%`, background: 'var(--ink)' }} />
    </div>
    <div className="mono num" style={{ flex: '0 0 auto', fontSize: 12, fontWeight: 500, minWidth: 32, textAlign: 'right' }}>{score}</div>
  </div>
);

// ——— Nav bar ———
const Nav = ({ route, go, matched }) => {
  const items = [
    { k: 'landing', label: 'Home' },
    { k: 'profile', label: 'My CV' },
    { k: 'feed', label: 'Feed' },
    { k: 'match', label: 'Matches', badge: matched.length }
  ];
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 48px', borderBottom: '1px solid var(--rule)',
      position: 'sticky', top: 0, background: 'var(--paper)', zIndex: 50, backdropFilter: 'blur(6px)'
    }}>
      <button onClick={() => go('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: 10, padding: 0 }}>
        <span className="serif" style={{ fontSize: 22, letterSpacing: '-0.01em' }}>BuilderMatch</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.1em' }}>/ ISSUE Nº 04</span>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {items.map(it => (
          <button
            key={it.k}
            onClick={() => go(it.k)}
            className="mono"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 14px',
              fontSize: 12, letterSpacing: '0.06em',
              color: route === it.k ? 'var(--ink)' : 'var(--ink-3)',
              textTransform: 'uppercase',
              position: 'relative'
            }}
          >
            {it.label}
            {it.badge > 0 && <sup className="num" style={{ marginLeft: 4, fontSize: 9, color: 'var(--terracotta)' }}>{it.badge}</sup>}
            {route === it.k && <span style={{ position: 'absolute', bottom: -21, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, background: 'var(--ink)', borderRadius: '50%' }} />}
          </button>
        ))}
        <div style={{ width: 1, height: 20, background: 'var(--rule)', margin: '0 12px' }} />
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--moss)' }} />
          paloma.eth
        </div>
      </div>
    </nav>
  );
};

// ——— Avatar block (monogram + stripes) ———
const Avatar = ({ label, size = 56, ens }) => (
  <div className="placeholder-avatar" style={{
    width: size, height: size,
    fontSize: size * 0.36,
    position: 'relative',
    flexShrink: 0
  }}>
    <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: 'repeating-linear-gradient(-45deg, transparent 0, transparent 3px, rgba(26,23,20,0.05) 3px, rgba(26,23,20,0.05) 4px)'
    }} />
  </div>
);

// ——— Data row (for receipts) ———
const DataRow = ({ type, name, venue, date, value, idx }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '90px 1fr 180px 110px 110px',
    alignItems: 'baseline',
    padding: '14px 0',
    borderBottom: '1px solid var(--rule)',
    gap: 16
  }}>
    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
      <span className="num" style={{ marginRight: 8 }}>{String(idx).padStart(2, '0')}</span>{type}
    </div>
    <div className="serif" style={{ fontSize: 17 }}>{name}</div>
    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{venue}</div>
    <div className="mono num" style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'right' }}>{date}</div>
    <div className="mono num" style={{ fontSize: 11, color: 'var(--ink)', textAlign: 'right' }}>{value}</div>
  </div>
);

Object.assign(window, { Icon, DottedScore, CompatBar, Nav, Avatar, DataRow });
