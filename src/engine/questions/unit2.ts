import type { Generator } from '../types';
import { build, gen, mc, num, part, f, list, tolFor, type Opt } from './helpers';
import { scenario, genData, integerMeanData, niceData, unitLabel } from './scenarios';
import { fiveNumber, iqrFences, mean, median, sd, sorted, summarize, variance, lowerHalf } from '../../lib/stats/descriptive';
import { DATASETS } from '../../content/datasets';

const ds = (id: string) => DATASETS.find((d) => d.id === id)!;

/* ---------------- Graphs of quantitative data ---------------- */

const quantGraphs: Generator[] = [
  gen('qg-hist-read', 'quant-graphs', 'Read a histogram', [2, 3, 4], 'graph', (rng, level) => {
    const lo = rng.pick([0, 10, 20]);
    const w = rng.pick([5, 10]);
    const counts = Array.from({ length: 6 }, () => rng.int(1, 12));
    const n = counts.reduce((a, b) => a + b, 0);
    const k = rng.int(2, 4);
    const atLeast = counts.slice(k).reduce((a, b) => a + b, 0);
    const v = (atLeast / n) * 100;
    const cut = lo + k * w;
    return build({
      concept: 'quant-graphs', level, type: 'graph',
      context: 'The histogram shows the number of minutes a sample of gamers spent in a match lobby.',
      visual: { type: 'histogram', xLabel: 'Minutes in lobby', bins: counts.map((c, i) => ({ lo: lo + i * w, hi: lo + (i + 1) * w, count: c })) },
      prompt: `What percent of the gamers spent **at least ${cut} minutes** in the lobby? (One decimal.)`,
      answer: num(v, 0.15, { unit: '%', wrong: [{ value: (counts[k] / n) * 100, misconception: 'cumulative-confusion', why: 'That is only one bar. "At least" includes every bar from that point up.' }] }),
      hints: ['First find the sample size n by adding all bar heights.', `n = ${n}.`, `Add the bars starting at ${cut}.`, `${counts.slice(k).join(' + ')} = ${atLeast}`, `${atLeast} ÷ ${n} × 100`],
      solution: [`n = ${counts.join(' + ')} = ${n}`, `Bars from ${cut} up: ${counts.slice(k).join(' + ')} = ${atLeast}`, `${atLeast}/${n} = ${f(atLeast / n, 4)} → **${f(v, 1)}%**`],
      takeaway: 'Histogram bar heights are counts; percents are counts ÷ n.',
      source: { pages: [23], section: 'Style of 2.1–2.2 Practice #4' },
    });
  }, ['calculate', 'interpret']),
  gen('qg-stem-read', 'quant-graphs', 'Read a stem-and-leaf plot', [2, 3, 4], 'graph', (rng, level) => {
    const data = sorted(niceData(rng, rng.int(13, 19), 21, 79));
    const rows: { stem: number; leaves: number[] }[] = [];
    for (let s = Math.floor(data[0] / 10); s <= Math.floor(data[data.length - 1] / 10); s++) rows.push({ stem: s, leaves: data.filter((x) => Math.floor(x / 10) === s).map((x) => x % 10) });
    const ask = rng.pick(['median', 'above', 'range'] as const);
    const thr = rng.int(4, 6) * 10;
    const val = ask === 'median' ? median(data) : ask === 'above' ? data.filter((x) => x > thr).length : data[data.length - 1] - data[0];
    return build({
      concept: 'quant-graphs', level, type: 'graph',
      context: 'A stem-and-leaf plot shows the ages of contestants on a TV quiz show. Key: 4|7 = 47 years.',
      visual: { type: 'stemleaf', rows, keyText: '4|7 = 47 years' },
      prompt: ask === 'median' ? 'What is the **median** age?' : ask === 'above' ? `How many contestants are **older than ${thr}**?` : 'What is the **range** of the ages?',
      answer: num(val, 0.01, ask === 'median' && data.length % 2 === 0 ? { wrong: [{ value: data[data.length / 2], misconception: 'median-even-n', why: 'With an even number of values, average the two middle values.' }] } : {}),
      hints: ['Read each leaf with its stem: stem 4 and leaf 7 → 47.', ask === 'median' ? `There are ${data.length} values; the median is in position ${(data.length + 1) / 2}.` : ask === 'above' ? `Count leaves on stems ${Math.floor(thr / 10)} and higher that exceed ${thr}.` : 'Range = max − min.'],
      solution: [`Data: ${data.join(', ')}`, ask === 'median' ? `Median = **${f(val)}**` : ask === 'above' ? `**${val}** contestants are older than ${thr}.` : `${data[data.length - 1]} − ${data[0]} = **${val}**`],
      takeaway: 'Stem plots keep every data value, so exact calculations are easy.',
    });
  }, ['calculate', 'interpret']),
  gen('qg-which-display', 'quant-graphs', 'Choose a display', [1, 2, 3, 4], 'conceptual', (rng, level) => {
    const items = [
      { s: 'You have 2,500 customer wait times and want to see the overall shape.', a: 'Histogram', why: 'Large data sets are best grouped into intervals.' },
      { s: 'You have 12 quiz scores and want to see every individual value on a number line.', a: 'Dotplot', why: 'Small data sets show nicely as individual dots.' },
      { s: 'You want to organize 29 ages so the shape is visible but every original value can still be read.', a: 'Stem-and-leaf plot', why: 'Stem plots keep the digits of every value.' },
      { s: 'You want to show the share of students choosing each of five majors.', a: 'Bar graph', why: 'Majors are categorical.' },
    ];
    const it = rng.pick(items);
    return build({
      concept: 'quant-graphs', level, type: 'conceptual', context: it.s,
      prompt: 'Which display is most appropriate?',
      answer: mc(rng, items.map((x): Opt => [x.a, x.a === it.a, x.a === it.a ? it.why : `Not ideal: ${it.why}`, (x.a === 'Bar graph') !== (it.a === 'Bar graph') ? 'histogram-vs-bar' : undefined]), false),
      hints: ['Is the variable categorical or quantitative? Is the data set large or small?'],
      solution: [`**${it.a}** — ${it.why}`],
      takeaway: 'Small → dotplot/stem plot; large → histogram; categories → bar graph.',
    });
  }),
];

/* ---------------- Measures of center ---------------- */

const center: Generator[] = [
  gen('ce-mean', 'center', 'Compute a mean', [1, 2, 3], 'calculation', (rng, level) => {
    const s = scenario(rng);
    const data = genData(rng, s, { n: rng.int(5, 8) });
    const m = mean(data);
    return build({
      concept: 'center', level, type: 'calculation',
      context: `A sample of ${s.who} recorded their ${s.what}: ${list(data, s.decimals)} (${s.unit}).`,
      prompt: `Find the sample mean $\\bar{x}$.`,
      answer: num(m, tolFor(m, 2), { wrong: [{ value: median(data), misconception: 'wrong-method', why: 'That is the median. The mean is the sum divided by n.' }] }),
      hints: ['Mean = sum of the values ÷ number of values.', `Add all ${data.length} values.`, `Sum = ${f(data.reduce((a, b) => a + b, 0), 2)}.`, `Divide by n = ${data.length}.`],
      solution: [`Σx = ${f(data.reduce((a, b) => a + b, 0), 2)}`, `x̄ = ${f(data.reduce((a, b) => a + b, 0), 2)} ÷ ${data.length} = **${f(m, 2)}**`],
      takeaway: 'x̄ is a statistic estimating the population mean μ.',
      interpretFollowUp: part('Interpret', `What does x̄ ≈ ${f(m, 2)} mean in context?`, mc(rng, [
        [`The average ${s.short} for the sampled ${s.who} is about ${unitLabel(s, f(m, 2))}`, true, 'Correct interpretation of a sample mean.'],
        [`Half of the sampled ${s.who} are above ${unitLabel(s, f(m, 2))}`, false, 'That describes the median.', 'wrong-method'],
        [`Every ${s.who.replace(/s$/, '')} has a ${s.short} of ${unitLabel(s, f(m, 2))}`, false, 'The mean is an average; individual values vary.'],
      ]), 'The mean is the average value for the sample.'),
      calculator: true,
    });
  }),
  gen('ce-median', 'center', 'Find a median', [1, 2, 3], 'calculation', (rng, level) => {
    const s = scenario(rng);
    const even = rng.bool();
    const data = genData(rng, s, { n: even ? rng.pick([6, 8, 10]) : rng.pick([5, 7, 9]) });
    const md = median(data);
    const unsortedMid = data[Math.floor(data.length / 2)];
    const wrong = [{ value: unsortedMid, misconception: 'median-unsorted', why: 'Sort the data first — the middle of the unsorted list is not the median.' }];
    if (even) wrong.push({ value: sorted(data)[data.length / 2], misconception: 'median-even-n', why: 'With an even n, average the two middle values.' });
    return build({
      concept: 'center', level, type: 'calculation',
      context: `${s.who[0].toUpperCase() + s.who.slice(1)} — ${s.what} (${s.unit}): ${list(data, s.decimals)}.`,
      prompt: 'Find the **median**.',
      answer: num(md, tolFor(md, 2), { wrong: wrong.filter((w) => Math.abs(w.value - md) > 1e-9) }),
      hints: ['Sort the data from smallest to largest.', `Sorted: ${list(sorted(data), s.decimals)}.`, even ? `n = ${data.length} is even → average the two middle values.` : `n = ${data.length} is odd → the middle value is position ${(data.length + 1) / 2}.`],
      solution: [`Sorted: ${list(sorted(data), s.decimals)}`, `Median = **${f(md, 2)}**`],
      takeaway: 'Sort first; with even n, average the middle two.',
    });
  }),
  gen('ce-resistant', 'center', 'Which measure moves?', [3, 4, 5], 'conceptual', (rng, level) => {
    const base = ds('chips').data;
    const add = rng.int(75, 95);
    const newData = [...base, add];
    return build({
      concept: 'center', level, type: 'conceptual',
      context: `The 14 chip brands have mean 42.571% air and median 45.5%. A new brand with **${add}%** air is added.`,
      prompt: 'Which statement is true?',
      answer: mc(rng, [
        [`The mean increases a lot (to ${f(mean(newData), 2)}%) while the median barely changes (to ${f(median(newData), 1)}%)`, true, 'The median is resistant; the mean is pulled toward the outlier.'],
        ['The median increases a lot while the mean barely changes', false, 'It is the reverse: the mean is sensitive to extreme values.', 'mean-resistant'],
        ['Both change by the same amount', false, 'The mean uses the size of the new value; the median only uses order.', 'mean-resistant'],
      ]),
      hints: ['The mean uses the actual value of the outlier. The median only depends on the middle position.'],
      solution: [`New mean = ${f(mean(newData), 3)}, new median = ${f(median(newData), 1)}.`],
      takeaway: 'Median = resistant. Mean = pulled by outliers.',
      source: { pages: [23], section: '2.1–2.2 Practice #3c (Helium Chips)' },
    });
  }, ['interpret']),
  gen('ce-best', 'center', 'Choose the typical value', [4, 5, 6], 'interpretation', (rng, level) => {
    const cases = [
      { c: 'Household incomes in a town include a few multi-millionaires.', a: 'Median', why: 'Incomes are skewed right by a few huge values; the median isn\'t pulled up.' },
      { c: 'MLB team payrolls range from $34M to $126M, with most teams between $40M and $80M (skewed right).', a: 'Median', why: 'Skewed data → median.' },
      { c: 'Heights of adult women in a large random sample form a symmetric, bell-shaped histogram.', a: 'Mean', why: 'Symmetric data without outliers → the mean works well and uses all values.' },
      { c: 'Hurricane death counts: most storms have under 20 deaths, a few have over 200.', a: 'Median', why: 'Extreme high values make the mean unrepresentative.' },
    ];
    const it = rng.pick(cases);
    return build({
      concept: 'center', level, type: 'interpretation', context: it.c,
      prompt: 'Which measure of center best represents a "typical" value?',
      answer: mc(rng, [['Median', it.a === 'Median', it.a === 'Median' ? it.why : 'For symmetric data the mean is preferred.', it.a === 'Median' ? undefined : 'wrong-measure-skew'], ['Mean', it.a === 'Mean', it.a === 'Mean' ? it.why : it.why, it.a === 'Mean' ? undefined : 'wrong-measure-skew'], ['Midrange', false, 'The midrange uses only the two extremes — the least resistant choice.']], false),
      hints: ['Is the distribution skewed or does it have outliers?'],
      solution: [`**${it.a}** — ${it.why}`],
      takeaway: 'Skewed/outliers → median; symmetric → mean.',
      source: { pages: [58], section: '2.1–2.2 Example 2c' },
    });
  }),
  gen('ce-grouped', 'center', 'Estimate center from a histogram', [5, 6], 'exam', (rng, level) => {
    const vals = [1, 2, 3, 4, 5];
    const freqs = vals.map(() => rng.int(2, 9));
    const n = freqs.reduce((a, b) => a + b, 0);
    const m = vals.reduce((a, v, i) => a + v * freqs[i], 0) / n;
    const label = rng.pick(['AP exam score (1–5)', 'Rating of a new burger (1–5 stars)', 'Number of streaming services a household pays for']);
    return build({
      concept: 'center', level, type: 'exam',
      context: `A histogram shows ${label}. Bar heights (for 1, 2, 3, 4, 5): ${freqs.join(', ')}.`,
      visual: { type: 'histogram', xLabel: label, bins: vals.map((v, i) => ({ lo: v - 0.5, hi: v + 0.5, count: freqs[i] })) },
      prompt: 'Estimate the **mean** using each bar\'s value as a placeholder for the raw data.',
      answer: num(m, 0.01, { wrong: [{ value: 3, misconception: 'ev-plain-average', why: 'Averaging 1–5 ignores how many values are in each bar — weight by frequency.' }] }),
      hints: ['Rebuild the raw data: value × frequency.', 'Mean = Σ(value × frequency) ÷ n.', `n = ${n}.`, `Σ = ${vals.map((v, i) => `${v}(${freqs[i]})`).join(' + ')}.`],
      solution: [`Σ(x·f) = ${vals.reduce((a, v, i) => a + v * freqs[i], 0)}`, `n = ${n}`, `x̄ = **${f(m, 3)}**`],
      takeaway: 'Histograms only give intervals — use the bar values (midpoints) as placeholders.',
      source: { pages: [22, 23], section: '2.1–2.2 Practice #2, #4' },
    });
  }, ['calculate', 'apply']),
];

/* ---------------- Shape ---------------- */

const shape: Generator[] = [
  gen('sh-mean-median', 'shape', 'Shape from mean and median', [2, 3, 4], 'conceptual', (rng, level) => {
    const kind = rng.pick(['right', 'left', 'sym'] as const);
    const md = rng.int(60, 80);
    const m = kind === 'right' ? md + rng.int(5, 9) + rng.int(0, 9) / 10 : kind === 'left' ? md - rng.int(5, 9) - rng.int(0, 9) / 10 : md + rng.pick([-0.3, 0.2, 0.4]);
    const label = { right: 'Skewed right', left: 'Skewed left', sym: 'Approximately symmetric' };
    return build({
      concept: 'shape', level, type: 'conceptual',
      context: `A professor's exam scores (out of 100): mean μ = ${f(m, 1)}, median MD = ${md}.`,
      prompt: 'What is the likely shape of the distribution?',
      answer: mc(rng, (['right', 'left', 'sym'] as const).map((k): Opt => [label[k], k === kind, k === kind ? (kind === 'right' ? 'Mean > median: a right tail pulls the mean up.' : kind === 'left' ? 'Mean < median: a left tail pulls the mean down.' : 'Mean ≈ median.') : 'Compare the mean and median: the mean follows the tail.', k === kind ? undefined : 'mean-median-skew']), false),
      hints: ['The mean is pulled toward the tail.', 'Mean > median → tail on the right.'],
      solution: [`μ = ${f(m, 1)} vs MD = ${md} → **${label[kind]}**.`],
      takeaway: 'The mean follows the tail.',
      source: { pages: [20], section: '2.4, 2.6 Practice #1' },
    });
  }),
  gen('sh-identify', 'shape', 'Name the shape', [1, 2, 3], 'graph', (rng, level) => {
    const k = rng.pick(['symmetric', 'right', 'left', 'uniform', 'bimodal'] as const);
    const names = { symmetric: 'Symmetric', right: 'Skewed right', left: 'Skewed left', uniform: 'Uniform', bimodal: 'Bimodal' };
    return build({
      concept: 'shape', level, type: 'graph',
      visual: { type: 'shape', shape: k },
      prompt: 'Describe the shape of this distribution.',
      answer: mc(rng, (Object.keys(names) as (keyof typeof names)[]).map((x): Opt => [names[x], x === k, x === k ? 'Correct.' : 'Look at where the tail or peaks are.', (x === 'right' && k === 'left') || (x === 'left' && k === 'right') ? 'skew-direction' : undefined]), false),
      hints: ['Where is the long tail? How many peaks?', 'Skew is named for the direction of the tail.'],
      solution: [`**${names[k]}**.`],
      takeaway: 'Name skew by the tail, not the peak.',
    });
  }),
  gen('sh-order', 'shape', 'Order mean, median, mode', [3, 4, 5], 'conceptual', (rng, level) => {
    const k = rng.pick(['right', 'left'] as const);
    return build({
      concept: 'shape', level, type: 'conceptual',
      context: `A distribution is **skewed ${k}**.`,
      prompt: 'Which ordering is typical?',
      answer: mc(rng, [
        ['mode < median < mean', k === 'right', k === 'right' ? 'The right tail pulls the mean highest.' : 'That is the right-skew order.', k === 'right' ? undefined : 'mean-median-skew'],
        ['mean < median < mode', k === 'left', k === 'left' ? 'The left tail pulls the mean lowest.' : 'That is the left-skew order.', k === 'left' ? undefined : 'mean-median-skew'],
        ['mean = median = mode', false, 'That is a symmetric distribution.'],
      ], false),
      hints: ['The mean is pulled farthest toward the tail; the mode sits at the peak.'],
      solution: [k === 'right' ? 'Skewed right: **mode < median < mean**.' : 'Skewed left: **mean < median < mode**.'],
      takeaway: 'Peak (mode) → median → mean, heading toward the tail.',
      source: { pages: [53], section: '2.4, 2.6 Example 1' },
    });
  }),
];

/* ---------------- Position ---------------- */

const position: Generator[] = [
  gen('po-percentile', 'position', 'Percentile of a value', [2, 3, 4], 'calculation', (rng, level) => {
    const n = rng.pick([20, 25, 40, 50]);
    const below = rng.int(Math.floor(n * 0.2), Math.floor(n * 0.9));
    const v = (below / n) * 100;
    const ctx = rng.pick([
      `In a class of ${n} students, ${below} students scored lower than Jordan on a quiz.`,
      `Of the ${n} states, ${below} have fewer representatives than a particular state.`,
      `Among ${n} runners, ${below} finished with slower times than Ava (lower is slower here: ${below} had lower scores).`,
    ]);
    return build({
      concept: 'position', level, type: 'calculation', context: ctx,
      prompt: 'What percentile is this? (Enter the number, e.g. 58 for the 58th percentile.)',
      answer: num(v, 0.5, { accept: [v / 100], wrong: [{ value: ((below + 1) / n) * 100, misconception: 'percentile-vs-percent', why: 'The course counts values strictly **less than** the value.' }] }),
      hints: ['Percentile = (number of values below) ÷ n × 100.', `${below} ÷ ${n} = ${f(below / n, 4)}.`],
      solution: [`${below}/${n} = ${f(below / n, 4)} → **${f(v, 1)}th percentile**`],
      takeaway: 'Percentile = percent of data with lesser value.',
      source: { pages: [19, 54], section: '2.7 Practice #3a' },
    });
  }),
  gen('po-quartile', 'position', 'Find Q1 or Q3', [3, 4, 5], 'calculation', (rng, level) => {
    const s = scenario(rng, (x) => x.decimals === 0);
    const n = rng.pick([7, 9, 11, 8, 10, 12]);
    const data = genData(rng, s, { n });
    const fn = fiveNumber(data);
    const which = rng.pick(['Q1', 'Q3'] as const);
    const target = which === 'Q1' ? fn.q1 : fn.q3;
    const srt = sorted(data);
    // wrong: include median in halves for odd n
    const incl = n % 2 ? median(which === 'Q1' ? srt.slice(0, (n + 1) / 2) : srt.slice((n - 1) / 2)) : NaN;
    return build({
      concept: 'position', level, type: 'calculation',
      context: `${s.what[0].toUpperCase() + s.what.slice(1)} for ${n} ${s.who}: ${list(data, 0)}.`,
      prompt: `Find **${which}** (course/Stapplet method).`,
      answer: num(target, 0.01, { wrong: Number.isNaN(incl) || incl === target ? [] : [{ value: incl, misconception: 'quartile-include-median', why: 'With odd n, leave the median out of both halves.' }] }),
      hints: ['Sort the data and find the median.', `Sorted: ${list(srt, 0)}. Median = ${f(fn.median)}.`, n % 2 ? 'n is odd: exclude the median from both halves.' : 'n is even: split the data into two equal halves.', `${which === 'Q1' ? 'Lower' : 'Upper'} half: ${list(which === 'Q1' ? lowerHalf(srt) : srt.slice(Math.ceil(n / 2)), 0)}.`, `${which} = the median of that half.`],
      solution: [`Sorted: ${list(srt, 0)}`, `${which === 'Q1' ? 'Lower' : 'Upper'} half: ${list(which === 'Q1' ? lowerHalf(srt) : srt.slice(Math.ceil(n / 2)), 0)}`, `**${which} = ${f(target)}**`],
      takeaway: 'Quartiles = medians of the halves.',
      calculator: true,
    });
  }),
  gen('po-five', 'position', 'Five-number summary (guided)', [3, 4], 'multi-step', (_rng, level) => {
    const data = ds('speeds-north').data.slice();
    const fn = fiveNumber(data);
    const parts = [
      part('Median', `The ${data.length} speeds are sorted. What is the median?`, num(fn.median, 0.01), `n = 19 → 10th value = ${fn.median}.`),
      part('Q1', 'What is Q1 (median of the 9 values below the median)?', num(fn.q1, 0.01, { wrong: [{ value: 63.5, misconception: 'quartile-include-median', why: 'Don\'t include the median in the lower half.' }] }), `Lower half 60…64 → 5th value = ${fn.q1}.`),
      part('Q3', 'What is Q3?', num(fn.q3, 0.01), `Upper half 65…83 → 5th value = ${fn.q3}.`),
      part('IQR', 'What is the IQR?', num(fn.q3 - fn.q1, 0.01), `${fn.q3} − ${fn.q1} = ${fn.q3 - fn.q1}.`),
    ];
    return build({
      concept: 'position', level, type: 'multi-step',
      context: `Northbound speeds (mph): ${data.join(', ')}.`,
      prompt: 'Build the five-number summary step by step.',
      answer: parts[3].answer, parts,
      hints: ['Find the median first, then the medians of each half.'],
      solution: [`Five-number summary: ${fn.min}, ${fn.q1}, ${fn.median}, ${fn.q3}, ${fn.max}.`],
      takeaway: 'Min, Q1, median, Q3, max → the skeleton of a boxplot.',
      source: { pages: [54], section: '2.4, 2.6 Example 2' },
    });
  }, ['calculate', 'apply']),
  gen('po-interpret', 'position', 'Interpret a percentile', [3, 4, 5], 'interpretation', (rng, level) => {
    const p = rng.pick([62, 75, 80, 90, 95]);
    const raw = rng.int(55, 72);
    return build({
      concept: 'position', level, type: 'interpretation',
      context: `Riley scored ${raw}% on a very hard chemistry exam, which was at the **${p}th percentile** of the class.`,
      prompt: 'What does the percentile tell you?',
      answer: mc(rng, [
        [`Riley scored higher than about ${p}% of the class`, true, 'Percentile = percent of values with lesser value.'],
        [`Riley answered ${p}% of the questions correctly`, false, `Riley's raw score was ${raw}%; percentile is about rank.`, 'percentile-vs-percent'],
        [`${p}% of students scored higher than Riley`, false, 'That reverses the meaning.'],
      ]),
      hints: ['A percentile describes position compared to everyone else, not the raw score.'],
      solution: [`${p}th percentile → better than about ${p}% of classmates, even with a raw score of ${raw}%.`],
      takeaway: 'Percentile ≠ percent correct.',
    });
  }),
];

/* ---------------- Boxplots ---------------- */

const boxplots: Generator[] = [
  gen('bx-percent', 'boxplots', 'Percent from a boxplot', [2, 3, 4], 'graph', (rng, level) => {
    const min = rng.int(10, 20); const q1 = min + rng.int(4, 9); const md = q1 + rng.int(3, 8); const q3 = md + rng.int(3, 10); const max = q3 + rng.int(5, 15);
    const asks: [string, number][] = [[`between ${q1} and ${q3}`, 50], [`below ${md}`, 50], [`above ${q1}`, 75], [`below ${q3}`, 75], [`between ${md} and ${q3}`, 25], [`below ${q1}`, 25]];
    const [desc, ans] = rng.pick(asks);
    return build({
      concept: 'boxplots', level, type: 'graph',
      context: 'The boxplot shows delivery times (minutes) for a pizza shop.',
      visual: { type: 'boxplot', xLabel: 'Delivery time (minutes)', groups: [{ label: 'Deliveries', min, q1, median: md, q3, max }] },
      prompt: `About what percent of deliveries took **${desc}** minutes?`,
      answer: num(ans, 1, { unit: '%', accept: [ans / 100] }),
      hints: ['Each of the four sections of a boxplot holds about 25% of the data.', `Mark ${desc} on the plot and count sections.`],
      solution: [`That region covers ${ans / 25} section(s) × 25% = **${ans}%**.`],
      takeaway: 'Each quarter of a boxplot ≈ 25% of the data.',
      source: { pages: [55], section: '2.4, 2.6 Example 3' },
    });
  }),
  gen('bx-compare', 'boxplots', 'Compare boxplots', [4, 5, 6], 'graph', (rng, level) => {
    const mk = () => { const min = rng.int(2, 8); const q1 = min + rng.int(2, 6); const md = q1 + rng.int(1, 5); const q3 = md + rng.int(1, 6); const max = q3 + rng.int(2, 9); return { min, q1, median: md, q3, max }; };
    let A = mk(); let B = mk();
    while (A.q3 - A.q1 === B.q3 - B.q1) B = mk();
    const ask = rng.pick(['iqr', 'median'] as const);
    if (ask === 'median') while (A.median === B.median) { A = mk(); }
    const ctx = rng.pick([{ c: 'Bubble diameters (cm) from two solutions', a: 'Control', b: 'Glycerin' }, { c: 'Weekly hours at two bank branches', a: 'North', b: 'South' }, { c: 'Sodium (mg) in two cheese types', a: 'Processed', b: 'Unprocessed' }]);
    const iqrA = A.q3 - A.q1; const iqrB = B.q3 - B.q1;
    const ansA = ask === 'iqr' ? iqrA > iqrB : A.median > B.median;
    return build({
      concept: 'boxplots', level, type: 'graph', context: `${ctx.c}.`,
      visual: { type: 'boxplot', xLabel: ctx.c, groups: [{ label: ctx.a, ...A }, { label: ctx.b, ...B }] },
      prompt: ask === 'iqr' ? 'Which group has the **larger interquartile range** (more variable middle 50%)?' : 'Which group has the **larger median**?',
      answer: mc(rng, [[ctx.a, ansA, ask === 'iqr' ? `IQR ${ctx.a} = ${iqrA}, ${ctx.b} = ${iqrB}.` : `Medians: ${A.median} vs ${B.median}.`], [ctx.b, !ansA, ask === 'iqr' ? `IQR ${ctx.a} = ${iqrA}, ${ctx.b} = ${iqrB}.` : `Medians: ${A.median} vs ${B.median}.`, ask === 'iqr' ? 'box-length-count' : undefined]], false),
      hints: [ask === 'iqr' ? 'IQR = width of the box (Q3 − Q1).' : 'The median is the line inside the box.'],
      solution: [ask === 'iqr' ? `${ctx.a}: ${A.q3} − ${A.q1} = ${iqrA}; ${ctx.b}: ${B.q3} − ${B.q1} = ${iqrB}.` : `${ctx.a}: ${A.median}; ${ctx.b}: ${B.median}.`],
      takeaway: 'Compare boxes for spread, lines for center.',
    });
  }),
  gen('bx-misconception', 'boxplots', 'What a long whisker means', [4, 5, 6], 'misconception', (rng, level) => {
    const q3 = rng.int(20, 30); const max = q3 + rng.int(60, 200);
    return build({
      concept: 'boxplots', level, type: 'misconception',
      context: `A boxplot of hurricane deaths has Q3 = ${q3} and max = ${max}, so the right whisker is extremely long.`,
      prompt: 'A classmate says, "The long whisker means most hurricanes had lots of deaths." Is that right?',
      answer: mc(rng, [
        ['No — only about 25% of the data lie on that whisker; it shows those values are very spread out (right skew)', true, 'Length = spread, not count.'],
        ['Yes — longer sections contain more data', false, 'Every section holds about 25% of the data.', 'box-length-count'],
        ['We can\'t tell without the sample size', false, 'Percentages from a boxplot don\'t depend on n.', 'boxplot-sample-size'],
      ]),
      hints: ['How much of the data does each section of a boxplot contain?'],
      solution: ['About 25% of storms are on the right whisker; the length shows a long right tail (skewed right), not more storms.'],
      takeaway: 'A long section = spread out, not crowded.',
    });
  }, ['interpret']),
];

/* ---------------- Range & IQR ---------------- */

const rangeIqr: Generator[] = [
  gen('ri-compute', 'range-iqr', 'Range and IQR', [2, 3, 4], 'calculation', (rng, level) => {
    const s = scenario(rng, (x) => x.decimals === 0);
    const data = genData(rng, s, { n: rng.pick([8, 9, 10, 11]) });
    const fn = fiveNumber(data);
    const ask = rng.pick(['range', 'iqr'] as const);
    const v = ask === 'range' ? fn.max - fn.min : fn.q3 - fn.q1;
    return build({
      concept: 'range-iqr', level, type: 'calculation',
      context: `${s.what[0].toUpperCase() + s.what.slice(1)} (${s.unit}) for ${data.length} ${s.who}: ${list(data, 0)}.`,
      prompt: `Find the **${ask === 'range' ? 'range' : 'interquartile range (IQR)'}**.`,
      answer: num(v, 0.01, { wrong: [{ value: ask === 'range' ? fn.q3 - fn.q1 : fn.max - fn.min, misconception: 'range-vs-iqr', why: ask === 'range' ? 'That is the IQR; the range is max − min.' : 'That is the range; the IQR is Q3 − Q1.' }] }),
      hints: [ask === 'range' ? 'Range = max − min.' : 'IQR = Q3 − Q1.', 'Sort the data first.', `Sorted: ${list(sorted(data), 0)}.`, ask === 'iqr' ? `Q1 = ${f(fn.q1)}, Q3 = ${f(fn.q3)}.` : `max = ${fn.max}, min = ${fn.min}.`],
      solution: [ask === 'range' ? `${fn.max} − ${fn.min} = **${f(v)}**` : `Q1 = ${f(fn.q1)}, Q3 = ${f(fn.q3)} → IQR = **${f(v)}**`],
      takeaway: 'Range: all data. IQR: middle 50%.',
      interpretFollowUp: part('Interpret', `Interpret the ${ask === 'range' ? 'range' : 'IQR'} of ${f(v)} ${s.unit}.`, mc(rng, ask === 'range'
        ? [[`All of the ${s.who} are within ${f(v)} ${s.unit} of each other`, true, 'Range = width of all the data.'], [`The middle 50% are within ${f(v)} ${s.unit} of each other`, false, 'That describes the IQR.', 'range-vs-iqr'], [`A typical value is ${f(v)} ${s.unit} from the mean`, false, 'That describes the SD.', 'sd-meaning']]
        : [[`The middle 50% of the ${s.who} are within ${f(v)} ${s.unit} of each other`, true, 'IQR = width of the middle half.'], [`All of the ${s.who} are within ${f(v)} ${s.unit} of each other`, false, 'That describes the range.', 'range-vs-iqr'], [`A typical value is ${f(v)} ${s.unit} from the mean`, false, 'That describes the SD.', 'sd-meaning']]), 'Range = all data; IQR = middle 50%.'),
    });
  }),
  gen('ri-resistant', 'range-iqr', 'Which spread resists outliers?', [4, 5], 'conceptual', (rng, level) => {
    const data = ds('oj').data;
    const fnA = fiveNumber(data);
    return build({
      concept: 'range-iqr', level, type: 'conceptual',
      context: `OJ prices: range = $${f(fnA.max - fnA.min, 2)}, IQR = $${f(fnA.q3 - fnA.q1, 2)}. One store charges $5.99 (a high outlier), creating a right skew.`,
      prompt: 'Which measure of spread better describes the typical variation in price?',
      answer: mc(rng, [['IQR', true, 'IQR ignores the extremes, so the outlier barely affects it.'], ['Range', false, 'The range is determined by the outlier itself.', 'resistant-measures'], ['Both are equally good', false, 'The outlier inflates the range but not the IQR.', 'resistant-measures']], false),
      hints: ['Which measure uses the maximum value directly?'],
      solution: ['The **IQR** is resistant to the $5.99 outlier; the range is not.'],
      takeaway: 'Skew or outliers → IQR.',
      source: { pages: [17], section: '2.7 Practice #1d' },
    });
  }, ['interpret']),
];

/* ---------------- Standard deviation ---------------- */

const stdDev: Generator[] = [
  gen('sd-compute', 'std-dev', 'Compute a standard deviation', [2, 3, 4], 'calculation', (rng, level) => {
    const n = rng.pick([4, 5, 6]);
    const data = integerMeanData(rng, n, 2, 20);
    const s = sd(data);
    const m = mean(data);
    const ss = data.reduce((a, x) => a + (x - m) ** 2, 0);
    const ctx = rng.pick(['Number of push-ups done in a minute', 'Points scored in a video game round', 'Hours worked this week', 'Goals scored per season']);
    return build({
      concept: 'std-dev', level, type: 'calculation',
      context: `${ctx}, for ${n} people: ${data.join(', ')}.`,
      prompt: 'Compute the **sample standard deviation** s. (Two decimals.)',
      answer: num(s, 0.01, { wrong: [
        { value: sd(data, 'population'), misconception: 'sd-divide-n', why: `You divided by n = ${n}. For a sample, divide by n − 1 = ${n - 1}.` },
        { value: variance(data), misconception: 'sd-no-sqrt', why: 'That is the variance — take its square root.' },
        { value: variance(data, 'population'), misconception: 'sd-divide-n', why: 'That is the population variance; divide by n − 1 and take the square root.' },
      ] }),
      hints: ['SD = typical distance from the mean. Start with the mean.', `x̄ = ${f(m)}. Find each deviation (x − x̄) and square it.`, `Deviations: ${data.map((x) => f(x - m)).join(', ')}.`, `Sum of squares = ${f(ss)}; divide by n − 1 = ${n - 1}.`, `s² = ${f(ss / (n - 1), 4)}; take the square root.`],
      solution: [`x̄ = ${f(m)}`, `Σ(x − x̄)² = ${data.map((x) => f((x - m) ** 2)).join(' + ')} = ${f(ss)}`, `s² = ${f(ss)}/${n - 1} = ${f(ss / (n - 1), 4)}`, `s = **${f(s, 2)}**`],
      takeaway: 'Deviate, square, sum, divide by n − 1, square root.',
      parts: level <= 3 ? [
        part('Mean', 'Step 1 — find the mean x̄.', num(m, 0.01), `x̄ = ${f(m)}.`),
        part('Sum of squares', 'Step 2 — find Σ(x − x̄)².', num(ss, 0.01, { wrong: [{ value: 0, misconception: 'sd-no-square', why: 'Raw deviations sum to 0 — square them first.' }] }), `Σ(x − x̄)² = ${f(ss)}.`),
        part('Variance', 'Step 3 — divide by n − 1 to get s².', num(ss / (n - 1), 0.01, { wrong: [{ value: ss / n, misconception: 'sd-divide-n', why: 'Divide by n − 1 for a sample.' }] }), `s² = ${f(ss / (n - 1), 4)}.`),
        part('Standard deviation', 'Step 4 — take the square root.', num(s, 0.01, { wrong: [{ value: sd(data, 'population'), misconception: 'sd-divide-n', why: 'Use n − 1.' }] }), `s = ${f(s, 2)}.`),
      ] : undefined,
      calculator: true,
    });
  }, ['calculate']),
  gen('sd-interpret', 'std-dev', 'Interpret a standard deviation', [3, 4, 5], 'interpretation', (rng, level) => {
    const s = scenario(rng);
    const data = genData(rng, s, { n: 20 });
    const sm = summarize(data);
    return build({
      concept: 'std-dev', level, type: 'interpretation',
      context: `For a sample of ${s.who}, the ${s.what} has mean ${unitLabel(s, f(sm.mean, s.decimals + 1))} and standard deviation ${unitLabel(s, f(sm.sd, s.decimals + 1))}.`,
      prompt: 'Which is the correct interpretation of the standard deviation?',
      answer: mc(rng, [
        [`On average, a ${s.short} is about ${unitLabel(s, f(sm.sd, s.decimals + 1))} away from the mean`, true, 'SD = typical distance from the mean.'],
        [`All values are within ${unitLabel(s, f(sm.sd, s.decimals + 1))} of the mean`, false, 'SD is a typical distance, not a maximum.', 'sd-meaning'],
        [`The middle 50% of values are within ${unitLabel(s, f(sm.sd, s.decimals + 1))} of each other`, false, 'That describes the IQR.', 'range-vs-iqr'],
        [`The values vary by ${f(sm.sd, s.decimals + 1)}%`, false, 'SD is in the units of the data, not a percent.', 'sd-meaning'],
      ]),
      hints: ['SD answers: "How far from the mean is a typical value?"'],
      solution: [`SD ≈ ${f(sm.sd, s.decimals + 1)}: values typically fall about that far from the mean of ${f(sm.mean, s.decimals + 1)}.`],
      takeaway: 'SD = typical distance from the mean (in the data\'s units).',
      source: { pages: [17], section: '2.7 Practice #1b' },
    });
  }),
  gen('sd-compare', 'std-dev', 'Which set is more consistent?', [2, 3, 4], 'graph', (rng, level) => {
    const center = rng.int(30, 60);
    const tight = Array.from({ length: 8 }, () => center + rng.int(-3, 3));
    const wide = Array.from({ length: 8 }, () => center + rng.int(-15, 15));
    const swap = rng.bool();
    const [A, B] = swap ? [wide, tight] : [tight, wide];
    return build({
      concept: 'std-dev', level, type: 'graph',
      context: `Two paint brands were tested (months before fading).\nBrand A: ${A.join(', ')}\nBrand B: ${B.join(', ')}`,
      visual: { type: 'dotplot', data: A, xLabel: 'Brand A (months)' },
      prompt: 'Without calculating, which brand has the **smaller standard deviation**?',
      answer: mc(rng, [['Brand A', !swap, `Brand A values stay close to ${center}.`], ['Brand B', swap, `Brand B values stay close to ${center}.`], ['They are equal because the means are similar', false, 'Similar means don\'t imply similar spread.']], false),
      hints: ['Which list has values clustered more tightly around its center?'],
      solution: [`SD(A) = ${f(sd(A), 2)}, SD(B) = ${f(sd(B), 2)}.`],
      takeaway: 'Smaller SD = more consistent.',
      source: { pages: [50, 51], section: '2.7 Example 1' },
    });
  }, ['interpret', 'recognize']),
  gen('sd-frq', 'std-dev', 'Explain a standard deviation (FRQ)', [5, 6, 7], 'free-response', (rng, level) => {
    const s = scenario(rng);
    const data = genData(rng, s, { n: 15 });
    const sm = summarize(data);
    const sdText = unitLabel(s, f(sm.sd, s.decimals + 1));
    return build({
      concept: 'std-dev', level, type: 'free-response',
      context: `A sample of 15 ${s.who} had ${s.what} with x̄ = ${unitLabel(s, f(sm.mean, s.decimals + 1))} and s = ${sdText}.`,
      prompt: 'Interpret the standard deviation in context.',
      answer: { kind: 'text', rubric: { prompt: 'Interpret s in context.', items: [
        { id: 'typical', idea: 'Typical/average distance from the mean', patterns: ['(typical|average|on average|usual).{0,60}(away|from|distance|var|differ)', 'about.{0,40}from the mean'], weight: 1.5 },
        { id: 'value', idea: `Uses the value ${f(sm.sd, s.decimals + 1)}`, patterns: [f(sm.sd, s.decimals + 1).replace('.', '\\.')], weight: 1 },
        { id: 'context', idea: `Mentions the context (${s.short})`, patterns: [s.short.split(' ')[0], s.unit.split(' ')[0]], weight: 1 },
      ], misconceptions: [{ patterns: ['all.{0,30}within', 'percent'], message: 'The SD is a typical distance, not a guarantee that all values are within it (and not a percent).' }], model: `On average, a ${s.short} for these ${s.who} is about ${sdText} away from the mean of ${unitLabel(s, f(sm.mean, s.decimals + 1))}.` } },
      hints: ['Use the template: "On average, [variable] is about [s] [units] away from the mean."'],
      solution: [`On average, a ${s.short} is about ${sdText} away from the mean.`],
      takeaway: 'Template: typical distance from the mean, with units and context.',
    });
  }),
];

/* ---------------- Outliers ---------------- */

const outliers: Generator[] = [
  gen('ol-fence', 'outliers', 'Compute an outlier fence', [2, 3, 4], 'calculation', (rng, level) => {
    const q1 = rng.int(20, 60); const q3 = q1 + rng.int(4, 20);
    const which = rng.pick(['upper', 'lower'] as const);
    const iqrV = q3 - q1;
    const v = which === 'upper' ? q3 + 1.5 * iqrV : q1 - 1.5 * iqrV;
    return build({
      concept: 'outliers', level, type: 'calculation',
      context: `Weekly hours worked at a bank branch: Q1 = ${q1}, Q3 = ${q3}.`,
      prompt: `Find the **${which} fence** for the 1.5 × IQR rule.`,
      answer: num(v, 0.01, { wrong: [
        { value: which === 'upper' ? q3 + iqrV : q1 - iqrV, misconception: 'fence-forget-15', why: 'Multiply the IQR by 1.5 first.' },
        { value: which === 'upper' ? q1 + 1.5 * iqrV : q3 - 1.5 * iqrV, misconception: 'fence-wrong-quartile', why: which === 'upper' ? 'The upper fence starts from Q3.' : 'The lower fence starts from Q1.' },
      ] }),
      hints: ['IQR = Q3 − Q1.', `IQR = ${iqrV}; 1.5 × IQR = ${1.5 * iqrV}.`, which === 'upper' ? 'Upper fence = Q3 + 1.5·IQR.' : 'Lower fence = Q1 − 1.5·IQR.'],
      solution: [`IQR = ${q3} − ${q1} = ${iqrV}`, `1.5 × ${iqrV} = ${1.5 * iqrV}`, which === 'upper' ? `${q3} + ${1.5 * iqrV} = **${f(v)}**` : `${q1} − ${1.5 * iqrV} = **${f(v)}**`],
      takeaway: 'Q1 − 1.5·IQR and Q3 + 1.5·IQR.',
      source: { pages: [15], section: '2.8 Practice #1c' },
    });
  }),
  gen('ol-which', 'outliers', 'Which values are outliers?', [3, 4, 5], 'calculation', (rng, level) => {
    const s = scenario(rng, (x) => x.decimals === 0);
    const data = genData(rng, s, { n: 11, outlier: rng.pick(['high', 'low']) });
    const fz = iqrFences(data);
    const srt = sorted(data);
    const cand = Array.from(new Set([srt[0], srt[1], srt[srt.length - 2], srt[srt.length - 1]]));
    const label = (xs: number[]) => (xs.length ? xs.join(' and ') : 'No outliers');
    const correctLabel = label(fz.outliers);
    const opts = new Map<string, Opt>();
    opts.set(correctLabel, [correctLabel, true, `Fences: ${f(fz.lower, 2)} and ${f(fz.upper, 2)}.`]);
    for (const c of cand) {
      const lab = label([c]);
      if (!opts.has(lab)) opts.set(lab, [lab, false, `Compare ${c} to the fences ${f(fz.lower, 2)} and ${f(fz.upper, 2)}.`, 'fence-forget-15']);
    }
    if (!opts.has('No outliers')) opts.set('No outliers', ['No outliers', false, `Check the extreme values against the fences ${f(fz.lower, 2)} and ${f(fz.upper, 2)}.`]);
    return build({
      concept: 'outliers', level, type: 'calculation',
      context: `${s.what[0].toUpperCase() + s.what.slice(1)} (${s.unit}) for 11 ${s.who}: ${list(data, 0)}.`,
      prompt: 'Use the **1.5 × IQR rule** to identify any outliers.',
      answer: mc(rng, [...opts.values()].slice(0, 5)),
      hints: ['Find Q1 and Q3 first (sort; n = 11 is odd, so exclude the median).', `Q1 = ${f(fiveNumber(data).q1)}, Q3 = ${f(fiveNumber(data).q3)}.`, `IQR = ${f(fz.iqr)}; 1.5·IQR = ${f(fz.step)}.`, `Fences: ${f(fz.lower, 2)} and ${f(fz.upper, 2)}.`],
      solution: [`Q1 = ${f(fiveNumber(data).q1)}, Q3 = ${f(fiveNumber(data).q3)}, IQR = ${f(fz.iqr)}`, `Fences: ${f(fz.lower, 2)} to ${f(fz.upper, 2)}`, `Outliers: **${correctLabel}**`],
      takeaway: 'Anything beyond the fences is an outlier.',
      calculator: true,
    });
  }, ['calculate', 'apply']),
  gen('ol-2sd', 'outliers', '2 SD rule', [3, 4], 'calculation', (rng, level) => {
    const m = rng.int(30, 80) + rng.int(0, 9) / 10; const s = rng.int(3, 12) + rng.int(0, 9) / 10;
    const test = r1(m + s * rng.pick([1.6, 2.3, 2.6, -2.4, -1.5]));
    const lower = m - 2 * s; const upper = m + 2 * s;
    const isOut = test < lower || test > upper;
    return build({
      concept: 'outliers', level, type: 'calculation',
      context: `A data set has x̄ = ${m} and s = ${s}.`,
      prompt: `Using the **2 SD rule**, is ${test} an outlier?`,
      answer: mc(rng, [[`Yes — it is outside ${f(lower, 2)} to ${f(upper, 2)}`, isOut, `Typical range: ${f(lower, 2)} to ${f(upper, 2)}.`], [`No — it is inside ${f(lower, 2)} to ${f(upper, 2)}`, !isOut, `Typical range: ${f(lower, 2)} to ${f(upper, 2)}.`]], false),
      hints: ['Typical values are within x̄ ± 2s.', `2s = ${f(2 * s)}.`],
      solution: [`${m} − ${f(2 * s)} = ${f(lower, 2)}; ${m} + ${f(2 * s)} = ${f(upper, 2)}`, isOut ? `${test} is outside → **outlier**.` : `${test} is inside → **not an outlier**.`],
      takeaway: 'x̄ ± 2s marks the typical range.',
    });
  }),
  gen('ol-effect', 'outliers', 'Effect of removing an outlier', [4, 5, 6], 'conceptual', (rng, level) => {
    return build({
      concept: 'outliers', level, type: 'conceptual',
      context: 'The 14 chip brands include Fritos at 19% air, flagged as an outlier by both rules.',
      prompt: 'If Fritos is removed, which measures change the **most**?',
      answer: mc(rng, [
        ['Mean, standard deviation, and range', true, 'Mean 42.571 → 44.385, s 10.181 → 7.901, range 40 → 31.'],
        ['Median and IQR', false, 'Median 45.5 → 46 and IQR 10 → 9.5 barely change — they are resistant.', 'resistant-measures'],
        ['None of them — one value doesn\'t matter', false, 'One extreme value can move non-resistant measures a lot.', 'mean-resistant'],
      ]),
      hints: ['Which measures use the actual size of every value (or the extremes)?'],
      solution: ['With outlier: x̄ = 42.571, MD = 45.5, range 40, IQR 10, s = 10.181.', 'Without: x̄ = 44.385, MD = 46, range 31, IQR 9.5, s = 7.901.'],
      takeaway: 'Resistant: median, IQR. Not resistant: mean, SD, range.',
      source: { pages: [18], section: '2.7 Practice #2d' },
    });
  }, ['interpret']),
];

function r1(x: number) { return Math.round(x * 10) / 10; }

/* ---------------- z-scores ---------------- */

const zScore: Generator[] = [
  gen('z-compute', 'z-score', 'Standard deviations from the mean', [2, 3, 4], 'calculation', (rng, level) => {
    const m = rng.int(20, 90); const s = rng.int(4, 15); const x = m + rng.pick([-1, 1]) * rng.int(2, Math.round(2.6 * s));
    const z = (x - m) / s;
    return build({
      concept: 'z-score', level, type: 'calculation',
      context: `Weekly study hours for a group of students have mean ${m} and SD ${s}. One student studies ${x} hours.`,
      prompt: 'How many standard deviations from the mean is this student? (Use a negative sign if below.)',
      answer: num(z, 0.01, { wrong: [
        { value: Math.abs(z), misconception: 'z-sign', why: 'The value is below the mean, so the answer is negative.' },
        { value: (x - m) / (s * s), misconception: 'z-divide-variance', why: 'Divide by the SD, not the variance.' },
        { value: x - m, misconception: 'z-divide-variance', why: 'Divide the distance by the SD.' },
      ].filter((w) => Math.abs(w.value - z) > 1e-9) }),
      hints: ['z = (x − x̄)/s.', `Distance: ${x} − ${m} = ${x - m}.`, `Divide by s = ${s}.`],
      solution: [`(${x} − ${m}) / ${s} = **${f(z, 3)}**`],
      takeaway: 'Positive → above the mean; negative → below.',
    });
  }),
  gen('z-compare', 'z-score', 'Which is more unusual?', [4, 5, 6], 'real-world', (rng, level) => {
    const a = { name: 'Representatives', x: 8, m: 8.7, s: 9.723 };
    const b = { name: 'Counties', x: 23, m: 62.82, s: 46.421 };
    const useCourse = rng.bool(0.4);
    const sets = useCourse ? [a, b] : [
      { name: 'Math test', x: rng.int(80, 92), m: rng.int(70, 75), s: rng.int(5, 9) },
      { name: 'History test', x: rng.int(80, 92), m: rng.int(70, 75), s: rng.int(9, 14) },
    ];
    const z = sets.map((t) => (t.x - t.m) / t.s);
    const pick = Math.abs(z[0]) > Math.abs(z[1]) ? 0 : 1;
    return build({
      concept: 'z-score', level, type: 'real-world',
      context: useCourse ? 'Maryland has 8 representatives (states: x̄ = 8.7, s = 9.723) and 23 counties (states: x̄ = 62.82, s = 46.421).' : `A student scored ${sets[0].x} on a math test (class x̄ = ${sets[0].m}, s = ${sets[0].s}) and ${sets[1].x} on a history test (class x̄ = ${sets[1].m}, s = ${sets[1].s}).`,
      prompt: useCourse ? 'In which distribution is Maryland farther from the mean, measured in standard deviations?' : 'On which test did the student do better relative to the class?',
      answer: mc(rng, sets.map((t, i): Opt => [t.name, i === pick, `z: ${f(z[0], 3)} vs ${f(z[1], 3)}.`]), false),
      hints: ['Compute (x − x̄)/s for each.', 'Compare how many SDs from the mean each one is.'],
      solution: sets.map((t, i) => `${t.name}: (${t.x} − ${t.m})/${t.s} = ${f(z[i], 3)}`).concat([`**${sets[pick].name}**`]),
      takeaway: 'Standardizing lets you compare different distributions.',
      source: useCourse ? { pages: [19], section: '2.7 Practice #3d' } : undefined,
    });
  }, ['apply', 'calculate']),
];

/* ---------------- Comparing distributions ---------------- */

const compare: Generator[] = [
  gen('cp-measures', 'compare', 'Pick measures for a comparison', [3, 4, 5], 'conceptual', (rng, level) => {
    const kind = rng.pick(['both-sym', 'one-skew'] as const);
    return build({
      concept: 'compare', level, type: 'conceptual',
      context: kind === 'both-sym' ? 'Two groups\' histograms are both roughly symmetric with no outliers.' : 'One group\'s histogram is symmetric; the other is strongly skewed right with an outlier.',
      prompt: 'Which measures of center and spread should you use to compare the groups?',
      answer: mc(rng, [
        ['Mean and standard deviation for both', kind === 'both-sym', kind === 'both-sym' ? 'Symmetric → mean and SD.' : 'Skew/outliers distort the mean and SD.', kind === 'both-sym' ? undefined : 'wrong-measure-skew'],
        ['Median and IQR for both', kind === 'one-skew', kind === 'one-skew' ? 'Use resistant measures for both groups so you compare like with like.' : 'For symmetric data, mean and SD are preferred.'],
        ['Mean and SD for the symmetric group, median and IQR for the skewed group', false, 'Don\'t mix and match — compare the same measures.', 'mix-measures'],
      ]),
      hints: ['Skew/outliers in **either** group → resistant measures for **both**.'],
      solution: [kind === 'both-sym' ? 'Mean & SD for both.' : 'Median & IQR for both.'],
      takeaway: 'Compare like with like.',
      source: { pages: [48], section: '2.8 table' },
    });
  }),
  gen('cp-interpret', 'compare', 'Interpret a comparison', [4, 5, 6], 'graph', (rng, level) => {
    const groups = [
      { label: 'Alone', ...fiveNumber(ds('hr-alone').data) },
      { label: 'Friend', ...fiveNumber(ds('hr-friend').data) },
      { label: 'Pet', ...fiveNumber(ds('hr-pet').data) },
    ];
    const ask = rng.pick(['consistent', 'center'] as const);
    const iqrs = groups.map((g) => g.q3 - g.q1);
    const best = ask === 'consistent' ? iqrs.indexOf(Math.min(...iqrs)) : groups.map((g) => g.median).indexOf(Math.min(...groups.map((g) => g.median)));
    return build({
      concept: 'compare', level, type: 'graph',
      context: 'Heart rates (bpm) of women doing a stressful task alone, with a friend, or with their pet dog.',
      visual: { type: 'boxplot', xLabel: 'Heart rate (bpm)', groups: groups.map((g) => ({ ...g, max: g.label === 'Pet' ? 86.4 : g.max, outliers: g.label === 'Pet' ? [97.5] : undefined })) },
      prompt: ask === 'consistent' ? 'Which group had the **most consistent** heart rates?' : 'Which group had the **lowest typical** heart rate?',
      answer: mc(rng, groups.map((g, i): Opt => [g.label, i === best, ask === 'consistent' ? `IQRs: alone ${f(iqrs[0], 1)}, friend ${f(iqrs[1], 1)}, pet ${f(iqrs[2], 1)}.` : `Medians: ${groups.map((x) => f(x.median, 1)).join(', ')}.`]), false),
      hints: [ask === 'consistent' ? 'With skew present, compare IQRs (box widths).' : 'With skew present, compare medians.'],
      solution: [ask === 'consistent' ? `Smallest IQR: **${groups[best].label}** (${f(iqrs[best], 1)} bpm).` : `Lowest median: **${groups[best].label}** (${f(groups[best].median, 1)} bpm).`],
      takeaway: 'Center + spread + shape, with resistant measures when skewed.',
      source: { pages: [16], section: '2.8 Practice #2' },
    });
  }),
  gen('cp-scope', 'compare', 'Scope of a conclusion', [5, 6], 'interpretation', (rng, level) => {
    return build({
      concept: 'compare', level, type: 'interpretation',
      context: 'In the heart-rate study, 45 women who said they were dog lovers were randomly assigned to do a stressful task alone, with a friend, or with their dog.',
      prompt: 'Can the result ("pets lower heart rate under stress") be extended to **any person** and **any stressful task**?',
      answer: mc(rng, [
        ['No — only dog-loving women did one particular task, so we can\'t generalize to everyone or every task', true, 'The scope is limited by who was studied.'],
        ['Yes — it was a randomized experiment', false, 'Random assignment supports cause within the group studied, but the group wasn\'t a random sample of all people.'],
        ['Yes — 45 people is a large enough sample', false, 'Sample size doesn\'t fix who was included.'],
      ]),
      hints: ['Who was in the study? Is that group representative of everyone?'],
      solution: ['The participants were dog-loving women doing one task — not a random sample of all people or tasks.'],
      takeaway: 'Conclusions only extend to the population the sample represents.',
      source: { pages: [16], section: '2.8 Practice #2b' },
    });
  }, ['interpret', 'apply']),
  gen('cp-frq', 'compare', 'Write a comparison (FRQ)', [6, 7], 'free-response', (rng, level) => {
    const pair = rng.pick([
      { a: 'North Branch', b: 'South Branch', A: [27, 33, 45, 55, 61], B: [33, 36, 40, 42, 70], v: 'weekly working hours' },
      { a: 'Control', b: 'Glycerin', A: [2.5, 4.5, 7, 10, 12.5], B: [4, 6, 8.5, 10.5, 16], v: 'average bubble diameter (cm)' },
    ]);
    return build({
      concept: 'compare', level, type: 'free-response',
      context: `Five-number summaries of ${pair.v}: ${pair.a}: ${pair.A.join(', ')}. ${pair.b}: ${pair.B.join(', ')}.`,
      visual: { type: 'boxplot', xLabel: pair.v, groups: [{ label: pair.a, min: pair.A[0], q1: pair.A[1], median: pair.A[2], q3: pair.A[3], max: pair.A[4] }, { label: pair.b, min: pair.B[0], q1: pair.B[1], median: pair.B[2], q3: pair.B[3], max: pair.B[4] }] },
      prompt: 'Compare the two distributions. Discuss center, shape, and spread in context.',
      answer: { kind: 'text', rubric: { prompt: 'Compare center, shape, and spread.', items: [
        { id: 'center', idea: 'Compares medians with values', patterns: ['median'], weight: 1 },
        { id: 'spread', idea: 'Compares IQRs (or ranges) with values', patterns: ['iqr|interquartile|range|spread|consistent|variab'], weight: 1 },
        { id: 'shape', idea: 'Describes the shape of each', patterns: ['skew|symmetric'], weight: 1 },
        { id: 'context', idea: 'Uses context', patterns: [pair.v.split(' ')[0], pair.a.split(' ')[0].toLowerCase(), pair.b.split(' ')[0].toLowerCase()], weight: 0.5 },
      ], misconceptions: [{ patterns: ['mean'], message: 'From five-number summaries you can\'t compute means — compare medians.' }], model: `Center: the median ${pair.v} is ${pair.A[2]} for ${pair.a} and ${pair.B[2]} for ${pair.b}. Spread: IQR ${pair.a} = ${pair.A[3] - pair.A[1]}, ${pair.b} = ${pair.B[3] - pair.B[1]}, so ${pair.A[3] - pair.A[1] > pair.B[3] - pair.B[1] ? pair.b : pair.a} is more consistent in its middle 50%. Shape: ${pair.a} is roughly ${pair.A[4] - pair.A[3] > (pair.A[1] - pair.A[0]) * 1.5 ? 'skewed right' : 'symmetric'}, while ${pair.b} is ${pair.B[4] - pair.B[3] > (pair.B[1] - pair.B[0]) * 1.5 ? 'skewed right (possible high outlier)' : 'roughly symmetric'}.` } },
      hints: ['Center: compare medians. Spread: compare IQRs. Shape: look at whisker and box lengths.'],
      solution: ['Discuss center (medians), spread (IQRs), and shape for both groups, in context.'],
      takeaway: 'SOCS in context, like with like.',
      source: { pages: [15, 21], section: '2.8 Practice #1 / 2.4 Practice #3' },
    });
  }),
];

export const UNIT2_GENERATORS: Generator[] = [...quantGraphs, ...center, ...shape, ...position, ...boxplots, ...rangeIqr, ...stdDev, ...outliers, ...zScore, ...compare];

