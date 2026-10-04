import type { Generator } from '../types';
import { build, gen, mc, num, f, type Opt } from './helpers';
import { linearRegression } from '../../lib/stats/regression';
import { sd } from '../../lib/stats/descriptive';
import { integerMeanData } from './scenarios';
import { TABLES } from '../../content/datasets';

/**
 * Additional generators that guarantee every concept can earn evidence in each of its
 * mastery dimensions (recognize / calculate / interpret / apply) through practice.
 */

const recognitionTerm = (id: string, concept: Generator['concept'], title: string, items: { q: string; a: string; why: string }[], wrongPool?: string[]) =>
  gen(id, concept, title, [1, 2], 'recognition', (rng, level) => {
    const it = rng.pick(items);
    const pool = (wrongPool ?? items.map((x) => x.a)).filter((x) => x !== it.a);
    return build({
      concept, level, type: 'recognition',
      prompt: it.q,
      answer: mc(rng, [[it.a, true, it.why], ...rng.sample(Array.from(new Set(pool)), 3).map((w): Opt => [w, false, it.why])]),
      hints: ['Recall the definition from the lesson.'],
      solution: [`**${it.a}** — ${it.why}`],
      takeaway: it.why,
    });
  });

/* ---------- Unit 1 ---------- */

const dtSummary = gen('dt-summary', 'data-types', 'Which summary makes sense?', [4, 5, 6], 'real-world', (rng, level) => {
  const items = [
    { v: 'the zip code of each customer', a: 'The most common zip code (and the percent of customers in each)', w: ['The average zip code', 'The standard deviation of zip codes'], why: 'Zip codes are categorical labels — count them, don\'t average them.' },
    { v: 'the jersey number of each player', a: 'A count of players per jersey number', w: ['The mean jersey number', 'The median jersey number'], why: 'Jersey numbers are labels; arithmetic on them is meaningless.' },
    { v: 'each student\'s favorite streaming service', a: 'The percent choosing each service (bar graph)', w: ['The mean favorite service', 'A histogram of services'], why: 'Categorical data → proportions and bar graphs.' },
    { v: 'the number of text messages each student sent today', a: 'The mean or median number of texts (histogram/dotplot)', w: ['A pie chart of text counts', 'The most common text message'], why: 'Discrete quantitative data → numerical summaries and dot/histogram displays.' },
    { v: 'each runner\'s marathon time', a: 'The median time and IQR (or mean and SD)', w: ['The percent of runners in each time', 'A pie chart of times'], why: 'Continuous quantitative data → center and spread.' },
  ];
  const it = rng.pick(items);
  return build({
    concept: 'data-types', level, type: 'real-world',
    context: `A researcher records ${it.v}.`,
    prompt: 'Which summary is appropriate for this variable?',
    answer: mc(rng, [[it.a, true, it.why], ...it.w.map((w): Opt => [w, false, it.why, 'numbers-are-quantitative'])]),
    hints: ['First classify the variable: categorical, discrete, or continuous?'],
    solution: [it.why],
    takeaway: 'The data type decides which summaries are allowed.',
  });
});

const ftInterpret = gen('ft-interpret', 'freq-tables', 'Read a frequency table', [2, 3, 4, 5], 'interpretation', (rng, level) => {
  const cum = rng.pick([0.6, 0.667, 0.8, 0.883, 0.983]);
  const cls = { 0.6: '0–4', 0.667: '5–9', 0.8: '10–14', 0.883: '15–19', 0.983: '20–24' }[cum]!;
  const upper = Number(cls.split('–')[1]);
  return build({
    concept: 'freq-tables', level, type: 'interpretation',
    context: `In a table of days missed by 60 employees, the class ${cls} has cumulative relative frequency ${cum}.`,
    prompt: `What does ${cum} mean?`,
    answer: mc(rng, [
      [`About ${f(cum * 100, 1)}% of employees missed ${upper} or fewer days`, true, 'Cumulative = everything up to and including the class.'],
      [`About ${f(cum * 100, 1)}% of employees missed between ${cls} days`, false, 'That would be the (non-cumulative) relative frequency.', 'cumulative-confusion'],
      [`${f(cum * 60, 0)} employees missed exactly ${upper} days`, false, 'Cumulative counts include every class below too.', 'cumulative-confusion'],
    ]),
    hints: ['Cumulative means "running total up to here".'],
    solution: [`${cum} = proportion missing at most ${upper} days.`],
    takeaway: 'Cumulative relative frequency = "at most" proportion.',
    source: { pages: [1], section: 'Exam #1 Review #5' },
  });
}, ['recognize', 'interpret']);

const ftTerms = recognitionTerm('ft-terms', 'freq-tables', 'Frequency vocabulary', [
  { q: 'Which column divides a class count by the total number of observations?', a: 'Relative frequency', why: 'Relative frequency = f ÷ n.' },
  { q: 'Which column is a running total of class counts?', a: 'Cumulative frequency', why: 'Cumulative = running total.' },
  { q: 'In a correct table, the last **cumulative relative frequency** must equal…', a: '1', why: 'All observations are included by the last class.' },
  { q: 'Which column simply counts how many observations fall in a class?', a: 'Frequency', why: 'Frequency = count.' },
], ['Relative frequency', 'Cumulative frequency', 'Frequency', '1', '0', 'n', 'Class width']);

const iqWrite = gen('iq-write', 'investigative', 'Write the investigative question', [4, 5, 6], 'real-world', (rng, level) => {
  const items = [
    { s: 'A fitness company randomly assigns 200 customers to an in-person or online trainer and records how often they work out.', a: 'Is there convincing evidence that an in-person trainer increases how often customers work out compared with an online trainer?', w: ['How often do people work out?', 'What is the true proportion for all customers?', 'Do trainers work?'] },
    { s: 'A health researcher samples high school and middle school students and records hours of sleep per night.', a: 'What is the difference in the mean hours of sleep per night between all high school and all middle school students?', w: ['Do students sleep?', 'What is the mean?', 'Is sleep important for middle schoolers?'] },
    { s: 'A transportation center randomly samples 290 Michigan high school students and asks if they drive their own car to school.', a: 'What proportion of all Michigan high school students drive their own car to school?', w: ['Do students like driving?', 'What proportion of students?', 'How many cars are in Michigan?'] },
  ];
  const it = rng.pick(items);
  return build({
    concept: 'investigative', level, type: 'real-world', context: it.s,
    prompt: 'Which is the best investigative question for this study?',
    answer: mc(rng, [[it.a, true, 'It names the variable, the inference goal, and the population.'], ...it.w.map((w): Opt => [w, false, 'It is missing at least one component (variable, goal, or scope).', 'missing-inference-component'])]),
    hints: ['Check each choice for variable, goal (estimate/test), and scope (population).'],
    solution: [it.a],
    takeaway: 'Variable + goal + scope.',
    source: { pages: [63], section: '1.3–1.4 Practice #4' },
  });
});

/* ---------- Unit 2 ---------- */

const qgClaim = gen('qg-claim', 'quant-graphs', 'Check a claim with a histogram', [5, 6, 7], 'real-world', (rng, level) => {
  const counts = [5, 17, 23, 39, 25, 2];
  const k = rng.pick([3, 4]);
  const share = counts.slice(k).reduce((a, b) => a + b, 0) / 111;
  const claim = rng.pick([0.5, 0.6, 0.25]);
  const supported = share >= claim;
  return build({
    concept: 'quant-graphs', level, type: 'real-world',
    context: '111 shoppers at a T-shirt store reported how many shirts they own costing over $19 (relative frequency histogram).',
    visual: { type: 'histogram', relative: true, xLabel: 'Number of $19+ shirts owned', bins: counts.map((c, i) => ({ lo: i + 0.5, hi: i + 1.5, count: c / 111 })) },
    prompt: `The store manager claims that at least ${claim * 100}% of shoppers own ${k + 1} or more of these shirts. Is the claim supported?`,
    answer: mc(rng, [[`${supported ? 'Yes' : 'No'} — ${f(share * 100, 1)}% own ${k + 1} or more`, true, `(${counts.slice(k).join(' + ')})/111 = ${f(share, 4)}.`], [`${supported ? 'No' : 'Yes'} — ${f(counts[k] / 111 * 100, 1)}% own ${k + 1} or more`, false, 'That uses only one bar; "or more" includes every bar from there up.', 'cumulative-confusion']], false),
    hints: [`Add the relative frequencies for ${k + 1}, ${k + 2}, … shirts.`],
    solution: [`(${counts.slice(k).join(' + ')})/111 = ${f(share * 100, 1)}% → claim ${supported ? 'supported' : 'not supported'}.`],
    takeaway: 'Read cumulative shares from histograms to test claims.',
    source: { pages: [22], section: '2.1–2.2 Practice #2' },
  });
}, ['apply', 'calculate']);

const ceTerms = recognitionTerm('ce-terms', 'center', 'Center vocabulary', [
  { q: 'Which symbol is the **sample** mean?', a: 'x̄', why: 'x̄ (x-bar) is the sample mean; μ is the population mean.' },
  { q: 'Which symbol is the **population** mean?', a: 'μ', why: 'μ (mu) describes the population.' },
  { q: 'What is the **midrange**?', a: 'The mean of the minimum and maximum', why: 'Midrange = (min + max)/2.' },
  { q: 'What is the **mode**?', a: 'The most frequently occurring value', why: 'Mode = most common value.' },
  { q: 'Which measure of center is **resistant** to outliers?', a: 'Median', why: 'The median depends only on the middle position.' },
], ['x̄', 'μ', 'n', 'σ', 'Median', 'Mean', 'Midrange', 'The mean of the minimum and maximum', 'The most frequently occurring value', 'The middle value of the sorted data']);

const shContext = gen('sh-context', 'shape', 'Predict the shape', [4, 5, 6], 'real-world', (rng, level) => {
  const items = [
    { s: 'Annual incomes of all residents of a large city', a: 'Skewed right', why: 'A few very high incomes form a long right tail.' },
    { s: 'Scores on a very easy quiz where most students got 9 or 10 out of 10', a: 'Skewed left', why: 'Scores pile up near the max; a few low scores form a left tail.' },
    { s: 'Heights of adult men in a large random sample', a: 'Approximately symmetric', why: 'Heights cluster around a center with similar tails.' },
    { s: 'Number of hurricane deaths per storm', a: 'Skewed right', why: 'Most storms have few deaths; a few have hundreds.' },
    { s: 'Fitness scores for a group mixing 6th graders and 12th graders', a: 'Bimodal', why: 'Two groups → two peaks.' },
    { s: 'The last digit of randomly chosen phone numbers', a: 'Uniform', why: 'Each digit 0–9 is equally likely.' },
  ];
  const it = rng.pick(items);
  const names = ['Skewed right', 'Skewed left', 'Approximately symmetric', 'Bimodal', 'Uniform'];
  return build({
    concept: 'shape', level, type: 'real-world', context: it.s,
    prompt: 'What shape would you expect the distribution to have?',
    answer: mc(rng, [[it.a, true, it.why], ...rng.sample(names.filter((n) => n !== it.a), 3).map((n): Opt => [n, false, it.why, (n === 'Skewed left' && it.a === 'Skewed right') || (n === 'Skewed right' && it.a === 'Skewed left') ? 'skew-direction' : undefined])]),
    hints: ['Where would most values be? Is there a natural floor or ceiling? Any extreme values on one side?'],
    solution: [`${it.a}: ${it.why}`],
    takeaway: 'Think about floors, ceilings, and rare extremes.',
    source: { pages: [53], section: '2.4 Example 1 (Marines)' },
  });
}, ['apply', 'interpret']);

const poTerms = recognitionTerm('po-terms', 'position', 'Position vocabulary', [
  { q: 'Q1 is the same as which percentile?', a: '25th percentile', why: 'Q1 splits off the lowest 25%.' },
  { q: 'The median is the same as which percentile?', a: '50th percentile', why: 'Half the data are below the median.' },
  { q: 'Q3 is the same as which percentile?', a: '75th percentile', why: '75% of the data are below Q3.' },
  { q: 'Which list is the five-number summary?', a: 'Min, Q1, median, Q3, max', why: 'Those five values build a boxplot.' },
], ['25th percentile', '50th percentile', '75th percentile', '100th percentile', 'Min, Q1, median, Q3, max', 'Mean, SD, min, max, n', 'Q1, Q2, Q3, IQR, range']);

const bxParts = recognitionTerm('bx-parts', 'boxplots', 'Parts of a boxplot', [
  { q: 'In a boxplot, the line inside the box marks the…', a: 'Median', why: 'The box runs Q1→Q3 with the median inside.' },
  { q: 'The width of the box in a boxplot equals the…', a: 'IQR', why: 'Box = Q1 to Q3 = IQR.' },
  { q: 'About what percent of the data are inside the box?', a: '50%', why: 'Q1 to Q3 holds the middle half.' },
  { q: 'Points drawn separately beyond the whiskers in a modified boxplot are…', a: 'Outliers', why: 'They are beyond the 1.5×IQR fences.' },
], ['Median', 'Mean', 'IQR', 'Range', '50%', '25%', '75%', 'Outliers', 'Quartiles']);

const bxHurricanes = gen('bx-hurricanes', 'boxplots', 'Hurricanes: evaluate a claim', [5, 6, 7], 'real-world', (rng, level) => {
  return build({
    concept: 'boxplots', level, type: 'real-world',
    context: 'Deadly hurricanes 1950–2012 (big outliers removed). Male-named: mean 14.233, 0/1/5/15/84. Female-named: mean 23.758, 0/2/5/21/256.',
    visual: { type: 'boxplot', xLabel: 'Total # of deaths', groups: [{ label: 'Female', min: 0, q1: 2, median: 5, q3: 21, max: 256 }, { label: 'Male', min: 0, q1: 1, median: 5, q3: 15, max: 84 }] },
    prompt: 'A headline says "Female-named hurricanes are deadlier." Do the boxplots support this?',
    answer: mc(rng, [
      ['Not reliably — both medians are 5; the higher female mean comes from a few extreme storms (strong right skew)', true, 'Skewed data → compare medians.'],
      ['Yes — the female mean (23.758) is much higher', false, 'Means are distorted by extreme values in skewed data.', 'wrong-measure-skew'],
      ['Yes — the female box is longer, so there are more female hurricanes', false, 'Box length shows spread, not count.', 'box-length-count'],
    ]),
    hints: ['Both are strongly right-skewed. Which measure of center should you compare?'],
    solution: ['Medians are equal (5). The difference in means is driven by a few extreme storms.'],
    takeaway: 'Skewed data: compare medians, not means.',
    source: { pages: [55], section: '2.4, 2.6 Example 3h' },
  });
}, ['apply', 'interpret']);

const riTerms = recognitionTerm('ri-terms', 'range-iqr', 'Range vs. IQR', [
  { q: 'Which measure of spread is computed as max − min?', a: 'Range', why: 'Range uses the two extremes.' },
  { q: 'Which measure of spread is computed as Q3 − Q1?', a: 'IQR', why: 'IQR covers the middle 50%.' },
  { q: 'Which measure of spread is resistant to outliers?', a: 'IQR', why: 'It ignores the top and bottom 25%.' },
], ['Range', 'IQR', 'Standard deviation', 'Variance', 'Mean']);

const riBranches = gen('ri-branches', 'range-iqr', 'Which branch is more consistent?', [4, 5, 6], 'real-world', (rng, level) => {
  const A = [rng.int(25, 30), rng.int(31, 35), rng.int(40, 46), rng.int(52, 56), rng.int(58, 62)];
  const B = [rng.int(30, 34), rng.int(35, 37), rng.int(38, 41), rng.int(42, 44), rng.int(65, 72)];
  const iqrA = A[3] - A[1]; const iqrB = B[3] - B[1];
  return build({
    concept: 'range-iqr', level, type: 'real-world',
    context: `Weekly hours at two bank branches (min, Q1, median, Q3, max). North: ${A.join(', ')}. South: ${B.join(', ')} (the South maximum is a likely outlier).`,
    prompt: 'Which branch\'s typical working hours are more consistent, and which measure shows it?',
    answer: mc(rng, [
      [`${iqrB < iqrA ? 'South' : 'North'} — its IQR (${Math.min(iqrA, iqrB)}) is smaller`, true, 'IQR is the right spread measure with an outlier present.'],
      [`${iqrB < iqrA ? 'North' : 'South'} — its IQR (${Math.max(iqrA, iqrB)}) is larger`, false, 'A larger IQR means *less* consistency.'],
      [`North — its range (${A[4] - A[0]}) is smaller than South's (${B[4] - B[0]})`, false, 'The South range is inflated by an outlier — use the IQR.', 'resistant-measures'],
    ]),
    hints: ['With an outlier present, compare IQRs.', `IQR North = ${A[3]} − ${A[1]}; South = ${B[3]} − ${B[1]}.`],
    solution: [`IQR North = ${iqrA}, South = ${iqrB}.`],
    takeaway: 'Smaller IQR = more consistent middle 50%.',
    source: { pages: [15], section: '2.8 Practice #1b' },
  });
}, ['apply', 'calculate']);

const sdDecide = gen('sd-decide', 'std-dev', 'Choose the more consistent option', [4, 5, 6], 'real-world', (rng, level) => {
  const a = integerMeanData(rng, 5, 15, 25);
  let b = integerMeanData(rng, 5, 5, 35);
  let guard = 0;
  while (Math.abs(sd(a) - sd(b)) < 1 && guard++ < 20) b = integerMeanData(rng, 5, 5, 35);
  const ctx = rng.pick([{ s: 'points per game', who: ['Player A', 'Player B'] }, { s: 'monthly returns (%)', who: ['Fund A', 'Fund B'] }, { s: 'minutes late', who: ['Bus route A', 'Bus route B'] }]);
  const better = sd(a) < sd(b) ? 0 : 1;
  return build({
    concept: 'std-dev', level, type: 'real-world',
    context: `${ctx.who[0]} — ${ctx.s}: ${a.join(', ')}.\n${ctx.who[1]} — ${ctx.s}: ${b.join(', ')}.`,
    prompt: 'Which one is more **consistent**? Compute each sample SD to decide.',
    answer: mc(rng, ctx.who.map((w, i): Opt => [`${w} (s ≈ ${f(sd(i === 0 ? a : b), 2)})`, i === better, `Smaller SD = more consistent. s_A ≈ ${f(sd(a), 2)}, s_B ≈ ${f(sd(b), 2)}.`]), false),
    hints: ['Consistency = small spread around the mean.', 'Compute s for each data set (Calculator → Describe data).'],
    solution: [`s(${ctx.who[0]}) ≈ ${f(sd(a), 3)}, s(${ctx.who[1]}) ≈ ${f(sd(b), 3)} → **${ctx.who[better]}**.`],
    takeaway: 'Smaller standard deviation → more consistent.',
    source: { pages: [50, 51], section: '2.7 Example 1 (style)' },
    calculator: true,
  });
}, ['apply', 'calculate']);

const olTerms = recognitionTerm('ol-terms', 'outliers', 'Outlier rules and resistance', [
  { q: 'Which pair of measures is **resistant** to outliers?', a: 'Median and IQR', why: 'They depend on positions, not extreme values.' },
  { q: 'Under the 1.5 × IQR rule, the upper fence is…', a: 'Q3 + 1.5·IQR', why: 'Start at Q3 and go 1.5 IQRs up.' },
  { q: 'Under the 2 SD rule, typical values lie within…', a: 'x̄ ± 2s', why: 'Two standard deviations of the mean.' },
], ['Median and IQR', 'Mean and SD', 'Range and mean', 'Q3 + 1.5·IQR', 'Q3 + IQR', 'Median + 1.5·IQR', 'x̄ ± 2s', 'x̄ ± s', 'Median ± 2·IQR']);

const zInterpret = gen('z-interpret', 'z-score', 'Interpret a standardized score', [2, 3, 4], 'interpretation', (rng, level) => {
  const z = rng.pick([-1.5, -0.072, -0.858, 1.25, 2.3, -2.6]);
  const ctx = rng.pick(['a state\'s number of counties', 'a student\'s test score', 'a city\'s average rent']);
  return build({
    concept: 'z-score', level, type: 'interpretation',
    context: `The standardized score for ${ctx} is ${z}.`,
    prompt: 'What does this tell you?',
    answer: mc(rng, [
      [`The value is ${Math.abs(z)} standard deviations ${z < 0 ? 'below' : 'above'} the mean`, true, 'z = number of SDs from the mean; sign = direction.'],
      [`The value is ${Math.abs(z)} standard deviations ${z < 0 ? 'above' : 'below'} the mean`, false, 'Negative → below the mean.', 'z-sign'],
      [`The value is ${Math.abs(z)} units ${z < 0 ? 'below' : 'above'} the mean`, false, 'It is measured in standard deviations, not raw units.', 'z-divide-variance'],
      [`The value is at the ${f(Math.abs(z) * 10, 0)}th percentile`, false, 'A z-score is not a percentile.', 'percentile-vs-percent'],
    ]),
    hints: ['z = (x − x̄)/s. What do the sign and size mean?'],
    solution: [`${Math.abs(z)} SDs ${z < 0 ? 'below' : 'above'} the mean${Math.abs(z) > 2 ? ' — unusual by the 2 SD rule' : ''}.`],
    takeaway: 'Sign = side of the mean; size = how many SDs.',
  });
}, ['recognize', 'interpret']);

/* ---------- Unit 3 ---------- */

const coTech = gen('co-tech', 'correlation', 'Compute r with technology', [4, 5, 6], 'calculation', (rng, level) => {
  const n = rng.int(5, 7);
  const x = Array.from({ length: n }, () => rng.int(1, 20));
  const sign = rng.pick([1, -1]);
  const y = x.map((v) => Math.round(sign * 2 * v + rng.int(-8, 8) + 40));
  const m = linearRegression(x, y);
  if (!Number.isFinite(m.r) || m.sxx === 0) return build({ concept: 'correlation', level, type: 'calculation', prompt: 'For x = 1, 2, 3, 4, 5 and y = 2, 4, 5, 4, 5, compute r.', answer: num(linearRegression([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]).r, 0.005), hints: ['Use the Calculator → Regression.'], solution: [`r ≈ ${f(linearRegression([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]).r, 4)}`], takeaway: 'Technology computes r.', calculator: true });
  return build({
    concept: 'correlation', level, type: 'calculation',
    context: `Hours of practice (x): ${x.join(', ')}. Free-throw score (y): ${y.join(', ')}.`,
    prompt: 'Use technology to compute the correlation coefficient r. (3 decimals.)',
    answer: num(m.r, 0.005, { wrong: [{ value: m.r2, misconception: 'r-percent', why: 'That is r²; take the square root with the slope\'s sign.' }, { value: m.b, misconception: 'r-is-slope', why: 'That is the slope, not r.' }] }),
    hints: ['Enter x and y in the Calculator → Regression tool.', 'r is reported alongside the slope and intercept.'],
    solution: [`r ≈ **${f(m.r, 3)}** (${Math.abs(m.r) >= 0.8 ? 'strong' : Math.abs(m.r) >= 0.5 ? 'moderate' : 'weak'}, ${m.r > 0 ? 'positive' : 'negative'})`],
    takeaway: 'r summarizes the strength and direction of the linear pattern.',
    calculator: true,
  });
});

const rgTerms = recognitionTerm('rg-terms', 'regression', 'Regression notation', [
  { q: 'In ŷ = 106.3421 − 0.8145x, what is the slope?', a: '−0.8145', why: 'b is the coefficient of x.' },
  { q: 'In ŷ = 180.8 + 15.8x, what is the y-intercept?', a: '180.8', why: 'a is the constant term.' },
  { q: 'What does ŷ ("y-hat") represent?', a: 'The predicted value of the response variable', why: 'The hat means predicted.' },
  { q: 'The least-squares line minimizes the sum of the squared…', a: 'Residuals', why: 'It makes Σ(residual²) as small as possible.' },
], ['−0.8145', '106.3421', '180.8', '15.8', 'The predicted value of the response variable', 'The observed value of y', 'Residuals', 'x-values', 'Correlations']);

const r2Terms = recognitionTerm('r2-terms', 'r-squared', 'Facts about r²', [
  { q: 'Which value could be an r² value?', a: '0.64', why: 'r² is between 0 and 1.' },
  { q: 'If r = −0.9, then r² is…', a: '0.81', why: 'Squaring removes the sign.' },
  { q: 'r² is best described as…', a: 'The percent of variation in y explained by x', why: 'That is the course\'s interpretation.' },
], ['0.64', '−0.64', '1.3', '0.81', '−0.81', '−0.9', 'The percent of variation in y explained by x', 'The slope of the line', 'The percent of points on the line']);

const r2Models = gen('r2-models', 'r-squared', 'Which variable explains more?', [4, 5, 6], 'real-world', (rng, level) => {
  const a = rng.pick([0.342, 0.53, 0.649]); const b = rng.pick([0.81, 0.9138, 0.9883]);
  const swap = rng.bool();
  const opts = swap ? [{ n: 'Model B (outside temperature)', r2: b }, { n: 'Model A (day of week)', r2: a }] : [{ n: 'Model A (day of week)', r2: a }, { n: 'Model B (outside temperature)', r2: b }];
  return build({
    concept: 'r-squared', level, type: 'real-world',
    context: `A café predicts daily iced-coffee sales. ${opts[0].n}: r² = ${opts[0].r2}. ${opts[1].n}: r² = ${opts[1].r2}.`,
    prompt: 'Which model explains more of the variation in sales?',
    answer: mc(rng, opts.map((o): Opt => [`${o.n}: ${f(o.r2 * 100, 2)}% of the variation explained`, o.r2 === b, `Larger r² → more variation explained.`])),
    hints: ['Compare the r² values as percents.'],
    solution: [`Temperature explains ${f(b * 100, 2)}% vs ${f(a * 100, 2)}%.`],
    takeaway: 'Higher r² → the explanatory variable accounts for more of y\'s variation.',
  });
}, ['apply', 'interpret']);

const reTerms = recognitionTerm('re-terms', 'residuals', 'Residual facts', [
  { q: 'A residual is computed as…', a: 'Observed − predicted', why: 'y − ŷ.' },
  { q: 'A point lies **above** the regression line. Its residual is…', a: 'Positive', why: 'Observed > predicted.' },
  { q: 'A good linear model\'s residual plot shows…', a: 'A random scatter with no pattern', why: 'Patterns mean the line misses systematically.' },
], ['Observed − predicted', 'Predicted − observed', 'Positive', 'Negative', 'Zero', 'A random scatter with no pattern', 'A clear curve', 'All residuals positive']);

/* ---------- Unit 4 ---------- */

const prMedals = gen('pr-medals', 'prob-rules', 'Olympic medals: "or"', [5, 6], 'real-world', (rng, level) => {
  const t = TABLES.find((x) => x.id === 'medals')!;
  const i = rng.int(0, t.rows.length - 2); const j = rng.int(0, 2);
  const rowTot = t.counts[i].reduce((a, b) => a + b, 0);
  const colTot = t.counts.reduce((a, r) => a + r[j], 0);
  const both = t.counts[i][j];
  const v = (rowTot + colTot - both) / 1080;
  return build({
    concept: 'prob-rules', level, type: 'real-world',
    context: 'One medal is chosen at random from the 1,080 medals won by the top 24 countries at the 2004 Olympics.',
    visual: { type: 'table', headers: ['', ...t.cols, 'Total'], rows: [...t.rows.map((r, k) => [r, ...t.counts[k], t.counts[k].reduce((a, b) => a + b, 0)]), ['Total', 340, 338, 402, 1080]], rowHeaders: true },
    prompt: `Find P(${t.cols[j]} or ${t.rows[i]}).`,
    answer: num(v, 0.002, { wrong: [{ value: (rowTot + colTot) / 1080, misconception: 'or-double-count', why: `The ${both} ${t.rows[i]} ${t.cols[j].toLowerCase()} medals were counted twice.` }] }),
    hints: ['Addition rule: P(A) + P(B) − P(A and B).', `${colTot}/1080 + ${rowTot}/1080 − ${both}/1080.`],
    solution: [`(${colTot} + ${rowTot} − ${both})/1080 = **${f(v, 4)}**`],
    takeaway: 'Subtract the overlap cell.',
    source: { pages: [5], section: '3.1–3.5 Practice #2g' },
  });
}, ['apply', 'calculate']);

const cdIdentify = gen('cd-identify', 'conditional', 'Translate into probability notation', [1, 2, 3], 'recognition', (rng, level) => {
  const items = [
    { s: 'Of the seniors, the probability a student chose English', a: 'P(English | Senior)', w: ['P(Senior | English)', 'P(English and Senior)', 'P(English or Senior)'] },
    { s: 'The probability a medal is silver, given it was won by Japan', a: 'P(Silver | Japan)', w: ['P(Japan | Silver)', 'P(Silver and Japan)', 'P(Silver)'] },
    { s: 'The probability a patient has the flu, given a positive test', a: 'P(Flu | +)', w: ['P(+ | Flu)', 'P(Flu and +)', 'P(Flu)'] },
    { s: 'The probability a member swims, given that they play poker', a: 'P(Swim | Poker)', w: ['P(Poker | Swim)', 'P(Swim and Poker)', 'P(Swim or Poker)'] },
  ];
  const it = rng.pick(items);
  return build({
    concept: 'conditional', level, type: 'recognition',
    prompt: `Write in symbols: *${it.s}*.`,
    answer: mc(rng, [[it.a, true, 'The given condition goes after the bar.'], ...it.w.map((w): Opt => [w, false, 'The event that is *known/given* goes after "|".', w.includes('|') ? 'cond-reversed' : 'cond-grand-total'])]),
    hints: ['"Given", "of the…", "among…" → that event goes after the bar.'],
    solution: [it.a],
    takeaway: 'Given → after the bar → denominator.',
  });
});

const cdMedals = gen('cd-medals', 'conditional', 'Olympic medals: conditional', [5, 6], 'real-world', (rng, level) => {
  const t = TABLES.find((x) => x.id === 'medals')!;
  const i = rng.int(0, t.rows.length - 2); const j = rng.int(0, 2);
  const colTot = t.counts.reduce((a, r) => a + r[j], 0);
  const v = t.counts[i][j] / colTot;
  return build({
    concept: 'conditional', level, type: 'real-world',
    context: 'One medal is chosen at random from the 1,080 medals won by the top 24 countries at the 2004 Olympics.',
    visual: { type: 'table', headers: ['', ...t.cols, 'Total'], rows: [...t.rows.map((r, k) => [r, ...t.counts[k], t.counts[k].reduce((a, b) => a + b, 0)]), ['Total', 340, 338, 402, 1080]], rowHeaders: true },
    prompt: `Find the probability it was won by ${t.rows[i]}, given that it is a ${t.cols[j].toLowerCase()} medal.`,
    answer: num(v, 0.002, { wrong: [{ value: t.counts[i][j] / 1080, misconception: 'cond-grand-total', why: 'Given the medal type, divide by that column\'s total.' }, { value: t.counts[i][j] / t.counts[i].reduce((a, b) => a + b, 0), misconception: 'cond-reversed', why: 'That is P(medal type | country).' }] }),
    hints: [`Given ${t.cols[j]} → only the ${t.cols[j]} column (total ${colTot}).`],
    solution: [`${t.counts[i][j]}/${colTot} = **${f(v, 4)}**`],
    takeaway: 'The given column becomes the sample space.',
    source: { pages: [5], section: '3.1–3.5 Practice #2f' },
  });
}, ['apply', 'calculate']);

const inIdentify = gen('in-identify', 'independence', 'Independent or not?', [1, 2, 3], 'recognition', (rng, level) => {
  const items = [
    { s: 'Flipping a coin twice: "first flip heads" and "second flip heads"', a: true, why: 'Coins have no memory.' },
    { s: 'Drawing two cards **without** replacement: "first is a heart" and "second is a heart"', a: false, why: 'The first draw changes the deck.' },
    { s: 'Rolling two dice: "first die is a 6" and "second die is a 6"', a: true, why: 'Separate dice don\'t affect each other.' },
    { s: 'A rolled die: "even number" and "a 5" (mutually exclusive)', a: false, why: 'If one happens the other can\'t — dependent.' },
    { s: 'Drawing two marbles **with** replacement: "first is red" and "second is red"', a: true, why: 'Replacement resets the bag.' },
  ];
  const it = rng.pick(items);
  return build({
    concept: 'independence', level, type: 'recognition', context: it.s,
    prompt: 'Are these events independent?',
    answer: mc(rng, [['Independent', it.a, it.why], ['Dependent', !it.a, it.why, it.s.includes('mutually') ? 'indep-vs-mutex' : 'without-replacement']], false),
    hints: ['Does knowing the first outcome change the probability of the second?'],
    solution: [`${it.a ? 'Independent' : 'Dependent'} — ${it.why}`],
    takeaway: 'Independent: knowing one doesn\'t change the other.',
  });
});

const inLaneSplit = gen('in-lane', 'independence', 'Lane splitting survey', [5, 6, 7], 'real-world', (rng, level) => {
  const pc = 0.48; const pl = 0.51; const pcl = 0.72;
  const both = pl * pcl;
  return build({
    concept: 'independence', level, type: 'real-world',
    context: '48% of Marylanders support a law banning motorcycle lane splitting (C). 51% of Marylanders are over 45 (L). Among those over 45, 72% support the law.',
    prompt: 'Are "supports the law" and "over 45" independent?',
    answer: mc(rng, [
      [`No — P(C | L) = 0.72 ≠ P(C) = 0.48 (equivalently P(L and C) = ${f(both, 4)} ≠ ${f(pc * pl, 4)})`, true, 'Knowing someone is over 45 changes the probability of support.'],
      ['Yes — both events can happen at the same time', false, 'That only shows they are not mutually exclusive.', 'indep-vs-mutex'],
      [`Yes — P(L and C) = ${f(pc * pl, 4)}`, false, 'That assumes independence instead of testing it.'],
    ]),
    hints: ['Compare P(C) with P(C | L).', `P(L and C) = P(L)·P(C | L) = 0.51 × 0.72.`],
    solution: [`P(L and C) = ${f(both, 4)} but P(L)P(C) = ${f(pc * pl, 4)} → dependent.`],
    takeaway: 'Test independence with numbers, not intuition.',
    source: { pages: [6, 7], section: '3.1–3.5 Practice #8' },
  });
}, ['apply', 'interpret']);

const tvConcept = gen('tv-concept', 'trees-venn', 'Reading trees and Venn diagrams', [1, 2, 3, 4], 'conceptual', (rng, level) => {
  const items = [
    { q: 'On a tree diagram, how do you find the probability of one complete path?', a: 'Multiply the probabilities along the branches', why: 'Each step is "and".', mis: 'tree-add-along' },
    { q: 'An event can happen along several different paths of a tree. How do you find its probability?', a: 'Add the probabilities of those paths', why: 'Different paths are mutually exclusive.', mis: 'tree-add-along' },
    { q: 'In a Venn diagram, P(A only) equals…', a: 'P(A) − P(A and B)', why: 'Remove the overlap from circle A.', mis: 'venn-only' },
    { q: 'In a tree, the path "Bus → Late" has probability 0.028. What does that number mean?', a: 'P(takes the bus AND is late)', why: 'A path product is an "and" probability.', mis: 'cond-reversed' },
  ];
  const it = rng.pick(items);
  const pool = ['Multiply the probabilities along the branches', 'Add the probabilities along the branches', 'Add the probabilities of those paths', 'Multiply the probabilities of those paths', 'P(A) − P(A and B)', 'P(A) + P(B)', 'P(takes the bus AND is late)', 'P(late | bus)', 'P(bus | late)'];
  return build({
    concept: 'trees-venn', level, type: 'conceptual',
    prompt: it.q,
    answer: mc(rng, [[it.a, true, it.why], ...rng.sample(pool.filter((p) => p !== it.a), 3).map((p): Opt => [p, false, it.why, it.mis])]),
    hints: ['Multiply down a path, add across paths.'],
    solution: [`${it.a} — ${it.why}`],
    takeaway: 'Multiply along, add across.',
  });
}, ['recognize', 'interpret']);

/* ---------- Unit 5 ---------- */

const pdGame = gen('pd-game', 'prob-dist', 'Build a distribution from a game', [4, 5, 6], 'real-world', (rng, level) => {
  const cost = rng.pick([2, 3]);
  const pay = [0, 1, 5, 20]; const sec = [3, 8, 4, 1];
  const k = rng.int(0, 3);
  return build({
    concept: 'prob-dist', level, type: 'real-world',
    context: `A spinner has 16 equal sections: 3 pay $0, 8 pay $1, 4 pay $5, 1 pays $20. It costs $${cost} to play. X = net winnings.`,
    prompt: `What is P(X = ${pay[k] - cost})?`,
    answer: num(sec[k] / 16, 0.001, { wrong: [{ value: sec[k], misconception: 'prob-range', why: 'Divide the number of sections by 16.' }] }),
    hints: [`Net winnings = payout − $${cost}. Which payout gives X = ${pay[k] - cost}?`, `That payout covers ${sec[k]} of 16 sections.`],
    solution: [`X = ${pay[k] - cost} when the payout is $${pay[k]} → ${sec[k]}/16 = **${f(sec[k] / 16, 4)}**`],
    takeaway: 'Each value of X gets the probability of the outcomes that produce it.',
    source: { pages: [4], section: '4.1–4.2 Practice #2a' },
  });
}, ['apply', 'calculate']);

const evTerms = recognitionTerm('ev-terms', 'expected-value', 'Expected value facts', [
  { q: 'E(X) for a discrete random variable is computed as…', a: 'Σ x·P(x)', why: 'A probability-weighted average.' },
  { q: 'A game is called "fair" when…', a: 'E(X) = 0', why: 'Neither side has an advantage in the long run.' },
  { q: 'The variance of a random variable is…', a: 'Σ x²·P(x) − μ²', why: 'Mean of squares minus square of the mean.' },
], ['Σ x·P(x)', 'Σ x / n', 'Σ P(x)', 'E(X) = 0', 'E(X) = 1', 'P(win) = 0.5', 'Σ x²·P(x) − μ²', 'Σ (x − μ)', 'Σ x²·P(x)']);

const trConcept = gen('tr-concept', 'transform', 'What changes, what stays?', [1, 2, 3, 4], 'conceptual', (rng, level) => {
  const items = [
    { q: 'Adding a $5 fee to every bet changes which of these?', a: 'Only the mean (center)', why: 'Shifting moves every outcome equally — spread and shape stay.', mis: 'add-const-sd' },
    { q: 'Doubling every outcome of a random variable changes…', a: 'The mean and the standard deviation (both double)', why: 'Multiplying stretches the distribution.', mis: 'mult-const-var' },
    { q: 'Which is never changed by adding or multiplying by a constant?', a: 'The shape', why: 'Both transformations preserve shape.', mis: 'add-const-sd' },
  ];
  const it = rng.pick(items);
  const pool = ['Only the mean (center)', 'Only the standard deviation', 'The mean and the standard deviation (both double)', 'Only the mean doubles', 'The shape', 'The mean', 'The standard deviation', 'Nothing changes'];
  return build({
    concept: 'transform', level, type: 'conceptual',
    prompt: it.q,
    answer: mc(rng, [[it.a, true, it.why], ...rng.sample(pool.filter((p) => p !== it.a), 3).map((p): Opt => [p, false, it.why, it.mis])]),
    hints: ['Add slides; multiply stretches.'],
    solution: [`${it.a} — ${it.why}`],
    takeaway: 'Adding shifts the center; multiplying scales center and spread.',
    source: { pages: [30], section: '4.1–4.2 transformation table' },
  });
}, ['recognize', 'interpret']);

/* ---------- Unit 1 splits (level-appropriate dims) ---------- */

export const EXTRA_GENERATORS: Generator[] = [
  dtSummary, ftInterpret, ftTerms, iqWrite,
  qgClaim, ceTerms, shContext, poTerms, bxParts, bxHurricanes, riTerms, riBranches, sdDecide, olTerms, zInterpret,
  coTech, rgTerms, r2Terms, r2Models, reTerms,
  prMedals, cdIdentify, cdMedals, inIdentify, inLaneSplit, tvConcept,
  pdGame, evTerms, trConcept,
];
