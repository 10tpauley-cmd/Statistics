/**
 * THE PATHWAY — data model.
 *
 * AUTHORED CONTENT (src/content/pathway/*) uses the *Spec types below. The builder (./build.ts)
 * turns specs into a playable world: ordered nodes, auto-placed mini-bosses, and per-level segments.
 * Progress lives in the existing learner store (LearnerState.pathway) and every graded item flows
 * through the existing engine (answerQuestion → mastery, mistakes, spaced repetition).
 */
import type { ConceptId, Dimension, InlineInput, LessonStep, QType, Rich, Source, UnitId, VisualSpec, WidgetId } from '../types';
import type { BossStep } from '../../content/boss';

/* ---------------- Cast ---------------- */

export type NpcId = 'quill' | 'vera' | 'juno' | 'odalys' | 'thorne';

export interface NpcLine {
  npc: NpcId;
  text: string; // 1–2 short sentences; supports learning, never padding
}

/* ---------------- Regions ---------------- */

export type RegionTheme = 'village' | 'highlands' | 'observatory' | 'woods' | 'arena' | 'archive';
export type LandmarkKind = 'village' | 'camp' | 'bridge' | 'mountain' | 'tower' | 'castle' | 'observatory' | 'forest' | 'arena' | 'library' | 'river' | 'gate';

export interface RegionSpec {
  id: string; // 'r1'
  unit: UnitId | 'final';
  number: number; // 1..6
  name: string; // "Hearthstone Village"
  subtitle: string; // "Sampling & Data"
  theme: RegionTheme;
  emoji: string;
  quote: string; // intro epigraph, e.g. "Before you can master statistics, you must understand the data itself."
  description: Rich; // 2–3 sentences: what this region is about, in course terms
  learn: string[]; // "What you'll learn" bullets (course topics)
  /** Big environmental landmarks. `afterLevel` places one mid-region; omit for the region gate. */
  landmarks: { kind: LandmarkKind; label: string; afterLevel?: string }[];
  boss: { name: string; title: string; emoji: string; description: string; defeatLine: string };
  /** Mini-boss characters, used in order wherever the builder places mini-bosses. */
  miniBosses: { name: string; emoji: string; taunt: string }[];
}

/* ---------------- Levels ---------------- */

export type LevelType =
  | 'lesson' // 📖 teach a new concept (uses a slice of the concept's lesson)
  | 'practice' // 🧩 apply a concept: worked example → guided → harder → real world → challenge
  | 'lab' // 🔬 interactive simulation with a mission
  | 'graph-lab' // 📊 manipulate / read a graph
  | 'experiment' // 🧪 change variables and observe
  | 'recall' // 🧠 memory-focused retrieval
  | 'challenge' // ⚔️ difficult application, less guidance
  | 'mixed' // 🔀 several concepts interleaved
  | 'precision' // 🎯 target a common mistake
  | 'teach' // 🗣️ explain it yourself (graded by rubric / Claude)
  | 'review'; // 🏆 cumulative review

export interface QuestionPlan {
  concept: ConceptId;
  /** Preferred generator ids (must belong to `concept`). The runtime picks among them with fresh seeds. */
  generators?: string[];
  level: number; // desired difficulty 1..7 (snapped to the generator's nearest level)
  preferTypes?: QType[];
  excludeTypes?: QType[];
}

export interface LevelSpec {
  id: string; // unique, e.g. 'u2-center-1'
  title: string; // evocative but clear: "Finding the Center"
  type: LevelType;
  concepts: ConceptId[]; // primary concept first; 'mixed'/'review' list several
  minutes?: number;
  intro: Rich; // "Today you'll…" — one or two sentences
  npc?: NpcLine; // optional mentor line shown on the intro card
  /** Scenario that opens the level. 'lesson' levels starting at lesson step 0 may omit it (the lesson hook is used). */
  hook?: { title: string; body: Rich; visual?: VisualSpec };
  /** 'lesson' only: inclusive [start, end] indices into the primary concept's lesson steps. */
  lessonSteps?: [number, number];
  /** Discover step for lab / graph-lab / experiment (falls back to the concept lesson's predict step). */
  predict?: { prompt: Rich; input: InlineInput; reveal: Rich };
  /** Interactive for lab / graph-lab / experiment (falls back to the concept lesson's interact step). */
  widget?: { id: WidgetId; props?: Record<string, unknown>; mission: Rich; takeaway: Rich };
  /** Generators to prefer for this level's questions (each must belong to one of `concepts`). */
  generators?: string[];
  /** Extra retrieval prompts (else the concept's recall prompts are used). */
  recall?: { prompt: Rich; answer: Rich }[];
  /** Key takeaways shown on the completion card (else derived from the concept). */
  summary?: Rich[];
}

/* ---------------- Encounters (optional side nodes) ---------------- */

export type EncounterKind = 'shrine' | 'scholar' | 'lost-formula' | 'random' | 'treasure' | 'lab';

export interface EncounterSpec {
  id: string;
  kind: EncounterKind;
  afterLevel: string; // a LevelSpec id in the same region
  title: string;
  concepts: ConceptId[];
  npc?: NpcLine;
  /** shrine/scholar: the conceptual question to answer (mc). lost-formula uses `formula`. lab uses `widget`. */
  question?: { prompt: Rich; input: InlineInput; explain: Rich };
  formula?: string; // formula id for 'lost-formula'
  widget?: { id: WidgetId; props?: Record<string, unknown>; mission: Rich; takeaway: Rich };
}

/* ---------------- Battles ---------------- */

export type PhaseKind = 'recognition' | 'calculation' | 'interpretation' | 'application' | 'final';

export type BattleTask =
  | { kind: 'boss-step'; boss: string; index: number } // reuse a step from src/content/boss.ts
  | { kind: 'step'; step: BossStep; context?: Rich; visual?: VisualSpec } // new authored step
  | { kind: 'gen'; concept: ConceptId; generators?: string[]; level: number; preferTypes?: QType[]; excludeTypes?: QType[] };

export interface BattlePhase {
  title: string; // "Phase 2 — Calculation"
  kind: PhaseKind;
  intro: Rich; // the boss's line / narrative framing for this phase (short)
  tasks: BattleTask[];
}

export interface UnitBossSpec {
  id: string; // matches the existing boss id, e.g. 'boss-u2', so /boss and the Pathway share records
  story: Rich; // opening scenario (dataset context)
  visual?: VisualSpec;
  phases: BattlePhase[];
  source: Source;
}

export interface RegionContent {
  region: RegionSpec;
  levels: LevelSpec[];
  encounters: EncounterSpec[];
  boss: UnitBossSpec;
}

/* ---------------- Built world (runtime) ---------------- */

export type Segment =
  | { kind: 'intro'; title: string; levelType: LevelType; text: Rich; npc?: NpcLine; concepts: ConceptId[]; minutes: number }
  | { kind: 'hook'; title: string; body: Rich; visual?: VisualSpec }
  | { kind: 'lesson-step'; concept: ConceptId; index: number; step: LessonStep; last: boolean }
  | { kind: 'predict'; prompt: Rich; input: InlineInput; reveal: Rich }
  | { kind: 'widget'; widget: WidgetId; props?: Record<string, unknown>; mission: Rich; takeaway: Rich }
  | { kind: 'question'; stage: 'practice' | 'practice2' | 'apply' | 'challenge' | 'check'; plan: QuestionPlan; scaffold: boolean; hints: boolean }
  | { kind: 'misconceptions'; concept: ConceptId; ids: string[] }
  | { kind: 'recall'; concept: ConceptId; prompt: Rich; answer: Rich }
  | { kind: 'teach'; concept: ConceptId }
  | { kind: 'formula-match'; formula: string }
  | { kind: 'mc'; concept: ConceptId; prompt: Rich; input: InlineInput; explain: Rich }
  | { kind: 'complete'; summary: Rich[] };

export type NodeKind = 'level' | 'mini-boss' | 'boss' | 'encounter';

interface NodeBase {
  id: string;
  regionId: string;
  regionIndex: number;
  kind: NodeKind;
  title: string;
  concepts: ConceptId[];
}

export interface LevelNode extends NodeBase {
  kind: 'level';
  number: number; // global level number shown on the map (1..N)
  type: LevelType;
  minutes: number;
  spec: LevelSpec;
}

export interface MiniBossNode extends NodeBase {
  kind: 'mini-boss';
  name: string;
  emoji: string;
  taunt: string;
  covers: string[]; // level ids in the group it tests
  phases: BattlePhase[];
}

export interface BossNode extends NodeBase {
  kind: 'boss';
  bossId: string;
  name: string;
  emoji: string;
  description: string;
  defeatLine: string;
  story: Rich;
  visual?: VisualSpec;
  phases: BattlePhase[];
  final: boolean;
}

export interface EncounterNode extends NodeBase {
  kind: 'encounter';
  encounter: EncounterSpec;
  afterNode: string; // main-path node it branches from
}

export type PathNode = LevelNode | MiniBossNode | BossNode | EncounterNode;

export interface BuiltRegion {
  spec: RegionSpec;
  index: number;
  main: (LevelNode | MiniBossNode | BossNode)[]; // in path order
  encounters: EncounterNode[];
  concepts: ConceptId[];
}

export interface Pathway {
  regions: BuiltRegion[];
  main: (LevelNode | MiniBossNode | BossNode)[]; // every main-path node, in order
  nodes: Record<string, PathNode>;
  levelCount: number;
}

/** Dimensions a battle task primarily tests (used to label phases). */
export const PHASE_DIMS: Record<PhaseKind, Dimension[]> = {
  recognition: ['recognize'],
  calculation: ['calculate'],
  interpretation: ['interpret', 'explain'],
  application: ['apply'],
  final: ['apply', 'interpret', 'calculate'],
};
