// Profile / Onchain CV
const Profile = ({ go, me }) => {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rise" style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 48px 120px' }}>
      {/* Masthead breadcrumb */}
      <div className="hairline-b" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 16px', fontSize: 10.5 }}>
        <span className="mono" style={{ letterSpacing: '0.14em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>§ Onchain CV · auto-generated 6m ago</span>
        <span className="mono" style={{ letterSpacing: '0.14em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>builder.match/paloma.eth</span>
      </div>

      {/* Header */}
      <header style={{ padding: '56px 0 40px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'end' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 20 }}>Profile Nº {me.address.slice(2, 6).toUpperCase()}</div>
          <h1 className="display" style={{ fontSize: 'clamp(56px, 7vw, 96px)', marginBottom: 16 }}>
            {me.ens}
          </h1>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, flexWrap: 'wrap' }}>
            <span className="serif" style={{ fontSize: 24, fontStyle: 'italic', color: 'var(--ink-2)' }}>{me.role}</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>· {me.tenure} onchain</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>· {me.address}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 260 }}>
          <button onClick={() => go('feed')} className="btn" style={{ justifyContent: 'space-between' }}>
            <span>Find my match</span>
            <Icon name="arrow" size={14} />
          </button>
          <button onClick={copyLink} className="btn btn-ghost" style={{ justifyContent: 'space-between' }}>
            <span>{copied ? 'Link copied' : 'Share my CV'}</span>
            <Icon name={copied ? 'check' : 'share'} size={14} />
          </button>
        </div>
      </header>

      {/* Three-column masthead info */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: 64,
        borderTop: '1px solid var(--ink)',
        paddingTop: 32
      }}>
        {/* Left column: meta */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <MetaBlock label="Location" value={me.location} suffix={me.timezone} />
          <MetaBlock label="Commitment" value={me.commitment} />
          <MetaBlock label="Looking for" value={me.lookingFor} />

          <div>
            <div className="label" style={{ marginBottom: 12 }}>Skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {me.skills.map(s => <span key={s} className="chip">{s}</span>)}
            </div>
          </div>

          <div>
            <div className="label" style={{ marginBottom: 12 }}>Domains</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {me.domains.map(d => <span key={d} className="chip" style={{ borderColor: 'var(--ink-2)', color: 'var(--ink)' }}>{d}</span>)}
            </div>
          </div>

          <div style={{ paddingTop: 24, borderTop: '1px solid var(--rule)' }}>
            <div className="label" style={{ marginBottom: 12 }}>Identity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--mono)', fontSize: 11.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-3)' }}>ENS</span>
                <span>{me.ens}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-3)' }}>Address</span>
                <span>{me.address}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-3)' }}>Farcaster</span>
                <span>@paloma</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-3)' }}>GitHub</span>
                <span>paloma-f</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right column: narrative + stats */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 20 }}>— The Narrative · ai-composed from onchain signal</div>
          <p className="serif" style={{ fontSize: 28, lineHeight: 1.35, color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: 32 }}>
            {me.narrative}
          </p>

          <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.04em', marginBottom: 40 }}>
            Revised twice · last edit 6m ago · <span className="link-underline">edit narrative</span>
          </div>

          {/* Stats grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)',
            padding: '24px 0'
          }}>
            {[
              ['Deployed', me.stats.deployed],
              ['DAOs active', me.stats.daos],
              ['Commits', me.stats.commits.toLocaleString()],
              ['Audits', me.stats.audits]
            ].map(([k, v], i) => (
              <div key={k} style={{ padding: '0 20px 0 0', borderRight: i < 3 ? '1px solid var(--rule)' : 'none', paddingLeft: i > 0 ? 20 : 0 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>{k}</div>
                <div className="serif num" style={{ fontSize: 38, lineHeight: 1 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Receipts */}
      <section style={{ paddingTop: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 64, marginBottom: 32 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>§ Receipts</div>
            <div className="serif" style={{ fontSize: 28, lineHeight: 1.2, color: 'var(--ink-2)', fontStyle: 'italic' }}>
              Evidence, not claims.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span className="label">Filter</span>
            {['All', 'Deployed', 'Voted', 'Authored', 'Audited'].map((f, i) => (
              <button key={f} className="mono" style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, letterSpacing: '0.06em',
                color: i === 0 ? 'var(--ink)' : 'var(--ink-3)',
                textTransform: 'uppercase',
                padding: 0,
                borderBottom: i === 0 ? '1px solid var(--ink)' : '1px solid transparent'
              }}>{f}</button>
            ))}
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--ink)',
          borderBottom: '1px solid var(--ink)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '90px 1fr 180px 110px 110px',
            padding: '10px 0',
            gap: 16,
            borderBottom: '1px solid var(--rule)'
          }}>
            {['№ Type', 'Action', 'Venue', 'Date', 'Value'].map((h, i) => (
              <span key={h} className="mono" style={{
                fontSize: 10, color: 'var(--ink-4)',
                letterSpacing: '0.14em', textTransform: 'uppercase',
                textAlign: i >= 3 ? 'right' : 'left'
              }}>{h}</span>
            ))}
          </div>
          {me.receipts.map((r, i) => (
            <DataRow key={i} idx={i + 1} {...r} />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
            Showing 4 of 41 · <span className="link-underline">view all onchain history</span>
          </span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
            Last indexed · block 22,147,329
          </span>
        </div>
      </section>
    </div>
  );
};

const MetaBlock = ({ label, value, suffix }) => (
  <div>
    <div className="label" style={{ marginBottom: 8 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span className="serif" style={{ fontSize: 22 }}>{value}</span>
      {suffix && <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{suffix}</span>}
    </div>
  </div>
);

window.Profile = Profile;
