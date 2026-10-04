import type { AnswerSpec, ConceptId, InlineInput } from '../types';
import { CONCEPTS, CONCEPT_BY_ID } from '../../content/concepts';
import { BOSS_BY_ID } from '../../content/boss';
import { FORMULA_BY_ID } from '../../content/formulas';
import { generatorsFor, GENERATOR_BY_ID } from '../questions';
import { WIDGET_IDS as WIDGETS } from './widgetIds';
import type { BattleTask, LevelSpec, RegionContent } from './types';
import { miniBossSlots, widgetFor, taskCount } from './build';

const LAB_TYPES = new Set(['lab', 'graph-lab', 'experiment']);

function checkInput(input: InlineInput, where: string, errs: string[]) {
  if (input.type === 'mc') {
    const n = input.options.filter((o) => o.correct).length;
    if (n !== 1) errs.push(`${where}: mc must have exactly one correct option (has ${n})`);
    if (input.options.length < 2) errs.push(`${where}: mc needs ≥2 options`);
  } else if (!Number.isFinite(input.answer)) errs.push(`${where}: numeric answer missing`);
}

function checkAnswer(a: AnswerSpec, where: string, errs: string[]) {
  if (a.kind === 'mc') {
    const n = a.options.filter((o) => o.correct).length;
    if (n !== 1) errs.push(`${where}: mc must have exactly one correct option (has ${n})`);
  } else if (a.kind === 'numeric') {
    if (!Number.isFinite(a.value) || !(a.tol > 0)) errs.push(`${where}: numeric value/tol invalid`);
  } else if (!a.rubric.items.length || !a.rubric.model) errs.push(`${where}: text rubric needs items and a model answer`);
}

function checkGens(gens: string[] | undefined, concepts: ConceptId[], where: string, errs: string[]) {
  for (const g of gens ?? []) {
    const gen = GENERATOR_BY_ID[g];
    if (!gen) errs.push(`${where}: unknown generator '${g}'`);
    else if (!concepts.includes(gen.concept)) errs.push(`${where}: generator '${g}' belongs to '${gen.concept}', not ${concepts.join('/')}`);
  }
}

function checkTask(t: BattleTask, unitConcepts: ConceptId[], where: string, errs: string[]) {
  if (t.kind === 'boss-step') {
    const b = BOSS_BY_ID[t.boss];
    if (!b) errs.push(`${where}: unknown boss '${t.boss}'`);
    else if (!b.steps[t.index]) errs.push(`${where}: boss '${t.boss}' has no step ${t.index}`);
  } else if (t.kind === 'step') {
    if (!CONCEPT_BY_ID[t.step.concept]) errs.push(`${where}: unknown concept '${t.step.concept}'`);
    checkAnswer(t.step.answer, where, errs);
    if (!t.step.prompt || !t.step.explain || !t.step.hint) errs.push(`${where}: step needs prompt, explain and hint`);
  } else {
    if (!unitConcepts.includes(t.concept)) errs.push(`${where}: gen concept '${t.concept}' not in this region`);
    if (!generatorsFor(t.concept).length) errs.push(`${where}: no generators for '${t.concept}'`);
    checkGens(t.generators, [t.concept], where, errs);
  }
}

/** Validates one region's authored content. Returns human-readable errors (empty = valid). */
export function validateRegion(rc: RegionContent, opts: { final?: boolean } = {}): string[] {
  const errs: string[] = [];
  const r = rc.region;
  const unitConcepts = opts.final ? CONCEPTS.map((c) => c.id) : CONCEPTS.filter((c) => c.unit === r.unit).map((c) => c.id);
  const ids = new Set<string>();
  if (!opts.final && rc.levels.length < 6) errs.push(`${r.id}: only ${rc.levels.length} levels`);

  rc.levels.forEach((l: LevelSpec, i) => {
    const w = `${r.id} level ${i + 1} '${l.id}'`;
    if (ids.has(l.id)) errs.push(`${w}: duplicate id`);
    ids.add(l.id);
    if (!l.title || !l.intro) errs.push(`${w}: needs title and intro`);
    if (!l.concepts.length) errs.push(`${w}: no concepts`);
    l.concepts.forEach((c) => { if (!unitConcepts.includes(c)) errs.push(`${w}: concept '${c}' is not in this region`); });
    checkGens(l.generators, l.concepts, w, errs);
    if (l.type === 'lesson') {
      const steps = CONCEPT_BY_ID[l.concepts[0]]?.lesson ?? [];
      const [a, b] = l.lessonSteps ?? [0, steps.length - 1];
      if (!(a >= 0 && b < steps.length && a <= b)) errs.push(`${w}: lessonSteps [${a}, ${b}] out of range (lesson has ${steps.length} steps)`);
    } else if (l.lessonSteps) errs.push(`${w}: lessonSteps only allowed on 'lesson' levels`);
    if (LAB_TYPES.has(l.type)) {
      if (!widgetFor(l)) errs.push(`${w}: ${l.type} needs a widget (spec.widget or a concept lesson with an interact step)`);
      if (l.widget && !WIDGETS.includes(l.widget.id)) errs.push(`${w}: unknown widget '${l.widget.id}'`);
    }
    if (l.predict) checkInput(l.predict.input, `${w} predict`, errs);
    if (l.type === 'challenge' && !l.hook) errs.push(`${w}: challenge levels need a hook scenario`);
    if ((l.type === 'mixed' || l.type === 'review') && l.concepts.length < 2) errs.push(`${w}: ${l.type} needs ≥2 concepts`);
    if (i >= 2 && rc.levels[i - 1].type === l.type && rc.levels[i - 2].type === l.type) errs.push(`${w}: three '${l.type}' levels in a row — mix the formats`);
  });

  if (!opts.final) {
    // Every concept in the unit is taught in full (each non-summary lesson step exactly once) and practiced in varied formats.
    for (const c of unitConcepts) {
      const lv = rc.levels.filter((l) => l.concepts.includes(c));
      if (lv.length < 3) errs.push(`${r.id}: concept '${c}' appears in only ${lv.length} levels (need ≥3)`);
      const types = new Set(lv.map((l) => l.type));
      if (types.size < 3) errs.push(`${r.id}: concept '${c}' uses only ${types.size} level types (need ≥3)`);
      const steps = CONCEPT_BY_ID[c].lesson;
      const covered = new Map<number, number>();
      rc.levels.filter((l) => l.type === 'lesson' && l.concepts[0] === c).forEach((l) => {
        const [a, b] = l.lessonSteps ?? [0, steps.length - 1];
        for (let i = a; i <= b; i++) covered.set(i, (covered.get(i) ?? 0) + 1);
      });
      steps.forEach((s, i) => {
        if (s.kind === 'summary') return;
        const n = covered.get(i) ?? 0;
        if (n !== 1) errs.push(`${r.id}: lesson step ${i} (${s.kind}) of '${c}' is covered ${n}× by lesson levels (need exactly 1)`);
      });
    }
    const need = miniBossSlots(rc.levels.length).length;
    if (r.miniBosses.length < need) errs.push(`${r.id}: ${need} mini-bosses will be placed but only ${r.miniBosses.length} characters are defined`);
  }

  r.landmarks.forEach((lm) => { if (lm.afterLevel && !ids.has(lm.afterLevel)) errs.push(`${r.id}: landmark '${lm.label}' after unknown level '${lm.afterLevel}'`); });
  if (!r.landmarks.some((lm) => !lm.afterLevel)) errs.push(`${r.id}: needs a gate landmark (one landmark without afterLevel)`);
  if (r.learn.length < 3) errs.push(`${r.id}: "what you'll learn" needs ≥3 bullets`);

  rc.encounters.forEach((e) => {
    const w = `${r.id} encounter '${e.id}'`;
    if (ids.has(e.id)) errs.push(`${w}: id collides with a level`);
    if (!ids.has(e.afterLevel)) errs.push(`${w}: afterLevel '${e.afterLevel}' not found`);
    e.concepts.forEach((c) => { if (!unitConcepts.includes(c)) errs.push(`${w}: concept '${c}' not in region`); });
    if ((e.kind === 'shrine' || e.kind === 'scholar') && !e.question) errs.push(`${w}: ${e.kind} needs a question`);
    if (e.question) checkInput(e.question.input, w, errs);
    if (e.kind === 'lost-formula' && (!e.formula || !FORMULA_BY_ID[e.formula])) errs.push(`${w}: lost-formula needs a valid formula id`);
    if (e.kind === 'lab' && (!e.widget || !WIDGETS.includes(e.widget.id))) errs.push(`${w}: lab needs a valid widget`);
  });

  const b = rc.boss;
  if (!opts.final && !BOSS_BY_ID[b.id]) errs.push(`${r.id}: boss id '${b.id}' must match an existing boss in src/content/boss.ts`);
  if (b.phases.length < 4) errs.push(`${r.id}: boss needs ≥4 phases (has ${b.phases.length})`);
  if (taskCount(b.phases) < 10) errs.push(`${r.id}: boss needs ≥10 tasks (has ${taskCount(b.phases)})`);
  b.phases.forEach((p, pi) => {
    if (!p.tasks.length) errs.push(`${r.id}: boss phase ${pi + 1} is empty`);
    p.tasks.forEach((t, ti) => checkTask(t, unitConcepts, `${r.id} boss phase ${pi + 1} task ${ti + 1}`, errs));
  });
  if (!b.phases.some((p) => p.tasks.some((t) => t.kind === 'step' || t.kind === 'boss-step'))) errs.push(`${r.id}: boss must use authored scenario steps, not only generated questions`);
  return errs;
}

/** Whole-course checks: every concept in the course has a home on the Pathway. */
export function validateCoverage(contents: RegionContent[]): string[] {
  const covered = new Set(contents.flatMap((rc) => rc.levels.flatMap((l) => l.concepts)));
  return CONCEPTS.filter((c) => !covered.has(c.id)).map((c) => `concept '${c.id}' is not on the Pathway`);
}
