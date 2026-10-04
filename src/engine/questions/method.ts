import type { ConceptId, Generator } from '../types';
import { build, gen, mc, type Opt } from './helpers';

/** Method-selection training (STEP 13): recognize the situation before any formula. */
interface MethodCase { s: string; m: string; concept: ConceptId; why: string }

const M = {
  median: 'Median (resistant center)',
  mean: 'Mean',
  sd: 'Standard deviation',
  iqr: 'IQR (resistant spread)',
  z: 'Standard deviations from the mean (z-score)',
  percentile: 'Percentile',
  fences: '1.5 × IQR outlier rule',
  regression: 'Regression line prediction (ŷ = a + bx)',
  r: 'Correlation coefficient r',
  r2: 'Coefficient of determination r²',
  residual: 'Residual (observed − predicted)',
  addition: 'Addition rule P(A or B)',
  conditional: 'Conditional probability P(A | B)',
  multiplication: 'Multiplication rule for independent events',
  atleast: 'Complement: 1 − P(none)',
  tree: 'Tree diagram (total / reverse probability)',
  ev: 'Expected value Σ x·P(x)',
  binomial: 'Binomial distribution',
  stratified: 'Stratified random sampling',
  freq: 'Cumulative relative frequency',
} as const;

const CASES: MethodCase[] = [
  { s: 'You want the typical home price in a town where a few mansions sell for $5 million.', m: M.median, concept: 'center', why: 'Skewed by extreme values → resistant median.' },
  { s: 'You want a single number for the average battery life of 30 phones whose histogram is symmetric.', m: M.mean, concept: 'center', why: 'Symmetric, no outliers → mean.' },
  { s: 'Two paint brands last 35 months on average. You want to know which lasts a more consistent amount of time (both roughly symmetric).', m: M.sd, concept: 'std-dev', why: 'Consistency = spread; symmetric → SD.' },
  { s: 'You want to describe the spread of hurricane death counts, which are strongly skewed with huge outliers.', m: M.iqr, concept: 'range-iqr', why: 'Skewed spread → resistant IQR.' },
  { s: 'Maryland has 23 counties and 8 representatives. You want to know in which distribution Maryland is more unusual.', m: M.z, concept: 'z-score', why: 'Comparing positions across distributions → standardize.' },
  { s: 'A student wants to say what percent of test takers scored below her.', m: M.percentile, concept: 'position', why: 'Percent below a value = percentile.' },
  { s: 'A sandwich has 54 g of fat. You want an objective check of whether it is unusually high compared with 12 others.', m: M.fences, concept: 'outliers', why: 'Outlier detection rule.' },
  { s: 'A diver wants to estimate the maximum dive time at 115 feet using dive-table data.', m: M.regression, concept: 'regression', why: 'Predict y from x with the regression line.' },
  { s: 'A researcher wants one number describing how strongly and in what direction femur length and humerus length are linearly related.', m: M.r, concept: 'correlation', why: 'Strength and direction of a linear relationship → r.' },
  { s: 'You want to know what percent of the variation in tablet battery life is explained by price.', m: M.r2, concept: 'r-squared', why: 'Percent of variation explained → r².' },
  { s: 'A flower with 2 tablespoons of sugar stayed fresh 204 hours. You want to know how far off the regression prediction was.', m: M.residual, concept: 'residuals', why: 'Observed − predicted = residual.' },
  { s: 'At a school, you know how many students play a sport, how many do an extracurricular, and how many do both. You want P(sport or extracurricular).', m: M.addition, concept: 'prob-rules', why: '"Or" with overlap → addition rule.' },
  { s: 'Using a two-way table, you want the probability a student prefers Math, knowing the student is a non-senior.', m: M.conditional, concept: 'conditional', why: '"Knowing/given" → conditional probability.' },
  { s: 'Each of five students independently is learning Spanish with probability 0.75. You want P(all five are).', m: M.multiplication, concept: 'independence', why: 'Independent "and" → multiply.' },
  { s: 'A loot box has a 15% chance of a rare item. You open 5 and want P(you get at least one rare item).', m: M.atleast, concept: 'independence', why: '"At least one" → 1 − P(none).' },
  { s: 'A patient tested positive on a rapid flu test. You know the flu rate and the test\'s error rates and want P(flu | positive).', m: M.tree, concept: 'trees-venn', why: 'Two-stage chance process, reverse question → tree diagram.' },
  { s: 'A casino wants to know how much it earns per $100 roulette bet in the long run.', m: M.ev, concept: 'expected-value', why: 'Long-run average outcome → expected value.' },
  { s: 'A 72% free-throw shooter takes 3 independent shots. You want P(exactly 2 made).', m: M.binomial, concept: 'binomial', why: 'Fixed n, two outcomes, independent, same p → binomial.' },
  { s: 'A principal wants a random sample that is guaranteed to include students from every grade level.', m: M.stratified, concept: 'sampling', why: 'Representation of every group → stratified.' },
  { s: 'From a frequency table, you want the proportion of employees who missed at most 14 days.', m: M.freq, concept: 'freq-tables', why: '"At most" → cumulative relative frequency.' },
  { s: 'You want the expected number of correct answers when guessing on 10 four-choice questions.', m: M.binomial, concept: 'binomial', why: 'X ~ B(10, 0.25) → μ = np.' },
  { s: 'A teacher wants to know whether scores of 45 and 48 hours are unusually high for a branch with Q1 = 36 and Q3 = 42.', m: M.fences, concept: 'outliers', why: 'Fences: Q3 + 1.5·IQR = 51.' },
  { s: 'Two cards are drawn without replacement and you want P(both hearts).', m: M.multiplication, concept: 'independence', why: 'Sequential "and" → multiplication rule (with the conditional second factor).' },
];

const ALL_METHODS = Object.values(M);

export const METHOD_GENERATORS: Generator[] = [
  gen('mt-which', 'center', 'Which method should you use?', [5, 6], 'method', (rng, level) => {
    const c = rng.pick(CASES);
    const distractors = rng.sample(ALL_METHODS.filter((x) => x !== c.m), 3);
    const q = build({
      concept: c.concept, level, type: 'method', context: c.s,
      prompt: '**Which method should you use?** (Don\'t calculate — identify the tool.)',
      answer: mc(rng, [[c.m, true, c.why], ...distractors.map((d): Opt => [d, false, `Not this one: ${c.why}`, 'wrong-method'])]),
      hints: ['What is being asked: center, spread, position, relationship, prediction, or probability?', 'Look for key words: "given", "or", "at least", "typical", "consistent", "predict", "explained".'],
      solution: [`**${c.m}** — ${c.why}`],
      takeaway: 'Recognize the situation first; the formula comes second.',
      method: c.m,
    });
    return q;
  }, ['apply', 'recognize']),
];

/** Method generator is cross-concept: its question's concept comes from the case. */
export const METHOD_CASES = CASES;
