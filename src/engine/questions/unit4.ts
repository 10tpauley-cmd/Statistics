import type { Generator, TreeNode } from '../types';
import type { Rng } from '../../lib/stats/random';
import { build, gen, mc, num, part, f, type Opt } from './helpers';
import { fracStr } from '../../lib/stats/format';
import { TABLES } from '../../content/datasets';

const p2 = (x: number) => Math.round(x * 100) / 100;

/* ---------------- Basics ---------------- */

const basics: Generator[] = [
  gen('pb-space', 'prob-basics', 'Sample space', [1, 2, 3], 'recognition', (rng, level) => {
    const items = [
      { e: 'Tossing two coins', a: '{HH, HT, TH, TT}', w: ['{HH, HT, TT}', '{H, T}', '{0, 1, 2}'], why: 'HT and TH are different outcomes.' },
      { e: 'Picking a one-digit number at random', a: '{0, 1, 2, …, 9}', w: ['{1, 2, …, 9}', '{1, 2, …, 10}', '{0, 1}'], why: 'Zero is a one-digit number.' },
      { e: 'Asking four people their favorite color and counting how many say "red"', a: '{0, 1, 2, 3, 4}', w: ['{1, 2, 3, 4}', '{red, not red}', '{red, blue, green, yellow}'], why: 'We count reds, from 0 to 4.' },
      { e: 'Drawing a marble from a bag with two red, three white, and one blue marble', a: '{R, W, B}', w: ['{R, R, W, W, W, B}', '{2, 3, 1}', '{R, W}'], why: 'The possible colors are red, white, and blue.' },
    ];
    const it = rng.pick(items);
    return build({
      concept: 'prob-basics', level, type: 'recognition',
      prompt: `What is the sample space for: **${it.e}**?`,
      answer: mc(rng, [[it.a, true, it.why], ...it.w.map((w): Opt => [w, false, it.why])]),
      hints: ['List every possible outcome of one run of the experiment.'],
      solution: [`S = ${it.a}. ${it.why}`],
      takeaway: 'Define the outcome first, then list them all.',
      source: { pages: [31], section: '3.1 Example 1' },
    });
  }),
  gen('pb-equally', 'prob-basics', 'Equally likely outcomes', [1, 2, 3], 'calculation', (rng, level) => {
    const kind = rng.pick(['marbles', 'cards', 'die', 'spinner'] as const);
    let ctx = ''; let fav = 0; let tot = 0; let ev = '';
    if (kind === 'marbles') { const r = rng.int(2, 8), w = rng.int(2, 8), b = rng.int(1, 6); tot = r + w + b; const c = rng.pick(['red', 'white', 'blue']); fav = c === 'red' ? r : c === 'white' ? w : b; ctx = `A bag holds ${r} red, ${w} white, and ${b} blue marbles. One is drawn at random.`; ev = `the marble is ${c}`; }
    if (kind === 'cards') { tot = 52; const c = rng.pick([['a heart', 13], ['a king', 4], ['a red card', 26], ['a face card (J, Q, K)', 12]] as const); fav = c[1]; ev = `the card is ${c[0]}`; ctx = 'One card is drawn from a standard 52-card deck.'; }
    if (kind === 'die') { tot = 6; const c = rng.pick([['less than 5', 4], ['even', 3], ['a 1', 1], ['greater than 4', 2]] as const); fav = c[1]; ev = `the roll is ${c[0]}`; ctx = 'A fair six-sided die is rolled.'; }
    if (kind === 'spinner') { tot = 16; fav = rng.pick([8, 4, 3, 1]); ev = `the spinner lands on one of ${fav} specific sections`; ctx = 'A spinner has 16 equal sections.'; }
    const v = fav / tot;
    return build({
      concept: 'prob-basics', level, type: 'calculation', context: ctx,
      prompt: `Find the probability that ${ev}. (Fraction or decimal.)`,
      answer: num(v, 0.002),
      hints: ['P(A) = favorable outcomes ÷ total outcomes.', `Total outcomes: ${tot}.`, `Favorable outcomes: ${fav}.`],
      solution: [`${fav}/${tot} = **${fracStr(fav, tot)}** ≈ ${f(v, 4)}`],
      takeaway: 'Equally likely: want ÷ could.',
    });
  }),
  gen('pb-valid', 'prob-basics', 'What can be a probability?', [1, 2], 'misconception', (rng, level) => {
    const bad = rng.pick(['1.2', '−0.3', '115%', '7/5']);
    const goods = rng.sample(['0', '1', '0.999', '3/8', '45%', '0.04'], 3);
    return build({
      concept: 'prob-basics', level, type: 'misconception',
      prompt: 'Which value **cannot** be a probability?',
      answer: mc(rng, [[bad, true, 'Probabilities must be between 0 and 1.'], ...goods.map((g): Opt => [g, false, `${g} is between 0 and 1, so it is a valid probability.`, 'prob-range'])]),
      hints: ['Every probability is between 0 and 1 (0% to 100%).'],
      solution: [`${bad} is outside [0, 1].`],
      takeaway: '0 ≤ P(A) ≤ 1.',
    });
  }),
  gen('pb-lln', 'prob-basics', 'Experimental vs. theoretical', [3, 4, 5], 'conceptual', (rng, level) => {
    const n = rng.pick([10, 20]);
    const heads = Math.round(n * rng.pick([0.7, 0.3, 0.75]));
    return build({
      concept: 'prob-basics', level, type: 'conceptual',
      context: `A fair coin is flipped ${n} times and lands heads ${heads} times.`,
      prompt: 'What should you expect if you keep flipping, say 10,000 times?',
      answer: mc(rng, [
        ['The proportion of heads should get close to 0.5', true, 'As trials increase, experimental probability approaches theoretical probability.'],
        [`Tails will come up more often to "balance out" the ${heads > n / 2 ? 'extra heads' : 'extra tails'}`, false, 'The coin has no memory; it doesn\'t compensate.', 'lln-gamblers'],
        [`The proportion of heads will stay near ${f(heads / n, 2)}`, false, 'Short runs vary; the long run settles near 0.5.', 'lln-gamblers'],
      ]),
      hints: ['Probability is a long-run relative frequency.'],
      solution: ['With many flips the experimental probability approaches the theoretical 0.5 (Lab #3).'],
      takeaway: 'More trials → experimental ≈ theoretical.',
      source: { pages: [31], section: '3.1 handwritten note' },
    });
  }, ['interpret', 'explain']),
  gen('pb-dice', 'prob-basics', 'Two dice', [2, 3, 4], 'calculation', (rng, level) => {
    const ev = rng.pick([
      { d: 'the sum is 7', c: 6 }, { d: 'the sum is 7 or 11', c: 8 }, { d: 'the dice show different numbers', c: 30 }, { d: 'the sum is at least 10', c: 6 }, { d: 'both dice are even', c: 9 }, { d: 'the sum is 2', c: 1 },
    ]);
    return build({
      concept: 'prob-basics', level, type: 'calculation',
      context: 'Two fair six-sided dice are rolled (36 equally likely outcomes in the dot array).',
      prompt: `Find P(${ev.d}).`,
      answer: num(ev.c / 36, 0.002, { wrong: [{ value: ev.c / 11, misconception: 'sample-space', why: 'There are 36 equally likely outcomes, not 11 possible sums.' }] }),
      hints: ['Use the 6 × 6 dot array: 36 outcomes.', 'Count the dots that satisfy the event.'],
      solution: [`${ev.c} of 36 outcomes → **${fracStr(ev.c, 36)}** ≈ ${f(ev.c / 36, 4)}`],
      takeaway: 'Two dice → 36 equally likely outcomes.',
      source: { pages: [33], section: '3.1–3.5 Example 7' },
    });
  }),
];

/* ---------------- Rules ---------------- */

const rules: Generator[] = [
  gen('pr-or', 'prob-rules', 'Addition rule', [2, 3, 4], 'calculation', (rng, level) => {
    const N = rng.pick([200, 300, 400, 250]);
    const a = rng.int(Math.round(N * 0.2), Math.round(N * 0.5));
    const b = rng.int(Math.round(N * 0.2), Math.round(N * 0.5));
    const both = rng.int(Math.round(Math.min(a, b) * 0.2), Math.round(Math.min(a, b) * 0.7));
    const ctx = rng.pick([['play a sport', 'are in an extracurricular'], ['have a part-time job', 'take an online class'], ['own a gaming console', 'have a Netflix account']]);
    const v = (a + b - both) / N;
    return build({
      concept: 'prob-rules', level, type: 'calculation',
      context: `At a school of ${N} students, ${a} ${ctx[0]}, ${b} ${ctx[1]}, and ${both} do both.`,
      prompt: `What is the probability a randomly selected student ${ctx[0]} **or** ${ctx[1]}?`,
      answer: num(v, 0.002, { wrong: [{ value: (a + b) / N, misconception: 'or-double-count', why: `The ${both} students who do both were counted twice — subtract them once.` }, { value: both / N, misconception: 'wrong-method', why: 'That is "and", not "or".' }] }),
      hints: ['"Or" → addition rule.', 'P(A or B) = P(A) + P(B) − P(A and B).', `${a}/${N} + ${b}/${N} − ${both}/${N}.`],
      solution: [`(${a} + ${b} − ${both})/${N} = ${a + b - both}/${N} = **${f(v, 4)}**`],
      takeaway: 'Add, then subtract the overlap.',
      source: { pages: [6], section: '3.1–3.5 Practice #6 (style)' },
    });
  }),
  gen('pr-neither', 'prob-rules', 'Neither (Venn)', [3, 4, 5], 'calculation', (rng, level) => {
    const pa = p2(rng.float(0.3, 0.6)); const pb = p2(rng.float(0.4, 0.8)); const both = p2(Math.min(pa, pb) * rng.float(0.3, 0.8));
    const or = pa + pb - both;
    if (or > 1) return build({ concept: 'prob-rules', level, type: 'calculation', context: 'At a car rental lot, 42% of cars are four-door sedans (F), 77% have Bluetooth (B), and 31% are both.', prompt: 'Find P(neither F nor B).', answer: num(0.12, 0.002), hints: ['P(neither) = 1 − P(F or B).'], solution: ['P(F or B) = 0.42 + 0.77 − 0.31 = 0.88 → 1 − 0.88 = **0.12**'], takeaway: 'Neither = 1 − P(A or B).', source: { pages: [35], section: '3.1–3.5 Example 7' } });
    const v = 1 - or;
    const ctx = rng.pick([['are four-door sedans', 'have Bluetooth', 'cars on a rental lot'], ['play poker', 'swim', 'members of a country club'], ['wear a team jersey', 'root for the home team', 'fans at a game']]);
    return build({
      concept: 'prob-rules', level, type: 'calculation',
      context: `Among ${ctx[2]}, ${f(pa * 100, 0)}% ${ctx[0]}, ${f(pb * 100, 0)}% ${ctx[1]}, and ${f(both * 100, 0)}% do both.`,
      prompt: 'Find the probability that a randomly selected one does **neither**.',
      visual: { type: 'venn', labels: ['A', 'B'], onlyA: '?', both: f(both, 2), onlyB: '?', neither: '?' },
      answer: num(v, 0.002, { wrong: [{ value: 1 - pa - pb, misconception: 'or-double-count', why: 'Subtract the overlap when computing P(A or B) first.' }] }),
      hints: ['Neither = 1 − P(A or B).', `P(A or B) = ${pa} + ${pb} − ${both}.`],
      solution: [`P(A or B) = ${f(or, 2)}`, `1 − ${f(or, 2)} = **${f(v, 2)}**`],
      takeaway: 'Neither = complement of "or".',
    });
  }),
  gen('pr-mutex', 'prob-rules', 'Mutually exclusive?', [3, 4, 5], 'conceptual', (rng, level) => {
    const items = [
      { a: 'a senior plans to enroll in college right after graduation', b: 'the same senior plans to work full-time right after graduation (as their plan)', me: true },
      { a: 'a car is a four-door sedan', b: 'the car has Bluetooth', me: false },
      { a: 'a rolled die shows an even number', b: 'the die shows a 5', me: true },
      { a: 'a student plays a sport', b: 'the student plans to attend college', me: false },
      { a: 'a drawn card is a heart', b: 'the card is a king', me: false },
    ];
    const it = rng.pick(items);
    return build({
      concept: 'prob-rules', level, type: 'conceptual',
      prompt: `Are these events mutually exclusive? A: ${it.a}. B: ${it.b}.`,
      answer: mc(rng, [['Yes — they cannot happen at the same time', it.me, it.me ? 'There is no outcome in both events.' : 'They can happen together (there is overlap).'], ['No — they can happen at the same time', !it.me, !it.me ? 'There is an overlap, so P(A and B) > 0.' : 'They can\'t both happen.']], false),
      hints: ['Can a single outcome belong to both events?'],
      solution: [it.me ? 'No overlap → mutually exclusive → P(A or B) = P(A) + P(B).' : 'Overlap exists → not mutually exclusive → subtract P(A and B).'],
      takeaway: 'Mutually exclusive = no overlap.',
      source: { pages: [33], section: '3.1–3.5 Example 6' },
    });
  }),
  gen('pr-words', 'prob-rules', 'Read the symbols', [1, 2, 3], 'recognition', (rng, level) => {
    const ev = rng.pick([
      { s: "H'", w: 'Selecting a player who is not a great hitter' },
      { s: 'I and H', w: 'Selecting a player who is an infielder and a great hitter' },
      { s: "O or H'", w: 'Selecting a player who is an outfielder or is not a great hitter' },
      { s: 'O | H', w: 'Selecting an outfielder, given that they are a great hitter' },
      { s: 'H | O', w: 'Selecting a great hitter, given that they are an outfielder' },
    ]);
    const others = ['Selecting a player who is not a great hitter', 'Selecting a player who is an infielder and a great hitter', 'Selecting a player who is an outfielder or is not a great hitter', 'Selecting an outfielder, given that they are a great hitter', 'Selecting a great hitter, given that they are an outfielder'].filter((x) => x !== ev.w);
    return build({
      concept: 'prob-rules', level, type: 'recognition',
      context: 'Baseball team: I = infielder, O = outfielder, H = great hitter.',
      prompt: `What does **${ev.s}** mean?`,
      answer: mc(rng, [[ev.w, true, 'Correct reading.'], ...rng.sample(others, 3).map((o): Opt => [o, false, '′ = not; and = both; or = either; | = given.', o.includes('given') && ev.s.includes('|') ? 'cond-reversed' : undefined])]),
      hints: ['′ means "not". "|" means "given".'],
      solution: [`${ev.s}: ${ev.w}.`],
      takeaway: 'Symbols: ′ not, and, or, | given.',
      source: { pages: [5], section: '3.1–3.5 Practice #1' },
    });
  }),
];

/* ---------------- Conditional ---------------- */

function randTable(rng: Rng) {
  const rows = rng.pick([['9th', '10th', '11th'], ['Freshman', 'Sophomore', 'Junior', 'Senior'], ['Cats', 'Dogs', 'No pet']]);
  const cols = rng.pick([['Yes', 'No'], ['Pizza', 'Tacos', 'Burgers'], ['Morning', 'Night']]);
  const counts = rows.map(() => cols.map(() => rng.int(4, 30)));
  return { rows, cols, counts };
}

const conditional: Generator[] = [
  gen('cd-table', 'conditional', 'Conditional from a two-way table', [2, 3, 4, 5], 'calculation', (rng, level) => {
    const usePdf = rng.bool(0.5);
    const t = usePdf ? rng.pick(TABLES.filter((x) => x.id !== 'medals')) : { ...randTable(rng), title: 'Survey results', rowVar: 'Group', colVar: 'Choice', source: undefined };
    const i = rng.int(0, t.rows.length - 1); const j = rng.int(0, t.cols.length - 1);
    const cell = t.counts[i][j];
    const rowTot = t.counts[i].reduce((a, b) => a + b, 0);
    const colTot = t.counts.reduce((a, r) => a + r[j], 0);
    const grand = t.counts.flat().reduce((a, b) => a + b, 0);
    const givenRow = rng.bool();
    const v = givenRow ? cell / rowTot : cell / colTot;
    const prompt = givenRow ? `P(${t.cols[j]} | ${t.rows[i]})` : `P(${t.rows[i]} | ${t.cols[j]})`;
    return build({
      concept: 'conditional', level, type: 'calculation',
      context: `${t.title}. One person is selected at random.`,
      visual: { type: 'table', headers: ['', ...t.cols, 'Total'], rows: [...t.rows.map((r, k) => [r, ...t.counts[k], t.counts[k].reduce((a, b) => a + b, 0)]), ['Total', ...t.cols.map((_, c) => t.counts.reduce((a, rr) => a + rr[c], 0)), grand]], rowHeaders: true },
      prompt: `Find **${prompt}**.`,
      answer: num(v, 0.002, { wrong: [
        { value: cell / grand, misconception: 'cond-grand-total', why: 'Divide by the total of the given group, not the grand total.' },
        { value: givenRow ? cell / colTot : cell / rowTot, misconception: 'cond-reversed', why: 'That reverses the condition — the event after | is the denominator.' },
      ].filter((w) => Math.abs(w.value - v) > 1e-9) }),
      hints: ['The event after "|" is the given — it becomes the new sample space.', givenRow ? `Use only the ${t.rows[i]} row: total ${rowTot}.` : `Use only the ${t.cols[j]} column: total ${colTot}.`, `The count in both is ${cell}.`],
      solution: [`${cell} ÷ ${givenRow ? rowTot : colTot} = **${fracStr(cell, givenRow ? rowTot : colTot)}** ≈ ${f(v, 4)}`],
      takeaway: 'Given → denominator.',
      source: 'source' in t && t.source ? t.source : undefined,
    });
  }),
  gen('cd-formula', 'conditional', 'Conditional from percents', [3, 4, 5], 'calculation', (rng, level) => {
    const it = rng.pick([
      { c: `At a country club, ${73}% of members play poker and swim; ${82}% play poker.`, q: 'P(swim | poker)', and: 0.73, given: 0.82, src: [6] },
      { c: '48% of Marylanders support a law; 51% are over 45; 36.72% are over 45 and support it.', q: 'P(support | over 45)', and: 0.3672, given: 0.51, src: [6, 7] },
      { c: `${rng.int(20, 35)}% of shoppers buy coffee and a pastry; ${rng.int(45, 70)}% buy coffee.`, q: 'P(pastry | coffee)', and: 0, given: 0 },
    ]);
    let and = it.and; let given = it.given;
    if (!and) { const m = it.c.match(/(\d+)% of shoppers buy coffee and a pastry; (\d+)%/)!; and = +m[1] / 100; given = +m[2] / 100; }
    const v = and / given;
    return build({
      concept: 'conditional', level, type: 'calculation', context: it.c,
      prompt: `Find **${it.q}**.`,
      answer: num(v, 0.002, { wrong: [{ value: and, misconception: 'cond-grand-total', why: 'That is P(A and B). Divide by P(given).' }, { value: and * given, misconception: 'wrong-method', why: 'Divide, don\'t multiply.' }] }),
      hints: ['P(A | B) = P(A and B) ÷ P(B).', `P(A and B) = ${and}; P(B) = ${given}.`],
      solution: [`${and} ÷ ${given} = **${f(v, 4)}**`],
      takeaway: 'Conditional = both ÷ given.',
      source: it.src ? { pages: it.src, section: '3.1–3.5 Practice #5, #8' } : undefined,
    });
  }),
  gen('cd-frq', 'conditional', 'Interpret a conditional probability (FRQ)', [5, 6, 7], 'free-response', (_rng, level) => {
    return build({
      concept: 'conditional', level, type: 'free-response',
      context: 'Pew Research surveyed 100 mothers in each of 1976, 1994, and 2014. Let C = has 4 or more children and S = surveyed in 2014. P(C | S) = 13/100 = 0.13.',
      prompt: 'Interpret P(C | S) = 0.13 in context.',
      answer: { kind: 'text', rubric: { prompt: 'Interpret P(C|S).', items: [
        { id: 'given', idea: 'States the condition: given surveyed in 2014', patterns: ['given|among|of (the )?(mothers|those).{0,40}2014|2014'], weight: 1.5 },
        { id: 'event', idea: 'States the event: has 4+ children', patterns: ['(4|four).{0,20}(or more|\\+)? ?child'], weight: 1 },
        { id: 'value', idea: 'Uses 0.13 / 13%', patterns: ['0?\\.13|13 ?%|13 out of'], weight: 1 },
      ], misconceptions: [{ patterns: ['13 ?% of all mothers'], message: 'It is 13% of the 2014 mothers, not of all mothers.' }], model: 'There is a 0.13 probability that a randomly selected mother has four or more children, given that she was surveyed in 2014 — 13 of the 100 mothers surveyed in 2014 had 4+ children.' } },
      hints: ['Use the template: "There is a ___ chance of [event], given that [condition]."'],
      solution: ['13% of mothers surveyed in 2014 had four or more children.'],
      takeaway: 'Always state the condition.',
      source: { pages: [8], section: '3.1–3.5 Practice #13a' },
    });
  }),
];

/* ---------------- Independence ---------------- */

const independence: Generator[] = [
  gen('in-check', 'independence', 'Check independence', [3, 4, 5], 'calculation', (rng, level) => {
    const pa = p2(rng.float(0.2, 0.8)); const pb = p2(rng.float(0.2, 0.6));
    const indep = rng.bool();
    const both = indep ? p2(pa * pb) : p2(pa * pb + rng.pick([-1, 1]) * rng.float(0.03, 0.08));
    const exact = Math.abs(both - pa * pb) < 0.0051;
    return build({
      concept: 'independence', level, type: 'calculation',
      context: `For two events, P(A) = ${pa}, P(B) = ${pb}, and P(A and B) = ${both}.`,
      prompt: 'Are A and B independent?',
      answer: mc(rng, [[`Yes — P(A)·P(B) = ${f(pa * pb, 4)} ≈ P(A and B)`, exact, 'The multiplication rule holds.'], [`No — P(A)·P(B) = ${f(pa * pb, 4)} ≠ P(A and B)`, !exact, 'The multiplication rule fails.'], ['Yes — because P(A and B) > 0', false, 'Overlap doesn\'t tell you about independence.', 'indep-vs-mutex']], false),
      hints: ['Independent ⇔ P(A and B) = P(A)·P(B).', `${pa} × ${pb} = ${f(pa * pb, 4)}.`],
      solution: [`${pa} × ${pb} = ${f(pa * pb, 4)} vs. ${both} → ${exact ? '**independent**' : '**dependent**'}`],
      takeaway: 'Test: does P(A)·P(B) equal P(A and B)?',
      source: { pages: [32], section: '3.1–3.5 Example 4' },
    });
  }),
  gen('in-repeated', 'independence', 'Repeated independent trials', [2, 3, 4], 'calculation', (rng, level) => {
    const p = rng.pick([0.6, 0.75, 0.85, 0.9, 0.3]); const n = rng.int(3, 6);
    const kind = rng.pick(['all', 'none'] as const);
    const ctx = rng.pick([`${f(p * 100, 0)}% of PhD students have a TA role`, `${f(p * 100, 0)}% of students are learning Spanish`, `a player makes ${f(p * 100, 0)}% of free throws`]);
    const v = kind === 'all' ? p ** n : (1 - p) ** n;
    return build({
      concept: 'independence', level, type: 'calculation',
      context: `Suppose ${ctx}. Consider ${n} independent selections/attempts.`,
      prompt: kind === 'all' ? `Find the probability that **all ${n}** are successes.` : `Find the probability that **none** of the ${n} are successes.`,
      answer: num(v, Math.max(0.0005, v * 0.005), { wrong: [{ value: kind === 'all' ? p * n : (1 - p) * n, misconception: 'wrong-method', why: 'Multiply the probabilities (and = multiply), don\'t multiply by n.' }, { value: kind === 'none' ? p ** n : (1 - p) ** n, misconception: 'binom-p-vs-q', why: kind === 'none' ? 'For "none", use the failure probability 1 − p.' : 'Use the success probability.' }] }),
      hints: ['Independent → multiply.', kind === 'none' ? `P(failure) = 1 − ${p} = ${f(1 - p, 2)}.` : `P(success) = ${p}.`, kind === 'none' ? `(${f(1 - p, 2)})^${n}` : `(${p})^${n}`],
      solution: [`${kind === 'all' ? `(${p})` : `(${f(1 - p, 2)})`}^${n} = **${f(v, 5)}**`],
      takeaway: 'Independent "and" → multiply.',
      source: { pages: [5], section: '3.1–3.5 Practice #3' },
    });
  }),
  gen('in-at-least', 'independence', '"At least one"', [3, 4, 5], 'calculation', (rng, level) => {
    const p = rng.pick([0.15, 0.1, 0.2, 0.05, 0.2321]); const n = rng.int(3, 6);
    const ctx = p === 0.2321 ? 'Each patient has a 0.2321 chance of testing positive on a rapid flu test.' : rng.pick([`In a video game, each enemy has a ${f(p * 100, 0)}% chance of being a special enemy.`, `Each package has a ${f(p * 100, 0)}% chance of arriving late.`, `Each free sample has a ${f(p * 100, 0)}% chance of containing a prize.`]);
    const v = 1 - (1 - p) ** n;
    return build({
      concept: 'independence', level, type: 'calculation', context: `${ctx} Consider ${n} independent ${p === 0.2321 ? 'patients' : 'trials'}.`,
      prompt: 'Find the probability of **at least one**.',
      answer: num(v, 0.002, { wrong: [{ value: p * n, misconception: 'at-least-one', why: 'n·p is not a probability of "at least one" — use 1 − P(none).' }, { value: n * p * (1 - p) ** (n - 1), misconception: 'at-least-one', why: 'That is "exactly one". At least one = 1 − P(none).' }, { value: (1 - p) ** n, misconception: 'complement', why: 'That is P(none); subtract it from 1.' }] }),
      hints: ['At least one = 1 − P(none).', `P(none) = (1 − ${p})^${n}.`, `(${f(1 - p, 4)})^${n} = ${f((1 - p) ** n, 4)}.`],
      solution: [`P(none) = ${f(1 - p, 4)}^${n} = ${f((1 - p) ** n, 4)}`, `1 − ${f((1 - p) ** n, 4)} = **${f(v, 4)}**`],
      takeaway: 'At least one = 1 − none.',
      source: { pages: [8], section: '3.1–3.5 Practice #10, #12c' },
    });
  }),
  gen('in-replacement', 'independence', 'With vs. without replacement', [3, 4, 5], 'calculation', (rng, level) => {
    const it = rng.pick([
      { c: 'Two cards are drawn from a standard deck', ev: 'both are hearts', good: 13, tot: 52 },
      { c: 'A circuit has 8 switches, 2 of them defective. Two switches are tested', ev: 'both are defective', good: 2, tot: 8 },
      { c: 'A bag has 5 red and 7 blue marbles. Two are drawn', ev: 'both are red', good: 5, tot: 12 },
    ]);
    const repl = rng.bool();
    const v = repl ? (it.good / it.tot) ** 2 : (it.good / it.tot) * ((it.good - 1) / (it.tot - 1));
    return build({
      concept: 'independence', level, type: 'calculation',
      context: `${it.c} **${repl ? 'with' : 'without'} replacement**.`,
      prompt: `Find the probability that ${it.ev}.`,
      answer: num(v, Math.max(0.0005, v * 0.005), { wrong: [{ value: repl ? (it.good / it.tot) * ((it.good - 1) / (it.tot - 1)) : (it.good / it.tot) ** 2, misconception: 'without-replacement', why: repl ? 'With replacement, the second draw has the same probability.' : 'Without replacement, the second draw has one fewer success and one fewer item.' }] }),
      hints: [repl ? 'With replacement → independent: P(A)·P(B).' : 'Without replacement → dependent: P(A)·P(B | A).', repl ? `(${it.good}/${it.tot})²` : `(${it.good}/${it.tot}) × (${it.good - 1}/${it.tot - 1})`],
      solution: [repl ? `(${it.good}/${it.tot})² = **${f(v, 4)}**` : `(${it.good}/${it.tot})(${it.good - 1}/${it.tot - 1}) = **${f(v, 4)}**`],
      takeaway: 'Replacement keeps draws independent.',
      source: { pages: [33, 5], section: '3.1–3.5 Example 5 / Practice #4' },
    });
  }),
  gen('in-vs-me', 'independence', 'Independent vs. mutually exclusive', [5, 6, 7], 'misconception', (rng, level) => {
    const pa = p2(rng.float(0.2, 0.5)); const pb = p2(rng.float(0.2, 0.4));
    return build({
      concept: 'independence', level, type: 'misconception',
      context: `Events A and B are mutually exclusive, with P(A) = ${pa} and P(B) = ${pb}.`,
      prompt: 'Are A and B independent?',
      answer: mc(rng, [
        [`No — P(A and B) = 0, but P(A)·P(B) = ${f(pa * pb, 4)}, so they are dependent`, true, 'If A happens, B becomes impossible — knowing A changes P(B).'],
        ['Yes — mutually exclusive events are always independent', false, 'This is a classic mix-up. ME events (with P > 0) are dependent.', 'indep-vs-mutex'],
        ['Not enough information', false, 'ME gives P(A and B) = 0, which is enough to check.', 'indep-vs-mutex'],
      ]),
      hints: ['What is P(A and B) for mutually exclusive events? Compare with P(A)·P(B).'],
      solution: [`P(A and B) = 0 ≠ ${f(pa * pb, 4)} = P(A)P(B) → **dependent**.`],
      takeaway: 'Independent ≠ mutually exclusive.',
      source: { pages: [6], section: '3.1–3.5 Practice #7' },
    });
  }, ['interpret', 'explain']),
];

/* ---------------- Trees & Venn ---------------- */

interface TreeCase { title: string; ctx: string; stage1: { label: string; p: number }[]; cond: number[]; ev: string; notEv: string; src?: number[] }
const TREES: TreeCase[] = [
  { title: 'Duck pools', ctx: 'Roll a die: 1–4 → Pool 1 (8 red, 2 gold ducks); 5–6 → Pool 2 (3 red, 7 gold). Draw one duck.', stage1: [{ label: 'Pool 1', p: 4 / 6 }, { label: 'Pool 2', p: 2 / 6 }], cond: [0.2, 0.7], ev: 'Gold', notEv: 'Red', src: [34] },
  { title: 'Jed\'s commute', ctx: 'Jed drives 30%, walks 30%, buses 40% of the time. He is late 3% when driving, 10% when walking, 7% on the bus.', stage1: [{ label: 'Car', p: 0.3 }, { label: 'Walk', p: 0.3 }, { label: 'Bus', p: 0.4 }], cond: [0.03, 0.1, 0.07], ev: 'Late', notEv: 'On time', src: [7] },
  { title: 'Rapid flu test', ctx: '22% of patients have the flu. The test is positive for 96.3% of flu patients and 2.6% of healthy patients.', stage1: [{ label: 'Flu', p: 0.22 }, { label: 'No flu', p: 0.78 }], cond: [0.963, 0.026], ev: 'Test +', notEv: 'Test −', src: [8] },
  { title: 'Factory machines', ctx: 'Machine A makes 60% of phone cases and Machine B 40%. 2% of A\'s cases and 5% of B\'s cases are defective.', stage1: [{ label: 'Machine A', p: 0.6 }, { label: 'Machine B', p: 0.4 }], cond: [0.02, 0.05], ev: 'Defective', notEv: 'OK' },
  { title: 'Weather and traffic', ctx: 'It rains on 25% of days. On rainy days a commuter hits heavy traffic 60% of the time; on dry days, 20%.', stage1: [{ label: 'Rain', p: 0.25 }, { label: 'Dry', p: 0.75 }], cond: [0.6, 0.2], ev: 'Traffic', notEv: 'No traffic' },
];

function treeVisual(t: TreeCase): TreeNode {
  return { label: 'Start', children: t.stage1.map((s, i) => ({ label: s.label, p: f(s.p, 3), children: [{ label: t.ev, p: f(t.cond[i], 3) }, { label: t.notEv, p: f(1 - t.cond[i], 3) }] })) };
}

const treesVenn: Generator[] = [
  gen('tv-total', 'trees-venn', 'Total probability from a tree', [3, 4, 5], 'calculation', (rng, level) => {
    const t = rng.pick(TREES);
    const v = t.stage1.reduce((a, s, i) => a + s.p * t.cond[i], 0);
    return build({
      concept: 'trees-venn', level, type: 'calculation', context: t.ctx,
      visual: level <= 4 ? { type: 'tree', root: treeVisual(t) } : undefined,
      prompt: `Find P(${t.ev}).`,
      answer: num(v, 0.0015, { wrong: [{ value: t.cond.reduce((a, b) => a + b, 0), misconception: 'tree-add-along', why: 'Multiply along each branch first, then add the paths.' }, { value: t.cond.reduce((a, b) => a + b, 0) / t.cond.length, misconception: 'tree-add-along', why: 'The branches aren\'t equally likely — weight each by its first-stage probability.' }] }),
      hints: ['Draw the tree: first stage, then the outcome.', 'Multiply along each path that ends in ' + t.ev + '.', t.stage1.map((s, i) => `${f(s.p, 3)} × ${t.cond[i]}`).join(' + '), 'Add the paths.'],
      solution: [t.stage1.map((s, i) => `(${f(s.p, 3)})(${t.cond[i]})`).join(' + ') + ` = **${f(v, 4)}**`],
      takeaway: 'Multiply down, add across.',
      source: t.src ? { pages: t.src, section: `3.1–3.5 ${t.title}` } : undefined,
    });
  }),
  gen('tv-reverse', 'trees-venn', 'Reverse conditional from a tree', [5, 6, 7], 'multi-step', (rng, level) => {
    const t = rng.pick(TREES);
    const k = rng.int(0, t.stage1.length - 1);
    const total = t.stage1.reduce((a, s, i) => a + s.p * t.cond[i], 0);
    const path = t.stage1[k].p * t.cond[k];
    const v = path / total;
    const parts = [
      part('Path', `Find P(${t.stage1[k].label} and ${t.ev}).`, num(path, 0.0015), `${f(t.stage1[k].p, 3)} × ${t.cond[k]} = ${f(path, 4)}.`),
      part('Total', `Find P(${t.ev}).`, num(total, 0.0015, { wrong: [{ value: t.cond.reduce((a, b) => a + b, 0), misconception: 'tree-add-along', why: 'Multiply along each path before adding.' }] }), `Sum of paths = ${f(total, 4)}.`),
      part('Reverse', `Find P(${t.stage1[k].label} | ${t.ev}).`, num(v, 0.002, { wrong: [{ value: t.cond[k], misconception: 'cond-reversed', why: `That is P(${t.ev} | ${t.stage1[k].label}). Reverse it: path ÷ total.` }] }), `${f(path, 4)} ÷ ${f(total, 4)} = ${f(v, 4)}.`),
    ];
    return build({
      concept: 'trees-venn', level, type: 'multi-step', context: t.ctx,
      prompt: `Given that the outcome was **${t.ev}**, what is the probability it came from **${t.stage1[k].label}**?`,
      answer: parts[2].answer, parts,
      hints: ['This is a reverse conditional: P(first stage | second stage).', 'Numerator: the one path. Denominator: all paths ending in ' + t.ev + '.'],
      solution: [`P(${t.stage1[k].label} and ${t.ev}) = ${f(path, 4)}`, `P(${t.ev}) = ${f(total, 4)}`, `${f(path, 4)}/${f(total, 4)} = **${f(v, 4)}**`],
      takeaway: 'Reverse conditional = path ÷ total of matching paths.',
      source: t.src ? { pages: t.src, section: `3.1–3.5 ${t.title}` } : undefined,
    });
  }, ['calculate', 'apply']),
  gen('tv-venn', 'trees-venn', 'Venn regions', [3, 4, 5], 'calculation', (rng, level) => {
    const pa = p2(rng.float(0.3, 0.6)); const pb = p2(rng.float(0.3, 0.6)); const both = p2(Math.min(pa, pb) * rng.float(0.2, 0.7));
    const ask = rng.pick(['onlyA', 'onlyB', 'neither'] as const);
    const v = ask === 'onlyA' ? pa - both : ask === 'onlyB' ? pb - both : 1 - (pa + pb - both);
    return build({
      concept: 'trees-venn', level, type: 'calculation',
      context: `P(A) = ${pa}, P(B) = ${pb}, P(A and B) = ${both}.`,
      visual: { type: 'venn', labels: ['A', 'B'], onlyA: ask === 'onlyA' ? '?' : f(pa - both, 2), both: f(both, 2), onlyB: ask === 'onlyB' ? '?' : f(pb - both, 2), neither: ask === 'neither' ? '?' : f(1 - (pa + pb - both), 2) },
      prompt: ask === 'onlyA' ? 'Find P(A only) — A but not B.' : ask === 'onlyB' ? 'Find P(B only).' : 'Find P(neither A nor B).',
      answer: num(v, 0.002, { wrong: [{ value: ask === 'onlyA' ? pa : ask === 'onlyB' ? pb : 1 - pa - pb, misconception: ask === 'neither' ? 'or-double-count' : 'venn-only', why: ask === 'neither' ? 'Subtract the overlap in P(A or B).' : 'The circle includes the overlap — subtract P(A and B).' }] }),
      hints: ['Fill in the overlap first, then each "only" region, then neither.', `Only A = ${pa} − ${both}.`],
      solution: [`Only A = ${f(pa - both, 2)}, both = ${both}, only B = ${f(pb - both, 2)}, neither = ${f(1 - (pa + pb - both), 2)}`],
      takeaway: 'Fill a Venn diagram from the middle out.',
      source: { pages: [35], section: '3.1–3.5 Example 7 (car rental)' },
    });
  }),
  gen('tv-coins', 'trees-venn', 'Three coins', [2, 3, 4], 'calculation', (rng, level) => {
    const ev = rng.pick([{ d: 'Tails, Heads, Tails in that order', c: 1 }, { d: 'all the same side', c: 2 }, { d: 'exactly two heads', c: 3 }, { d: 'no heads', c: 1 }, { d: 'at least one head', c: 7 }]);
    return build({
      concept: 'trees-venn', level, type: 'calculation',
      context: 'Three fair coins are flipped in a row (8 equally likely outcomes on the tree).',
      visual: { type: 'tree', root: { label: 'Start', children: ['H', 'T'].map((a) => ({ label: a, p: '1/2', children: ['H', 'T'].map((b) => ({ label: a + b, p: '1/2', children: ['H', 'T'].map((c) => ({ label: a + b + c, p: '1/2' })) })) })) } },
      prompt: `Find P(${ev.d}).`,
      answer: num(ev.c / 8, 0.002),
      hints: ['There are 2 × 2 × 2 = 8 outcomes.', 'List them: HHH, HHT, HTH, HTT, THH, THT, TTH, TTT.'],
      solution: [`${ev.c} of 8 outcomes → **${fracStr(ev.c, 8)}**`],
      takeaway: 'Each path of the tree is an outcome; multiply ½ three times.',
      source: { pages: [34], section: '3.1–3.5 Example 8' },
    });
  }),
];

export const UNIT4_GENERATORS: Generator[] = [...basics, ...rules, ...conditional, ...independence, ...treesVenn];
