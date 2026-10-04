# Stat Lab — FCC MA120 Statistics

An interactive, adaptive learning system built from the FCC MA120 Statistics course packet. It is not a PDF viewer or a flashcard deck. Every concept in the packet becomes a short interactive lesson, simulations you can play with, adaptive practice, spaced review, exams, and a mastery model that cannot be gamed.

Everything runs in the browser. Progress is saved on your device, with nothing to install and no account needed.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm test           # unit tests (stats engine vs. PDF values, generators, learner model)
npm run e2e        # Playwright end-to-end tests (desktop + mobile)
```

The production build is fully static. It uses relative paths and a hash router, so `dist/` works from any static host or straight from disk.

## What's inside

| Area | What you get |
|---|---|
| **Dashboard** | Overall mastery, problems solved, accuracy, study time, streak and level. Also: Continue Learning, Today's Plan (sized to your daily goal), reviews due, weak areas (click one to jump into the lesson or practice), strongest concepts, recent activity, and boss battles. |
| **Course path** | 5 units and 32 concepts, in the order the ideas build. Each concept shows its status, mastery ring, lesson progress and source pages. |
| **Lessons** | Hook → predict → explain → interact → check → worked example → formula → recall → summary. Predictions are never graded. Checks give feedback specific to each misconception. A "Why does this work?" mode is available on every concept. |
| **Simulation lab** | 25 interactives, including: the sampling methods on the wood-duck park, drag-the-data mean vs. median, building the standard deviation, box plots, outlier fences, correlation, fitting your own least-squares line, residuals (linear/quadratic/exponential), the law of large numbers, two-dice events, tree diagrams, two-way table conditioning, the binomial explorer, and the buzzer-beater free throws. |
| **Practice** | Adaptive modes: smart, single concept, mixed (interleaved), "which method?", graph reading, a 5-minute quiz, fix-my-mistakes, and retrieval challenges. There are 7 difficulty levels; you move up after clean solves and back down after misses. Guided multi-step scaffolding is on at low levels. |
| **Hints** | Progressive hints: concept clue → formula → what matters → first step → full walkthrough. Every hint lowers mastery credit a little. |
| **Calculator** | Describe data, frequency tables, z-score/percentile, regression and r, probability rules, expected value, binomial, and at-least-one/uniform. Each result shows **Your answer / How we got there / What this means**. |
| **Formula sheet** | For every formula: what each symbol means, when to use it, when not to, a memory trick, a step-by-step example, the common mistake, and a "Your turn" problem. Searchable, with a quick-sheet view. |
| **Glossary** | About 100 terms, each with a definition, intuition, example, related terms and source page. |
| **Concept map** | How every concept connects, with prerequisite arrows and live mastery on each node. |
| **Daily review** | Spaced repetition on a 1 → 3 → 7 → 14 → 30 → 60 → 120 day ladder, with a memory-strength view. |
| **Exams** | Exam #1, Exam #2, unit tests, and a final mastery exam. Timed or untimed, with no hints and no feedback until the end. The report shows results by unit and concept, your most common error, recommended next lessons, and a question-by-question review. |
| **Teach It** | Explain a concept in your own words and get rubric feedback. Explaining is required for mastery. |
| **Boss battles** | One multi-stage, real-world problem per unit, built on the course's own scenarios. |
| **Placement test** | 17 questions to find your starting level. Placement can never mark a concept as mastered. |
| **Mistake bank** | Every miss is grouped by the misconception behind it and shown with its fix. Retrying fresh variants resolves mistakes. |
| **Mu 🐣** | A bell-curve mascot you can call any time (press **?**). It knows what's on your screen: it can drop the next hint into your problem, explain the current concept, share memory tricks and common traps, and tell you what to study next. |
| **Also** | Global search (**Ctrl/⌘ K** or **/**), bookmarks, per-concept notes, focus mode with a timer, session summaries, progress analytics, achievements, dark mode, adjustable text size, reduced motion, and export/import of your data. |

## AI feedback (optional)

Without a key, everything works offline. Written answers are checked against a rubric, and Mu answers from the glossary, formula sheet and planner.

To get detailed AI feedback, open **Settings → AI tutor** and paste your own Claude API key. With a key:

- **Free-response, Teach It and boss explanations** are graded by Claude against the concept's rubric. You get a score, what you got right, what's missing, misconceptions with corrections, a clarity rating, an improved answer and a follow-up question.
- **Mu** becomes a full tutor that streams its replies. It will not reveal the final answer to a problem you haven't answered yet.

The key is stored only in your browser's local storage and sent only to Anthropic's API. It is never included in exported backups. The SDK is loaded only when an AI feature is actually used.

## Scope and source traceability

The course packet is the source of truth (see [`docs/CURRICULUM.md`](docs/CURRICULUM.md) for the page-by-page knowledge map).

- Topics follow the packet: sampling and data, describing data, regression (Ch. 12), probability (Ch. 3), and discrete random variables including the binomial (Ch. 4).
- Normal distributions, confidence intervals and hypothesis tests are **not** in the packet, so they are not taught.
- Lessons, formulas, glossary entries and many questions carry a **"Course Source: PDF p. X"** tag.
- Anything added to aid understanding (analogies, the binomial formula behind Stapplet, the "z-score" name) is labeled **Supporting explanation**.
- Calculations follow the course's conventions: quartiles by the Stapplet/TI median-of-halves method, sample standard deviation with n − 1, and least-squares regression ŷ = a + bx. Unit tests check the engine against values printed in the packet.

## How mastery works (no fake mastery)

Each concept tracks evidence in five dimensions: **recognize, calculate, interpret, apply, explain**. A concept counts as *mastered* only when **all** of these are true:

- overall mastery is ≥ 85%,
- every dimension that applies is ≥ 70%,
- you've solved at least one level 5+ problem **without hints**,
- you've explained it (Teach It, a free-response answer, or recall).

The rules that stop the model from being gamed:

- Repeating the same question earns almost nothing. Repeating the same question *type* gives diminishing returns.
- Hints and walkthroughs reduce credit.
- Mastery decays when a review is overdue.
- Placement only seeds low-weight evidence.

Completing a lesson schedules your first review. It does not mark the concept as mastered.

## Architecture

```
src/
  content/        Course content as typed data (units, concepts + lessons, formulas, glossary,
                  misconceptions, datasets, boss problems). No UI code.
  engine/         Logic: question generators (seeded, 7 levels), grading, offline rubric checks,
                  learner model, spaced repetition, planner, exams, achievements.
  lib/stats/      Statistics engine (descriptive, regression, probability, formatting, RNG).
  lib/ai.ts       Claude integration (structured grading + streaming tutor), loaded lazily.
  state/          Local-storage store with versioned hydration, actions, tutor focus, UI state.
  components/     Charts (SVG, accessible tooltips + data tables), interactive widgets, lesson
                  player, question card, calculator, mascot, layout.
  pages/          One file per route.
```

To add or edit course content, change only `src/content/*`. The engine and UI pick it up automatically, and the generator tests check that every concept can still earn every kind of mastery evidence.
