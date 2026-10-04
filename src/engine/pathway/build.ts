import type { ConceptId, InlineInput, LessonStep, QType, Rich } from '../types';
import { CONCEPT_BY_ID } from '../../content/concepts';
import { BOSS_BY_ID } from '../../content/boss';
import { generatorsFor } from '../questions';
import type {
  BattlePhase, BattleTask, BossNode, BuiltRegion, EncounterNode, LevelNode, LevelSpec, LevelType, MiniBossNode, Pathway,
  QuestionPlan, RegionContent, Segment,
} from './types';

export const LEVEL_TYPE_META: Record<LevelType, { label: string; icon: string; emoji: string; blurb: string }> = {
  lesson: { label: 'Lesson', icon: 'book', emoji: '📖', blurb: 'Learn a new idea step by step' },
  practice: { label: 'Practice', icon: 'target', emoji: '🧩', blurb: 'Guided problems that get harder' },
  lab: { label: 'Lab', icon: 'flask', emoji: '🔬', blurb: 'Run a simulation and discover the rule' },
  'graph-lab': { label: 'Graph Lab', icon: 'chart', emoji: '📊', blurb: 'Manipulate and read a graph' },
  experiment: { label: 'Experiment', icon: 'flask', emoji: '🧪', blurb: 'Change the variables, watch what happens' },
  recall: { label: 'Recall', icon: 'brain', emoji: '🧠', blurb: 'Pull it from memory — no peeking' },
  challenge: { label: 'Challenge', icon: 'swords', emoji: '⚔️', blurb: 'Harder problems, less help' },
  mixed: { label: 'Mixed', icon: 'shuffle', emoji: '🔀', blurb: 'Several ideas, interleaved' },
  precision: { label: 'Precision', icon: 'target', emoji: '🎯', blurb: 'Defeat a common mistake' },
  teach: { label: 'Teach It', icon: 'chat', emoji: '🗣️', blurb: 'Explain it in your own words' },
  review: { label: 'Review', icon: 'trophy', emoji: '🏆', blurb: 'Cumulative review' },
};

/** Mini-boss placement: about one every 8–10 regular levels, evenly spaced, never right before the unit boss. */
export function miniBossSlots(n: number): number[] {
  if (n < 7) return [];
  const m = Math.max(1, Math.floor(n / 9));
  const s = n / (m + 1);
  return Array.from({ length: m }, (_, i) => Math.round(s * (i + 1)));
}

const NON_FRQ: QType[] = ['free-response'];

function gensOf(concept: ConceptId, preferred?: string[]) {
  const own = generatorsFor(concept).map((g) => g.id);
  const p = (preferred ?? []).filter((id) => own.includes(id));
  return p.length ? p : undefined;
}

function plan(concept: ConceptId, level: number, spec: LevelSpec | null, extra: Partial<QuestionPlan> = {}): QuestionPlan {
  return { concept, level, generators: gensOf(concept, spec?.generators), excludeTypes: NON_FRQ, ...extra };
}

function lessonStepsOf(concept: ConceptId) {
  return CONCEPT_BY_ID[concept].lesson;
}

function firstStep<K extends LessonStep['kind']>(concept: ConceptId, kind: K) {
  return lessonStepsOf(concept).find((s) => s.kind === kind) as Extract<LessonStep, { kind: K }> | undefined;
}

function conceptSummary(concept: ConceptId): Rich[] {
  const c = CONCEPT_BY_ID[concept];
  const sum = firstStep(concept, 'summary');
  if (sum) return sum.points.slice(0, 4);
  return [...c.understand, ...c.interpret].slice(0, 3);
}

function recallsFor(spec: LevelSpec, max: number): { concept: ConceptId; prompt: Rich; answer: Rich }[] {
  const out: { concept: ConceptId; prompt: Rich; answer: Rich }[] = [];
  const primary = spec.concepts[0];
  (spec.recall ?? []).forEach((r) => out.push({ concept: primary, ...r }));
  for (const id of spec.concepts) {
    CONCEPT_BY_ID[id].recall.forEach((r) => out.push({ concept: id, ...r }));
    lessonStepsOf(id).forEach((s) => s.kind === 'recall' && out.push({ concept: id, prompt: s.prompt, answer: s.answer }));
  }
  const seen = new Set<string>();
  return out.filter((r) => (seen.has(r.prompt) ? false : (seen.add(r.prompt), true))).slice(0, max);
}

function predictFor(spec: LevelSpec): Extract<Segment, { kind: 'predict' }> | null {
  if (spec.predict) return { kind: 'predict', ...spec.predict };
  const p = firstStep(spec.concepts[0], 'predict');
  return p ? { kind: 'predict', prompt: p.prompt, input: p.input, reveal: p.reveal } : null;
}

export function widgetFor(spec: LevelSpec): Extract<Segment, { kind: 'widget' }> | null {
  if (spec.widget) return { kind: 'widget', widget: spec.widget.id, props: spec.widget.props, mission: spec.widget.mission, takeaway: spec.widget.takeaway };
  for (const id of spec.concepts) {
    const s = firstStep(id, 'interact');
    if (s) return { kind: 'widget', widget: s.widget, props: s.props, mission: s.prompt, takeaway: s.takeaway };
  }
  return null;
}

/** Turn a level spec into its playable sequence. Different level types get genuinely different shapes. */
export function segmentsFor(node: LevelNode): Segment[] {
  const spec = node.spec;
  const c = spec.concepts[0];
  const segs: Segment[] = [{ kind: 'intro', title: spec.title, levelType: spec.type, text: spec.intro, npc: spec.npc, concepts: spec.concepts, minutes: node.minutes }];
  const hook = () => spec.hook && segs.push({ kind: 'hook', ...spec.hook });
  const q = (stage: Extract<Segment, { kind: 'question' }>['stage'], p: QuestionPlan, scaffold = false, hints = true) => segs.push({ kind: 'question', stage, plan: p, scaffold, hints });
  const rotate = (i: number) => spec.concepts[i % spec.concepts.length];
  let summary: Rich[] = spec.summary ?? conceptSummary(c);

  switch (spec.type) {
    case 'lesson': {
      hook();
      const steps = lessonStepsOf(c);
      const [a, b] = spec.lessonSteps ?? [0, steps.length - 1];
      let hadRecall = false;
      for (let i = a; i <= b; i++) {
        const st = steps[i];
        if (st.kind === 'summary') { if (!spec.summary) summary = st.points; continue; }
        if (st.kind === 'recall') hadRecall = true;
        segs.push({ kind: 'lesson-step', concept: c, index: i, step: st, last: i === steps.length - 1 || (i === b && steps.slice(b + 1).every((x) => x.kind === 'summary')) });
      }
      q('practice', plan(c, 2, spec), true);
      q('apply', plan(c, 3, spec, { preferTypes: ['real-world', 'interpretation', 'graph'] }));
      if (!hadRecall) {
        const r = recallsFor(spec, 1)[0];
        if (r) segs.push({ kind: 'recall', ...r });
      }
      break;
    }
    case 'practice': {
      hook();
      const worked = firstStep(c, 'worked');
      if (worked) segs.push({ kind: 'lesson-step', concept: c, index: lessonStepsOf(c).indexOf(worked), step: worked, last: false });
      else if (CONCEPT_BY_ID[c].formulas[0]) segs.push({ kind: 'lesson-step', concept: c, index: -1, step: { kind: 'formula', formulaId: CONCEPT_BY_ID[c].formulas[0] }, last: false });
      q('practice', plan(c, 3, spec), true);
      q('practice2', plan(rotate(1), 4, spec));
      q('apply', plan(rotate(2), 4, spec, { preferTypes: ['real-world', 'interpretation'] }));
      q('challenge', plan(c, 5, spec, { preferTypes: ['multi-step', 'exam', 'calculation'] }));
      break;
    }
    case 'lab':
    case 'graph-lab':
    case 'experiment': {
      hook();
      const p = predictFor(spec);
      if (p) segs.push(p);
      const w = widgetFor(spec);
      if (w) segs.push(w);
      const pref: QType[] = spec.type === 'graph-lab' ? ['graph', 'interpretation'] : ['interpretation', 'conceptual', 'graph'];
      q('check', plan(c, 3, spec, { preferTypes: pref }));
      q('apply', plan(rotate(1), 4, spec, { preferTypes: ['real-world', 'calculation', 'graph'] }));
      break;
    }
    case 'recall': {
      hook();
      recallsFor(spec, 3).forEach((r) => segs.push({ kind: 'recall', ...r }));
      q('check', plan(c, 3, spec, { preferTypes: ['recognition', 'conceptual'] }));
      q('apply', plan(rotate(1), 4, spec, { preferTypes: ['interpretation', 'real-world'] }));
      break;
    }
    case 'precision': {
      hook();
      segs.push({ kind: 'misconceptions', concept: c, ids: CONCEPT_BY_ID[c].misconceptions });
      q('check', plan(c, 3, spec, { preferTypes: ['misconception', 'conceptual'] }));
      q('practice2', plan(c, 4, spec, { preferTypes: ['calculation', 'misconception'] }));
      q('apply', plan(rotate(1), 4, spec, { preferTypes: ['interpretation', 'conceptual', 'real-world'] }));
      const r = recallsFor(spec, 1)[0];
      if (r) segs.push({ kind: 'recall', ...r });
      break;
    }
    case 'teach': {
      hook();
      const r = recallsFor(spec, 1)[0];
      if (r) segs.push({ kind: 'recall', ...r });
      segs.push({ kind: 'teach', concept: c });
      break;
    }
    case 'challenge': {
      hook();
      q('challenge', plan(c, 5, spec, { preferTypes: ['multi-step', 'real-world', 'exam'] }), false);
      q('challenge', plan(rotate(1), 6, spec, { preferTypes: ['interpretation', 'exam', 'graph'] }), false);
      q('challenge', plan(rotate(2), 6, spec, { preferTypes: ['free-response', 'interpretation'], excludeTypes: [] }), false);
      break;
    }
    case 'mixed':
    case 'review': {
      hook();
      const n = spec.type === 'review' ? 6 : 5;
      for (let i = 0; i < n; i++) {
        const lvl = spec.type === 'review' ? 3 + Math.floor((i * 3) / n) : 4;
        q(i === n - 1 ? 'challenge' : i === 0 ? 'practice' : 'practice2', plan(rotate(i), lvl, spec, { excludeTypes: ['free-response', 'multi-step'] }));
      }
      summary = spec.summary ?? spec.concepts.map((id) => `**${CONCEPT_BY_ID[id].title}** — ${CONCEPT_BY_ID[id].short}`);
      break;
    }
  }
  segs.push({ kind: 'complete', summary });
  return segs;
}

/** Synthetic quick-review level for a concept (used by review markers and the recommendation engine). */
export function reviewSegments(concept: ConceptId, level: number): Segment[] {
  const c = CONCEPT_BY_ID[concept];
  const r = c.recall[0];
  return [
    { kind: 'intro', title: `Quick review — ${c.title}`, levelType: 'review', text: `A short tune-up on **${c.title}** before you move on. Fresh problems, no penalty — just stronger memory.`, concepts: [concept], minutes: 4 },
    ...(r ? [{ kind: 'recall' as const, concept, prompt: r.prompt, answer: r.answer }] : []),
    { kind: 'question', stage: 'practice', plan: { concept, level: Math.max(2, level - 1), excludeTypes: NON_FRQ }, scaffold: level <= 3, hints: true },
    { kind: 'question', stage: 'practice2', plan: { concept, level, excludeTypes: NON_FRQ }, scaffold: false, hints: true },
    { kind: 'question', stage: 'apply', plan: { concept, level, preferTypes: ['real-world', 'interpretation'], excludeTypes: NON_FRQ }, scaffold: false, hints: true },
    { kind: 'complete', summary: conceptSummary(concept) },
  ];
}

/* ---------------- Encounters ---------------- */

export function encounterSegments(node: EncounterNode): Segment[] {
  const e = node.encounter;
  const c = e.concepts[0];
  const segs: Segment[] = [{ kind: 'intro', title: e.title, levelType: e.kind === 'lab' ? 'lab' : 'recall', text: ENCOUNTER_INTRO[e.kind], npc: e.npc, concepts: e.concepts, minutes: 3 }];
  if (e.kind === 'lost-formula' && e.formula) segs.push({ kind: 'formula-match', formula: e.formula });
  if ((e.kind === 'shrine' || e.kind === 'scholar') && e.question) segs.push({ kind: 'mc', concept: c, ...e.question });
  if (e.kind === 'lab' && e.widget) segs.push({ kind: 'widget', widget: e.widget.id, props: e.widget.props, mission: e.widget.mission, takeaway: e.widget.takeaway });
  if (e.kind === 'random' || e.kind === 'treasure' || e.kind === 'lab') {
    segs.push({ kind: 'question', stage: 'challenge', plan: { concept: c, level: 4, excludeTypes: NON_FRQ }, scaffold: false, hints: true });
  }
  segs.push({ kind: 'complete', summary: [ENCOUNTER_OUTRO[e.kind]] });
  return segs;
}

export const ENCOUNTER_META: Record<string, { label: string; emoji: string }> = {
  shrine: { label: 'Knowledge Shrine', emoji: '📜' },
  scholar: { label: 'The Scholar', emoji: '🧙' },
  'lost-formula': { label: 'Lost Formula', emoji: '🧩' },
  random: { label: 'Random Encounter', emoji: '🎲' },
  treasure: { label: 'Treasure', emoji: '💎' },
  lab: { label: 'Statistics Lab', emoji: '🧪' },
};

const ENCOUNTER_INTRO: Record<string, Rich> = {
  shrine: 'An old shrine holds a single question. Answer it with understanding, not memorized words.',
  scholar: 'A wandering scholar stops you on the road with a question.',
  'lost-formula': 'A torn page lies in the grass. Match each symbol to its meaning to restore the formula.',
  random: 'A quick challenge blocks the road — one problem, no warm-up.',
  treasure: 'A chest glints beside the path. It opens for travelers who can still remember what they learned.',
  lab: 'A field laboratory. Run the experiment, then put what you saw to the test.',
};

const ENCOUNTER_OUTRO: Record<string, Rich> = {
  shrine: 'The shrine glows — understanding beats memorizing.',
  scholar: 'The scholar nods and steps aside.',
  'lost-formula': 'Formula restored. Knowing what each symbol means is half of using it correctly.',
  random: 'Challenge cleared.',
  treasure: 'Treasure claimed! Remembering old ideas is what makes them stick.',
  lab: 'Experiment complete.',
};

/* ---------------- Battles ---------------- */

function pickPref(concept: ConceptId, types: QType[]) {
  return generatorsFor(concept).some((g) => types.includes(g.type));
}

/** Mini-bosses are generated from the concepts of the levels they guard: recognize → compute → interpret/apply. */
export function miniBossPhases(concepts: ConceptId[], name: string): BattlePhase[] {
  const cs = concepts.length ? concepts : (['center'] as ConceptId[]);
  const calcTypes: QType[] = ['calculation', 'multi-step'];
  const calcConcepts = cs.filter((c) => pickPref(c, calcTypes));
  const at = (arr: ConceptId[], i: number) => arr[i % arr.length];
  const phases: BattlePhase[] = [
    {
      title: 'Phase 1 — Recognition', kind: 'recognition', intro: `${name} tests whether you can tell these ideas apart.`,
      tasks: [0, 1].map((i): BattleTask => ({ kind: 'gen', concept: at(cs, i), level: 4, preferTypes: ['recognition', 'conceptual', 'misconception'], excludeTypes: NON_FRQ })),
    },
  ];
  phases.push(calcConcepts.length
    ? { title: 'Phase 2 — Calculation', kind: 'calculation', intro: 'Now the numbers. Work carefully — hints cost damage.', tasks: [0, 1].map((i): BattleTask => ({ kind: 'gen', concept: at(calcConcepts, i), level: 5, preferTypes: calcTypes, excludeTypes: NON_FRQ })) }
    : { title: 'Phase 2 — Application', kind: 'application', intro: 'New situations. Decide which idea applies.', tasks: [0, 1].map((i): BattleTask => ({ kind: 'gen', concept: at(cs, i + 1), level: 5, preferTypes: ['real-world', 'conceptual'], excludeTypes: NON_FRQ })) });
  phases.push({
    title: 'Phase 3 — Interpretation', kind: 'interpretation', intro: 'Final phase: what do the results actually mean?',
    tasks: [0, 1].map((i): BattleTask => ({ kind: 'gen', concept: at(cs, i + 2), level: 5, preferTypes: ['interpretation', 'real-world', 'graph'], excludeTypes: NON_FRQ })),
  });
  return phases;
}

export function taskCount(phases: BattlePhase[]) {
  return phases.reduce((a, p) => a + p.tasks.length, 0);
}

/* ---------------- World assembly ---------------- */

export function buildPathway(contents: RegionContent[], final: RegionContent): Pathway {
  const regions: BuiltRegion[] = [];
  let number = 0;
  const all = [...contents, final];
  all.forEach((rc, ri) => {
    const isFinal = rc === final;
    const main: BuiltRegion['main'] = [];
    const slots = new Set(isFinal ? [] : miniBossSlots(rc.levels.length));
    let group: LevelNode[] = [];
    let miniIdx = 0;
    rc.levels.forEach((spec, li) => {
      const node: LevelNode = {
        id: spec.id, regionId: rc.region.id, regionIndex: ri, kind: 'level', title: spec.title, concepts: spec.concepts,
        number: ++number, type: spec.type, minutes: spec.minutes ?? defaultMinutes(spec.type), spec,
      };
      main.push(node);
      group.push(node);
      if (slots.has(li + 1)) {
        const mb = rc.region.miniBosses[miniIdx % Math.max(1, rc.region.miniBosses.length)] ?? { name: 'The Gatekeeper', emoji: '🛡️', taunt: 'Prove you were paying attention.' };
        const concepts = [...new Set(group.flatMap((g) => g.concepts))];
        main.push({
          id: `${rc.region.id}-mini-${miniIdx + 1}`, regionId: rc.region.id, regionIndex: ri, kind: 'mini-boss', title: mb.name, concepts,
          name: mb.name, emoji: mb.emoji, taunt: mb.taunt, covers: group.map((g) => g.id), phases: miniBossPhases(concepts, mb.name),
        });
        miniIdx++;
        group = [];
      }
    });
    const concepts = [...new Set(rc.levels.flatMap((l) => l.concepts))];
    const b = rc.region.boss;
    main.push({
      id: rc.boss.id, regionId: rc.region.id, regionIndex: ri, kind: 'boss', title: b.name, concepts, bossId: rc.boss.id,
      name: b.name, emoji: b.emoji, description: b.description, defeatLine: b.defeatLine, story: rc.boss.story, visual: rc.boss.visual ?? BOSS_BY_ID[rc.boss.id]?.visual,
      phases: rc.boss.phases, final: isFinal,
    });
    const encounters: EncounterNode[] = rc.encounters.map((e) => ({
      id: e.id, regionId: rc.region.id, regionIndex: ri, kind: 'encounter', title: e.title, concepts: e.concepts, encounter: e, afterNode: e.afterLevel,
    }));
    regions.push({ spec: rc.region, index: ri, main, encounters, concepts });
  });
  const mainAll = regions.flatMap((r) => r.main);
  const nodes: Pathway['nodes'] = {};
  regions.forEach((r) => { r.main.forEach((n) => (nodes[n.id] = n)); r.encounters.forEach((n) => (nodes[n.id] = n)); });
  return { regions, main: mainAll, nodes, levelCount: number };
}

function defaultMinutes(t: LevelType) {
  return ({ lesson: 8, practice: 7, lab: 6, 'graph-lab': 6, experiment: 6, recall: 4, challenge: 8, mixed: 7, precision: 6, teach: 6, review: 9 } as Record<LevelType, number>)[t];
}

/* ---------------- Battle task materialization helpers ---------------- */

export function inlineFromMc(options: { id: string; text: string; correct?: boolean; why?: string }[]): InlineInput {
  return { type: 'mc', options };
}

export function isBossNode(n: { kind: string }): n is BossNode { return n.kind === 'boss'; }
export function isMiniBossNode(n: { kind: string }): n is MiniBossNode { return n.kind === 'mini-boss'; }
