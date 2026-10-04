import { useEffect, useMemo } from 'react';
import type { ConceptId } from '../../engine/types';
import { PATHWAY } from '../../content/pathway';
import { segmentsFor, encounterSegments, reviewSegments } from '../../engine/pathway/build';
import { computeView, journeyStats } from '../../engine/pathway/progress';
import { cs, masteryInfo, overallMastery } from '../../engine/learner';
import { upcomingReviews } from '../../engine/planner';
import { CONCEPTS, CONCEPT_BY_ID } from '../../content/concepts';
import { getState, useLearner } from '../../state/store';
import { LevelRunner } from './LevelRunner';
import { BattleRunner } from './BattleRunner';
import { Empty, LinkBtn, Ring, dueIn } from '../../components/ui';
import { Icon } from '../../components/ui/Icon';
import { Mu } from '../../components/mascot/Mu';
import * as fx from '../../lib/fx';

function themeForConcept(c: ConceptId) {
  const r = PATHWAY.regions.find((x) => x.concepts.includes(c) && x.spec.unit !== 'final') ?? PATHWAY.regions[0];
  return r.spec.theme;
}

export function PlayPage({ id }: { id: string }) {
  const node = PATHWAY.nodes[id];
  // Lock state is read once on entry so finishing the node doesn't re-evaluate mid-play.
  const locked = useMemo(() => (node ? computeView(getState(), PATHWAY).states[node.id] === 'locked' : true), [node]);
  const segments = useMemo(() => (node?.kind === 'level' ? segmentsFor(node) : node?.kind === 'encounter' ? encounterSegments(node) : []), [node]);
  if (!node) return <div className="content narrow"><Empty title="That place isn't on the map" action={<LinkBtn to="/pathway" className="btn primary">Back to the Pathway</LinkBtn>} /></div>;
  if (locked) {
    return (
      <div className="content narrow">
        <Empty icon="🔒" title={`${node.title} is still locked`} action={<LinkBtn to="/pathway" className="btn primary">Back to the Pathway</LinkBtn>}>
          Finish the earlier stops on the road first — the Pathway opens one step at a time so each idea builds on the last.
        </Empty>
      </div>
    );
  }
  const theme = PATHWAY.regions[node.regionIndex].spec.theme;
  if (node.kind === 'level') return <LevelRunner kind="level" title={node.title} segments={segments} theme={theme} node={node} />;
  if (node.kind === 'encounter') return <LevelRunner kind="encounter" title={node.title} segments={segments} theme={theme} node={node} />;
  return <BattleRunner node={node} />;
}

export function QuickReviewPage({ concept, query }: { concept: string; query: URLSearchParams }) {
  const c = CONCEPT_BY_ID[concept as ConceptId];
  const segments = useMemo(() => (c ? reviewSegments(c.id, cs(getState(), c.id).level) : []), [c]);
  if (!c) return <div className="content narrow"><Empty title="Unknown concept" action={<LinkBtn to="/pathway" className="btn primary">Back to the Pathway</LinkBtn>} /></div>;
  return <LevelRunner kind="review" title={`Quick review — ${c.title}`} segments={segments} theme={themeForConcept(c.id)} reviewConcept={c.id} then={query.get('then') ?? undefined} />;
}

/* ---------------- The completion ceremony ---------------- */

function certificateSvg(name: string, score: number, date: string, levels: number) {
  const esc = (t: string) => t.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]!));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="780" viewBox="0 0 1100 780">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#312e81"/><stop offset="1" stop-color="#0e7490"/></linearGradient></defs>
  <rect width="1100" height="780" fill="#fffdf6"/>
  <rect x="24" y="24" width="1052" height="732" fill="none" stroke="url(#g)" stroke-width="10" rx="18"/>
  <rect x="44" y="44" width="1012" height="692" fill="none" stroke="#d4a017" stroke-width="2" rx="12"/>
  <text x="550" y="150" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#4c1d95" letter-spacing="6">STAT LAB · FCC MA120</text>
  <text x="550" y="240" text-anchor="middle" font-family="Georgia, serif" font-size="68" fill="#111827">Statistics Master</text>
  <text x="550" y="310" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="#374151">This certifies that</text>
  <text x="550" y="390" text-anchor="middle" font-family="Georgia, serif" font-size="54" fill="#312e81" font-style="italic">${esc(name || 'A determined traveler')}</text>
  <line x1="300" y1="410" x2="800" y2="410" stroke="#d4a017" stroke-width="2"/>
  <text x="550" y="470" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="#374151">completed The Pathway — all ${levels} levels, every boss, and the Grand Archive —</text>
  <text x="550" y="510" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="#374151">with a final mastery score of ${Math.round(score * 100)}%.</text>
  <text x="550" y="640" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#6b7280">${esc(date)}</text>
  <circle cx="900" cy="620" r="62" fill="#fde68a" stroke="#d4a017" stroke-width="4"/><text x="900" y="640" text-anchor="middle" font-size="54">μ</text>
</svg>`;
}

export function PathwayCompletePage() {
  const s = useLearner();
  const done = !!s.pathway.completedAt;
  useEffect(() => { if (done) { fx.celebrate('final'); fx.sound('victory'); } }, [done]);
  if (!done) {
    return <div className="content narrow"><Empty icon="🏛️" title="The journey isn't over yet" action={<LinkBtn to="/pathway" className="btn primary">Continue the Pathway</LinkBtn>}>Defeat the Grand Archivist at the end of the Pathway to see your journey summary and earn your certificate.</Empty></div>;
  }
  const st = journeyStats(s, PATHWAY);
  const infos = CONCEPTS.map((c) => ({ c, info: masteryInfo(s, c.id) }));
  const mastered = infos.filter((x) => x.info.mastered).length;
  const solved = s.attempts.filter((a) => a.correct).length;
  const score = overallMastery(s);
  const weakest = infos.slice().sort((a, b) => a.info.overall - b.info.overall).slice(0, 4);
  const strongest = infos.slice().sort((a, b) => b.info.overall - a.info.overall).slice(0, 4);
  const upcoming = upcomingReviews(s, Date.now(), 30).slice(0, 5);
  const date = new Date(s.pathway.completedAt!).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const download = () => {
    const blob = new Blob([certificateSvg(s.name, score, date, st.levelCount)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stat-lab-statistics-master.svg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000); // some browsers start the download after click() returns
  };
  return (
    <div className="content narrow pw-final">
      <div className="card center stack" style={{ padding: 32 }}>
        <div style={{ fontSize: '3rem' }}>🎉</div>
        <div className="pw-kicker" style={{ color: '#d97706', opacity: 1 }}>THE JOURNEY IS COMPLETE</div>
        <h1 style={{ margin: 0 }}>Statistics Master</h1>
        <p className="muted" style={{ margin: 0 }}>You traveled from the first village to the Grand Archive.</p>
        <div className="pw-final-stats">
          <div><b>{st.levelCount}</b><span>levels</span></div>
          <div><b>{st.regionCount}</b><span>regions</span></div>
          <div><b>{st.miniCount}</b><span>mini-bosses</span></div>
          <div><b>{st.bossCount}</b><span>bosses</span></div>
          <div><b>{mastered}</b><span>concepts mastered</span></div>
          <div><b>{solved.toLocaleString()}</b><span>problems solved</span></div>
        </div>
        <div className="row" style={{ justifyContent: 'center', gap: 16 }}>
          <Ring value={score} size={110} stroke={10} label={`${Math.round(score * 100)}%`} color="var(--primary)" ariaLabel={`Final mastery ${Math.round(score * 100)} percent`} />
          <Mu mood="proud" size={110} />
        </div>
      </div>
      <div className="grid grid-2 mt">
        <div className="card"><h3>Strongest topics</h3>{strongest.map((x) => <div key={x.c.id} className="row small between"><span>{x.c.title}</span><b>{Math.round(x.info.overall * 100)}%</b></div>)}</div>
        <div className="card"><h3>Keep reviewing</h3>{weakest.map((x) => <div key={x.c.id} className="row small between"><span>{x.c.title}</span><LinkBtn to={`/pathway/review/${x.c.id}`} className="btn sm ghost">Review</LinkBtn></div>)}</div>
      </div>
      <div className="card mt">
        <h3>Long-term review plan</h3>
        <p className="small muted">Mastery fades without review. Your spaced-repetition schedule keeps going after the Pathway:</p>
        {upcoming.length ? upcoming.map((u) => <div key={u.id} className="row small between"><span>{CONCEPT_BY_ID[u.id].title}</span><span className="muted">{dueIn(u.due)}</span></div>) : <p className="small">Nothing due in the next month — check back on the dashboard.</p>}
      </div>
      <div className="row wrap mt" style={{ justifyContent: 'center' }}>
        <button className="btn primary lg" onClick={download}><Icon name="download" size={18} /> Download certificate</button>
        <LinkBtn to="/exam" className="btn lg">Take the final exam</LinkBtn>
        <LinkBtn to="/pathway" className="btn ghost lg">Back to the map</LinkBtn>
      </div>
    </div>
  );
}
