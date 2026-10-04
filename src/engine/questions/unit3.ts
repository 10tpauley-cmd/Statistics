import type { Generator } from '../types';
import type { Rng } from '../../lib/stats/random';
import { gaussian } from '../../lib/stats/random';
import { build, gen, mc, num, part, f, type Opt } from './helpers';
import { linearRegression } from '../../lib/stats/regression';
import { BIVARIATE } from '../../content/datasets';

interface BiScenario { x: string; y: string; xu: string; yu: string; xr: [number, number]; a: number; b: number; noise: number; ctx: string; lurk?: string }
const BI: BiScenario[] = [
  { x: 'hours studied', y: 'exam score', xu: 'hours', yu: 'points', xr: [1, 10], a: 52, b: 4.2, noise: 6, ctx: 'A teacher records hours studied and exam score for students.' },
  { x: 'outside temperature', y: 'iced coffee sales', xu: '°F', yu: 'cups', xr: [55, 95], a: -120, b: 3.1, noise: 18, ctx: 'A café tracks the daily high temperature and iced coffee sales.' },
  { x: 'price', y: 'battery life', xu: 'dollars', yu: 'hours', xr: [450, 900], a: 4.67, b: 0.0068, noise: 1.2, ctx: 'A tech site records the price and battery life of tablets.' },
  { x: 'depth', y: 'maximum dive time', xu: 'feet', yu: 'minutes', xr: [50, 130], a: 106.3, b: -0.81, noise: 5, ctx: 'Dive tables list the maximum dive time at different depths.' },
  { x: 'height of a roller coaster', y: 'maximum speed', xu: 'feet', yu: 'mph', xr: [50, 310], a: 24.3, b: 0.215, noise: 4, ctx: 'A database lists roller coaster heights and top speeds.' },
  { x: 'hours of screen time before bed', y: 'hours of sleep', xu: 'hours', yu: 'hours', xr: [0, 5], a: 8.4, b: -0.55, noise: 0.6, ctx: 'A sleep study records evening screen time and hours of sleep.' },
  { x: 'car age', y: 'resale value', xu: 'years', yu: 'thousand dollars', xr: [1, 12], a: 31, b: -2.1, noise: 2.5, ctx: 'A dealership records the age and resale value of used sedans.' },
  { x: 'tablespoons of sugar', y: 'hours a flower stays fresh', xu: 'tablespoons', yu: 'hours', xr: [0, 3], a: 180.8, b: 15.8, noise: 9, ctx: 'Students add sugar to vases and record how long carnations stay fresh.' },
];

function points(rng: Rng, s: BiScenario, n: number, noiseMult = 1): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const x = Math.round((s.xr[0] + rng.next() * (s.xr[1] - s.xr[0])) * 10) / 10;
    const y = Math.round((s.a + s.b * x + gaussian(rng, 0, s.noise * noiseMult)) * 10) / 10;
    pts.push([x, y]);
  }
  return pts;
}

function corrPoints(rng: Rng, target: number, n = 24): [number, number][] {
  const pts: [number, number][] = [];
  const k = Math.sqrt(Math.max(0, 1 - target * target));
  for (let i = 0; i < n; i++) {
    const zx = gaussian(rng);
    const zy = target * zx + k * gaussian(rng);
    pts.push([Math.round((50 + 12 * zx) * 10) / 10, Math.round((50 + 12 * zy) * 10) / 10]);
  }
  return pts;
}

const strengthWord = (r: number) => (Math.abs(r) >= 0.8 ? 'strong' : Math.abs(r) >= 0.5 ? 'moderate' : 'weak');

/* ---------------- Scatterplots ---------------- */

const scatter: Generator[] = [
  gen('sc-roles', 'scatter', 'Explanatory and response', [1, 2, 3], 'recognition', (rng, level) => {
    const s = rng.pick(BI);
    return build({
      concept: 'scatter', level, type: 'recognition', context: s.ctx,
      visual: { type: 'scatter', points: points(rng, s, 12), xLabel: '?', yLabel: '?' },
      prompt: 'Which variable belongs on the **x-axis** (explanatory)?',
      answer: mc(rng, [[s.x[0].toUpperCase() + s.x.slice(1), true, 'It is used to explain/predict the other variable.'], [s.y[0].toUpperCase() + s.y.slice(1), false, 'That is the response — it goes on the y-axis.', 'explanatory-vs-response']], false),
      hints: ['Which variable might explain or predict changes in the other?'],
      solution: [`x (explanatory): ${s.x}; y (response): ${s.y}.`],
      takeaway: 'Explanatory on x, response on y.',
    });
  }),
  gen('sc-describe', 'scatter', 'Describe a scatterplot', [2, 3, 4], 'graph', (rng, level) => {
    const target = rng.pick([0.95, 0.85, 0.6, 0.15, -0.6, -0.88, -0.96]);
    const pts = corrPoints(rng, target);
    const r = linearRegression(pts.map((p) => p[0]), pts.map((p) => p[1])).r;
    const dir = r > 0 ? 'positive' : 'negative';
    const str = strengthWord(r);
    const correct = Math.abs(r) < 0.3 ? 'Weak or no linear relationship' : `${str[0].toUpperCase() + str.slice(1)} ${dir} linear relationship`;
    const pool = ['Strong positive linear relationship', 'Strong negative linear relationship', 'Moderate positive linear relationship', 'Moderate negative linear relationship', 'Weak or no linear relationship'];
    return build({
      concept: 'scatter', level, type: 'graph',
      visual: { type: 'scatter', points: pts, xLabel: 'x', yLabel: 'y' },
      prompt: 'Which description best fits the scatterplot?',
      answer: mc(rng, [[correct, true, `r ≈ ${f(r, 2)}.`], ...rng.sample(pool.filter((p) => p !== correct), 3).map((p): Opt => [p, false, `Look at the direction (uphill/downhill) and how tightly the points follow a line. r ≈ ${f(r, 2)}.`, 'r-strength-sign'])]),
      hints: ['Direction: do the points go uphill (positive) or downhill (negative)?', 'Strength: how closely do they hug a straight line?'],
      solution: [`${correct} (r ≈ ${f(r, 2)}).`],
      takeaway: 'Direction + strength + form.',
      source: { pages: [43], section: '12.1 scatterplot gallery' },
    });
  }, ['interpret']),
  gen('sc-linear', 'scatter', 'Is a line appropriate?', [4, 5], 'graph', (rng, level) => {
    const curved = rng.bool();
    const pts: [number, number][] = Array.from({ length: 10 }, (_, i) => [i, Math.round(((curved ? 0.25 * i * i + 0.5 : 1.2 * i + 1) + gaussian(rng, 0, 0.5)) * 10) / 10]);
    return build({
      concept: 'scatter', level, type: 'graph',
      context: 'Units sold (millions) of a product by year since launch.',
      visual: { type: 'scatter', points: pts, xLabel: 'Years since launch', yLabel: 'Units sold (millions)' },
      prompt: 'Is a linear model the most appropriate?',
      answer: mc(rng, [[curved ? 'No — the pattern curves upward, so a curved model may fit better' : 'Yes — the points follow a roughly straight-line pattern', true, curved ? 'The increase gets larger each year.' : 'The rate of change looks constant.'], [curved ? 'Yes — the points are increasing' : 'No — the points are curved', false, curved ? 'Increasing isn\'t the same as linear; the rate of increase is growing.' : 'The pattern is roughly straight.', 'r-nonlinear']], false),
      hints: ['Is the rate of increase constant (line) or changing (curve)?'],
      solution: [curved ? 'Curved form → consider quadratic/exponential (iPhone example).' : 'Linear form → a line is reasonable.'],
      takeaway: 'Check the form before fitting a line.',
      source: curved ? { pages: [13], section: '12.5 Practice #6a' } : undefined,
    });
  }, ['interpret', 'apply']),
];

/* ---------------- Correlation ---------------- */

const correlation: Generator[] = [
  gen('co-interpret', 'correlation', 'What does r tell you?', [2, 3, 4], 'misconception', (rng, level) => {
    const r = rng.pick([-0.85, -0.92, -0.71, 0.79, 0.88, 0.94, -0.35, 0.28]);
    const dir = r > 0 ? 'positive' : 'negative';
    const str = strengthWord(r);
    return build({
      concept: 'correlation', level, type: 'misconception',
      prompt: `What does a correlation of **r = ${r}** indicate?`,
      answer: mc(rng, [
        [`A ${str} ${dir} linear relationship`, true, 'Sign → direction; size → strength.'],
        [`A ${str} ${dir === 'positive' ? 'negative' : 'positive'} relationship`, false, 'The sign gives the direction.', 'r-strength-sign'],
        [`${Math.round(Math.abs(r) * 100)}% of observations are ${dir}`, false, 'r is not a percentage of observations.', 'r-percent'],
        [`The slope of the line is ${r}`, false, 'r and the slope are different numbers; they only share a sign.', 'r-is-slope'],
      ]),
      hints: ['The sign of r tells direction; how close |r| is to 1 tells strength.'],
      solution: [`|r| = ${Math.abs(r)} → ${str}; sign ${r > 0 ? '+' : '−'} → ${dir}.`],
      takeaway: 'r is unitless, between −1 and 1, and describes linear association only.',
    });
  }),
  gen('co-match', 'correlation', 'Match r to a scatterplot', [3, 4, 5], 'graph', (rng, level) => {
    const choices = rng.shuffle([0.95, 0.6, 0.05, -0.6, -0.95]).slice(0, 4);
    const target = rng.pick(choices);
    const pts = corrPoints(rng, target, 30);
    return build({
      concept: 'correlation', level, type: 'graph',
      visual: { type: 'scatter', points: pts, xLabel: 'x', yLabel: 'y' },
      prompt: 'Which correlation is closest to this scatterplot\'s r?',
      answer: mc(rng, choices.map((c): Opt => [`r = ${c}`, c === target, c === target ? 'Matches the direction and tightness.' : 'Compare direction and how tightly points cluster.', Math.sign(c) !== Math.sign(target) ? 'r-strength-sign' : undefined]), false),
      hints: ['Uphill → positive, downhill → negative.', 'Tight line → |r| near 1; loose cloud → near 0.'],
      solution: [`Closest: r = ${target} (actual sample r ≈ ${f(linearRegression(pts.map((p) => p[0]), pts.map((p) => p[1])).r, 2)}).`],
      takeaway: 'Tightness = strength; slope direction = sign.',
    });
  }, ['interpret', 'recognize']),
  gen('co-causation', 'correlation', 'Correlation and causation', [3, 4, 5, 6], 'real-world', (rng, level) => {
    const cases = [
      { c: 'Across countries, chocolate consumption per person and Nobel Prizes per 10 million residents have r = 0.791.', q: 'If people in the U.S. ate more chocolate, should we expect more Nobel Prizes?', lurk: 'national wealth / research funding', src: [10] },
      { c: 'Letters in the winning Spelling Bee word and deaths by spider bite each year have r = .806.', q: 'Do longer winning words cause more spider-bite deaths?', lurk: 'coincidence — there is no plausible connection', src: [2] },
      { c: 'In summer months, ice cream sales and drownings have a strong positive correlation.', q: 'Does eating ice cream cause drowning?', lurk: 'hot weather (more swimming and more ice cream)' },
      { c: 'Students who own more books at home tend to have higher reading scores (r = 0.72).', q: 'Will buying a student more books guarantee higher scores?', lurk: 'family resources / parental education' },
    ];
    const it = rng.pick(cases);
    return build({
      concept: 'correlation', level, type: 'real-world', context: it.c, prompt: it.q,
      answer: mc(rng, [
        [`Not necessarily — correlation does not imply causation; ${it.lurk} could explain the association`, true, 'A strong r shows association only.'],
        ['Yes — the correlation is strong, so one causes the other', false, 'Strength doesn\'t prove cause.', 'correlation-causation'],
        ['Yes, because r is positive', false, 'The sign shows direction, not causation.', 'correlation-causation'],
      ]),
      hints: ['Was this a randomized experiment?', 'Could a third variable (or coincidence) drive both?'],
      solution: [`Correlation ≠ causation. A possible explanation: ${it.lurk}.`],
      takeaway: 'Correlation is a clue, not a confession.',
      source: it.src ? { pages: it.src, section: 'Correlation examples' } : undefined,
    });
  }, ['interpret', 'apply']),
  gen('co-frq', 'correlation', 'Interpret r in context (FRQ)', [5, 6, 7], 'free-response', (rng, level) => {
    const d = rng.pick(BIVARIATE.filter((b) => ['archaeopteryx', 'coasters', 'scuba', 'spelling'].includes(b.id)));
    const m = linearRegression(d.x, d.y);
    return build({
      concept: 'correlation', level, type: 'free-response',
      context: `${d.title}: ${d.description} r = ${f(m.r, 4)}.`,
      visual: { type: 'scatter', points: d.x.map((x, i) => [x, d.y[i]]), xLabel: d.xLabel, yLabel: d.yLabel },
      prompt: 'Interpret the correlation coefficient in context (strength, direction, and type).',
      answer: { kind: 'text', rubric: { prompt: 'Interpret r.', items: [
        { id: 'str', idea: `Strength: ${strengthWord(m.r)}`, patterns: [strengthWord(m.r)], weight: 1 },
        { id: 'dir', idea: `Direction: ${m.r > 0 ? 'positive' : 'negative'}`, patterns: [m.r > 0 ? 'positive' : 'negative'], weight: 1 },
        { id: 'lin', idea: 'Type: linear', patterns: ['linear'], weight: 1 },
        { id: 'ctx', idea: 'Names both variables in context', patterns: [d.xLabel.split(' ')[0].toLowerCase(), d.yLabel.split(' ')[0].toLowerCase()], weight: 1 },
      ], misconceptions: [{ patterns: ['caus'], message: 'Be careful: r describes association, not causation.' }], model: `There is a ${strengthWord(m.r)}, ${m.r > 0 ? 'positive' : 'negative'}, linear correlation between ${d.xLabel.toLowerCase()} and ${d.yLabel.toLowerCase()}: as ${d.xLabel.toLowerCase()} increases, ${d.yLabel.toLowerCase()} tends to ${m.r > 0 ? 'increase' : 'decrease'}.` } },
      hints: ['Template: "There is a [strength], [direction], linear correlation between [x] and [y]."'],
      solution: [`${strengthWord(m.r)}, ${m.r > 0 ? 'positive' : 'negative'}, linear.`],
      takeaway: 'Strength, direction, form — with both variables named.',
      source: d.source,
    });
  }),
];

/* ---------------- Regression ---------------- */

const regression: Generator[] = [
  gen('rg-predict', 'regression', 'Make a prediction', [2, 3, 4], 'calculation', (rng, level) => {
    const s = rng.pick(BI);
    const x = Math.round((s.xr[0] + rng.next() * (s.xr[1] - s.xr[0])) * (s.xr[1] - s.xr[0] < 10 ? 10 : 1)) / (s.xr[1] - s.xr[0] < 10 ? 10 : 1);
    const y = s.a + s.b * x;
    const sign = s.b < 0 ? '−' : '+';
    return build({
      concept: 'regression', level, type: 'calculation', context: `${s.ctx} The least-squares line is ŷ = ${s.a} ${sign} ${Math.abs(s.b)}x, where x = ${s.x} (${s.xu}) and y = ${s.y} (${s.yu}).`,
      prompt: `Predict the ${s.y} when x = ${x} ${s.xu}.`,
      answer: num(y, Math.max(0.01, Math.abs(y) * 0.002), { wrong: [{ value: s.a + s.b, misconception: 'arithmetic', why: `Substitute x = ${x}, not 1.` }] }),
      hints: ['Substitute the x-value into ŷ = a + bx.', `ŷ = ${s.a} ${sign} ${Math.abs(s.b)}(${x}).`, `${Math.abs(s.b)} × ${x} = ${f(Math.abs(s.b) * x, 4)}.`],
      solution: [`ŷ = ${s.a} ${sign} ${Math.abs(s.b)}(${x}) = **${f(y, 3)}** ${s.yu}`],
      takeaway: 'ŷ is a prediction (an average expectation), not a guarantee.',
      calculator: true,
    });
  }),
  gen('rg-slope', 'regression', 'Interpret the slope', [3, 4, 5], 'interpretation', (rng, level) => {
    const s = rng.pick(BI);
    const dirWord = s.b > 0 ? 'increases' : 'decreases';
    return build({
      concept: 'regression', level, type: 'interpretation', context: `${s.ctx} ŷ = ${s.a} ${s.b < 0 ? '−' : '+'} ${Math.abs(s.b)}x (x = ${s.x}, y = ${s.y}).`,
      prompt: 'Which is the correct interpretation of the slope?',
      answer: mc(rng, [
        [`For every 1 ${s.xu.replace(/s$/, '')} increase in ${s.x}, the predicted ${s.y} ${dirWord} by ${Math.abs(s.b)} ${s.yu}`, true, 'Slope = predicted change in y per 1-unit increase in x.'],
        [`For every 1 ${s.yu.replace(/s$/, '')} increase in ${s.y}, ${s.x} ${dirWord} by ${Math.abs(s.b)} ${s.xu}`, false, 'That reverses x and y.', 'slope-wording'],
        [`When ${s.x} is 0, the predicted ${s.y} is ${Math.abs(s.b)} ${s.yu}`, false, 'That describes an intercept, and the intercept is a = ' + s.a + '.', 'intercept-literal'],
        [`The correlation between ${s.x} and ${s.y} is ${s.b}`, false, 'The slope is not r.', 'r-is-slope'],
      ]),
      hints: ['Template: "For every 1-unit increase in x, the predicted y increases/decreases by b."'],
      solution: [`b = ${s.b}: each extra ${s.xu.replace(/s$/, '')} of ${s.x} → predicted ${s.y} ${dirWord} by ${Math.abs(s.b)} ${s.yu}.`],
      takeaway: 'Slope: per 1 unit of x, predicted change in y.',
      source: { pages: [12, 11], section: '12.1 Practice' },
    });
  }),
  gen('rg-intercept', 'regression', 'Is the intercept meaningful?', [4, 5, 6], 'interpretation', (rng, level) => {
    const cases = [
      { c: 'ŷ = −5.4141 + 1.2778x predicts spider-bite deaths (y) from letters in the winning Spelling Bee word (x, observed 7–13).', meaningful: false, why: 'A 0-letter word is impossible and far outside 7–13; the predicted −5.41 deaths is meaningless.', src: [2] },
      { c: 'ŷ = 180.8 + 15.8x predicts hours a flower stays fresh (y) from tablespoons of sugar (x, observed 0–3).', meaningful: true, why: 'x = 0 (no sugar) is within the data, so 180.8 hours is a sensible prediction.', src: [12] },
      { c: 'ŷ = −3.6596 + 1.1969x predicts humerus length (y) from femur length (x, observed 38–74 cm).', meaningful: false, why: 'A femur of 0 cm doesn\'t exist and is far outside the data.', src: [11] },
    ];
    const it = rng.pick(cases);
    return build({
      concept: 'regression', level, type: 'interpretation', context: it.c,
      prompt: 'Does the y-intercept have a meaningful interpretation here?',
      answer: mc(rng, [['Yes', it.meaningful, it.why], ['No', !it.meaningful, it.why, it.meaningful ? undefined : 'intercept-literal']], false),
      hints: ['The intercept is the prediction at x = 0. Is x = 0 possible and inside the observed data?'],
      solution: [it.why],
      takeaway: 'Interpret the intercept only when x = 0 makes sense and is near the data.',
      source: { pages: it.src, section: '12.1 Practice / Exam #1' },
    });
  }),
  gen('rg-extrapolate', 'regression', 'Extrapolation', [4, 5, 6], 'conceptual', (rng, level) => {
    const s = rng.pick(BI);
    const outside = rng.bool();
    const x = outside ? Math.round(s.xr[1] * rng.pick([2, 3]) + (s.xr[1] < 10 ? 1 : 10)) : Math.round(((s.xr[0] + s.xr[1]) / 2) * 10) / 10;
    return build({
      concept: 'regression', level, type: 'conceptual',
      context: `${s.ctx} The data cover ${s.x} from ${s.xr[0]} to ${s.xr[1]} ${s.xu}.`,
      prompt: `Is it appropriate to use the regression line to predict ${s.y} at x = ${x} ${s.xu}?`,
      answer: mc(rng, [[outside ? 'No — that is extrapolation, outside the observed x-values' : 'Yes — it is within the observed x-values', true, outside ? 'The pattern may not continue beyond the data.' : 'Interpolation within the domain is reasonable.'], [outside ? 'Yes — just substitute into the equation' : 'No — predictions are never appropriate', false, outside ? 'You can compute a number, but it\'s unreliable.' : 'Within the domain, predictions are reasonable.', outside ? 'extrapolation' : undefined]], false),
      hints: [`Compare x = ${x} with the observed range ${s.xr[0]}–${s.xr[1]}.`],
      solution: [outside ? `x = ${x} is outside ${s.xr[0]}–${s.xr[1]} → **extrapolation**.` : `x = ${x} is inside the domain → okay.`],
      takeaway: 'Predict only within the domain of the sample data.',
      source: { pages: [43, 12], section: '12.1 note on domain' },
    });
  }, ['interpret', 'apply']),
  gen('rg-solve-x', 'regression', 'Solve for x', [5, 6], 'calculation', (rng, level) => {
    const it = rng.pick([
      { eq: 'ŷ = −3.6596 + 1.1969x', a: -3.6596, b: 1.1969, y: rng.int(60, 82), ctx: 'Archaeopteryx: humerus length (y, cm) from femur length (x, cm). A fossil has a humerus but no femur.', ask: 'femur length (cm)', src: [11] },
      { eq: 'ŷ = −5.4141 + 1.2778x', a: -5.4141, b: 1.2778, y: rng.int(5, 11), ctx: 'Spider-bite deaths (y) from letters in the winning Spelling Bee word (x).', ask: 'number of letters', src: [2] },
    ]);
    const x = (it.y - it.a) / it.b;
    return build({
      concept: 'regression', level, type: 'calculation', context: `${it.ctx} The line is ${it.eq}.`,
      prompt: `If y = ${it.y}, what ${it.ask} does the line suggest?`,
      answer: num(x, 0.02, { wrong: [{ value: it.a + it.b * it.y, misconception: 'arithmetic', why: 'You substituted y for x. Set ŷ equal to the y-value and solve for x.' }] }),
      hints: [`Set ${it.y} = ${it.a} + ${it.b}x.`, `Add ${Math.abs(it.a)} to both sides: ${f(it.y - it.a, 4)} = ${it.b}x.`, `Divide by ${it.b}.`],
      solution: [`${it.y} = ${it.a} + ${it.b}x → x = (${it.y} − (${it.a}))/${it.b} = **${f(x, 2)}**`],
      takeaway: 'You can solve the line for x — as the course does.',
      source: { pages: it.src, section: '12.1 Practice / Exam #1 #9g' },
    });
  }),
  gen('rg-data', 'regression', 'Regression from data (technology)', [5, 6, 7], 'exam', (rng, level) => {
    const d = rng.pick(BIVARIATE.filter((b) => ['archaeopteryx', 'scuba', 'coasters'].includes(b.id)));
    const m = linearRegression(d.x, d.y);
    const xs = d.x.slice().sort((a, b) => a - b);
    const x0 = Math.round(((xs[0] + xs[xs.length - 1]) / 2) * 1) / 1;
    const y0 = m.a + m.b * x0;
    const parts = [
      part('Slope', `Use technology (the Calculator → Regression) to find the slope b.`, num(m.b, Math.abs(m.b) * 0.01 + 0.0005), `b ≈ ${f(m.b, 4)}.`),
      part('Intercept', 'Find the y-intercept a.', num(m.a, Math.abs(m.a) * 0.01 + 0.01), `a ≈ ${f(m.a, 4)}.`),
      part('Predict', `Predict y when x = ${x0}.`, num(y0, Math.abs(y0) * 0.01 + 0.05), `ŷ = ${f(m.a, 4)} + ${f(m.b, 4)}(${x0}) ≈ ${f(y0, 2)}.`),
    ];
    return build({
      concept: 'regression', level, type: 'exam',
      context: `${d.title}. x = ${d.xLabel}: ${d.x.join(', ')}. y = ${d.yLabel}: ${d.y.join(', ')}.`,
      visual: { type: 'scatter', points: d.x.map((x, i) => [x, d.y[i]]), xLabel: d.xLabel, yLabel: d.yLabel },
      prompt: 'Find the least-squares regression line and use it to predict.',
      answer: parts[2].answer, parts,
      hints: ['Enter x and y in the Calculator\'s Regression tool.', `ŷ ≈ ${f(m.a, 2)} + ${f(m.b, 3)}x.`],
      solution: [`ŷ = ${f(m.a, 4)} + ${f(m.b, 4)}x`, `At x = ${x0}: ŷ ≈ ${f(y0, 2)}.`],
      takeaway: 'Technology finds a and b; you interpret and predict.',
      source: d.source,
      calculator: true,
    });
  }, ['calculate', 'apply']),
];

/* ---------------- r-squared ---------------- */

const rSquared: Generator[] = [
  gen('r2-compute', 'r-squared', 'r ↔ r²', [2, 3, 4], 'calculation', (rng, level) => {
    const backward = rng.bool();
    if (!backward) {
      const r = rng.pick([0.791, 0.9941, 0.806, -0.932, 0.62, -0.75]);
      return build({
        concept: 'r-squared', level, type: 'calculation',
        prompt: `A regression has r = ${r}. Compute r². (4 decimals.)`,
        answer: num(r * r, 0.0006, { wrong: [{ value: Math.abs(r), misconception: 'r2-meaning', why: 'Square r.' }] }),
        hints: ['r² is r squared.', `${r} × ${r}`],
        solution: [`(${r})² = **${f(r * r, 4)}**${r === 0.791 ? ' (the PDF key prints 0.6247 — a typo)' : ''}`],
        takeaway: 'r² is always between 0 and 1.',
        source: r === 0.791 ? { pages: [10], section: '12.1 Practice #1b', note: 'Key prints 0.6247; correct value 0.6257.' } : undefined,
      });
    }
    const r2 = rng.pick([0.342, 0.81, 0.64, 0.4489, 0.9025]);
    const slopeNeg = rng.bool();
    const r = (slopeNeg ? -1 : 1) * Math.sqrt(r2);
    return build({
      concept: 'r-squared', level, type: 'calculation',
      prompt: `A regression line has slope ${slopeNeg ? '−' : '+'}${rng.int(1, 9)}.${rng.int(1, 9)} and r² = ${r2}. Find r.`,
      answer: num(r, 0.002, { wrong: [{ value: -r, misconception: 'r-from-r2-sign', why: 'r has the same sign as the slope.' }] }),
      hints: ['r = ±√r².', 'Choose the sign that matches the slope.'],
      solution: [`√${r2} = ${f(Math.sqrt(r2), 4)}; slope is ${slopeNeg ? 'negative' : 'positive'} → r = **${f(r, 4)}**`],
      takeaway: 'r takes the sign of the slope.',
      source: { pages: [12], section: '12.1 Practice #5c' },
    });
  }),
  gen('r2-interpret', 'r-squared', 'Interpret r²', [3, 4, 5], 'interpretation', (rng, level) => {
    const s = rng.pick(BI);
    const r2 = rng.pick([0.342, 0.649, 0.9883, 0.81, 0.53]);
    const pct = f(r2 * 100, 2);
    return build({
      concept: 'r-squared', level, type: 'interpretation', context: `${s.ctx} The regression of ${s.y} on ${s.x} has r² = ${r2}.`,
      prompt: 'Which interpretation is correct?',
      answer: mc(rng, [
        [`About ${pct}% of the variation in ${s.y} is explained by the variation in ${s.x}`, true, 'Template interpretation.'],
        [`About ${pct}% of the points lie on the regression line`, false, 'r² is about variation explained.', 'r2-meaning'],
        [`${s.x[0].toUpperCase() + s.x.slice(1)} causes ${pct}% of ${s.y}`, false, 'r² doesn\'t imply causation.', 'correlation-causation'],
        [`The correlation is ${r2}`, false, 'That is r², not r.', 'r-percent'],
      ]),
      hints: ['Template: "About __% of the variation in [y] is explained by the variation in [x]."'],
      solution: [`${pct}% of the variation in ${s.y} is explained by ${s.x}.`],
      takeaway: 'r² = % of variation in y explained by x.',
    });
  }),
];

/* ---------------- Residuals ---------------- */

const residuals: Generator[] = [
  gen('re-compute', 'residuals', 'Compute a residual', [2, 3, 4], 'calculation', (rng, level) => {
    const s = rng.pick(BI);
    const x = Math.round((s.xr[0] + rng.next() * (s.xr[1] - s.xr[0])) * (s.xr[1] - s.xr[0] < 10 ? 1 : 1));
    const yhat = s.a + s.b * x;
    const y = Math.round((yhat + rng.pick([-1, 1]) * s.noise * rng.float(0.4, 1.6, 2)) * 10) / 10;
    const res = y - yhat;
    return build({
      concept: 'residuals', level, type: 'calculation',
      context: `${s.ctx} ŷ = ${s.a} ${s.b < 0 ? '−' : '+'} ${Math.abs(s.b)}x. One observation has x = ${x} ${s.xu} and actual y = ${y} ${s.yu}.`,
      prompt: 'Find the residual for this observation.',
      answer: num(res, Math.max(0.01, Math.abs(res) * 0.003), { wrong: [{ value: -res, misconception: 'residual-order', why: 'Residual = observed − predicted.' }] }),
      hints: ['Residual = observed − predicted.', `First predict: ŷ = ${s.a} ${s.b < 0 ? '−' : '+'} ${Math.abs(s.b)}(${x}).`, `ŷ = ${f(yhat, 3)}.`, `${y} − ${f(yhat, 3)}`],
      solution: [`ŷ = ${f(yhat, 3)}`, `Residual = ${y} − ${f(yhat, 3)} = **${f(res, 3)}**`],
      takeaway: 'Positive → underpredicted; negative → overpredicted.',
      interpretFollowUp: part('Interpret', `What does a residual of ${f(res, 2)} mean?`, mc(rng, [
        [res < 0 ? `The line overpredicted the ${s.y} by about ${f(Math.abs(res), 2)} ${s.yu}` : `The line underpredicted the ${s.y} by about ${f(Math.abs(res), 2)} ${s.yu}`, true, 'Residual = actual − predicted.'],
        [res < 0 ? `The line underpredicted by ${f(Math.abs(res), 2)} ${s.yu}` : `The line overpredicted by ${f(Math.abs(res), 2)} ${s.yu}`, false, 'Check the sign: positive means actual is above the line.', 'residual-sign-meaning'],
      ]), 'Negative residual → prediction too high (overprediction).'),
      source: { pages: [12], section: '12.1 Practice #4a' },
    });
  }),
  gen('re-plot', 'residuals', 'Read a residual plot', [3, 4, 5, 6], 'graph', (rng, level) => {
    const curved = rng.bool();
    const pts: [number, number][] = Array.from({ length: 12 }, (_, i) => [i + 1, Math.round(((curved ? 0.12 * (i - 5.5) ** 2 - 1.1 : 0) + gaussian(rng, 0, curved ? 0.25 : 0.9)) * 100) / 100]);
    return build({
      concept: 'residuals', level, type: 'graph',
      context: 'A residual plot for a linear regression model is shown.',
      visual: { type: 'residual', points: pts, xLabel: 'x' },
      prompt: 'Is a linear model appropriate?',
      answer: mc(rng, [[curved ? 'No — the residuals show a curved pattern' : 'Yes — the residuals are randomly scattered with no pattern', true, curved ? 'A pattern means the line systematically misses.' : 'Random scatter supports a linear model.'], [curved ? 'Yes — the residuals are small' : 'No — some residuals are negative', false, curved ? 'Size isn\'t the issue; the pattern is.' : 'Residuals are always both positive and negative.', 'residual-pattern']], false),
      hints: ['Look for a pattern (curve, U-shape). Random scatter = good.'],
      solution: [curved ? 'Curved pattern → linear not appropriate.' : 'No pattern → linear appropriate.'],
      takeaway: 'Good model → random residuals.',
      source: { pages: [12, 13], section: '12.1 Practice #5a, #6c' },
    });
  }, ['interpret']),
  gen('re-models', 'residuals', 'Choose the best model', [5, 6, 7], 'exam', (rng, level) => {
    const models = rng.shuffle([
      { name: 'Linear', s: 1.4429, r2: 0.9138, pattern: 'curved' },
      { name: 'Quadratic', s: 0.6761, r2: 0.9838, pattern: 'random' },
      { name: 'Exponential', s: 1.5587, r2: 0.97, pattern: 'slight pattern' },
    ]);
    return build({
      concept: 'residuals', level, type: 'exam',
      context: 'Three models were fit to iPhone opening-weekend sales (millions) vs. years since 2007.',
      visual: { type: 'table', headers: ['Model', 's', 'r²', 'Residual plot'], rows: models.map((m) => [m.name, m.s, m.r2, m.pattern]) },
      prompt: 'Which model is most appropriate?',
      answer: mc(rng, models.map((m): Opt => [m.name, m.name === 'Quadratic', m.name === 'Quadratic' ? 'Random residuals, smallest s, largest r².' : `${m.name}: s = ${m.s}, r² = ${m.r2}, residuals ${m.pattern}.`, m.name === 'Linear' ? 'residual-pattern' : undefined]), false),
      hints: ['Prefer: random residual plot, smallest s, largest r².'],
      solution: ['Quadratic: random residuals, s = 0.6761 (smallest typical error), r² = 0.9838 (most variation explained).'],
      takeaway: 'Use residuals, s, and r² together.',
      source: { pages: [13, 14], section: '12.5 Practice #6' },
    });
  }, ['interpret', 'apply']),
];

export const UNIT3_GENERATORS: Generator[] = [...scatter, ...correlation, ...regression, ...rSquared, ...residuals];
