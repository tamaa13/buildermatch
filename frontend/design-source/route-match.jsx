// Match Detail / Chat
const MatchDetail = ({ go, me, matched, candidates }) => {
  const [selectedId, setSelectedId] = useState(matched[0] || null);
  const [messages, setMessages] = useState(window.CHAT_SEED);
  const [draft, setDraft] = useState("");
  const [icebreakerUsed, setIcebreakerUsed] = useState(false);

  const partner = useMemo(
    () => candidates.find(c => c.id === selectedId),
    [selectedId, candidates]
  );

  const icebreaker = partner ? `I've been following your ${partner.domains[0]} work — especially the ${partner.receipts[0].name.toLowerCase()}. Curious what you're thinking about lately outside of that. Want to talk Tuesday?` : "";

  useEffect(() => {
    setMessages(window.CHAT_SEED);
    setIcebreakerUsed(false);
    setDraft("");
  }, [selectedId]);

  const useIcebreaker = () => {
    setDraft(icebreaker);
    setIcebreakerUsed(true);
  };

  const send = () => {
    if (!draft.trim()) return;
    setMessages(m => [...m, { who: 'you', at: 'now', text: draft.trim() }]);
    setDraft("");
  };

  if (matched.length === 0) {
    return (
      <div className="rise" style={{ maxWidth: 900, margin: '0 auto', padding: '120px 48px', textAlign: 'center' }}>
        <div className="eyebrow" style={{ marginBottom: 24 }}>§ No mutual matches yet</div>
        <h1 className="display" style={{ fontSize: 64, marginBottom: 24 }}>
          <em>Mutual</em> is the whole point.
        </h1>
        <p className="serif" style={{ fontSize: 20, color: 'var(--ink-2)', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.4 }}>
          When someone you swiped on swipes you back, the chat unlocks here. Until then, keep swiping.
        </p>
        <button onClick={() => go('feed')} className="btn">
          <span>Back to the feed</span>
          <Icon name="arrow" />
        </button>
      </div>
    );
  }

  return (
    <div className="rise" style={{ display: 'grid', gridTemplateColumns: '220px 1fr 300px', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
      {/* Left — match list */}
      <aside style={{ borderRight: '1px solid var(--rule)', padding: '28px 0', overflowY: 'auto' }}>
        <div className="eyebrow" style={{ padding: '0 24px 16px' }}>§ Mutual matches · {matched.length}</div>
        {matched.map(mid => {
          const c = candidates.find(x => x.id === mid);
          if (!c) return null;
          const active = selectedId === mid;
          return (
            <button
              key={mid}
              onClick={() => setSelectedId(mid)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 24px', width: '100%',
                background: active ? 'var(--paper-2)' : 'transparent',
                border: 'none',
                borderLeft: active ? '2px solid var(--ink)' : '2px solid transparent',
                cursor: 'pointer', textAlign: 'left'
              }}
            >
              <Avatar label={c.avatar} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="serif" style={{ fontSize: 16, lineHeight: 1.1 }}>{c.ens}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 3, letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.role}
                </div>
              </div>
              <span className="mono num" style={{ fontSize: 11, color: 'var(--terracotta)' }}>{c.compatibility}</span>
            </button>
          );
        })}
      </aside>

      {/* Center — shared profile + chat */}
      <main style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Shared profiles header */}
        <div style={{ padding: '28px 40px 24px', borderBottom: '1px solid var(--rule)' }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>§ Mutual match · unlocked {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'center' }}>
            {/* You */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'right' }}>
                <div className="serif" style={{ fontSize: 22, lineHeight: 1 }}>{me.ens}</div>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 4 }}>{me.role}</div>
              </div>
              <Avatar label={me.avatar} size={44} />
            </div>

            {/* Middle spark */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ color: 'var(--terracotta)' }}><Icon name="spark" size={18} /></div>
              <span className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--terracotta)', textTransform: 'uppercase' }}>{partner.compatibility} / 100</span>
            </div>

            {/* Them */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar label={partner.avatar} size={44} />
              <div>
                <div className="serif" style={{ fontSize: 22, lineHeight: 1 }}>{partner.ens}</div>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 4 }}>{partner.role}</div>
              </div>
            </div>
          </div>

          {/* Shared interests strip */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--rule)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
              <span className="label">Shared ground</span>
              {getShared(me, partner).map(s => (
                <span key={s} style={{
                  fontFamily: 'var(--mono)', fontSize: 11,
                  padding: '3px 8px',
                  background: 'var(--terracotta-soft)', color: 'var(--terracotta)',
                  borderRadius: 999
                }}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Chat thread */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            — chat unlocked —
          </div>

          {messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: m.who === 'you' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: '62%',
                padding: '14px 18px',
                background: m.who === 'you' ? 'var(--ink)' : 'var(--paper-2)',
                color: m.who === 'you' ? 'var(--paper)' : 'var(--ink)',
                borderRadius: 2,
                position: 'relative'
              }}>
                <div className="serif" style={{ fontSize: 16, lineHeight: 1.4 }}>{m.text}</div>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', marginTop: 8, opacity: 0.55, textTransform: 'uppercase' }}>
                  {m.who === 'you' ? 'You' : partner.ens} · {m.at}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div style={{ borderTop: '1px solid var(--rule)', padding: '16px 40px 24px', background: 'var(--paper)' }}>
          {!icebreakerUsed && (
            <div style={{ marginBottom: 14, padding: '12px 14px', border: '1px dashed var(--rule-strong)', display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)', textTransform: 'uppercase', flexShrink: 0 }}>Ai draft</span>
              <span className="serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ink-2)', flex: 1, lineHeight: 1.4 }}>
                "{icebreaker}"
              </span>
              <button onClick={useIcebreaker} className="mono" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--ink)', borderBottom: '1px solid var(--ink)', padding: '0 0 1px', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
                Use this
              </button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, border: '1px solid var(--rule-strong)', padding: '14px 18px' }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={`Write to ${partner.ens}…`}
              style={{ flex: 1, fontSize: 15, fontFamily: 'var(--serif)' }}
            />
            <button onClick={send} className="mono" style={{
              background: 'var(--ink)', color: 'var(--paper)', border: 'none',
              padding: '8px 14px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer'
            }}>
              Send ↵
            </button>
          </div>
        </div>
      </main>

      {/* Right — collaboration NFT & shared data */}
      <aside style={{ borderLeft: '1px solid var(--rule)', padding: '28px 24px', overflowY: 'auto' }}>
        <div className="eyebrow" style={{ marginBottom: 20 }}>§ Collaboration</div>

        {/* NFT card */}
        <div style={{ border: '1px solid var(--ink)', padding: '20px', marginBottom: 28, position: 'relative' }}>
          <div className="placeholder-stripe" style={{
            aspectRatio: '1 / 1',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12
          }}>
            <div className="serif" style={{ fontSize: 52, lineHeight: 1 }}>✦</div>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.14em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
              collab Nº 613
            </div>
          </div>

          <div className="serif" style={{ fontSize: 20, lineHeight: 1.2, marginBottom: 8 }}>
            After 30 days of collaboration, mint a Collaboration NFT.
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 16 }}>
            An onchain receipt that you two worked together. Soulbound, non-transferable — appears on both of your profiles.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 2, background: 'var(--rule)', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '13%', background: 'var(--terracotta)' }} />
            </div>
            <span className="mono num" style={{ fontSize: 11, color: 'var(--ink-2)' }}>4 / 30 d</span>
          </div>

          <button disabled className="btn" style={{
            width: '100%', justifyContent: 'center',
            background: 'var(--paper-2)', color: 'var(--ink-4)',
            borderColor: 'var(--rule-strong)', cursor: 'not-allowed'
          }}>
            <Icon name="clock" size={13} />
            <span>Unlocks in 26 days</span>
          </button>
        </div>

        {/* Notes */}
        <div className="eyebrow" style={{ marginBottom: 12 }}>§ Shared pins</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { n: 'Call · Tuesday 15:00 UTC', icon: 'clock' },
            { n: 'Shared repo (empty)', icon: 'link' },
            { n: 'Kickoff doc · draft', icon: 'plus' }
          ].map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--rule)' : 'none',
              fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-2)'
            }}>
              <span style={{ color: 'var(--ink-3)' }}><Icon name={p.icon} size={12} /></span>
              {p.n}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

function getShared(a, b) {
  const aSet = new Set([...a.skills, ...a.domains]);
  return [...new Set([...b.skills, ...b.domains])].filter(x => aSet.has(x)).slice(0, 5);
}

window.MatchDetail = MatchDetail;
