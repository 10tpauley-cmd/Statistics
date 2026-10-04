/**
 * Content + learner schemas. CONTENT (src/content) is pure data typed by these
 * interfaces; APPLICATION LOGIC (src/engine) operates on them. UI never hard-codes lessons.
 */
import type { Rng } from '../lib/stats/random';

export type UnitId = 'u1' | 'u2' | 'u3' | 'u4' | 'u5';

export type ConceptId =
  | 'pop-sample' | 'data-types' | 'cat-displays' | 'sampling' | 'freq-tables' | 'experiments' | 'bias' | 'investigative'
  | 'quant-graphs' | 'center' | 'shape' | 'position' | 'boxplots' | 'range-iqr' | 'std-dev' | 'outliers' | 'z-score' | 'compare'
  | 'scatter' | 'correlation' | 'regression' | 'r-squared' | 'residuals'
  | 'prob-basics' | 'prob-rules' | 'conditional' | 'independence' | 'trees-venn'
  | 'prob-dist' | 'expected-value' | 'transform' | 'binomial';

/** Traceability back to the course PDF. */
export interface Source {
  pages: number[];
  section: string; // e.g. "2.7 Measures of Spread"
  note?: string;
}

/**
 * Rich text mini-markup used in all content strings:
 *   **bold**, *italic*, $inline LaTeX$, $$display LaTeX$$, `code`, and blank-line paragraphs.
 */
export type Rich = string;

export interface Unit {
  id: UnitId;
  number: number;
  title: string;
  subtitle: string;
  chapter: string;
  color: string; // css var name suffix
  sections: Section[];
  exam: string;
}

export interface Section {
  id: string; // "2.7"
  title: string;
  pages: number[];
  concepts: ConceptId[];
}

export type Dimension = 'recognize' | 'calculate' | 'interpret' | 'explain' | 'apply';
export const DIMENSIONS: Dimension[] = ['recognize', 'calculate', 'interpret', 'apply', 'explain'];
export const DIM_LABEL: Record<Dimension, string> = {
  recognize: 'Recognize',
  calculate: 'Calculate',
  interpret: 'Interpret',
  apply: 'Apply',
  explain: 'Explain',
};

export interface Misconception {
  id: string;
  title: string; // "You often confuse…" headline
  short: string; // one-line description of the wrong idea
  fix: Rich; // the correct idea
  concepts: ConceptId[];
}

export interface Formula {
  id: string;
  concept: ConceptId;
  name: string;
  latex: string;
  symbols: { sym: string; meaning: string }[];
  meaning: Rich;
  whenToUse: Rich;
  whenNotToUse: Rich;
  memoryTrick: Rich;
  example: { prompt: Rich; steps: Rich[]; answer: Rich };
  commonMistake: Rich;
  yourTurn?: { prompt: Rich; answer: number; tol: number; hint: Rich };
  source: Source;
  supporting?: boolean; // SUPPORTING EXPLANATION (not printed in the PDF)
}

export interface GlossaryEntry {
  id: string;
  term: string;
  aliases?: string[];
  concept: ConceptId;
  definition: Rich;
  intuition: Rich;
  formula?: string; // formula id
  example: Rich;
  visual?: VisualSpec;
  related: string[]; // glossary ids
  mistake?: Rich;
  source: Source;
}

/* ---------------- Visual specs (rendered by components/charts) ---------------- */

export interface BoxGroup {
  label: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers?: number[];
}

export type VisualSpec =
  | { type: 'histogram'; bins: { lo: number; hi: number; count: number }[]; xLabel?: string; yLabel?: string; relative?: boolean }
  | { type: 'dotplot'; data: number[]; xLabel?: string; highlight?: number[] }
  | { type: 'boxplot'; groups: BoxGroup[]; xLabel?: string }
  | { type: 'scatter'; points: [number, number][]; line?: { a: number; b: number }; xLabel?: string; yLabel?: string; highlight?: number }
  | { type: 'residual'; points: [number, number][]; xLabel?: string }
  | { type: 'table'; headers: string[]; rows: (string | number)[][]; caption?: string; rowHeaders?: boolean }
  | { type: 'venn'; labels: [string, string]; onlyA: string; both: string; onlyB: string; neither: string }
  | { type: 'tree'; root: TreeNode }
  | { type: 'bar'; categories: { label: string; value: number }[]; yLabel?: string; percent?: boolean }
  | { type: 'probdist'; x: number[]; p: number[]; xLabel?: string; highlight?: number[] }
  | { type: 'stemleaf'; rows: { stem: number; leaves: number[] }[]; keyText: string }
  | { type: 'shape'; shape: 'symmetric' | 'right' | 'left' | 'uniform' | 'bimodal' };

export interface TreeNode {
  label: string;
  p?: string; // branch probability label
  children?: TreeNode[];
}

/* ---------------- Lessons ---------------- */

export interface McOption {
  id: string;
  text: Rich;
  correct?: boolean;
  why?: Rich; // why this choice is right/wrong
  misconception?: string; // Misconception id
}

export type InlineInput =
  | { type: 'mc'; options: McOption[] }
  | { type: 'number'; answer: number; tol: number; unit?: string; placeholder?: string }
  | { type: 'slider'; min: number; max: number; step: number; answer: number; tol: number; unit?: string; label?: string };

export type WidgetId =
  | 'drag-mean' | 'spread' | 'correlation' | 'lln' | 'binomial' | 'histogram-builder' | 'residuals'
  | 'outliers' | 'boxplot-builder' | 'sampling' | 'dice' | 'tree' | 'transform' | 'expected-value'
  | 'venn' | 'shape' | 'stemleaf' | 'freq-table' | 'scatter-fit' | 'percentile' | 'zscore' | 'contingency'
  | 'free-throws' | 'experiment-design' | 'bias-spotter';

export type LessonStep =
  | { kind: 'hook'; title: string; body: Rich; visual?: VisualSpec }
  | { kind: 'predict'; prompt: Rich; input: InlineInput; reveal: Rich; visual?: VisualSpec }
  | { kind: 'explain'; title: string; body: Rich; visual?: VisualSpec; source?: Source; supporting?: boolean }
  | { kind: 'interact'; title: string; widget: WidgetId; props?: Record<string, unknown>; prompt: Rich; takeaway: Rich }
  | { kind: 'check'; prompt: Rich; input: InlineInput; explain: Rich; visual?: VisualSpec }
  | { kind: 'worked'; title: string; problem: Rich; steps: { label: string; body: Rich }[]; answer: Rich; source?: Source; visual?: VisualSpec }
  | { kind: 'formula'; formulaId: string }
  | { kind: 'recall'; prompt: Rich; answer: Rich }
  | { kind: 'summary'; points: Rich[] };

export interface TeachRubricItem {
  id: string;
  idea: string; // what a complete explanation includes
  patterns: string[]; // regex sources (case-insensitive) for offline detection
  weight: number;
}

export interface TeachRubric {
  prompt: Rich;
  items: TeachRubricItem[];
  misconceptions: { patterns: string[]; message: string }[];
  model: Rich; // exemplary explanation
}

export interface Concept {
  id: ConceptId;
  unit: UnitId;
  section: string;
  title: string;
  short: string;
  source: Source;
  prereqs: ConceptId[];
  related: ConceptId[];
  confusedWith: { id: ConceptId; why: string }[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  importance: 1 | 2 | 3 | 4 | 5;
  minutes: number;
  dims: Dimension[]; // dimensions that apply to this concept
  know: string[];
  understand: string[];
  calculate: string[];
  interpret: string[];
  misconceptions: string[];
  why: { analogy: Rich; body: Rich };
  memoryTrick: Rich;
  lesson: LessonStep[];
  recall: { prompt: Rich; answer: Rich }[];
  teach: TeachRubric;
  formulas: string[];
  glossary: string[];
}

/* ---------------- Questions ---------------- */

export type QType =
  | 'recognition' | 'calculation' | 'interpretation' | 'conceptual' | 'misconception'
  | 'real-world' | 'graph' | 'multi-step' | 'method' | 'exam' | 'free-response';

export type AnswerSpec =
  | { kind: 'mc'; options: McOption[] }
  | {
      kind: 'numeric';
      value: number;
      tol: number;
      unit?: string;
      accept?: number[]; // equivalent correct values
      wrong?: { value: number; tol?: number; misconception?: string; why: Rich }[];
    }
  | { kind: 'text'; rubric: TeachRubric };

export interface QuestionPart {
  label: string; // "What do we know?"
  prompt: Rich;
  answer: AnswerSpec;
  explain: Rich;
}

export interface Question {
  id: string; // `${generatorId}#${seed}`
  generatorId: string;
  concept: ConceptId;
  level: number; // 1..7
  type: QType;
  dims: Dimension[];
  context?: Rich;
  prompt: Rich;
  visual?: VisualSpec;
  answer: AnswerSpec;
  /** Scaffolded steps (multi-step mode). The last part is the final answer. */
  parts?: QuestionPart[];
  hints: Rich[]; // progressive: concept → formula → values → first step → walkthrough
  solution: Rich[];
  takeaway: Rich; // short reinforcement shown on success
  interpretFollowUp?: QuestionPart; // "What does your answer mean?"
  source?: Source;
  method?: string; // method tag used by method-selection training
  calculator?: boolean;
}

export interface Generator {
  id: string;
  concept: ConceptId;
  title: string;
  levels: number[];
  type: QType;
  dims: Dimension[];
  make: (rng: Rng, level: number) => Question;
}

/* ---------------- Learner model ---------------- */

export interface DimState {
  score: number; // 0..1 EMA of weighted outcomes
  evidence: number; // accumulated weighted evidence
  last: number; // timestamp
}

export interface SrsState {
  step: number; // index into REVIEW_LADDER
  due: number; // timestamp
  last: number;
  reps: number;
  lapses: number;
}

export interface ConceptState {
  dims: Record<Dimension, DimState>;
  level: number;
  upStreak: number;
  downStreak: number;
  attempts: number;
  correct: number;
  hints: number;
  timeMs: number;
  noHintHighLevel: number; // correct, no hints, level ≥ 5
  lastPracticed: number;
  srs: SrsState | null;
  masteredAt?: number;
  placement?: 'known' | 'partial' | 'unknown';
}

export interface Attempt {
  t: number;
  qid: string;
  gen: string;
  concept: ConceptId;
  level: number;
  type: QType;
  correct: boolean;
  partial?: number; // 0..1 for free response / multi-step
  hints: number;
  ms: number;
  mode: StudyMode;
  misconception?: string;
}

export interface MistakeEntry {
  id: string;
  t: number;
  concept: ConceptId;
  type: QType;
  level: number;
  prompt: Rich;
  yourAnswer: string;
  correctAnswer: string;
  why: Rich;
  misconception?: string;
  resolved: boolean;
  qid: string;
  gen: string;
}

export type StudyMode =
  | 'lesson' | 'practice' | 'review' | 'mixed' | 'method' | 'mistakes' | 'exam' | 'final'
  | 'placement' | 'boss' | 'quick' | 'teach' | 'recall' | 'graph' | 'formula' | 'pathway';

export interface SessionRecord {
  id: string;
  start: number;
  end?: number;
  mode: StudyMode;
  concepts: ConceptId[];
  problems: number;
  correct: number;
  hints: number;
  xp: number;
  masteryBefore: Partial<Record<ConceptId, number>>;
  masteryAfter?: Partial<Record<ConceptId, number>>;
  activeMs: number;
}

export interface Bookmark {
  id: string;
  kind: 'concept' | 'formula' | 'question' | 'glossary' | 'mistake' | 'explanation';
  ref: string;
  title: string;
  note?: string;
  t: number;
  snapshot?: Rich;
}

export interface Note {
  id: string;
  concept: ConceptId;
  text: string;
  t: number;
  updated: number;
}

export interface TeachRecord {
  id: string;
  t: number;
  concept: ConceptId;
  text: string;
  score: number; // 0..1
  graded: 'ai' | 'offline';
  feedback: FrqFeedback;
}

export interface ExamRecord {
  id: string;
  t: number;
  kind: 'exam' | 'final' | 'placement';
  scope: string;
  timed: boolean;
  durationMs: number;
  total: number;
  score: number; // 0..1
  byConcept: Partial<Record<ConceptId, { correct: number; total: number }>>;
  misconceptions: Record<string, number>;
  items: { qid: string; concept: ConceptId; correct: boolean; partial?: number; yourAnswer: string; correctAnswer: string; prompt: Rich; misconception?: string }[];
}

export interface FrqFeedback {
  score: number; // 0..100
  verdict: 'excellent' | 'good' | 'partial' | 'needs-work';
  rubric: { id: string; idea: string; met: 'yes' | 'partial' | 'no'; comment: string }[];
  strengths: string[];
  missing: string[];
  misconceptions: { text: string; correction: string }[];
  clarity: { score: number; comment: string };
  improvedAnswer: string;
  followUp: string;
  source: 'ai' | 'offline';
}

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  sound: boolean;
  reducedMotion: boolean;
  mascot: boolean;
  mascotReactions: boolean;
  aiKey: string;
  aiEnabled: boolean;
  dailyGoal: number; // minutes
  examDate: string; // yyyy-mm-dd or ''
  fontScale: number;
  effects: 'full' | 'subtle' | 'off'; // celebratory visual effects
  haptics: boolean; // vibration on supported devices
}

/* ---------------- Pathway progress (lives inside the same learner state) ---------------- */

export interface PathwayLevelRecord {
  stars: number; // best stars earned (0–3)
  best: number; // best accuracy 0..1
  plays: number;
  completedAt?: number;
  step?: number; // resume point while in progress
}

export interface PathwayState {
  levels: Record<string, PathwayLevelRecord>;
  battles: Record<string, { best: number; passed: boolean; t: number; plays: number }>;
  encounters: Record<string, number>;
  introsSeen: string[];
  ceremonies: string[];
  lastVisit: string; // day key of the last Pathway visit
  quickReviews: Record<string, number>; // concept → last quick review time
  completedAt?: number;
}

export interface LearnerState {
  version: number;
  createdAt: number;
  name: string;
  placement: 'pending' | 'done' | 'skipped';
  concepts: Partial<Record<ConceptId, ConceptState>>;
  lessons: Partial<Record<ConceptId, { step: number; completed: boolean; completedAt?: number; perfect?: boolean; checksWrong?: number }>>;
  attempts: Attempt[];
  mistakes: MistakeEntry[];
  sessions: SessionRecord[];
  daily: Record<string, { ms: number; problems: number; correct: number; xp: number }>;
  xp: number;
  streak: { current: number; best: number; lastDay: string };
  achievements: Record<string, number>;
  bookmarks: Bookmark[];
  notes: Note[];
  teach: TeachRecord[];
  exams: ExamRecord[];
  bosses: Record<string, { best: number; t: number; cleared: boolean }>;
  formulasTried: string[];
  pathway: PathwayState;
  settings: Settings;
}
