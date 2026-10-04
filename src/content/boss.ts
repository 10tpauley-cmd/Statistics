import type { ConceptId, Dimension, QuestionPart, Source, UnitId, VisualSpec } from '../engine/types';

export interface BossStep extends QuestionPart {
  concept: ConceptId;
  dims: Dimension[];
  hint: string;
}

export interface Boss {
  id: string;
  unit: UnitId;
  title: string;
  tagline: string;
  story: string;
  visual?: VisualSpec;
  steps: BossStep[];
  source: Source;
}

const opt = (id: string, text: string, correct = false, why = '', misconception?: string) => ({ id, text, correct, why, misconception });

export const BOSSES: Boss[] = [
  {
    id: 'boss-u1', unit: 'u1', title: 'The Start-Time Survey', tagline: 'Design a study that survives scrutiny.',
    story: 'FCC\'s student government wants to know whether students support **moving the first class period from 8:00 to 9:30 am** — and whether later starts *cause* better grades. You\'re their statistician.',
    source: { pages: [60, 61, 62, 64, 65], section: 'Unit 1 — Sampling & Data' },
    steps: [
      { concept: 'pop-sample', dims: ['recognize', 'apply'], label: 'Identify', prompt: 'The council wants "the proportion of all FCC students who support the later start." What is this number?', answer: { kind: 'mc', options: [opt('a', 'A parameter — it describes all FCC students', true, 'Population → parameter.'), opt('b', 'A statistic — it comes from a survey', false, 'It describes *all* students, so it\'s a parameter; a survey would estimate it with a statistic.', 'param-vs-stat'), opt('c', 'The variable', false, 'The variable is whether each student supports the change.', 'variable-vs-data')] }, explain: 'The true proportion for all students is a parameter; a sample proportion estimates it.', hint: 'Does the number describe everyone, or only the people asked?' },
      { concept: 'sampling', dims: ['apply'], label: 'Sample', prompt: 'Students on different campuses and with day vs. evening schedules may feel differently. Which method guarantees every group is represented?', answer: { kind: 'mc', options: [opt('a', 'Stratified: random samples from each campus/schedule group', true, 'Stratifying guarantees representation of each group.'), opt('b', 'Cluster: randomly pick two whole classes and survey everyone', false, 'Two classes may not include every group.', 'stratified-vs-cluster'), opt('c', 'Convenience: ask students in the cafeteria at noon', false, 'Not random; evening students are missed.', 'convenience-is-random')] }, explain: 'Stratified random sampling → every group is represented.', hint: 'You need some students from *every* group.' },
      { concept: 'bias', dims: ['recognize', 'apply'], label: 'Bias', prompt: 'A council member proposes posting an Instagram poll instead. What bias does that create?', answer: { kind: 'mc', options: [opt('a', 'Voluntary response bias', true, 'Students choose whether to respond — usually those with strong opinions.'), opt('b', 'Nonresponse bias', false, 'Nobody was selected; people chose themselves.', 'nonresponse-vs-voluntary'), opt('c', 'Response bias', false, 'The wording isn\'t the issue here.', 'response-bias')] }, explain: 'Self-selected respondents → voluntary response bias.', hint: 'Who decides whether someone is in the sample?' },
      { concept: 'bias', dims: ['apply'], label: 'Wording', prompt: 'The draft question reads: "Wouldn\'t you agree that exhausted students deserve a more humane 9:30 start?" Problem?', answer: { kind: 'mc', options: [opt('a', 'Response bias — the wording pushes toward "yes"', true, 'Leading wording influences responses.'), opt('b', 'Undercoverage — some students can\'t answer', false, 'The issue is how the question is worded.', 'undercoverage-vs-nonresponse'), opt('c', 'No problem', false, '"Exhausted" and "humane" lead the respondent.')] }, explain: 'Leading wording → response bias.', hint: 'Does the wording suggest an answer?' },
      { concept: 'experiments', dims: ['interpret', 'apply'], label: 'Cause?', prompt: 'Data show students who take later classes have higher GPAs. Can the council conclude later starts cause higher GPAs?', answer: { kind: 'mc', options: [opt('a', 'No — students chose their schedules, so confounders (like work hours) could explain it', true, 'Observational data can\'t show cause.'), opt('b', 'Yes — the association is clear', false, 'Association isn\'t causation.', 'correlation-causation-study'), opt('c', 'Yes, if the sample is large', false, 'Size doesn\'t remove confounding.', 'correlation-causation-study')] }, explain: 'To show cause, randomly assign students to start times (an experiment).', hint: 'Were start times randomly assigned?' },
      { concept: 'investigative', dims: ['recognize', 'apply'], label: 'Question', prompt: 'Which is a complete investigative question?', answer: { kind: 'mc', options: [opt('a', 'What proportion of all FCC students support moving the first class to 9:30 am?', true, 'Variable, goal (estimate), and scope are all present.'), opt('b', 'Do students like later classes?', false, 'Missing scope and a clear goal.', 'missing-inference-component'), opt('c', 'What is the true proportion for all FCC students?', false, 'Missing the variable of interest.', 'missing-inference-component')] }, explain: 'Variable + goal + scope.', hint: 'Check for all three components.' },
      { concept: 'experiments', dims: ['explain', 'interpret'], label: 'Conclude', prompt: 'In 2–4 sentences, explain to the council how they could test whether later start times *cause* higher grades.', answer: { kind: 'text', rubric: { prompt: 'Design an experiment for cause and effect.', items: [
        { id: 'random', idea: 'Randomly assign students to start times', patterns: ['random(ly)? assign|randomi[sz]', 'random.{0,30}(group|start|time)'], weight: 1.5 },
        { id: 'compare', idea: 'Compare groups (early vs. later) on GPA', patterns: ['compar|two groups|both groups|control'], weight: 1 },
        { id: 'confound', idea: 'Explains randomization balances confounders', patterns: ['confound|other (factor|variable)|balance|similar'], weight: 1 },
        { id: 'response', idea: 'Names GPA/grades as the response', patterns: ['gpa|grade'], weight: 0.5 },
      ], misconceptions: [{ patterns: ['survey.{0,40}(prove|show).{0,20}caus'], message: 'A survey (observational) can\'t establish causation.' }], model: 'Run an experiment: randomly assign a group of students to 8:00 sections and another to 9:30 sections, then compare their GPAs at the end of the term. Random assignment balances confounding variables like work schedules, so a difference in GPA can be attributed to the start time.' } }, explain: 'Random assignment + comparison → cause-and-effect conclusions.', hint: 'Which design can show causation?' },
    ],
  },
  {
    id: 'boss-u2', unit: 'u2', title: 'Moneyball', tagline: 'Describe and compare two seasons of payrolls.',
    story: 'It\'s 2003. A sports journalist asks you whether MLB payrolls changed from 2002 to 2003 — and whether the Yankees-level spenders are outliers. You have all 30 payrolls for each year.',
    source: { pages: [57, 58], section: 'Unit 2 — Moneyball payroll data' },
    visual: { type: 'boxplot', xLabel: 'Payroll ($ millions)', groups: [{ label: '2002', min: 34, q1: 45, median: 61, q3: 80, max: 126 }, { label: '2003', min: 20, q1: 50, median: 69, q3: 83, max: 117, outliers: [153] }] },
    steps: [
      { concept: 'shape', dims: ['interpret'], label: 'Shape', prompt: '2003 payrolls: mean $71.067M, median $69M, with one team at $153M. Shape?', answer: { kind: 'mc', options: [opt('a', 'Skewed right', true, 'Mean > median and a long right tail.'), opt('b', 'Skewed left', false, 'The tail is on the high side.', 'skew-direction'), opt('c', 'Uniform', false, 'Most teams cluster in $40–80M.')] }, explain: 'Mean > median → skewed right.', hint: 'Which way does the tail point?' },
      { concept: 'center', dims: ['apply'], label: 'Center', prompt: 'Which measure best represents a typical team\'s payroll?', answer: { kind: 'mc', options: [opt('a', 'Median', true, 'Skewed data → resistant median.'), opt('b', 'Mean', false, 'The $153M team pulls the mean up.', 'wrong-measure-skew'), opt('c', 'Midrange', false, 'Uses only the extremes.')] }, explain: 'Median for skewed data.', hint: 'Skewed → resistant measure.' },
      { concept: 'position', dims: ['calculate'], label: 'Q1', prompt: 'For 2003 (n = 30), the lower 15 values are 20, 41, 41, 48, 49, 49, 49, 50, 51, 51, 52, 55, 56, 59, 67. Find Q1.', answer: { kind: 'numeric', value: 50, tol: 0.01, wrong: [{ value: 49, misconception: 'quartile-include-median', why: 'Q1 is the median of the 15 lower values: the 8th value.' }] }, explain: 'The 8th of 15 values is 50.', hint: 'Q1 = median of the lower half.' },
      { concept: 'range-iqr', dims: ['calculate'], label: 'IQR', prompt: 'Q3 for 2003 is 83. Find the IQR.', answer: { kind: 'numeric', value: 33, tol: 0.01, wrong: [{ value: 133, misconception: 'range-vs-iqr', why: 'That is the range; IQR = Q3 − Q1.' }] }, explain: '83 − 50 = 33.', hint: 'IQR = Q3 − Q1.' },
      { concept: 'outliers', dims: ['calculate', 'apply'], label: 'Fence', prompt: 'Find the upper fence for 2003 using the 1.5 × IQR rule.', answer: { kind: 'numeric', value: 132.5, tol: 0.01, wrong: [{ value: 116, misconception: 'fence-forget-15', why: 'Use 1.5 × IQR = 49.5.' }, { value: 99.5, misconception: 'fence-wrong-quartile', why: 'The upper fence starts at Q3.' }] }, explain: '83 + 1.5(33) = 132.5.', hint: 'Q3 + 1.5·IQR.' },
      { concept: 'outliers', dims: ['interpret'], label: 'Outlier?', prompt: 'Is the $153M payroll an outlier? Is 2002\'s top payroll of $126M (fence also 132.5) an outlier?', answer: { kind: 'mc', options: [opt('a', '$153M is an outlier; $126M is not', true, '153 > 132.5, but 126 < 132.5.'), opt('b', 'Both are outliers', false, '126 is below the 2002 fence of 132.5.', 'fence-forget-15'), opt('c', 'Neither is an outlier', false, '153 exceeds 132.5.')] }, explain: 'Compare each to its fence.', hint: 'Compare each value to 132.5.' },
      { concept: 'compare', dims: ['explain', 'interpret'], label: 'Compare', prompt: 'Write a comparison of 2002 vs. 2003 payrolls (2002: 34, 45, 61, 80, 126; 2003: 20, 50, 69, 83, 153). Address center, spread, and shape.', answer: { kind: 'text', rubric: { prompt: 'Compare center, spread, shape.', items: [
        { id: 'center', idea: 'Compares medians (61 vs 69)', patterns: ['median', '61.{0,40}69|69.{0,40}61'], weight: 1.5 },
        { id: 'spread', idea: 'Compares IQRs (35 vs 33) or ranges', patterns: ['iqr|interquartile|range|spread|variab'], weight: 1 },
        { id: 'shape', idea: 'Both skewed right; 2003 has a high outlier', patterns: ['skew', 'outlier'], weight: 1 },
        { id: 'context', idea: 'Uses payroll context', patterns: ['payroll|million|team|\\$'], weight: 0.5 },
      ], misconceptions: [{ patterns: ['mean.{0,30}(better|best)'], message: 'For skewed payrolls, the median is the better center.' }], model: 'The typical payroll rose from a median of $61M in 2002 to $69M in 2003. Spread was similar: IQR $35M in 2002 vs $33M in 2003. Both distributions are skewed right; 2003 has a high outlier at $153M, while 2002\'s maximum of $126M is not an outlier.' } }, explain: 'Center, spread, shape — in context.', hint: 'Use medians and IQRs since both are skewed.' },
    ],
  },
  {
    id: 'boss-u3', unit: 'u3', title: 'The Archaeopteryx Mystery', tagline: 'Use regression to judge a strange fossil.',
    story: 'Five Archaeopteryx fossils show femur and humerus lengths (cm): (38, 41), (56, 63), (59, 70), (64, 72), (74, 84). A new fossil arrives with a **70 cm femur** but only a **40 cm humerus**. Same species?',
    source: { pages: [10, 11, 46], section: 'Unit 3 — 12.1 Practice #2' },
    visual: { type: 'scatter', points: [[38, 41], [56, 63], [59, 70], [64, 72], [74, 84]], xLabel: 'Femur (cm)', yLabel: 'Humerus (cm)', line: { a: -3.6596, b: 1.1969 } },
    steps: [
      { concept: 'scatter', dims: ['recognize'], label: 'Roles', prompt: 'Which variable is explanatory?', answer: { kind: 'mc', options: [opt('a', 'Femur length', true, 'We use the femur to predict the humerus.'), opt('b', 'Humerus length', false, 'That\'s the response.', 'explanatory-vs-response')] }, explain: 'x = femur.', hint: 'Which predicts which?' },
      { concept: 'correlation', dims: ['interpret'], label: 'r', prompt: 'r = 0.9941. Interpret.', answer: { kind: 'mc', options: [opt('a', 'A very strong, positive, linear relationship', true, 'Close to 1 and positive.'), opt('b', '99.41% of fossils fit the line', false, 'r is not a percent.', 'r-percent'), opt('c', 'Longer femurs cause longer humeri', false, 'r shows association.', 'correlation-causation')] }, explain: 'Strong, positive, linear.', hint: 'Sign → direction; size → strength.' },
      { concept: 'regression', dims: ['calculate'], label: 'Predict', prompt: 'ŷ = −3.6596 + 1.1969x. Predict the humerus length for a 70 cm femur.', answer: { kind: 'numeric', value: -3.6596 + 1.1969 * 70, tol: 0.02 }, explain: '−3.6596 + 1.1969(70) ≈ 80.12 cm.', hint: 'Substitute x = 70.' },
      { concept: 'residuals', dims: ['calculate'], label: 'Residual', prompt: 'The new fossil\'s humerus is 40 cm. Find its residual.', answer: { kind: 'numeric', value: 40 - (-3.6596 + 1.1969 * 70), tol: 0.02, wrong: [{ value: (-3.6596 + 1.1969 * 70) - 40, misconception: 'residual-order', why: 'Residual = observed − predicted.' }] }, explain: '40 − 80.12 ≈ −40.12 cm.', hint: 'Observed − predicted.' },
      { concept: 'residuals', dims: ['interpret'], label: 'Meaning', prompt: 'What does that residual tell you?', answer: { kind: 'mc', options: [opt('a', 'The line overpredicts by about 40 cm — the fossil doesn\'t fit the pattern', true, 'Huge negative residual.'), opt('b', 'The line underpredicts by about 40 cm', false, 'Negative → overprediction.', 'residual-sign-meaning'), opt('c', 'It fits well', false, 'A 40 cm miss is enormous here.')] }, explain: 'Negative residual = overprediction; this one is extreme.', hint: 'Negative residual means…?' },
      { concept: 'r-squared', dims: ['interpret'], label: 'r²', prompt: 'r² = 0.9883. Interpret.', answer: { kind: 'mc', options: [opt('a', 'About 98.83% of the variation in humerus length is explained by femur length', true, 'Template.'), opt('b', '98.83% of the points are on the line', false, 'Not what r² means.', 'r2-meaning')] }, explain: 'Variation explained.', hint: 'Use the r² template.' },
      { concept: 'regression', dims: ['explain', 'apply'], label: 'Verdict', prompt: 'Is the new fossil likely the same species? Explain using the regression results.', answer: { kind: 'text', rubric: { prompt: 'Conclude with evidence.', items: [
        { id: 'no', idea: 'Concludes likely a different species', patterns: ['not (the )?same|different species|unlikely|probably not|isn.t the same'], weight: 1.5 },
        { id: 'pred', idea: 'Cites predicted ≈ 80 cm vs actual 40 cm', patterns: ['80', '40'], weight: 1 },
        { id: 'res', idea: 'Uses the residual / distance from the line', patterns: ['residual|off|far|below the line|overpredict|40 ?cm (shorter|less)'], weight: 1 },
        { id: 'strong', idea: 'Notes the strong relationship among known fossils (r, r²)', patterns: ['strong|0?\\.99|98'], weight: 0.5 },
      ], misconceptions: [], model: 'Probably not. The five known fossils follow a very strong linear pattern (r = 0.9941, r² = 0.9883), which predicts a humerus of about 80.12 cm for a 70 cm femur. The new fossil\'s humerus is only 40 cm — a residual of about −40 cm, far off the pattern — so it likely belongs to a different species.' } }, explain: 'A huge residual against a strong pattern suggests a different species.', hint: 'Compare actual to predicted.' },
    ],
  },
  {
    id: 'boss-u4', unit: 'u4', title: 'The Flu Test', tagline: 'Untangle what a positive test really means.',
    story: 'In November, **22%** of patients at a Kentwood urgent care have the flu. The rapid test misses **3.7%** of flu cases (false negatives) and wrongly flags **2.6%** of healthy patients (false positives).',
    source: { pages: [8], section: 'Unit 4 — 3.1–3.5 Practice #12' },
    visual: { type: 'tree', root: { label: 'Patient', children: [{ label: 'Flu', p: '0.22', children: [{ label: 'Test +', p: '0.963' }, { label: 'Test −', p: '0.037' }] }, { label: 'No flu', p: '0.78', children: [{ label: 'Test +', p: '0.026' }, { label: 'Test −', p: '0.974' }] }] } },
    steps: [
      { concept: 'trees-venn', dims: ['calculate'], label: 'Path', prompt: 'P(flu AND positive)?', answer: { kind: 'numeric', value: 0.22 * 0.963, tol: 0.0006 }, explain: '0.22 × 0.963 = 0.2119.', hint: 'Multiply along the branch.' },
      { concept: 'trees-venn', dims: ['calculate', 'apply'], label: 'P(+)', prompt: 'P(positive test)?', answer: { kind: 'numeric', value: 0.22 * 0.963 + 0.78 * 0.026, tol: 0.0006, wrong: [{ value: 0.963 + 0.026, misconception: 'tree-add-along', why: 'Multiply along each branch first.' }] }, explain: '0.2119 + 0.0203 = 0.2321.', hint: 'Add both paths that end in +.' },
      { concept: 'conditional', dims: ['calculate', 'apply'], label: 'P(flu | +)', prompt: 'Given a positive test, P(flu)?', answer: { kind: 'numeric', value: (0.22 * 0.963) / (0.22 * 0.963 + 0.78 * 0.026), tol: 0.002, wrong: [{ value: 0.963, misconception: 'cond-reversed', why: '0.963 is P(+ | flu) — reverse it.' }] }, explain: '0.2119 / 0.2321 ≈ 0.913.', hint: 'Path ÷ total of + paths.' },
      { concept: 'independence', dims: ['calculate'], label: 'At least one', prompt: 'Four patients are tested independently. P(at least one positive)?', answer: { kind: 'numeric', value: 1 - (1 - 0.23214) ** 4, tol: 0.002, wrong: [{ value: 4 * 0.23214, misconception: 'at-least-one', why: 'Use 1 − P(none).' }] }, explain: '1 − 0.7679⁴ ≈ 0.652.', hint: '1 − P(no positives).' },
      { concept: 'independence', dims: ['interpret'], label: 'Independent?', prompt: 'Are "has flu" and "tests positive" independent events?', answer: { kind: 'mc', options: [opt('a', 'No — P(flu) = 0.22 but P(flu | +) ≈ 0.913', true, 'Knowing the test result changes the probability.'), opt('b', 'Yes — the test is accurate', false, 'Accuracy means they are strongly dependent.'), opt('c', 'They are mutually exclusive', false, 'A person can have the flu and test positive.', 'indep-vs-mutex')] }, explain: 'P(A) ≠ P(A | B) → dependent.', hint: 'Compare P(flu) with P(flu | +).' },
      { concept: 'trees-venn', dims: ['explain', 'interpret'], label: 'Explain', prompt: 'A patient says: "The test is 96.3% accurate for flu, so I\'m 96.3% likely to have it." Explain why P(flu | +) is not 0.963.', answer: { kind: 'text', rubric: { prompt: 'Explain the reverse conditional.', items: [
        { id: 'reverse', idea: '0.963 is P(+ | flu), not P(flu | +)', patterns: ['given (they have|the) flu|p ?\\(\\+ ?\\| ?flu|reverse|backwards|other way'], weight: 1.5 },
        { id: 'false', idea: 'False positives from the large healthy group', patterns: ['false positive|healthy|no flu|don.t have'], weight: 1 },
        { id: 'value', idea: 'Gives ≈ 0.913', patterns: ['0?\\.91|91'], weight: 1 },
      ], misconceptions: [], model: '0.963 is P(positive | flu) — how often the test catches people who have the flu. The patient needs the reverse, P(flu | positive). Some positives come from the 78% who are healthy (false positives), so among all positives only about 0.2119/0.2321 ≈ 0.913 actually have the flu.' } }, explain: 'Reverse conditionals divide one path by all matching paths.', hint: 'Which conditional is 0.963?' },
    ],
  },
  {
    id: 'boss-u5', unit: 'u5', title: 'Buzzer-Beater Free Throws', tagline: 'Was fouling a smart strategy?',
    story: '2005 C-USA final: Louisville leads Memphis **75–73** with no time left. Darius Washington (72% free-throw shooter) was fouled on a three and gets **3 free throws**. Had he not been fouled, his three-pointer goes in **40%** of the time.',
    source: { pages: [24, 25], section: 'Unit 5 — 4.3 Example 1' },
    steps: [
      { concept: 'binomial', dims: ['recognize'], label: 'Model', prompt: 'X = free throws made. Which model fits?', answer: { kind: 'mc', options: [opt('a', 'X ~ B(3, 0.72)', true, 'n = 3, independent shots, p = 0.72.'), opt('b', 'X ~ B(0.72, 3)', false, 'Notation is B(n, p).'), opt('c', 'Not binomial — free throws are dependent', false, 'We treat shots as independent with the same p.', 'binom-conditions')] }, explain: 'Fixed n, two outcomes, independent, same p.', hint: 'BINS.' },
      { concept: 'binomial', dims: ['calculate'], label: 'Win', prompt: 'P(Memphis wins) = P(all 3 made)?', answer: { kind: 'numeric', value: 0.72 ** 3, tol: 0.001 }, explain: '0.72³ ≈ 0.373.', hint: 'Multiply three makes.' },
      { concept: 'binomial', dims: ['calculate'], label: 'Overtime', prompt: 'P(overtime) = P(exactly 2 made)?', answer: { kind: 'numeric', value: 3 * 0.72 ** 2 * 0.28, tol: 0.001, wrong: [{ value: 0.72 ** 2 * 0.28, misconception: 'binom-conditions', why: 'There are 3 orders (MMX, MXM, XMM).' }] }, explain: '3(0.72²)(0.28) ≈ 0.435.', hint: 'Count the arrangements.' },
      { concept: 'binomial', dims: ['calculate'], label: 'Mean & SD', prompt: 'Find σ for X.', answer: { kind: 'numeric', value: Math.sqrt(3 * 0.72 * 0.28), tol: 0.002, wrong: [{ value: 2.16, misconception: 'binom-sd-np', why: 'np = 2.16 is the mean; σ = √(npq).' }] }, explain: 'μ = 2.16; σ = √(3 · 0.72 · 0.28) ≈ 0.778.', hint: '√(npq).' },
      { concept: 'expected-value', dims: ['apply', 'calculate'], label: 'Strategy', prompt: 'Assume overtime is a 50/50 coin flip. With the foul, what is Louisville\'s probability of winning? (Memphis loses outright with 0 or 1 makes, P ≈ 0.191.)', answer: { kind: 'numeric', value: 0.191296 + 0.435456 / 2, tol: 0.003 }, explain: '0.191 + 0.435/2 ≈ 0.409.', hint: 'Lose outright + half of overtime.' },
      { concept: 'binomial', dims: ['explain', 'apply'], label: 'Verdict', prompt: 'Was Louisville smart to foul? Compare its win probability with and without the foul.', answer: { kind: 'text', rubric: { prompt: 'Compare strategies.', items: [
        { id: 'no', idea: 'Concludes fouling was not smart', patterns: ['not (smart|a good|wise)|bad (idea|decision|strategy)|shouldn.t|should not|mistake|no,'], weight: 1.5 },
        { id: 'without', idea: 'Without the foul Louisville wins 60%', patterns: ['60|0?\\.6\\b|0?\\.60'], weight: 1 },
        { id: 'with', idea: 'With the foul Louisville wins ≈ 41%', patterns: ['41|0?\\.409|0?\\.41'], weight: 1 },
      ], misconceptions: [], model: 'No. Without the foul, Washington makes the three 40% of the time, so Louisville wins 60%. With the foul, Louisville wins only if he makes 0 or 1 (0.191) plus about half of overtime (0.435/2), about 0.409 total — fouling cut Louisville\'s win chance from 60% to about 41%.' } }, explain: 'Compare probabilities to judge strategy.', hint: 'Louisville wins 60% without the foul.' },
    ],
  },
];

export const BOSS_BY_ID = Object.fromEntries(BOSSES.map((b) => [b.id, b]));
