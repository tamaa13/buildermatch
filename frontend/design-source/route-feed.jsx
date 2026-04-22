// Match Feed — swipe interface
const Feed = ({ go, me, candidates, onDecision, history }) => {
  const [idx, setIdx] = useState(0);
  const [swipe, setSwipe] = useState(null); // 'pass' | 'match' | null
  const [dragX, setDragX] = useState(0);
  const startX = useRef(0);
  const dragging = useRef(false);

  const current = candidates[idx];
  const hasMore = idx < candidates.length;

  const decide = (verdict) => {
    if (!current) return;
    setSwipe(verdict);
    setTimeout(() => {
      onDecision(current, verdict);
      setIdx(i => i + 1);
      setSwipe(null);
      setDragX(0);
    }, 420);
  };

  // Keyboard
  useEffect(() => {
    const h = (e) => {
      if (!hasMore) return;
      if (e.key === 'ArrowLeft') decide('pass');
      if (e.key === 'ArrowRight') decide('match');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const onMouseDown = (e) => {
    dragging.current = true;
    startX.current = e.clientX;
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    setDragX(e.clientX - startX.current);
  };
  const onMouseUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (dragX > 120) decide('match');
    else if (dragX < -120) decide('pass');
    else setDragX(0);
  };

  const rot = dragX * 0.04;
  const tx = swipe === 'pass' ? -800 : swipe === 'match' ? 800 : dragX;
  const rotation = swipe === 'pass' ? -18 : swipe === 'match' ? 18 : rot;

  return (
    <div className="rise" style={{ display: 'grid', gridTemplateColumns: '240px 1fr 260px', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
      {/* Left sidebar — swipe history */}
      <aside style={{ borderRight: '1px solid var(--rule)', padding: '28px 24px', overflowY: 'auto' }}>
        <div className="eyebrow" style={{ marginBottom: 20 }}>§ Your queue</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {candidates.map((c, i) => {
            const h = history.find(x => x.id === c.id);
            const isCurrent = i === idx;
            return (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 8px',
                borderLeft: isCurrent ? '2px solid var(--ink)' : '2px solid transparent',
                background: isCurrent ? 'var(--paper-2)' : 'transparent',
                opacity: h ? 0.45 : 1
              }}>
                <span className="mono num" style={{ fontSize: 10, color: 'var(--ink-4)', width: 18 }}>{String(i + 1).padStart(2, '0')}</span>
                <span className="mono" style={{ fontSize: 11.5, flex: 1, color: 'var(--ink-2)' }}>{c.ens}</span>
                {h && (
                  <span style={{ color: h.verdict === 'match' ? 'var(--terracotta)' : 'var(--ink-4)' }}>
                    <Icon name={h.verdict === 'match' ? 'heart' : 'x'} size={10} />
                  </span>
                )}
                {!h && <span className="mono num" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{c.compatibility}</span>}
              </div>
            );
          })}
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 24, letterSpacing: '0.1em', textTransform: 'uppercase', paddingTop: 16, borderTop: '1px solid var(--rule)' }}>
          ← pass · → match · space: skip
        </div>
      </aside>

      {/* Main — card */}
      <main
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          padding: '28px 40px 32px',
          display: 'flex', flexDirection: 'column',
          position: 'relative',
          background: swipe === 'match' ? 'var(--terracotta-soft)' : 'var(--paper)',
          transition: 'background 0.3s'
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <div className="eyebrow">§ Candidate {String(idx + 1).padStart(2, '0')} of {candidates.length}</div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Filters · DeFi · Full-time · {me.timezone} ± 3
          </div>
        </div>

        {/* Card */}
        {hasMore && current ? (
          <div
            onMouseDown={onMouseDown}
            style={{
              flex: 1,
              border: '1px solid var(--ink)',
              background: 'var(--paper)',
              position: 'relative',
              transform: `translateX(${tx}px) rotate(${rotation}deg)`,
              transition: dragging.current ? 'none' : 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: dragging.current ? 'grabbing' : 'grab',
              display: 'grid',
              gridTemplateColumns: '1.1fr 1fr',
              userSelect: 'none'
            }}
          >
            {/* Left half of card */}
            <div style={{ padding: '32px 36px', borderRight: '1px solid var(--rule)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                <Avatar label={current.avatar} size={52} />
                <div>
                  <div className="serif" style={{ fontSize: 32, lineHeight: 1 }}>{current.ens}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
                    {current.address} · {current.location} · {current.timezone}
                  </div>
                </div>
              </div>

              <div className="serif" style={{ fontSize: 20, fontStyle: 'italic', color: 'var(--ink-2)', marginBottom: 6 }}>
                {current.role}
              </div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 28 }}>
                {current.tenure} onchain · {current.commitment} · looking for {current.lookingFor.toLowerCase()}
              </div>

              {/* Narrative */}
              <div className="label" style={{ marginBottom: 10 }}>Narrative</div>
              <p className="serif" style={{ fontSize: 17, lineHeight: 1.4, color: 'var(--ink)', marginBottom: 28, flex: 1 }}>
                {current.narrative}
              </p>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {current.skills.slice(0, 5).map(s => <span key={s} className="chip">{s}</span>)}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {current.domains.map(d => <span key={d} className="chip" style={{ borderColor: 'var(--ink-2)', color: 'var(--ink)' }}>{d}</span>)}
              </div>
            </div>

            {/* Right half — compatibility */}
            <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column' }}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>Compatibility</div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                <span className="serif num" style={{ fontSize: 120, lineHeight: 0.9, letterSpacing: '-0.03em' }}>{current.compatibility}</span>
                <span className="serif" style={{ fontSize: 32, color: 'var(--ink-3)', fontStyle: 'italic' }}>/ 100</span>
              </div>

              <DottedScore score={current.compatibility} total={30} />

              <div style={{ marginTop: 32 }}>
                <div className="label" style={{ marginBottom: 10 }}>Why this match</div>
                <p className="serif" style={{ fontSize: 17, fontStyle: 'italic', lineHeight: 1.45, color: 'var(--ink-2)', marginBottom: 24 }}>
                  "{current.whyMatch || 'A quiet, strong profile that fits your filters.'}"
                </p>
              </div>

              <div className="label" style={{ marginBottom: 4 }}>Complementarity</div>
              <div>
                {(current.complementarity || []).map((c, i) => (
                  <CompatBar key={i} {...c} />
                ))}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
                  <Icon name="link" size={11} /> &nbsp;{current.stats.deployed} deployed · {current.stats.commits.toLocaleString()} commits
                </span>
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
                  <span className="link-underline">read full CV</span>
                </span>
              </div>
            </div>

            {/* Swipe overlays */}
            {dragX < -40 && (
              <div style={{ position: 'absolute', top: 32, left: 36, border: '2px solid var(--ink)', padding: '6px 14px', transform: 'rotate(-8deg)' }}>
                <span className="mono" style={{ fontSize: 14, letterSpacing: '0.2em', fontWeight: 500 }}>PASS</span>
              </div>
            )}
            {dragX > 40 && (
              <div style={{ position: 'absolute', top: 32, right: 36, border: '2px solid var(--terracotta)', color: 'var(--terracotta)', padding: '6px 14px', transform: 'rotate(8deg)' }}>
                <span className="mono" style={{ fontSize: 14, letterSpacing: '0.2em', fontWeight: 500 }}>MATCH</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
            <div className="serif" style={{ fontSize: 36, fontStyle: 'italic', color: 'var(--ink-2)' }}>
              That's everyone for now.
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              {history.filter(h => h.verdict === 'match').length} matched · {history.filter(h => h.verdict === 'pass').length} passed · new candidates daily
            </div>
            <button onClick={() => go('match')} className="btn" style={{ marginTop: 12 }}>
              <span>See your mutual matches</span>
              <Icon name="arrow" />
            </button>
          </div>
        )}

        {/* Action row */}
        {hasMore && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
            <button
              onClick={() => decide('pass')}
              className="btn btn-ghost"
              style={{ justifyContent: 'center', padding: '18px 20px', fontSize: 13 }}
            >
              <Icon name="x" size={16} />
              <span>Pass</span>
              <span className="num" style={{ color: 'var(--ink-4)', marginLeft: 8 }}>←</span>
            </button>
            <button
              onClick={() => decide('match')}
              className="btn"
              style={{ justifyContent: 'center', padding: '18px 20px', background: 'var(--terracotta)', borderColor: 'var(--terracotta)', fontSize: 13 }}
            >
              <Icon name="heart" size={16} />
              <span>Match</span>
              <span className="num" style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>→</span>
            </button>
          </div>
        )}
      </main>

      {/* Right sidebar — session stats & filters */}
      <aside style={{ borderLeft: '1px solid var(--rule)', padding: '28px 24px', overflowY: 'auto' }}>
        <div className="eyebrow" style={{ marginBottom: 20 }}>§ This session</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: 32, borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
          <div style={{ padding: '16px 12px 16px 0', borderRight: '1px solid var(--rule)' }}>
            <div className="eyebrow" style={{ marginBottom: 6, fontSize: 9 }}>Matched</div>
            <div className="serif num" style={{ fontSize: 32, color: 'var(--terracotta)' }}>{history.filter(h => h.verdict === 'match').length}</div>
          </div>
          <div style={{ padding: '16px 0 16px 12px' }}>
            <div className="eyebrow" style={{ marginBottom: 6, fontSize: 9 }}>Passed</div>
            <div className="serif num" style={{ fontSize: 32, color: 'var(--ink-3)' }}>{history.filter(h => h.verdict === 'pass').length}</div>
          </div>
        </div>

        <div className="eyebrow" style={{ marginBottom: 14 }}>§ Active filters</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {[
            ['Domain', 'DeFi · Infra · MEV'],
            ['Commitment', 'Full-time'],
            ['Timezone', 'UTC ± 3'],
            ['Role', 'Any complementary']
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 11, paddingBottom: 8, borderBottom: '1px solid var(--rule)' }}>
              <span style={{ color: 'var(--ink-3)' }}>{k}</span>
              <span style={{ color: 'var(--ink)' }}>{v}</span>
            </div>
          ))}
        </div>

        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}>
          Adjust filters
        </button>

        <div style={{ marginTop: 40 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>§ Note</div>
          <p className="serif" style={{ fontSize: 15, lineHeight: 1.4, color: 'var(--ink-2)', fontStyle: 'italic' }}>
            Compatibility scores are cached at 4am UTC and use onchain signal only. No Twitter, no LinkedIn.
          </p>
        </div>
      </aside>
    </div>
  );
};

window.Feed = Feed;
