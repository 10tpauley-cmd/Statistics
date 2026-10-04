# The Pathway — authoring guide

The Pathway is the guided journey through the whole course. It is **generated from data**:

- `src/engine/pathway/types.ts` — the schema (RegionSpec, LevelSpec, EncounterSpec, UnitBossSpec).
- `src/engine/pathway/build.ts` — turns specs into the world: global level numbers, mini-bosses placed automatically (about one every 8–10 levels), boss nodes, and a different segment sequence for each level type.
- `src/engine/pathway/validate.ts` — the rules every region must pass (`npx vitest run tests/pathway-content.test.ts`).
- `src/content/pathway/region-u1.ts … region-u5.ts`, `final.ts` — the authored regions.

Progress is stored in the existing learner state (`LearnerState.pathway`). Every graded item runs through the existing engine (`answerQuestion` → mastery, mistakes, spaced repetition), so the Pathway is the front end and the learning engine stays the brain.

## The course packet is the source of truth

- Use only topics in the unit (see `src/content/units.ts` and `docs/CURRICULUM.md`).
- Scenarios, datasets and numbers come from the packet (page references are in `docs/CURRICULUM.md`; the existing concept lessons already cite them).
- Every number in an authored boss step must be computed, not guessed. Use `src/lib/stats/*`, e.g. with `npx vite-node script.ts`.
- Fantasy flavor is a light frame around real statistics. Keep it short.

## Regions

| Region | Unit | Theme | Name | Boss |
|---|---|---|---|---|
| r1 | u1 Sampling & Data | `village` | Hearthstone Village | The Biased Herald 📯 |
| r2 | u2 Describing Data | `highlands` | The Histogram Highlands | The Skew Wyrm 🐉 |
| r3 | u3 Two Quantitative Variables | `observatory` | The Starfall Observatory | The Trendseer 🔮 |
| r4 | u4 Probability | `woods` | The Whispering Woods of Chance | The Oddskeeper 🎲 |
| r5 | u5 Discrete Random Variables | `arena` | The Arena of Outcomes | The Colossus of Expectation 🗿 |
| r6 | final (cumulative) | `archive` | The Grand Statistical Archive | The Grand Archivist 📚 |

## Cast (use sparingly — at most about one line per three levels)

| id | Character | Role |
|---|---|---|
| `quill` | Professor Quill | Warm statistician mentor; big ideas and why they matter |
| `vera` | Vera the Skeptic | Skeptical researcher; bias, causation, "check the claim" |
| `juno` | Juno the Explorer | Data explorer; graphs, real datasets, "let's look" |
| `odalys` | Odalys the Probability Wizard | Chance, games, counterintuitive probability |
| `thorne` | Archivist Thorne | Formulas, notation, careful recall |

## Level rules (enforced by the validator)

- Levels follow course order and prerequisites, interleaving concepts once they're introduced.
- **Every non-summary step of every concept's lesson is covered by exactly one `lesson` level** (via `lessonSteps: [start, end]`). Long lessons (8+ steps) are usually split across two lesson levels.
- Each concept appears in **at least 3 levels using at least 3 level types**.
- **Never three levels of the same type in a row.**
- `lab` / `graph-lab` / `experiment` need a widget: either `widget: { id, props?, mission, takeaway }` or a concept whose lesson has an interact step. Missions are concrete ("Drag one value to 90 and watch which measure moves").
- `challenge` levels need a `hook` scenario.
- `mixed` / `review` levels need 2 or more concepts; place them before mini-bosses and near the end of the unit.
- Include at least one `teach` level for a key concept per unit, and at least one `challenge`.
- Suggested level counts by amount of material: u1 ≈ 24–26, u2 ≈ 30–32, u3 ≈ 19–21, u4 ≈ 20–22, u5 ≈ 16–18.
- `intro` starts "Today you'll…" (one or two sentences). Titles are evocative but make the concept obvious.
- Define enough `miniBosses` characters for the automatic slots (3–4 is safe), each with a name, emoji and one-line taunt.

## Encounters (optional side nodes)

There are 3–4 per region, of varied kinds:

- `shrine` / `scholar`: one conceptual multiple-choice question with exactly one correct option, each option with `why`.
- `lost-formula`: a formula id from this unit.
- `lab`: a widget with a mission.
- `random` / `treasure`: just `concepts` (the runtime generates the challenge).

## Unit boss battles

- `boss.id` must equal the existing boss (`boss-u1` … `boss-u5`) so `/boss` and the Pathway share records.
- 4–5 phases (`recognition`, `calculation`, `interpretation`, `application`, `final`), with 10–14 tasks in total.
- Reuse every existing step (`{ kind: 'boss-step', boss, index }`). Add 3–6 new authored `step` tasks grounded in the boss's scenario or other packet data, plus 1–3 `gen` tasks.
- The final phase ends with the existing written-explanation step.
- Each phase `intro` is the boss's short line.
