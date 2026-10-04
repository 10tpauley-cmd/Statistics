import type { Generator } from '../types';
import type { Rng } from '../../lib/stats/random';
import { build, gen, mc, num, part, f, type Opt } from './helpers';
import { binomMean, binomProb, binomSd, distSd, expectedValue, sumIndependent } from '../../lib/stats/probability';

function randomDist(rng: Rng, k = 5) {
  const x = Array.from({ length: k }, (_, i) => i);
  const raw = x.map(() => rng.int(1, 9));
  const tot = raw.reduce((a, b) => a + b, 0);
  let p = raw.map((r) => Math.round((r / tot) * 100) / 100);
  const diff = Math.round((1 - p.reduce((a, b) => a + b, 0)) * 100) / 100;
  p[p.length - 1] = Math.round((p[p.length - 1] + diff) * 100) / 100;
  if (p.some((v) => v <= 0)) p = x.map(() => Math.round(100 / k) / 100).map((v, i, arr) => (i === arr.length - 1 ? Math.round((1 - v * (k - 1)) * 100) / 100 : v));
  return { x, p };
}

const RV_CTX = [
  { x: 'number of snow days in a school year', unit: 'snow days' },
  { x: 'number of pets a household owns', unit: 'pets' },
  { x: 'number of Pirates of the Caribbean movies a student has seen', unit: 'movies' },
  { x: 'number of cars a family owns', unit: 'cars' },
  { x: 'number of times a student hits snooze', unit: 'snoozes' },
];

/* ---------------- Probability distributions ---------------- */

const probDist: Generator[] = [
  gen('pd-missing', 'prob-dist', 'Missing probability', [1, 2, 3], 'calculation', (rng, level) => {
    const d = randomDist(rng);
    const ctx = rng.pick(RV_CTX);
    const k = rng.int(0, d.x.length - 1);
    return build({
      concept: 'prob-dist', level, type: 'calculation',
      context: `X = ${ctx.x}.`,
      visual: { type: 'table', headers: ['x', ...d.x.map(String)], rows: [['P(x)', ...d.p.map((v, i) => (i === k ? '?' : f(v, 2)))]] },
      prompt: `Find P(X = ${d.x[k]}).`,
      answer: num(d.p[k], 0.001),
      hints: ['All probabilities in a distribution add to 1.', 'Add the known probabilities and subtract from 1.'],
      solution: [`1 − ${f(1 - d.p[k], 2)} = **${f(d.p[k], 2)}**`],
      takeaway: 'ΣP(x) = 1.',
      source: { pages: [3], section: '4.1–4.2 Practice #1b' },
    });
  }),
  gen('pd-valid', 'prob-dist', 'Valid distribution?', [1, 2, 3], 'conceptual', (rng, level) => {
    const good = randomDist(rng, 4).p;
    const badSum = good.map((v, i) => (i === 0 ? Math.round((v + 0.1) * 100) / 100 : v));
    const badNeg = good.map((v, i) => (i === 1 ? -0.1 : i === 2 ? Math.round((v + good[1] + 0.1) * 100) / 100 : v));
    const opts: Opt[] = rng.shuffle([
      [good.map((v) => f(v, 2)).join(', '), true, 'All between 0 and 1, sum = 1.'],
      [badSum.map((v) => f(v, 2)).join(', '), false, `Sum = ${f(badSum.reduce((a, b) => a + b, 0), 2)} ≠ 1.`, 'dist-sum-1'],
      [badNeg.map((v) => f(v, 2)).join(', '), false, 'Contains a negative probability.', 'prob-range'],
    ]);
    return build({
      concept: 'prob-dist', level, type: 'conceptual',
      prompt: 'X takes the values 0, 1, 2, 3. Which list of probabilities makes a **valid** probability distribution?',
      answer: mc(rng, opts, false),
      hints: ['Check: each value between 0 and 1? Do they add to 1?'],
      solution: [`Valid: ${good.map((v) => f(v, 2)).join(', ')}.`],
      takeaway: 'Each P(x) ∈ [0, 1] and ΣP(x) = 1.',
    });
  }),
  gen('pd-range', 'prob-dist', 'More than / at least / at most', [2, 3, 4], 'calculation', (rng, level) => {
    const x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; const p = [0.33, 0.19, 0.14, 0.1, 0.07, 0.05, 0.04, 0.04, 0.02, 0.01, 0.01];
    const k = rng.int(2, 6);
    const op = rng.pick(['>', '≥', '≤', '<'] as const);
    const sumWhere = (fn: (v: number) => boolean) => p.reduce((a, pv, i) => a + (fn(x[i]) ? pv : 0), 0);
    const v = sumWhere(op === '>' ? (t) => t > k : op === '≥' ? (t) => t >= k : op === '≤' ? (t) => t <= k : (t) => t < k);
    const alt = sumWhere(op === '>' ? (t) => t >= k : op === '≥' ? (t) => t > k : op === '≤' ? (t) => t < k : (t) => t <= k);
    const words = { '>': `more than ${k}`, '≥': `at least ${k}`, '≤': `at most ${k}`, '<': `fewer than ${k}` };
    return build({
      concept: 'prob-dist', level, type: 'calculation',
      context: 'X = number of snow days at a Maryland high school in a random year.',
      visual: { type: 'probdist', x, p, xLabel: 'Number of snow days' },
      prompt: `Find P(X ${op} ${k}) — the probability of **${words[op]}** snow days.`,
      answer: num(v, 0.002, { wrong: [{ value: alt, misconception: 'strict-vs-inclusive', why: op === '>' || op === '<' ? `"${words[op]}" does not include ${k}.` : `"${words[op]}" includes ${k}.` }] }),
      hints: [op === '>' || op === '<' ? `Does "${words[op]}" include ${k}? No.` : `Does "${words[op]}" include ${k}? Yes.`, 'Add the probabilities of the included values.'],
      solution: [`Included values: ${x.filter((t) => (op === '>' ? t > k : op === '≥' ? t >= k : op === '≤' ? t <= k : t < k)).join(', ')}`, `Sum = **${f(v, 2)}**`],
      takeaway: '> and < exclude the boundary; ≥ and ≤ include it.',
      source: { pages: [3], section: '4.1–4.2 Practice #1c' },
    });
  }),
  gen('pd-uniform', 'prob-dist', 'Uniform distribution', [3, 4, 5], 'calculation', (rng, level) => {
    const b = rng.pick([60, 120, 180, 30]);
    const c = rng.int(0, Math.floor(b / 2)); const d = rng.int(c + 5, b);
    const ctx = rng.pick([`Y = minutes after 10 am that school ends on an early-dismissal day, uniform from 0 to ${b}.`, `A bus arrives at a uniformly random time in the next ${b} minutes (Y = wait time).`]);
    const v = (d - c) / b;
    return build({
      concept: 'prob-dist', level, type: 'calculation', context: ctx,
      prompt: c === 0 ? `Find P(Y < ${d}).` : `Find P(${c} < Y < ${d}).`,
      answer: num(v, 0.002, { wrong: [{ value: 1 / b, misconception: 'discrete-vs-continuous', why: 'For a continuous uniform variable, probability = length of the interval ÷ total length.' }] }),
      hints: ['Every value is equally likely, so probability = fraction of the interval.', `(${d} − ${c}) ÷ ${b}.`],
      solution: [`(${d} − ${c})/${b} = **${f(v, 4)}**`],
      takeaway: 'Uniform: length wanted ÷ total length.',
      source: { pages: [3], section: '4.1–4.2 Practice #1f' },
    });
  }),
];

/* ---------------- Expected value ---------------- */

const expectedV: Generator[] = [
  gen('ev-compute', 'expected-value', 'Expected value from a table', [2, 3, 4], 'calculation', (rng, level) => {
    const d = randomDist(rng);
    const ctx = rng.pick(RV_CTX);
    const mu = expectedValue(d);
    return build({
      concept: 'expected-value', level, type: 'calculation',
      context: `X = ${ctx.x}.`,
      visual: { type: 'table', headers: ['x', ...d.x.map(String)], rows: [['P(x)', ...d.p.map((v) => f(v, 2))]] },
      prompt: 'Find E(X), the expected value.',
      answer: num(mu, 0.005, { wrong: [{ value: d.x.reduce((a, b) => a + b, 0) / d.x.length, misconception: 'ev-plain-average', why: 'That is a plain average of the x-values. Weight each by its probability.' }] }),
      hints: ['E(X) = Σ x·P(x).', 'Multiply each x by its probability, then add.', d.x.map((x, i) => `${x}(${f(d.p[i], 2)})`).join(' + ')],
      solution: [d.x.map((x, i) => `${x}(${f(d.p[i], 2)})`).join(' + ') + ` = **${f(mu, 3)}**`],
      takeaway: 'Multiply across, add down.',
      interpretFollowUp: part('Interpret', `What does E(X) = ${f(mu, 2)} mean?`, mc(rng, [
        [`In the long run, the average ${ctx.unit.replace(/s$/, '')} count is about ${f(mu, 2)} ${ctx.unit}`, true, 'E(X) is a long-run average.'],
        [`Most often, X equals ${f(mu, 2)}`, false, 'That would be the mode — and E(X) need not be a possible value.', 'ev-must-occur'],
        [`X is always ${f(mu, 2)}`, false, 'Individual values vary around the mean.'],
      ]), 'E(X) is the long-run average of X.'),
      source: { pages: [3, 28], section: '4.1–4.2' },
    });
  }),
  gen('ev-game', 'expected-value', 'Expected winnings of a game', [3, 4, 5], 'real-world', (rng, level) => {
    const kind = rng.pick(['roulette', 'raffle', 'spinner'] as const);
    let x: number[] = []; let p: number[] = []; let ctx = '';
    if (kind === 'roulette') { const bet = rng.pick([10, 20, 50, 100]); x = [bet, -bet]; p = [18 / 38, 20 / 38]; ctx = `American roulette has 18 red, 18 black, and 2 green numbers. You bet $${bet} on black: win $${bet} if black, otherwise lose $${bet}.`; }
    if (kind === 'raffle') { const tix = rng.pick([500, 1000, 2000]); const cost = rng.pick([2, 5, 10]); const prize = rng.pick([250, 500, 1000]); x = [prize - cost, -cost]; p = [1 / tix, 1 - 1 / tix]; ctx = `A charity sells ${tix} raffle tickets for $${cost} each. One winner gets $${prize}. X = your net winnings with one ticket.`; }
    if (kind === 'spinner') { x = [-3, -2, 2, 17]; p = [3 / 16, 8 / 16, 4 / 16, 1 / 16]; ctx = 'A $3 spinner game has 16 equal sections: 3 pay $0, 8 pay $1, 4 pay $5, and 1 pays $20. X = net winnings.'; }
    const mu = expectedValue({ x, p });
    return build({
      concept: 'expected-value', level, type: 'real-world', context: ctx,
      visual: { type: 'table', headers: ['Net winnings x', ...x.map((v) => `$${v}`)], rows: [['P(x)', ...p.map((v) => f(v, 4))]] },
      prompt: 'Find the expected net winnings per play.',
      answer: num(mu, 0.01, { unit: '$', wrong: [{ value: x.reduce((a, b) => a + b, 0) / x.length, misconception: 'ev-plain-average', why: 'Weight each outcome by its probability.' }] }),
      hints: ['E(X) = Σ x·P(x).', x.map((v, i) => `(${v})(${f(p[i], 4)})`).join(' + ')],
      solution: [x.map((v, i) => `(${v})(${f(p[i], 4)})`).join(' + ') + ` = **$${f(mu, 2)}**`, mu < 0 ? 'Negative → players lose money on average in the long run.' : mu === 0 ? 'Fair game.' : 'Positive → players gain on average.'],
      takeaway: 'E(X) < 0 → the house wins in the long run.',
      source: kind === 'roulette' ? { pages: [29], section: '4.1–4.2 Example 2' } : kind === 'spinner' ? { pages: [4], section: '4.1–4.2 Practice #2' } : undefined,
    });
  }, ['apply', 'calculate']),
  gen('ev-fair', 'expected-value', 'Make a game fair', [5, 6, 7], 'exam', (rng, level) => {
    const cost = rng.pick([2, 3, 5]);
    const n = 16;
    const zero = rng.int(2, 4); const ones = rng.int(5, 8); const fives = n - zero - ones - 1;
    // net: -cost, 1-cost, 5-cost, x-cost
    const known = (zero * -cost + ones * (1 - cost) + fives * (5 - cost)) / n;
    const x = -known * n + cost; // (x - cost)/16 = -known
    return build({
      concept: 'expected-value', level, type: 'exam',
      context: `A spinner has ${n} equal sections: ${zero} pay $0, ${ones} pay $1, ${fives} pay $5, and 1 pays a grand prize $G. It costs $${cost} to play.`,
      prompt: 'What grand prize G makes the game **fair** (E = 0)?',
      answer: num(x, 0.01, { unit: '$', wrong: [{ value: x - cost, misconception: 'arithmetic', why: 'Remember the net winnings for the grand prize are G − cost.' }] }),
      hints: ['Fair game → E(net winnings) = 0.', 'Write each net winning: payout − cost.', `0 = ${zero}(−${cost})/16 + ${ones}(${1 - cost})/16 + ${fives}(${5 - cost})/16 + (G − ${cost})/16.`, 'Solve for G.'],
      solution: [`Known part: ${f(known, 4)}`, `(G − ${cost})/16 = ${f(-known, 4)} → G − ${cost} = ${f(-known * 16, 2)}`, `**G = $${f(x, 2)}**`],
      takeaway: 'Fair ⇔ expected value 0.',
      source: { pages: [4], section: '4.1–4.2 Practice #2b' },
    });
  }, ['calculate', 'apply']),
  gen('ev-sd', 'expected-value', 'SD of a random variable', [4, 5, 6], 'calculation', (rng, level) => {
    const d = randomDist(rng, 4);
    const mu = expectedValue(d);
    const s = distSd(d);
    const ex2 = d.x.reduce((a, x, i) => a + x * x * d.p[i], 0);
    return build({
      concept: 'expected-value', level, type: 'calculation',
      context: `X has the distribution below (E(X) = ${f(mu, 3)}).`,
      visual: { type: 'table', headers: ['x', ...d.x.map(String)], rows: [['P(x)', ...d.p.map((v) => f(v, 2))]] },
      prompt: 'Find σ, the standard deviation of X.',
      answer: num(s, 0.01, { wrong: [{ value: Math.sqrt(ex2), misconception: 'var-forget-mu2', why: 'Subtract μ² before taking the square root.' }, { value: ex2 - mu * mu, misconception: 'sd-no-sqrt', why: 'That is the variance; take the square root.' }] }),
      hints: ['σ² = Σx²P(x) − μ².', `Σx²P(x) = ${f(ex2, 4)}.`, `σ² = ${f(ex2, 4)} − ${f(mu, 3)}² = ${f(ex2 - mu * mu, 4)}.`],
      solution: [`Σx²P(x) = ${f(ex2, 4)}`, `σ² = ${f(ex2 - mu * mu, 4)}`, `σ = **${f(s, 3)}**`],
      takeaway: 'Mean of the squares minus square of the mean.',
      source: { pages: [3], section: '4.1–4.2 Practice #1e' },
    });
  }),
  gen('ev-frq', 'expected-value', 'Interpret E(X) (FRQ)', [5, 6, 7], 'free-response', (rng, level) => {
    const bet = rng.pick([20, 50, 100]);
    const mu = (bet * 18 - bet * 20) / 38;
    return build({
      concept: 'expected-value', level, type: 'free-response',
      context: `For a $${bet} bet on black in American roulette, E(X) = −$${f(-mu, 2)}.`,
      prompt: 'Interpret the expected value in context. If someone played 1,000 times, about how much would they expect to lose?',
      answer: { kind: 'text', rubric: { prompt: 'Interpret E(X) and scale to 1000 plays.', items: [
        { id: 'long', idea: 'Long-run average per bet', patterns: ['long.?(run|term)|on average|average|over many'], weight: 1.5 },
        { id: 'value', idea: `Loses about $${f(-mu, 2)} per bet`, patterns: [f(-mu, 2).replace('.', '\\.'), 'lose'], weight: 1 },
        { id: 'thousand', idea: `About $${f(-mu * 1000, 0)} over 1,000 plays`, patterns: [f(-mu * 1000, 0).replace(/(\d)(?=(\d{3})+$)/g, '$1,?'), f(-mu * 1000, 0)], weight: 1 },
      ], misconceptions: [{ patterns: ['every (bet|time)'], message: 'You don\'t lose exactly that amount every bet — it is a long-run average.' }], model: `In the long run, a player loses about $${f(-mu, 2)} per $${bet} bet on average. Over 1,000 plays, they would expect to lose about $${f(-mu * 1000, 0)} (results of individual bets vary a lot).` } },
      hints: ['Expected value = long-run average per play. Multiply by 1,000.'],
      solution: [`About $${f(-mu, 2)} lost per bet on average; ≈ $${f(-mu * 1000, 0)} over 1,000 bets.`],
      takeaway: 'E(X) predicts the long run, not a single play.',
      source: { pages: [29], section: '4.1–4.2 Example 2b–c' },
    });
  }),
];

/* ---------------- Transformations ---------------- */

const transform: Generator[] = [
  gen('tr-linear', 'transform', 'Add or multiply a constant', [2, 3, 4, 5], 'calculation', (rng, level) => {
    const mu = rng.int(-20, 40); const s = rng.int(3, 30);
    const op = rng.pick(['add', 'sub', 'mul', 'div'] as const);
    const c = op === 'mul' ? rng.pick([2, 3, 1.5]) : op === 'div' ? 2 : rng.pick([5, 10, 15]);
    const ask = rng.pick(['mean', 'sd'] as const);
    const newMu = op === 'add' ? mu + c : op === 'sub' ? mu - c : op === 'mul' ? mu * c : mu / c;
    const newSd = op === 'add' || op === 'sub' ? s : op === 'mul' ? s * c : s / c;
    const desc = { add: `add $${c} to every outcome`, sub: `subtract a $${c} fee from every outcome`, mul: `multiply every outcome by ${c}`, div: 'cut every outcome in half' };
    const v = ask === 'mean' ? newMu : newSd;
    return build({
      concept: 'transform', level, type: 'calculation',
      context: `A game's winnings X have mean $${mu} and SD $${s}. You ${desc[op]}.`,
      prompt: `What is the new ${ask === 'mean' ? 'mean' : 'standard deviation'}?`,
      answer: num(v, 0.01, { unit: '$', wrong: ask === 'sd' && (op === 'add' || op === 'sub') ? [{ value: op === 'add' ? s + c : s - c, misconception: 'add-const-sd', why: 'Adding/subtracting a constant does not change spread.' }] : ask === 'sd' && op === 'mul' ? [{ value: s * c * c, misconception: 'mult-const-var', why: 'The SD scales by c; the variance scales by c².' }] : [] }),
      hints: ['Add/subtract → center shifts, spread unchanged.', 'Multiply/divide → center and SD both scale.'],
      solution: [ask === 'mean' ? `New mean = **$${f(newMu, 2)}**` : `New SD = **$${f(newSd, 2)}**`],
      takeaway: 'Add slides; multiply stretches.',
      source: { pages: [30, 29], section: '4.1–4.2 transformation table' },
    });
  }),
  gen('tr-sum', 'transform', 'Sum of two independent random variables', [5, 6, 7], 'multi-step', (rng, level) => {
    const bet = 20; const p1 = rng.pick([0.2, 0.25]); const p2 = rng.pick([0.3, 0.35, 0.4]);
    const X = { x: [-bet, bet], p: [1 - p1, p1] }; const Y = { x: [-bet, bet], p: [1 - p2, p2] };
    const Z = sumIndependent(X, Y);
    const mu = expectedValue(Z); const s = distSd(Z);
    const i0 = Z.x.indexOf(0);
    const parts = [
      part('P(Z = −40)', 'P(lose both)?', num(Z.p[0], 0.002), `(${f(1 - p1, 2)})(${f(1 - p2, 2)}) = ${f(Z.p[0], 4)}.`),
      part('P(Z = 0)', 'P(win one, lose one)?', num(Z.p[i0], 0.002, { wrong: [{ value: (1 - p1) * p2, misconception: 'tree-add-along', why: 'There are two ways to win one and lose one — add both.' }] }), `(${f(1 - p1, 2)})(${p2}) + (${p1})(${f(1 - p2, 2)}) = ${f(Z.p[i0], 4)}.`),
      part('E(Z)', 'Expected value of Z?', num(mu, 0.01), `E(Z) = ${f(mu, 2)}.`),
      part('σ(Z)', 'Standard deviation of Z?', num(s, 0.02), `σ = ${f(s, 2)}.`),
    ];
    return build({
      concept: 'transform', level, type: 'multi-step',
      context: `Two independent $${bet} slot machines: machine 1 doubles your bet with probability ${p1}, machine 2 with probability ${p2}. Each pays +$${bet} on a win and −$${bet} on a loss. Z = total winnings from one play of each.`,
      prompt: 'Build the distribution of Z and find its mean and SD.',
      answer: parts[3].answer, parts,
      hints: ['Z can be −40, 0, or 40.', 'Independent → multiply probabilities. "Win one, lose one" happens two ways.'],
      solution: [`Z: −40 (${f(Z.p[0], 4)}), 0 (${f(Z.p[i0], 4)}), 40 (${f(Z.p[2], 4)})`, `E(Z) = ${f(mu, 2)}, σ = ${f(s, 2)}`],
      takeaway: 'Build the new distribution with the multiplication rule.',
      source: { pages: [4], section: '4.1–4.2 Practice #3' },
    });
  }, ['calculate', 'apply']),
];

/* ---------------- Binomial ---------------- */

const BINOM_CTX = [
  { c: 'A soccer player converts 75% of penalty kicks and takes {n} kicks in practice.', p: 0.75, n: 6, s: 'penalty kicks made', src: [27] },
  { c: 'A student guesses on a {n}-question quiz with 4 choices per question.', p: 0.25, n: 10, s: 'questions correct', src: [25] },
  { c: 'Each of {n} independent traffic lights turns red (forcing a stop) with probability 0.30.', p: 0.3, n: 4, s: 'lights you stop at', src: [27] },
  { c: 'A 72% free-throw shooter takes {n} free throws.', p: 0.72, n: 3, s: 'free throws made', src: [24] },
  { c: 'About 60% of PhD students have a TA role. {n} are selected at random.', p: 0.6, n: 5, s: 'students with a TA role', src: [5] },
  { c: 'A basketball player makes 40% of three-point attempts and takes {n} shots.', p: 0.4, n: 8, s: 'threes made' },
  { c: 'A video game loot box gives a rare item 15% of the time. You open {n} boxes.', p: 0.15, n: 12, s: 'rare items' },
];

const binomial: Generator[] = [
  gen('bn-conditions', 'binomial', 'Is it binomial?', [1, 2, 3, 4], 'conceptual', (rng, level) => {
    const items = [
      { s: 'Guessing on 10 multiple-choice questions, each with 4 choices; X = number correct.', b: true, why: 'Two outcomes, n = 10, independent, p = 0.25 each.' },
      { s: 'Drawing 5 cards **without replacement** from a deck; X = number of hearts.', b: false, why: 'Without replacement, trials are not independent (p changes).' },
      { s: 'Rolling a die until you get a 6; X = number of rolls.', b: false, why: 'The number of trials is not fixed.' },
      { s: 'Stopping at 4 traffic lights that run on a pre-programmed cycle; X = number of red lights.', b: false, why: 'A programmed cycle makes the lights dependent.' },
      { s: 'Taking 6 penalty kicks with a 75% success rate each; X = number made.', b: true, why: 'Two outcomes, fixed n = 6, independent, same p.' },
      { s: 'Measuring the heights of 20 students; X = average height.', b: false, why: 'Not counting successes in yes/no trials.' },
      { s: '250 customers each draw a random card (with replacement); X = number who draw a 3.', b: true, why: 'Fixed n = 250, two outcomes, independent, p = 1/13.' },
    ];
    const it = rng.pick(items);
    return build({
      concept: 'binomial', level, type: 'conceptual', context: it.s,
      prompt: 'Does X follow a binomial distribution?',
      answer: mc(rng, [['Yes', it.b, it.why], ['No', !it.b, it.why, it.b ? undefined : 'binom-conditions']], false),
      hints: ['Check BINS: Binary outcomes, Independent trials, Number of trials fixed, Same p.'],
      solution: [`${it.b ? 'Binomial' : 'Not binomial'}: ${it.why}`],
      takeaway: 'All four conditions must hold.',
      source: { pages: [25, 27], section: '4.3 conditions' },
    });
  }),
  gen('bn-mean-sd', 'binomial', 'Binomial mean and SD', [2, 3, 4], 'calculation', (rng, level) => {
    const b = rng.pick(BINOM_CTX);
    const n = b.n + rng.pick([0, 0, 2, 4]);
    const ask = rng.pick(['mean', 'sd'] as const);
    const v = ask === 'mean' ? binomMean(n, b.p) : binomSd(n, b.p);
    return build({
      concept: 'binomial', level, type: 'calculation',
      context: b.c.replace('{n}', String(n)) + ` X = number of ${b.s}.`,
      prompt: ask === 'mean' ? 'Find the mean μ of X.' : 'Find the standard deviation σ of X.',
      answer: num(v, 0.005, { wrong: ask === 'sd' ? [{ value: n * b.p, misconception: 'binom-sd-np', why: 'np is the mean; σ = √(npq).' }, { value: n * b.p * (1 - b.p), misconception: 'sd-no-sqrt', why: 'npq is the variance; take the square root.' }] : [{ value: n * (1 - b.p), misconception: 'binom-p-vs-q', why: 'Use p, the probability of the outcome being counted.' }] }),
      hints: [`n = ${n}, p = ${b.p}, q = ${f(1 - b.p, 2)}.`, ask === 'mean' ? 'μ = np.' : 'σ = √(npq).'],
      solution: [ask === 'mean' ? `μ = ${n}(${b.p}) = **${f(v, 3)}**` : `σ = √(${n} · ${b.p} · ${f(1 - b.p, 2)}) = **${f(v, 3)}**`],
      takeaway: 'μ = np; σ = √(npq).',
      interpretFollowUp: ask === 'mean' ? part('Interpret', `Interpret μ = ${f(v, 2)}.`, mc(rng, [
        [`In the long run, we expect about ${f(v, 2)} ${b.s} out of ${n}, on average`, true, 'The mean is a long-run average count.'],
        [`Exactly ${f(v, 2)} ${b.s} will happen every time`, false, 'Counts vary; the mean is an average.', 'ev-must-occur'],
        [`The probability of success is ${f(v, 2)}`, false, 'That is p, not μ.', 'binom-p-vs-q'],
      ]), 'Long-run average number of successes.') : undefined,
      source: b.src ? { pages: b.src, section: '4.3' } : undefined,
    });
  }),
  gen('bn-exact', 'binomial', 'Binomial probability', [3, 4, 5], 'calculation', (rng, level) => {
    const b = rng.pick(BINOM_CTX);
    const n = b.n;
    const op = rng.pick(['eq', 'ge', 'le'] as const);
    const k = op === 'eq' ? rng.int(1, n - 1) : op === 'ge' ? rng.int(Math.ceil(n / 2), n) : rng.int(0, Math.floor(n / 2));
    const v = binomProb(n, b.p, op, k);
    const words = { eq: `exactly ${k}`, ge: `at least ${k}`, le: `at most ${k}` };
    const alt = op === 'ge' ? binomProb(n, b.p, 'gt', k) : op === 'le' ? binomProb(n, b.p, 'lt', k) : b.p ** k;
    return build({
      concept: 'binomial', level, type: 'calculation',
      context: b.c.replace('{n}', String(n)) + ` X = number of ${b.s}.`,
      prompt: `Find P(X ${op === 'eq' ? '=' : op === 'ge' ? '≥' : '≤'} ${k}) — **${words[op]}** ${b.s}. (Use the Calculator\'s binomial tool.)`,
      answer: num(v, Math.max(0.0005, v * 0.005), { wrong: [{ value: alt, misconception: op === 'eq' ? 'binom-conditions' : 'strict-vs-inclusive', why: op === 'eq' ? `p^k ignores the failures and the number of arrangements.` : `"${words[op]}" includes ${k}.` }] }),
      hints: [`X ~ B(${n}, ${b.p}).`, op === 'eq' ? `P(X = ${k}) = C(${n}, ${k}) · ${b.p}^${k} · ${f(1 - b.p, 2)}^${n - k}.` : `Add P(X = x) for x ${op === 'ge' ? `= ${k}, …, ${n}` : `= 0, …, ${k}`}.`, 'Use technology (Calculator → Binomial).'],
      solution: [`X ~ B(${n}, ${b.p})`, `P(X ${op === 'eq' ? '=' : op === 'ge' ? '≥' : '≤'} ${k}) = **${f(v, 4)}**`],
      takeaway: 'Identify n and p, then let technology do the arithmetic.',
      source: b.src ? { pages: b.src, section: '4.3' } : undefined,
      calculator: true,
    });
  }),
  gen('bn-compare', 'binomial', 'Compare two binomial variables', [5, 6], 'real-world', (rng, level) => {
    const M = { n: 4, p: 0.3 }; const N = { n: 3, p: 0.45 };
    const ask = rng.pick(['more', 'consistent'] as const);
    const muM = M.n * M.p, muN = N.n * N.p, sM = binomSd(M.n, M.p), sN = binomSd(N.n, N.p);
    return build({
      concept: 'binomial', level, type: 'real-world',
      context: 'Mount Airy: 4 lights, each red with p = 0.30 (M = stops). New Market: 3 lights, each red with p = 0.45 (N = stops). Lights are independent.',
      prompt: ask === 'more' ? 'In which town do we expect to stop at more lights?' : 'In which town are the stops more consistent (less variable)?',
      answer: mc(rng, [['New Market', true, ask === 'more' ? `μ_N = ${f(muN, 2)} > μ_M = ${f(muM, 2)}.` : `σ_N = ${f(sN, 3)} < σ_M = ${f(sM, 3)}.`], ['Mount Airy', false, ask === 'more' ? `μ_M = ${f(muM, 2)} < μ_N = ${f(muN, 2)}.` : `σ_M = ${f(sM, 3)} > σ_N = ${f(sN, 3)}.`, ask === 'more' ? undefined : 'binom-sd-np'], ['They are the same', false, 'Compute μ = np and σ = √(npq) for each.']]),
      hints: ['μ = np and σ = √(npq) for each town.'],
      solution: [`M: μ = ${f(muM, 2)}, σ = ${f(sM, 3)}. N: μ = ${f(muN, 2)}, σ = ${f(sN, 3)}.`],
      takeaway: 'Compare means for "more", SDs for "consistent".',
      source: { pages: [27], section: '4.3 Practice #2e' },
    });
  }, ['apply', 'interpret']),
  gen('bn-surprise', 'binomial', 'Is the result surprising?', [6, 7], 'exam', (rng, level) => {
    const n = 250; const p = 1 / 13; const k = rng.pick([10, 11, 12]);
    const v = binomProb(n, p, 'le', k);
    const parts = [
      part('Model', 'Which model fits X = number of free lunches?', mc(rng, [['X ~ B(250, 1/13)', true, 'n = 250 customers, p = 4/52 = 1/13.'], ['X ~ B(13, 1/250)', false, 'n is the number of trials (customers).', 'binom-p-vs-q'], ['X ~ B(250, 1/52)', false, 'There are four 3s in a deck: p = 4/52.']]), 'n = 250, p = 1/13.'),
      part('Probability', `Find P(X ≤ ${k}) with technology.`, num(v, Math.max(0.0005, v * 0.01)), `P(X ≤ ${k}) ≈ ${f(v, 4)}.`),
      part('Conclusion', 'Should the customer be surprised?', mc(rng, [[`Yes — a result this low happens only about ${f(v * 100, 1)}% of the time by chance`, v < 0.05, 'Small probability → surprising.'], ['No — any number of winners is equally likely', false, 'Results near the mean (≈19) are far more likely.'], ['No — 10 is close to the mean of 19.2', false, `σ ≈ 4.2, so ${k} is more than 2 SDs below the mean.`]]), 'Small tail probability → surprising.'),
    ];
    return build({
      concept: 'binomial', level, type: 'exam',
      context: `A restaurant promotion: each customer draws a random card; drawing a 3 wins a free lunch. Of 250 customers, only ${k} won.`,
      prompt: 'Decide whether this result is surprising.',
      answer: parts[2].answer, parts,
      hints: ['Model it as binomial; then find the probability of a result this low **or lower**.', 'We use P(X ≤ k), not P(X = k), because any single exact value is unlikely.'],
      solution: [`X ~ B(250, 1/13), μ ≈ 19.23, σ ≈ 4.21`, `P(X ≤ ${k}) ≈ ${f(v, 4)} → surprising`],
      takeaway: 'Judge surprise with "this extreme or more", not one exact value.',
      source: { pages: [27], section: '4.3 Practice #3' },
    });
  }, ['apply', 'interpret']),
];

export const UNIT5_GENERATORS: Generator[] = [...probDist, ...expectedV, ...transform, ...binomial];
