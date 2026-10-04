import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { BuiltRegion, PathNode } from '../../engine/pathway/types';
import type { ConceptId } from '../../engine/types';
import { useLearner } from '../../state/store';
import { markIntroSeen, markWallsPassed, notePathwayVisit } from '../../state/pathway';
import { PATHWAY } from '../../content/pathway';
import { computeView, journeyStats, reviewMarkers, wallStatus, currentRegionIndex, type NodeState, type PathwayView } from '../../engine/pathway/progress';
import { LEVEL_TYPE_META, ENCOUNTER_META, taskCount } from '../../engine/pathway/build';
import { dueReviews } from '../../engine/planner';
import { masteryInfo } from '../../engine/learner';
import { CONCEPT_BY_ID } from '../../content/concepts';
import { layoutPathway, roadPath, GATE_H, type PlacedNode } from '../../components/pathway/layout';
import { Landmark, Scenery } from '../../components/pathway/art';
import { Mu } from '../../components/mascot/Mu';
import { Icon } from '../../components/ui/Icon';
import { Modal, Ring, Bar, useDialog } from '../../components/ui';
import { Rich } from '../../components/ui/Rich';
import { navigate } from '../../lib/router';
import * as fx from '../../lib/fx';

const P = PATHWAY;

function nodeLabel(n: PathNode) {
  if (n.kind === 'level') return `${n.number} · ${n.title}`;
  if (n.kind === 'mini-boss') return n.name;
  if (n.kind === 'boss') return n.name;
  return n.title;
}

function playRoute(n: PathNode) {
  return `/pathway/play/${n.id}`;
}

/* ---------------- Node tile ---------------- */

function NodeTile({ placed, state, current, offset, stars, review, onOpen }: { placed: PlacedNode; state: NodeState; current: boolean; offset: number; stars: number; review?: ConceptId[]; onOpen: () => void }) {
  const n = placed.node;
  const icon = n.kind === 'level' ? LEVEL_TYPE_META[n.type].icon : n.kind === 'encounter' ? null : null;
  const size = current && n.kind === 'level' ? placed.size + 12 : placed.size;
  const label = nodeLabel(n);
  return (
    <div className={`pw-node-wrap theme-${P.regions[n.regionIndex].spec.theme} kind-${n.kind} state-${state} ${current ? 'is-current' : ''}`} style={{ left: offset + placed.x, top: placed.y }} data-node={n.id}>
      {current && (
        <div className="pw-flag" aria-hidden="true">
          <span>{state === 'in-progress' ? 'CONTINUE' : n.kind === 'level' ? 'START' : 'FIGHT'}</span>
        </div>
      )}
      {current && <div className="pw-mu" aria-hidden="true"><Mu mood="wave" size={46} /></div>}
      <button className={`pw-node kind-${n.kind}`} style={{ width: size, height: size }} onClick={onOpen}
        aria-label={`${label}. ${state === 'locked' ? 'Locked' : state === 'available' ? 'Available' : state === 'in-progress' ? 'In progress' : state === 'mastered' ? 'Mastered' : 'Completed'}${stars ? `, ${stars} of 3 stars` : ''}`}>
        <span className="pw-base" />
        <span className="pw-face">
          {state === 'locked' ? (
            n.kind === 'boss' || n.kind === 'mini-boss' ? <span className="pw-emoji dim">{n.emoji}</span> : <Icon name="lock" size={n.kind === 'encounter' ? 16 : 22} />
          ) : n.kind === 'boss' || n.kind === 'mini-boss' ? (
            <span className="pw-emoji">{n.emoji}</span>
          ) : n.kind === 'encounter' ? (
            <span className="pw-emoji small">{ENCOUNTER_META[n.encounter.kind].emoji}</span>
          ) : state === 'completed' || state === 'mastered' ? (
            <Icon name={state === 'mastered' ? 'star' : 'check'} size={28} strokeWidth={3} />
          ) : (
            <Icon name={icon ?? 'book'} size={26} strokeWidth={2.4} />
          )}
        </span>
        {state === 'mastered' && <span className="pw-crown" aria-hidden="true">♛</span>}
        {(n.kind === 'boss' || n.kind === 'mini-boss') && state !== 'locked' && state !== 'completed' && <span className="pw-badge">{n.kind === 'boss' ? 'BOSS' : '⚔'}</span>}
      </button>
      {review?.length ? (
        <button className="pw-review" title={`Review due: ${review.map((c) => CONCEPT_BY_ID[c].title).join(', ')}`} onClick={() => navigate(`/pathway/review/${review[0]}`)}>
          🔄<span className="sr-only">Review {CONCEPT_BY_ID[review[0]].title}</span>
        </button>
      ) : null}
      {n.kind !== 'encounter' && (
        <div className="pw-label">
          {n.kind === 'boss' && <div className="pw-label-kicker">{n.final ? 'FINAL BOSS' : 'UNIT BOSS'}</div>}
          {n.kind === 'mini-boss' && <div className="pw-label-kicker">MINI-BOSS</div>}
          <div className="pw-label-title">{label}</div>
          {n.kind === 'level' && (state === 'completed' || state === 'mastered') && (
            <div className="pw-stars" aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} className={i < stars ? 'on' : ''}>★</i>)}</div>
          )}
          {n.kind === 'level' && state !== 'completed' && state !== 'mastered' && <div className="pw-label-type">{LEVEL_TYPE_META[n.type].emoji} {LEVEL_TYPE_META[n.type].label}</div>}
        </div>
      )}
    </div>
  );
}

/* ---------------- Node sheet (details + actions) ---------------- */

function NodeSheet({ node, view, onClose }: { node: PathNode; view: PathwayView; onClose: () => void }) {
  const s = useLearner();
  const state = view.states[node.id];
  const locked = state === 'locked';
  const rec = node.kind === 'level' ? s.pathway.levels[node.id] : undefined;
  const battle = node.kind === 'boss' || node.kind === 'mini-boss' ? s.pathway.battles[node.id] : undefined;
  const region = P.regions[node.regionIndex];
  const prevMain = P.main[P.main.findIndex((m) => m.id === node.id) - 1];
  const start = () => { onClose(); navigate(playRoute(node)); };
  return (
    <Modal open onClose={onClose} title={<span className="row" style={{ gap: 8 }}>{node.kind === 'level' ? LEVEL_TYPE_META[node.type].emoji : node.kind === 'encounter' ? ENCOUNTER_META[node.encounter.kind].emoji : node.emoji} {node.kind === 'level' ? `Level ${node.number}` : node.kind === 'boss' ? (node.final ? 'Final boss' : 'Unit boss') : node.kind === 'mini-boss' ? 'Mini-boss' : ENCOUNTER_META[node.encounter.kind].label}</span>}>
      <div className={`stack theme-${region.spec.theme}`}>
        <div>
          <h2 style={{ margin: 0 }}>{node.title}</h2>
          <div className="small muted">{region.spec.emoji} Region {region.spec.number} · {region.spec.name}</div>
        </div>
        {node.kind === 'level' && (
          <div className="row wrap" style={{ gap: 6 }}>
            <span className="chip primary">{LEVEL_TYPE_META[node.type].label}</span>
            <span className="chip">~{node.minutes} min</span>
            {node.concepts.map((c) => <span key={c} className="chip">{CONCEPT_BY_ID[c].title}</span>)}
          </div>
        )}
        {node.kind === 'level' && <p className="small" style={{ margin: 0 }}>{LEVEL_TYPE_META[node.type].blurb}.{!locked && <> <Rich text={node.spec.intro} as="span" /></>}</p>}
        {(node.kind === 'boss' || node.kind === 'mini-boss') && (
          <>
            <p className="small" style={{ margin: 0 }}>{node.kind === 'boss' ? node.description : `"${node.taunt}"`}</p>
            <div className="stack-sm">
              {node.phases.map((ph) => <div key={ph.title} className="row small"><span className="chip">{ph.tasks.length} tasks</span>{ph.title}</div>)}
            </div>
            <div className="tiny muted">{taskCount(node.phases)} tasks · pass with {node.kind === 'boss' ? '70%' : '60%'} · {node.kind === 'boss' ? '10–20 min' : '5–10 min'}</div>
          </>
        )}
        {node.kind === 'encounter' && <p className="small" style={{ margin: 0 }}>An optional side quest. {node.encounter.npc ? '' : ''}Complete it for bonus XP — it never blocks your path.</p>}
        {!locked && node.kind === 'level' && (
          <div className="row" style={{ gap: 14 }}>
            {node.concepts.slice(0, 3).map((c) => {
              const info = masteryInfo(s, c);
              return <div key={c} className="row small" style={{ gap: 6 }}><Ring value={info.overall} size={36} stroke={4} mastered={info.mastered} /><span>{CONCEPT_BY_ID[c].title}</span></div>;
            })}
          </div>
        )}
        {rec?.completedAt && <div className="small">Best: <b className="pw-gold">{'★'.repeat(rec.stars)}{'☆'.repeat(3 - rec.stars)}</b> · {Math.round(rec.best * 100)}% accuracy · played {rec.plays}×</div>}
        {battle && <div className="small">Best score {Math.round(battle.best * 100)}% · {battle.passed ? '✅ defeated' : 'not yet defeated'}</div>}
        {locked ? (
          <div className="callout small">🔒 Locked. {view.wall && view.wall.region.index === node.regionIndex - 1 ? `Master ${view.wall.region.spec.name} to enter this region.` : prevMain ? `Complete “${prevMain.title}” first.` : ''} You can see what's ahead — the lesson opens when you get here.</div>
        ) : (
          <div className="row wrap">
            <button className="btn primary lg" onClick={start}>
              <Icon name="play" size={18} /> {state === 'in-progress' ? 'Continue' : state === 'completed' || state === 'mastered' ? (node.kind === 'level' ? 'Replay' : 'Fight again') : node.kind === 'level' ? 'Start' : node.kind === 'encounter' ? 'Begin' : 'Begin battle'}
            </button>
            {node.kind === 'level' && (state === 'completed' || state === 'mastered') && (
              <>
                <button className="btn" onClick={() => { onClose(); navigate(`/pathway/review/${node.concepts[0]}`); }}><Icon name="repeat" size={16} /> Review</button>
                <button className="btn" onClick={() => { onClose(); navigate(`/practice?concept=${node.concepts[0]}`); }}><Icon name="target" size={16} /> Practice</button>
                <button className="btn ghost" onClick={() => { onClose(); navigate(`/learn/${node.concepts[0]}`); }}>See mastery</button>
              </>
            )}
          </div>
        )}
        {node.kind === 'level' && (state === 'completed' || state === 'mastered') && <div className="tiny muted">Replays use fresh problems. XP is only paid again for stars you haven't earned yet.</div>}
      </div>
    </Modal>
  );
}

/* ---------------- Region intro ---------------- */

export function RegionIntro({ region, onBegin, onClose }: { region: BuiltRegion; onBegin: () => void; onClose: () => void }) {
  const r = region.spec;
  const levels = region.main.filter((n) => n.kind === 'level');
  const minis = region.main.filter((n) => n.kind === 'mini-boss');
  const minutes = levels.reduce((a, n) => a + (n.kind === 'level' ? n.minutes : 0), 0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { fx.sound('whoosh'); }, []);
  useDialog(ref, onClose, true, '.pw-intro-begin');
  return (
    <div className="modal-scrim pw-intro-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal wide pw-intro theme-${r.theme}`} role="dialog" aria-modal="true" aria-label={`Entering ${r.name}`} ref={ref}>
        <div className="pw-intro-art">
          <Landmark kind={r.landmarks.find((l) => !l.afterLevel)?.kind ?? 'gate'} width={300} />
          <button className="btn ghost icon sm pw-intro-close" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="modal-body stack">
          <div className="center">
            <div className="pw-kicker">REGION {r.number} · {r.subtitle.toUpperCase()}</div>
            <h1 className="pw-intro-title">{r.emoji} {r.name}</h1>
            <p className="pw-quote">“{r.quote}”</p>
          </div>
          <Rich text={r.description} className="small" />
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div className="card flat pad-sm">
              <div className="section-title">What you'll learn</div>
              <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{r.learn.map((l) => <li key={l}>{l}</li>)}</ul>
            </div>
            <div className="card flat pad-sm">
              <div className="section-title">Guarding this region</div>
              <div className="row" style={{ gap: 10 }}><span style={{ fontSize: '2rem' }}>{r.boss.emoji}</span><div><b>{r.boss.name}</b><div className="tiny muted">{r.boss.title}</div></div></div>
              <p className="tiny muted" style={{ margin: '6px 0 0' }}>{r.boss.description}</p>
              {minis.length > 0 && <div className="tiny mt-sm">Mini-bosses: {minis.map((m) => (m.kind === 'mini-boss' ? `${m.emoji} ${m.name}` : '')).join(' · ')}</div>}
            </div>
          </div>
          <div className="row between wrap">
            <span className="small muted">{levels.length} levels · {minis.length} mini-boss{minis.length === 1 ? '' : 'es'} · about {minutes >= 60 ? `${(minutes / 60).toFixed(1)} hours` : `${minutes} min`}</span>
            <button className="btn primary lg pw-intro-begin" onClick={onBegin}>Begin journey <Icon name="right" size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */

export function PathwayPage() {
  const s = useLearner();
  const view = useMemo(() => computeView(s, P), [s]);
  const stats = useMemo(() => journeyStats(s, P), [s]);
  const markers = useMemo(() => reviewMarkers(s, P), [s]);
  const worldRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(() => (typeof window === 'undefined' ? 800 : Math.min(window.innerWidth, 1200)));
  const layout = useMemo(() => layoutPathway(P, Math.min(width - 24, 900)), [width]);
  const offset = Math.max(0, (width - layout.width) / 2);
  const [selected, setSelected] = useState<PathNode | null>(null);
  const [intro, setIntro] = useState<BuiltRegion | null>(null);
  const [welcome, setWelcome] = useState<{ due: number } | null>(null);
  const [currentVisible, setCurrentVisible] = useState(true);
  const positioned = useRef(false);
  const chipsRef = useRef<HTMLDivElement>(null);
  const regionIdx = currentRegionIndex(s, P);
  const destination = P.regions[regionIdx].spec;
  const due = dueReviews(s);

  useLayoutEffect(() => {
    const el = worldRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const worldTop = () => (worldRef.current ? worldRef.current.getBoundingClientRect().top + window.scrollY : 0);
  const jumpToY = (y: number, smooth = true) => window.scrollTo({ top: Math.max(0, worldTop() + y - window.innerHeight * 0.45), behavior: smooth ? 'smooth' : 'auto' });
  const jumpToCurrent = (smooth = true) => {
    if (!view.current && view.wall) {
      const gate = layout.regions[view.wall.region.index + 1];
      if (gate) return jumpToY(gate.gateY + 40, smooth);
    }
    const cur = view.current ? layout.byId[view.current.id] : layout.nodes[layout.nodes.length - 1];
    if (cur) jumpToY(cur.y, smooth);
  };
  const jumpToRegion = (i: number) => {
    const r = layout.regions[i];
    if (r) window.scrollTo({ top: worldTop() + r.gateY - 70, behavior: 'smooth' });
  };

  // Open at the current level — never make the learner scroll past finished content.
  useLayoutEffect(() => {
    if (positioned.current || !width) return;
    positioned.current = true;
    jumpToCurrent(false);
  });

  // Celebrate a newly unlocked node when you come back to the map.
  useEffect(() => {
    const cur = view.current?.id;
    if (!cur) return;
    let last: string | null = null;
    const remember = () => { try { sessionStorage.setItem('pw-last-current', cur); } catch { /* storage blocked */ } };
    try { last = sessionStorage.getItem('pw-last-current'); } catch { /* storage blocked */ }
    if (!last || last === cur) return remember();
    const t = window.setTimeout(() => {
      remember(); // only once the celebration actually plays
      const el = document.querySelector(`[data-node="${cur}"]`);
      if (!el) return;
      el.classList.add('just-unlocked');
      fx.burst(el.querySelector('.pw-node'), { count: 20, glyphs: ['✦', '★'], colors: ['#fde68a'], spread: 120, size: 14 });
      fx.sound('unlock');
      fx.haptic([10, 30, 10]);
    }, 450);
    return () => window.clearTimeout(t);
  }, [view.current?.id]);

  // Keep the active region chip visible in the (scrollable on small screens) chip strip.
  useEffect(() => {
    const strip = chipsRef.current;
    const chip = strip?.querySelector<HTMLElement>('.pw-chip.active');
    if (strip && chip) strip.scrollTo({ left: chip.offsetLeft - strip.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' });
  }, [regionIdx]);

  // Once a mastery wall has been crossed, keep it open even if mastery later decays.
  const passedKey = view.newlyPassed.join(',');
  useEffect(() => { markWallsPassed(view.newlyPassed); }, [passedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Daily return first, then the introduction of the region you're in (if you haven't had it yet).
  const [visitChecked, setVisitChecked] = useState(false);
  useEffect(() => {
    const visit = notePathwayVisit();
    const started = Object.keys(s.pathway.levels).length > 0;
    if (visit.newDay && started) setWelcome({ due: due.length });
    setVisitChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!visitChecked || welcome || !view.current) return;
    const region = P.regions[view.current.regionIndex];
    if (!s.pathway.introsSeen.includes(region.spec.id)) setIntro(region);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitChecked, welcome, view.current?.regionIndex]);

  // Floating "jump to current" when the current node scrolls out of view.
  useEffect(() => {
    const onScroll = () => {
      const cur = view.current ? layout.byId[view.current.id] : null;
      if (!cur) return setCurrentVisible(true);
      const sy = worldTop() + cur.y - window.scrollY;
      setCurrentVisible(sy > 60 && sy < window.innerHeight - 60);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [view.current, layout]);

  // Keyboard: C = current, [ ] = previous/next region.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || e.metaKey || e.ctrlKey || selected || intro) return;
      if (e.key === 'c') jumpToCurrent();
      if (e.key === ']') jumpToRegion(Math.min(P.regions.length - 1, regionAt() + 1));
      if (e.key === '[') jumpToRegion(Math.max(0, regionAt() - 1));
    };
    const regionAt = () => {
      const y = window.scrollY - worldTop() + window.innerHeight / 2;
      return Math.max(0, layout.regions.findIndex((r) => y >= r.top && y < r.bottom));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Drag the world with the mouse (touch already scrolls natively).
  const drag = useRef<{ y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.ctrlKey || (e.target as HTMLElement).closest('button, a')) return;
    drag.current = { y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    if ((e.buttons & 1) === 0) { drag.current = null; return; } // released outside the page (e.g. a context menu)
    window.scrollBy(0, drag.current.y - e.clientY);
    drag.current = { y: e.clientY };
  };
  const endDrag = () => { drag.current = null; };

  const open = (n: PathNode) => {
    if (view.states[n.id] === 'locked') fx.sound('shield');
    setSelected(n);
  };

  // Road geometry: through each region gate, then its nodes.
  const roadPts: { x: number; y: number; id?: string }[] = [];
  layout.regions.forEach((r) => {
    roadPts.push({ x: layout.width / 2, y: r.gateY + GATE_H - 110 });
    layout.nodes.filter((n) => n.node.regionIndex === r.region.index).forEach((n) => roadPts.push({ x: n.x, y: n.y, id: n.node.id }));
  });
  const wallEnd = view.wall ? view.wall.region.main[view.wall.region.main.length - 1].id : null;
  const curIdx = view.current ? roadPts.findIndex((p) => p.id === view.current!.id) : wallEnd ? roadPts.findIndex((p) => p.id === wallEnd) : roadPts.length - 1;
  const donePts = roadPts.slice(0, Math.max(1, curIdx + 1));
  const todoPts = roadPts.slice(Math.max(0, curIdx));
  const nextPts = view.current ? roadPts.slice(Math.max(0, curIdx), curIdx + 3) : [];

  const pct = Math.round(stats.pct * 100);
  return (
    <div className="pw-page">
      <header className="pw-hero">
        <div className="pw-hero-inner">
          <div>
            <div className="pw-kicker">🗺️ THE PATHWAY</div>
            <h1 className="pw-title">Your journey from statistics beginner to master</h1>
            <div className="pw-destination">Current destination: <b>{destination.emoji} Region {destination.number} — {destination.name}</b> <span className="muted">({destination.subtitle})</span></div>
          </div>
          <div className="pw-hero-stats">
            <div><b>{stats.levelsDone}</b><span>/ {stats.levelCount} levels</span></div>
            <div><b>{stats.regionsDone}</b><span>/ {stats.regionCount} regions</span></div>
            <div><b>{stats.bossesDefeated}</b><span>/ {stats.bossCount} bosses</span></div>
            <div><b>{stats.stars}</b><span>★ of {stats.maxStars}</span></div>
          </div>
        </div>
      </header>

      <div className="pw-sticky">
        <div className="pw-sticky-inner">
          <div className="pw-progress" title={`${pct}% of the journey complete`}>
            <span className="pw-progress-label">YOUR JOURNEY</span>
            <div className="pw-progress-bar"><span style={{ width: `${Math.max(2, pct)}%` }} /></div>
            <b>{pct}%</b>
          </div>
          <div className="pw-region-chips" role="tablist" aria-label="Jump to region" ref={chipsRef}>
            {P.regions.map((r, i) => {
              const done = r.main.every((n) => view.states[n.id] === 'completed' || view.states[n.id] === 'mastered');
              return (
                <button key={r.spec.id} role="tab" aria-selected={i === regionIdx} className={`pw-chip theme-${r.spec.theme} ${i === regionIdx ? 'active' : ''} ${done ? 'done' : ''}`} onClick={() => jumpToRegion(i)} title={`Region ${r.spec.number}: ${r.spec.name}`}>
                  <span>{r.spec.emoji}</span><span className="pw-chip-name">{r.spec.number}. {r.spec.name.replace(/^The /, '')}</span>{done && <span>✓</span>}
                </button>
              );
            })}
          </div>
          <div className="row" style={{ gap: 4 }}>
            <button className="btn sm primary" onClick={() => jumpToCurrent()} title="Jump to your current level (C)"><Icon name="target" size={14} /> <span className="hide-sm">Current</span></button>
            <button className="btn sm ghost icon" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Top" title="Top"><Icon name="right" size={14} className="rot-up" /></button>
            <button className="btn sm ghost icon" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} aria-label="Bottom" title="Bottom"><Icon name="right" size={14} className="rot-down" /></button>
          </div>
        </div>
      </div>

      <div className="pw-world" ref={worldRef} style={{ height: layout.height }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerLeave={endDrag} onPointerCancel={endDrag}>
        {layout.regions.map((pr, ri) => {
          const r = pr.region.spec;
          const gate = r.landmarks.find((l) => !l.afterLevel);
          const regionLocked = view.states[pr.region.main[0].id] === 'locked';
          const mastery = masteryAvg(s, pr.region);
          const levels = pr.region.main.filter((n) => n.kind === 'level');
          const done = levels.filter((n) => view.states[n.id] === 'completed' || view.states[n.id] === 'mastered').length;
          const wallHere = view.wall && view.wall.region.index === ri - 1;
          return (
            <section key={r.id} className={`pw-region theme-${r.theme}`} style={{ top: pr.top, height: pr.bottom - pr.top }} aria-label={`Region ${r.number}: ${r.name}`}>
              {pr.decorations.map((d, i) => <div key={i} className="pw-deco" style={{ left: offset + d.x - 30, top: d.y - pr.top - 45 }}><Scenery theme={r.theme} kind={d.kind} scale={d.scale} flip={d.flip} /></div>)}
              {pr.landmarks.map((l) => (
                <div key={l.label} className="pw-mid-landmark" style={{ left: offset + l.x - 100, top: l.y - pr.top - 100 }}>
                  <Landmark kind={l.kind} width={200} />
                  <div className="pw-landmark-label">{l.label}</div>
                </div>
              ))}
              <div className="pw-gate" style={{ left: offset + layout.width / 2 }}>
                <button className={`pw-gate-card ${regionLocked ? 'locked' : ''}`} onClick={() => setIntro(pr.region)}>
                  <div className="pw-gate-art"><Landmark kind={gate?.kind ?? 'gate'} width={230} /></div>
                  <div className="pw-kicker">REGION {r.number} · {r.subtitle.toUpperCase()}</div>
                  <div className="pw-gate-title">{r.emoji} {r.name}</div>
                  <div className="pw-gate-meta">{regionLocked ? '🔒 Locked' : `${done}/${levels.length} levels · ${Math.round(mastery * 100)}% mastery`}{gate ? ` · ${gate.label}` : ''}</div>
                </button>
              </div>
              {wallHere && view.wall && <MasteryWall wall={view.wall} />}
            </section>
          );
        })}

        <svg className="pw-road" width={layout.width} height={layout.height} style={{ left: offset }} aria-hidden="true">
          <path d={roadPath(roadPts)} className="pw-road-bed" />
          <path d={roadPath(todoPts)} className="pw-road-todo" />
          <path d={roadPath(nextPts)} className="pw-road-next" />
          <path d={roadPath(donePts)} className="pw-road-done" />
          {layout.encounters.map((e) => <path key={e.node.id} d={`M${e.anchor.x},${e.anchor.y} Q${(e.anchor.x + e.x) / 2},${e.anchor.y + 70} ${e.x},${e.y}`} className="pw-road-branch" />)}
        </svg>

        {layout.encounters.map((e) => (
          <NodeTile key={e.node.id} placed={e} state={view.states[e.node.id]} current={false} offset={offset} stars={0} onOpen={() => open(e.node)} />
        ))}
        {layout.nodes.map((pn) => (
          <NodeTile key={pn.node.id} placed={pn} state={view.states[pn.node.id]} current={view.current?.id === pn.node.id} offset={offset}
            stars={pn.node.kind === 'level' ? s.pathway.levels[pn.node.id]?.stars ?? 0 : 0} review={markers[pn.node.id]} onOpen={() => open(pn.node)} />
        ))}

        <div className="pw-finale" style={{ top: layout.height - 70 }}>
          {s.pathway.completedAt ? <button className="btn primary" onClick={() => navigate('/pathway/complete')}>🎉 View your journey summary</button> : <span className="small muted">👑 The journey ends with the Grand Archivist.</span>}
        </div>
      </div>

      {!currentVisible && view.current && (
        <button className="btn primary pw-jump" onClick={() => jumpToCurrent()}><Icon name="target" size={16} /> Jump to current</button>
      )}
      {selected && <NodeSheet node={selected} view={view} onClose={() => setSelected(null)} />}
      {intro && (
        <RegionIntro region={intro} onClose={() => { if (intro.index === view.current?.regionIndex) markIntroSeen(intro.spec.id); setIntro(null); }}
          onBegin={() => {
            // Previewing a region from its gate doesn't use up its introduction for when you arrive.
            if (intro.index === view.current?.regionIndex) markIntroSeen(intro.spec.id);
            setIntro(null);
            const first = view.current && view.current.regionIndex === intro.index ? view.current : null;
            if (first) navigate(playRoute(first)); else jumpToRegion(intro.index);
          }} />
      )}
      {welcome && view.current && (
        <Modal open onClose={() => setWelcome(null)} title="Welcome back 👋">
          <div className="stack">
            <div className="row" style={{ gap: 14 }}>
              <Mu mood="wave" size={72} />
              <div>
                <p style={{ margin: 0 }}>Your journey continues at <b>{view.current.kind === 'level' ? `Level ${view.current.number} — ${view.current.title}` : view.current.title}</b>.</p>
                {welcome.due > 0 ? <p className="small muted" style={{ margin: '6px 0 0' }}>You have <b>{welcome.due}</b> concept{welcome.due === 1 ? '' : 's'} due for review — a few minutes now keeps them from fading.</p> : <p className="small muted" style={{ margin: '6px 0 0' }}>No reviews due. Straight onward!</p>}
              </div>
            </div>
            <div className="row wrap">
              <button className="btn primary" onClick={() => { setWelcome(null); navigate(playRoute(view.current!)); }}><Icon name="play" size={16} /> Continue Pathway</button>
              {welcome.due > 0 && <button className="btn" onClick={() => { setWelcome(null); navigate(`/pathway/review/${due[0]}`); }}><Icon name="repeat" size={16} /> Review first</button>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function masteryAvg(s: ReturnType<typeof useLearner>, r: BuiltRegion) {
  return r.concepts.length ? r.concepts.reduce((a, c) => a + masteryInfo(s, c).overall, 0) / r.concepts.length : 0;
}

function MasteryWall({ wall }: { wall: NonNullable<PathwayView['wall']> }) {
  const s = useLearner();
  const st = wallStatus(s, wall.region);
  return (
    <div className="pw-wall">
      <div className="pw-wall-bricks" aria-hidden="true" />
      <div className="pw-wall-card">
        <div className="pw-kicker">🧱 MASTERY WALL</div>
        <div className="bold">Master {wall.region.spec.name} to continue</div>
        <ul className="small" style={{ margin: '6px 0', paddingLeft: 0, listStyle: 'none' }}>
          {st.requirements.map((r) => <li key={r.label}>{r.met ? '✅' : '⬜'} {r.label}</li>)}
        </ul>
        <div style={{ maxWidth: 260, margin: '0 auto 8px' }}><Bar value={st.mastery / 0.5 > 1 ? 1 : st.mastery / 0.5} label="Progress to the mastery threshold" /></div>
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          {st.weakest.slice(0, 2).map((c) => <button key={c} className="btn sm primary" onClick={() => navigate(`/pathway/review/${c}`)}>Targeted review: {CONCEPT_BY_ID[c].title}</button>)}
        </div>
        <div className="tiny muted mt-sm">Not a dead end — every review raises your mastery. The wall opens the moment you reach the threshold.</div>
      </div>
    </div>
  );
}

