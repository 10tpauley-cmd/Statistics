import type { RegionContent } from '../../engine/pathway/types';

/** Region 6 — the cumulative finale. Every unit returns, interleaved, ending with the Grand Archivist. */
export const REGION_FINAL: RegionContent = {
  region: {
    id: 'r6', unit: 'final', number: 6, name: 'The Grand Statistical Archive', subtitle: 'Cumulative mastery',
    theme: 'archive', emoji: '🏛️',
    quote: 'Every road you traveled was a chapter. The Archive asks you to read them all at once.',
    description: 'The Archive holds the whole course: how data is gathered, described, related, and reasoned about with probability. Here the units mix — just like on a real final exam — and you must recognize which tool each situation needs.',
    learn: ['Choose the right method when topics are mixed', 'Connect sampling, description, regression, and probability', 'Explain conclusions in context, without hints', 'Defeat the Grand Archivist to complete the journey'],
    landmarks: [{ kind: 'library', label: 'The Grand Archive' }, { kind: 'tower', label: 'Tower of Methods', afterLevel: 'f-mixed-method' }],
    boss: { name: 'The Grand Archivist', title: 'Keeper of Every Chapter', emoji: '📚', description: 'An ancient librarian who has read every dataset ever gathered — and checks whether you truly understood them.', defeatLine: 'The Archivist closes the last book and bows. "You read them all — and understood."' },
    miniBosses: [],
  },
  levels: [
    { id: 'f-review-origins', title: 'Hall of Origins', type: 'review', concepts: ['pop-sample', 'data-types', 'sampling', 'bias', 'experiments'], intro: 'Today you revisit where every study begins: who was measured, how they were chosen, and what can (and cannot) be concluded.', npc: { npc: 'thorne', text: 'Every great analysis is ruined or rescued before a single number is computed.' } },
    { id: 'f-review-describe', title: 'Gallery of Distributions', type: 'review', concepts: ['center', 'shape', 'std-dev', 'boxplots', 'outliers', 'compare'], intro: 'Today you describe data the complete way: shape, center, spread, and outliers — then compare.' },
    { id: 'f-mixed-method', title: 'The Crossroads of Methods', type: 'mixed', concepts: ['center', 'outliers', 'regression', 'conditional', 'binomial'], intro: 'Today the units are shuffled. Before you calculate anything, decide which tool fits the situation.', npc: { npc: 'vera', text: 'Half of a statistics exam is recognizing the question. Don\'t reach for a formula until you know what is being asked.' } },
    { id: 'f-review-relations', title: 'The Constellation Room', type: 'review', concepts: ['scatter', 'correlation', 'regression', 'r-squared', 'residuals'], intro: 'Today you read relationships again: direction, strength, prediction, and how far the model misses.' },
    { id: 'f-review-chance', title: 'Vault of Chance', type: 'review', concepts: ['prob-rules', 'conditional', 'independence', 'trees-venn', 'prob-dist', 'expected-value', 'binomial'], intro: 'Today you combine the probability rules with random variables — the heart of Exam #2.' },
    {
      id: 'f-grand-challenge', title: 'The Archivist\'s Commission', type: 'challenge', concepts: ['compare', 'regression', 'binomial'],
      intro: 'Today you take on full exam-level problems with no scaffolding.',
      hook: { title: 'One commission, three questions', body: 'The Archivist hands you three sealed folders: a comparison of two distributions, a regression prediction, and a game of chance. Each needs the right method **and** a sentence of interpretation in context.' },
    },
    { id: 'f-teach-causation', title: 'The Final Lecture', type: 'teach', concepts: ['experiments'], intro: 'Today you teach the single most important idea in reading research: when can a study show cause and effect?', npc: { npc: 'quill', text: 'If you can explain this to a friend, you will never be fooled by a headline again.' } },
  ],
  encounters: [],
  boss: {
    id: 'boss-final',
    story: 'The Grand Archivist opens five books — one from every region you crossed — and asks you to prove each chapter stayed with you. Then comes a final page that mixes them all.',
    source: { pages: [1, 2, 3, 4, 13, 14, 20, 21, 31, 32, 33, 60, 64, 65], section: 'Cumulative — all units' },
    phases: [
      { title: 'Phase 1 — Origins', kind: 'recognition', intro: '"How was the data gathered? Mistakes here poison everything after."', tasks: [
        { kind: 'boss-step', boss: 'boss-u1', index: 1 },
        { kind: 'boss-step', boss: 'boss-u1', index: 4 },
        { kind: 'gen', concept: 'bias', level: 5, excludeTypes: ['free-response'] },
      ] },
      { title: 'Phase 2 — Description', kind: 'calculation', intro: '"Numbers without shape and spread tell half a story."', tasks: [
        { kind: 'boss-step', boss: 'boss-u2', index: 3 },
        { kind: 'boss-step', boss: 'boss-u2', index: 4 },
        { kind: 'gen', concept: 'std-dev', level: 6, excludeTypes: ['free-response'] },
      ] },
      { title: 'Phase 3 — Relationships', kind: 'interpretation', intro: '"A line through points is a claim. Can you defend it?"', tasks: [
        { kind: 'boss-step', boss: 'boss-u3', index: 2 },
        { kind: 'boss-step', boss: 'boss-u3', index: 5 },
        { kind: 'gen', concept: 'residuals', level: 6, excludeTypes: ['free-response'] },
      ] },
      { title: 'Phase 4 — Chance', kind: 'application', intro: '"Probability punishes intuition. Trust the rules."', tasks: [
        { kind: 'boss-step', boss: 'boss-u4', index: 2 },
        { kind: 'boss-step', boss: 'boss-u5', index: 1 },
        { kind: 'gen', concept: 'expected-value', level: 6, excludeTypes: ['free-response'] },
      ] },
      { title: 'Final Phase — The Last Page', kind: 'final', intro: '"Everything at once. No labels, no hints of which chapter it came from."', tasks: [
        { kind: 'gen', concept: 'compare', level: 6, excludeTypes: ['free-response'] },
        { kind: 'gen', concept: 'conditional', level: 6, excludeTypes: ['free-response'] },
        { kind: 'boss-step', boss: 'boss-u3', index: 6 },
      ] },
    ],
  },
};
