# FCC MA120 Statistics — Course Knowledge Map

This document is the **Phase 1 output**: a full analysis of the course PDF
(`combinepdf.pdf`, 66 pages, FCC MA120 – Statistics). It is the source of truth that
the application's content data (`src/content/**`) is built from. Every concept,
dataset, formula and worked example in the app carries a `source` reference
back to the PDF page(s) listed here.

## 1. What the PDF contains (page map)

The PDF is a merge of guided-notes handouts, their practice sets, and handwritten /
highlighted answer keys. Pages are **not** in teaching order. In page order:

| PDF pages | Content | Kind |
|---|---|---|
| 1–2 | Exam #1 Review **KEY** (Ch. 1, 2, 12) — handwritten | Answer key |
| 3–4 | Section 4.1–4.2 Practice (snow days, spinner, slot machines) | Answer key |
| 5–9 | Section 3.1–3.5 Practice (baseball, Olympic medals, PhD TAs, switches, country club, Ravens/Eagles, lane splitting, Jed, video game, AP procrastination, flu test, Pew mothers) | Answer key |
| 10–14 | Section 12.1–12.3, 12.5 Practice (chocolate/Nobel, Archaeopteryx, flowers & sugar, tablet battery residual plot, iPhone sales linear/quadratic/exponential) | Answer key |
| 15–16 | Section 2.8 Practice (bank branches, pets/friends heart rate) | Answer key |
| 17–19 | Section 2.7 Practice (orange juice, chip air, House representatives) | Answer key |
| 20–21 | Section 2.4, 2.6 Practice (three professors, orange juice, bubble glycerin) | Answer key |
| 22–23 | Section 2.1–2.2, 2.5 Practice (actor ages stem plot, t‑shirt histogram, chip air, AP exam histogram) | Answer key |
| 24–27 | Section 4.3 Binomial Distributions notes + practice (Darius Washington free throws, pop quiz, soccer, traffic lights, "draw a three") | Notes (blank) |
| 28–30 | Section 4.1–4.2 Probability Distributions notes + practice (Pirates movies, roulette, transformations table) | Notes (blank) |
| 31–35 | Section 3.1–3.5 Probability Topics notes — **handwritten key** | Notes key |
| 36–42 | Section 3.1–3.5 notes (blank) + practice | Notes |
| 43–47 | Section 12.1–12.3, 12.5 notes (SCUBA, yogurt, roller coasters) + practice | Notes |
| 48–49 | Section 2.8 Comparing Distributions notes (concerts, OSHA noise) + practice | Notes |
| 50–52 | Section 2.7 Measures of Spread notes (paint, McDonald's fat) + practice | Notes |
| 53–56 | Section 2.4, 2.6 Shape, Percentiles, Quartiles, Boxplots (Marines, speed trap, hurricanes) + practice | Notes |
| 57–59 | Section 2.1–2.2, 2.5 Graphs of quantitative data + center (Moneyball payroll) + practice | Notes |
| 60–63 | Section 1.3–1.4 Frequency tables, Experimental design, Ethics/bias (phone sums, bias, marshmallow, Spotify) + practice (Lyme disease) | Notes |
| 64–66 | Section 1.1–1.2 Key Terms, Sampling, Variation (Knoll Academy, ethnicity charts, wood ducks) + practice | Notes |

Technology referenced throughout: **Stapplet** (stapplet.com), Desmos, a calculator,
and **Knewton Alta** practice assignments. The course explicitly says the formal
binomial formula is "beyond the scope of our course" and to use technology instead.

## 2. Course structure (teaching order)

Exam #1 Review covers Ch. 1, 2 and 12, so regression is taught **before** probability.

```
UNIT 1  Sampling & Data            (1.1–1.2, 1.3–1.4)
   ↓
UNIT 2  Describing Data            (2.1–2.2 & 2.5, 2.4 & 2.6, 2.7, 2.8)
   ↓
UNIT 3  Two Quantitative Variables (12.1–12.3, 12.5)        ← end of Exam #1 material
   ↓
UNIT 4  Probability                (3.1–3.5)
   ↓
UNIT 5  Discrete Random Variables  (4.1–4.2, 4.3)
```

**Scope note.** The PDF does **not** contain the normal distribution, sampling
distributions/CLT, confidence intervals, or hypothesis tests. Following the rule
"the PDF is the source of truth", the app does not teach those topics. Ideas the PDF
*does* contain that are adjacent — "how many standard deviations from the mean"
(2.7 practice #3), "experimental probability approaches theoretical as trials
increase" (3.1 handwritten note, Lab #3), investigative questions with an
"inference goal" (1.3–1.4) — are taught as they appear in the course.

## 3. Concept inventory

Legend — **K** know, **U** understand, **C** calculate, **I** interpret,
**Pre** prerequisites, **Err** common mistakes, **Conf** commonly confused with,
**Q** question types. Difficulty 1–5, Importance 1–5.

### UNIT 1 — Sampling & Data

#### 1.1 Population, sample, parameter, statistic, variable, data (`pop-sample`) — p.64, 66, 1
- K: statistics = collection, organization, summarization, analysis, presentation of data. Population = whole group; sample = subset studied; statistic = number computed from a sample; parameter = the corresponding number for the population; variable = characteristic of interest (letter X); data = actual observed values.
- U: we compute statistics to *estimate* parameters because studying populations is costly.
- I: identify all six in a scenario (Knoll Academy uniforms; Federal contractors; Spirit Halloween; ski resorts; cardiologist; Lake Tahoe CC absences: mean 3.5 days is a statistic).
- Err: calling the variable "the average"; confusing parameter vs statistic; calling the sample "the people who answered" when the question is about the population.
- Conf: parameter ↔ statistic; variable ↔ data. Difficulty 1, Importance 5.

#### 1.2 Types of data (`data-types`) — p.64, 66, 1
- K: categorical/qualitative (labels) vs quantitative (numbers); quantitative discrete (countable) vs continuous (any value in an interval).
- Err: zip codes / jersey numbers are categorical; "number of" ⇒ discrete; time/distance/percent body fat ⇒ continuous; age is continuous (key: age of executives).
- Q: classify (tickets sold, percent body fat, favorite team, time in line, students enrolled, most-watched show, toothpaste brand, distance to theatre, age). Difficulty 1, Importance 4.

#### 1.3 Displays of categorical data (`cat-displays`) — p.64
- K: frequency tables, percent, pie charts, bar graphs, Pareto charts (bars sorted descending). Ethnicity of Students example (Asian 36.1%, White 24.5%, Hispanic 17.1%, Other 9.6%, Black 5.8%, Filipino 5.3%, Pacific Islander 1.0%, Native American 0.6%).
- Err: histogram vs bar graph; pie chart percentages must sum to 100%. Difficulty 1, Importance 2.

#### 1.4 Sampling methods & sampling bias (`sampling`) — p.65, 66, 1, 20
- K: simple random (every group of n equally likely), systematic (every k‑th), stratified (split into groups, random sample from **each**), cluster (split into groups, randomly pick **whole groups**), convenience (non‑random, biased).
- U: random sampling minimizes sampling bias (statistics that systematically over/underestimate).
- Q: name method (airport questionnaire → convenience; rows 2 & 5 → cluster; 100 random customers at each store → stratified; every 4th patron → systematic; 1,200 random phone numbers → simple random; OJ random number generator → SRS); design all four for wood ducks park grid.
- Err/Conf: stratified ↔ cluster (sample *within* every group vs sample *entire* groups). Difficulty 2, Importance 5.

#### 1.5 Frequency tables (`freq-tables`) — p.60, 63, 1
- K: frequency, relative frequency (= f / n), cumulative frequency, cumulative relative frequency (last = 1).
- C: build table from raw data with classes (Lyme disease, classes 0.5–6.5, 6.5–12.5 …; Exam #1 #5 table 0–4 … 25–29, n = 60).
- I: "proportion with symptoms ≤ 12 weeks" from cumulative relative frequency.
- Err: relative frequencies not summing to 1; cumulative computed from relative incorrectly. Difficulty 2, Importance 3.

#### 1.6 Experimental design (`experiments`) — p.60, 62, 1
- K: explanatory variable, response variable, treatment, experimental units, lurking variable, confounding variable, randomization, control group, blinding (single/double), placebo.
- U: randomized experiments can show cause; observational studies cannot (marshmallow test — confounders like home environment/family income).
- Q: identify variables (Spotify premium vs free → explanatory = access type, response = daily listening time); confounder association (video games/homework/flunking — Exam #1 #4b); placebo effect (#4a).
- Conf: lurking vs confounding; explanatory vs response. Difficulty 3, Importance 4.

#### 1.7 Bias in surveys (`bias`) — p.60–61, 63, 1
- K (four boxes p.60): **response bias** — asking questions in a way that influences the response; **undercoverage** — participants left out of the selection process; **nonresponse bias** — selected participants unable/refuse to respond; **voluntary response bias** — individuals decide whether they are in the sample.
- Q: social media wetlands poll (voluntary response), emailed random survey (nonresponse), ChatGPT "given that it violates the policy…" (response), Whole Foods customers (undercoverage), YouPolls (voluntary), homeowners near parks (undercoverage), newspaper letters (voluntary), teacher email survey (nonresponse), 10% phone return (nonresponse), worded question (response).
- Conf: nonresponse ↔ voluntary response; undercoverage ↔ nonresponse. Difficulty 2, Importance 4.

#### 1.8 Investigative questions (`investigative`) — p.60–63
- K: three components — **variable of interest**, **inference goal** (estimate or test), **scope of inference** (population).
- Q: write one (Michigan students driving; Spotify); find the missing component (YouTube ads → population missing; "For all college students, do they typically study…" → inference goal unclear; "true proportion for all fans" → variable missing). Difficulty 2, Importance 2.

### UNIT 2 — Describing Data

#### 2.1 Graphs of quantitative data (`quant-graphs`) — p.57–59, 22
- K: stem-and-leaf (with key, e.g. 7|7 = 77), side-by-side stem-and-leaf, dotplot (shows each value; poor for large data), histogram (connected bars over intervals, 5–15 bars; not a bar graph).
- C: build a stem plot (actor ages); read relative-frequency histograms (t‑shirts: at most three = 45/111 ≈ 40.5%; AP exam n = 20, 35% scored 4, 65% passed).
- Err: unordered leaves, missing empty stems, histogram vs bar chart. Difficulty 2, Importance 3.

#### 2.2 Measures of center (`center`) — p.58–59, 22–23, 1–2
- K: n (sample) vs N (population); x̄ (sample mean) vs μ (population mean); median (MD); mode; midrange = (min+max)/2.
- C: mean & median (chips: x̄ = 42.571, MD = 45.5; adding Helium Chips 78% → x̄ = 44.933, MD = 46; payroll 2003 μ = 71.067, MD = 69; 2002 μ = 67.433, MD = 61).
- C: estimate mean/median from a histogram/frequency table using bar midpoints (t‑shirts x̄ ≈ 3.613, MD = 4; AP x̄ = 3.25, MD = 4; corporations x̄ = 48.111, MD = 45).
- U: median is **resistant** to outliers; mean is pulled toward the tail.
- Err: forgetting to sort before median; even‑n median; dividing by wrong n. Difficulty 2, Importance 5.

#### 2.3 Shape of distributions (`shape`) — p.53, 20–21
- K: symmetric (mean ≈ median ≈ mode), skewed right (mode < median < mean; majority falls below the mean), skewed left (mean < median < mode), uniform, bimodal (two peaks — usually the data should be separated into groups).
- U: compare mean vs median to infer skew (Professors Gamma μ = 67.3, MD = 72 → left; Delta 75.7/68 → right; Epsilon 66.8/67 → symmetric). Use median for skewed data.
- Err: "skewed right" means the tail points right, not the peak. Difficulty 2, Importance 5.

#### 2.4 Measures of position (`position`) — p.54, 19
- K: percentile = % of data with lesser value (80th percentile → better than 80%); median = 50th percentile; Q1 = 25th, Q3 = 75th; five-number summary (min, Q1, MD, Q3, max).
- C: quartiles as medians of lower/upper halves (method used by Stapplet/TI; excluding the median when n is odd). Speed trap northbound: 60, 63, 65, 66, 83. Maryland 8 reps → 29 of 50 lower → 58th percentile; South Carolina 52nd percentile → 26 states below → 6 reps.
- Err: including the median in both halves; percentile vs percent correct. Difficulty 3, Importance 4.

#### 2.5 Boxplots (`boxplots`) — p.54–56, 2, 15–16, 21
- K: box from Q1 to Q3, line at median, whiskers to min/max (modified boxplot shows outliers as dots). Each section holds ≈25% of data.
- I: read comparative boxplots (hurricanes: female max 256 more likely to have outliers; a little over 25% of female hurricanes had between 1 and 5 deaths [Q1 = 2 to MD = 5 holds 25%]; more than 75% of male hurricanes had under 21 deaths [male Q3 = 15]; IQR female 19 > male 14; means > medians ⇒ right skew).
- Err: a longer section has more spread, *not* more data; boxplots don't show sample size. Difficulty 3, Importance 4.

#### 2.6 Range & IQR (`range-iqr`) — p.50–52, 17–18
- C: range = max − min; IQR = Q3 − Q1 (paint A: range 50, IQR 40; B: range 20, IQR 10; OJ range 3, IQR 0.70; chips range 40, IQR 10).
- I: "The middle 50% of … are within IQR of each other." Difficulty 2, Importance 5.

#### 2.7 Variance & standard deviation (`std-dev`) — p.50–52, 17–18, 1–2
- K: variance = average squared distance from the mean; sample s² = Σ(x − x̄)²/(n − 1); s = √s². Population σ uses N.
- C: by table (paint A: s ≈ 21.85; B: s ≈ 7.07; McDonald's s ≈ 9.06; OJ s = 0.68; chips s = 10.181, s² = 103.652).
- I: "On average, the price … is about $0.68 away from the mean." Smaller s ⇒ more consistent (paint B lasts a more consistent amount of time).
- Err: dividing by n instead of n − 1; forgetting to square / to take the root; interpreting variance in original units; negative SD. Difficulty 3, Importance 5.

#### 2.8 Outliers (`outliers`) — p.51–52, 15, 17–18, 1
- K: **1.5×IQR rule**: fences Q1 − 1.5·IQR and Q3 + 1.5·IQR. **2 SD rule**: typical values within x̄ ± 2s.
- C: OJ fences 2.54–5.34 → $5.99 outlier; 2SD 2.675–5.395 → outlier. Chips: 24–64 and 22.209–62.933 → Fritos 19% outlier. McDonald's Big Tasty 54 g. South Branch 70 hrs. Medical GPA: no outlier by 1.5·IQR but 3.57 flagged by 2SD — rules can disagree.
- U: mean, SD, range are **not resistant**; median & IQR are resistant (chips without Fritos: x̄ 42.571→44.385, s 10.181→7.901, range 40→31; MD 45.5→46, IQR 10→9.5).
- Err: using Q3 for both fences; using 1.5·IQR on median. Difficulty 3, Importance 5.

#### 2.9 Standardized distance / z-score idea (`z-score`) — p.19, 52
- C: (x − x̄)/s = number of standard deviations from the mean (Maryland reps (8 − 8.7)/9.723 = −0.072; counties (23 − 62.82)/46.421 = −0.858 ⇒ farther from the mean in counties).
- U: lets you compare positions across different distributions.
- Err: dividing by the variance; sign errors. Difficulty 3, Importance 3. *(The PDF does this calculation without naming it a "z‑score"; the app names it as a supporting explanation.)*

#### 2.10 Comparing distributions (`compare`) — p.48–49, 15–16, 1–2, 21
- K: always discuss **center, shape, spread** (and outliers) in context. Symmetric → mean & SD; skewed/outliers → median & IQR. Compare means to means, IQRs to IQRs — don't mix.
- C/I: concerts students vs teachers; OSHA noise East vs West (median, SD, shape from histograms); North vs South Branch hours; heart rates alone/friend/pet; processed vs unprocessed cheese; glycerin bubbles; scope of conclusions (only dog‑loving women).
- Err: comparing a mean to a median; describing only numbers without context. Difficulty 4, Importance 5.

### UNIT 3 — Two Quantitative Variables & Regression

#### 3.1 Scatterplots & bivariate data (`scatter`) — p.43, 46–47, 10–13, 2
- K: explanatory (x) on horizontal axis, response (y) vertical; describe direction, strength, form (linear?), outliers. Seven reference scatterplots from strong positive to strong negative.
- Q: identify explanatory/response (femur → humerus; letters → spider deaths); decide whether a linear fit is appropriate (iPhone curve). Difficulty 2, Importance 4.

#### 3.2 Correlation coefficient r (`correlation`) — p.44, 10–12, 2
- K: −1 ≤ r ≤ 1; near ±1 strong, near 0 weak/none; sign = direction; measures **linear** relationships only.
- I: "strong, positive, linear correlation between …" (chocolate r = 0.791, femur r = 0.9941, spelling bee r = .806).
- U: **correlation does not imply causation** (chocolate → Nobel prizes; spelling bee → spider bites).
- Err: r = −0.85 is *strong*, not weak; r is not the slope; r is not a percent. Difficulty 3, Importance 5.

#### 3.3 Least-squares regression line (`regression`) — p.43–45, 10–12, 2
- K: ŷ = a + bx; a = predicted y when x = 0; b = slope = predicted change in y per 1‑unit increase in x. Line minimizes sum of squared residuals.
- C: use technology for a, b (SCUBA ŷ = 106.3421 − 0.8145x; Archaeopteryx ŷ = −3.6596 + 1.1969x; spelling bee ŷ = −5.4141 + 1.2778x; flowers ŷ = 180.8 + 15.8x; tablets ŷ = 4.67 + 0.0068x; roller coasters ŷ ≈ 24.336 + 0.2147x).
- C: predict (115 ft → 12.67 min; femur 45 → 50.20 cm); the course also solves for x given y (humerus 78 → femur 68.23; 9 spider deaths → 11.28 letters).
- U: **extrapolation** — only predict within the domain of observed x (SCUBA 50–130 ft; sugar 0–3 tbsp; letters 7–13).
- Err: "for every increase in y…"; interpreting meaningless intercepts literally; forgetting the hat (predicted). Difficulty 3, Importance 5.

#### 3.4 Coefficient of determination r² (`r-squared`) — p.44, 10–14, 2
- I: "About 98.83% of the variation in humerus length is explained by the variation in femur length (using the regression line)."
- C: r² = r²; r = ±√r², with sign from the slope.
- Err: "r² = 0.64 means 64% of points are on the line"; forgetting the sign when going from r² to r. Difficulty 3, Importance 4.

#### 3.5 Residuals & residual plots (`residuals`) — p.44–45, 12–14
- K: residual = observed − predicted = y − ŷ. Positive ⇒ model **underpredicts** (point above line); negative ⇒ model **overpredicts**.
- I: residual plot with random scatter ⇒ linear model appropriate; curved pattern ⇒ not. s = standard deviation of the residuals = typical prediction error. Compare linear / quadratic / exponential by residual plots, s and r² (iPhone: quadratic best, s = 0.6761, r² = 0.9838).
- C: flower with 2 tbsp & 204 h: residual = 204 − 212.4 = −8.4 h. Yogurt 310‑calorie outlier.
- Err: computing predicted − observed; "positive residual means overestimate". Difficulty 4, Importance 4.

### UNIT 4 — Probability

#### 4.1 Probability basics (`prob-basics`) — p.31, 36
- K: probability experiment, outcomes, sample space S, event, P(A) = long-run relative frequency, 0 ≤ P ≤ 1; equally likely outcomes P(A) = n(A)/n(S). Experimental (empirical) vs theoretical (classical); as the number of trials increases the experimental probability gets closer to the theoretical probability (handwritten note, Lab #3).
- Q: list sample spaces (two coins {HH, HT, TH, TT}; one digit {0,…,9}; four people saying red {0,1,2,3,4}; marble {R, W, B}). Difficulty 1, Importance 4.

#### 4.2 Complement, "or", "and", mutually exclusive (`prob-rules`) — p.31–33, 36–38, 5–9
- K: P(C′) = 1 − P(C); P(A or B) = P(A) + P(B) − P(A and B); mutually exclusive ⇔ P(A and B) = 0 ⇒ P(A or B) = P(A) + P(B).
- C: die A = {1,2,3,4}, B = {2,4,6}: P(A or B) = 5/6, P(A and B) = 1/3. MHS seniors: college or work = 0.9 (ME); sport or college = 168/200 = 0.84 (not ME). Sport/EC: 141/300 = 0.47. Neither = 1 − P(F or B) (car rental 0.12).
- Err: adding without subtracting the overlap ("double counted"); thinking ME means independent. Difficulty 2, Importance 5.

#### 4.3 Conditional probability & contingency tables (`conditional`) — p.31–32, 35, 37, 40, 5–9
- K: P(A | B) = P(A and B)/P(B) — the "given" event becomes the new sample space.
- C: favorite subject table (P(Math | non‑senior) = 11/25, P(SS | senior) = 7/25); Olympic medals (P(silver | Japan) = 14/58, P(Australia | bronze) = 22/402); Pew mothers (P(4+ | 2014) = 0.13); swim | poker = 0.73/0.82 = 0.8902.
- Err: P(A | B) vs P(B | A) (dividing by the wrong total); using grand total instead of the row/column total. Difficulty 3, Importance 5.

#### 4.4 Independence & the multiplication rule (`independence`) — p.32–33, 37–38, 5–9
- K: independent ⇔ P(A) = P(A | B) ⇔ P(A and B) = P(A)·P(B). Dependent: P(A and B) = P(A)·P(B | A). With replacement ⇒ independent; without ⇒ dependent (two hearts 1/16 vs 1/17).
- C: Spanish/German (0.15 = 0.75·0.2 → independent); repeated trials (0.75⁵ ≈ 0.237; 0.8⁵ ≈ 0.328; TAs 0.4⁵, 0.6⁵, alternating 0.0576); **at least one = 1 − P(none)** (video game 1 − 0.85⁵ = 0.5563; flu 1 − 0.7679⁴ = 0.6522); independence tests in tables (superheroes 30/84 vs 8/22 → dependent; USA medal vs gold; Pew 1976 & 4+; Ravens jerseys; lane splitting).
- Conf: **independent ≠ mutually exclusive** (ME events with nonzero probabilities are always dependent). Difficulty 3, Importance 5.

#### 4.5 Tree diagrams, Venn diagrams & dot arrays (`trees-venn`) — p.33–35, 38–40, 6–8
- K: tree branches multiply along a path, add across paths; Venn regions (only A, both, only B, neither); dot array for two dice.
- C: three coins (THT 1/8, all same 1/4, exactly two heads 3/8, no heads 1/8); duck pools (P(gold) = 11/30, P(pool 1 | gold) = 4/11 ≈ 0.364); Jed (P(late) = 0.067, P(bus | late) = 0.4179, P(walk | on time) = 0.2894); flu test (P(+) = 0.2321, P(flu | +) ≈ 0.913); switches 1/7; dice (sum 7 = 1/6, 7 or 11 = 2/9, different = 5/6); rainbow Venn; car rental Venn (.11, .31, .46, .12); AP procrastination Venn (12, 58, 24, 22).
- Err: adding along a branch; forgetting a path; Venn "only A" vs "A". Difficulty 4, Importance 4.

### UNIT 5 — Discrete Random Variables

#### 5.1 Probability distributions (`prob-dist`) — p.28, 30, 3
- K: discrete random variable X; probability distribution (PDF) table; every P(x) between 0 and 1 and ΣP(x) = 1; discrete vs continuous; continuous uniform distribution (P(Y < 75) on [0, 180] = 75/180).
- C: missing probability (snow days P(X = 0) = 1 − 0.67 = 0.33); P(X > 5) = 0.12; P(X ≥ 3) wording; histogram shape (right skewed).
- Err: P(X > 5) vs P(X ≥ 5); not checking sum = 1. Difficulty 2, Importance 4.

#### 5.2 Expected value & SD of a random variable (`expected-value`) — p.28–29, 3–4
- K: μ = E(X) = Σ x·P(x) (weighted average); σ² = Σ x²·P(x) − μ²; σ = √σ².
- C/I: snow days μ = 2.17, σ ≈ 2.409; roulette $100 on black: E = −$5.26, σ ≈ $99.86, 1000 plays ⇒ ≈ 474 wins and ≈ $5,263 lost; fair game E(X) = 0 (spinner grand prize $20).
- I: "In the long run, we expect … on average." Difficulty 3, Importance 5.

#### 5.3 Transforming & combining random variables (`transform`) — p.29–30, 4
- K (table p.30): add/subtract constant → center shifts, spread unchanged, shape unchanged; multiply/divide → center and SD scale (variance by the square), shape unchanged. Sum of independent X + Y: build the new distribution (slot machines Z: −40 (0.56), 0 (0.38), 40 (0.06); E(Z) = −20, σ = 24.33).
- C: roulette half bet (E −2.63, SD halves) and $5 fee (E −10.26, SD unchanged).
- Err: thinking adding a constant changes SD. Difficulty 3, Importance 3.

#### 5.4 Binomial distributions (`binomial`) — p.24–27
- K: conditions (binomial experiment): two outcomes (success/failure), fixed number of trials n, independent trials, same probability of success p each trial. X ~ B(n, p); μ = np; σ² = npq; σ = √(npq); q = 1 − p. Probabilities found with technology (Stapplet).
- C/I: Darius Washington 72% FT, 3 shots: win (3/3) 0.373, overtime (2/3) 0.435, lose 0.191; 40% three-point shooter — was fouling smart? Pop quiz X ~ B(10, 0.25): μ = 2.5, σ ≈ 1.369, P(X = 6) ≈ 0.0162; Mr. Athey Y ~ B(10, 1/3) more variability (σ ≈ 1.491) and higher pass chance. Soccer B(6, 0.75): P(X ≥ 5) ≈ 0.534, μ = 4.5, σ ≈ 1.061. Lights M ~ B(4, 0.3) (μ 1.2, σ 0.917) vs N ~ B(3, 0.45) (μ 1.35, σ 0.862). Draw a three X ~ B(250, 1/13): μ ≈ 19.23, σ ≈ 4.213, P(X ≤ 10) ≈ 0.013 (why use ≤ 10: "this extreme or more").
- Err: P(at least) vs P(more than); preprogrammed traffic lights violate independence; using n·p for σ. Difficulty 4, Importance 5.

## 4. Prerequisite graph (summary)

```
pop-sample → data-types → cat-displays
pop-sample → sampling → bias
data-types → freq-tables → quant-graphs → center → shape → compare
experiments ← pop-sample;  investigative ← pop-sample + experiments
center → position → boxplots → outliers
center → range-iqr → outliers;  center → std-dev → outliers, z-score
shape + boxplots + std-dev + range-iqr → compare
data-types → scatter → correlation → r-squared;  scatter → regression → residuals
prob-basics → prob-rules → conditional → independence → trees-venn
freq-tables + prob-rules → prob-dist → expected-value → transform
independence + expected-value → binomial
```

## 5. Formula inventory (all from the course)

| Formula | Section | Pages |
|---|---|---|
| Relative frequency = f / n | 1.3 | 60, 1 |
| x̄ = Σx / n, μ = Σx / N | 2.2 | 58 |
| Midrange = (min + max)/2 | 2.2 | 58 |
| Range = max − min | 2.7 | 50 |
| IQR = Q3 − Q1 | 2.7 | 50 |
| s² = Σ(x − x̄)²/(n − 1), s = √s² | 2.7 | 50 |
| Fences Q1 − 1.5·IQR, Q3 + 1.5·IQR | 2.7 | 51 |
| x̄ ± 2s | 2.7 | 51 |
| (x − x̄)/s | 2.7 practice | 19 |
| Percentile = (# values below)/n | 2.6 | 54, 19 |
| ŷ = a + bx | 12 | 43 |
| Residual = y − ŷ | 12 | 44 |
| r² | 12 | 44 |
| P(A) = n(A)/n(S) | 3 | 31 |
| P(A′) = 1 − P(A) | 3 | 31 |
| P(A or B) = P(A) + P(B) − P(A and B) | 3 | 33 |
| P(A | B) = P(A and B)/P(B) | 3 | 31 |
| P(A and B) = P(A)·P(B) (indep.), P(A)·P(B | A) (dep.) | 3 | 33 |
| P(at least one) = 1 − P(none) | 3 practice | 8 |
| μ = E(X) = Σ x·P(x) | 4.1 | 28, 3 |
| σ² = Σ x²·P(x) − μ² | 4.1 | 3 |
| μ = np, σ = √(npq) | 4.3 | 25 |

## 6. Errata found in the PDF answer keys

The app uses the mathematically correct value and shows a note when a learner
might compare against the PDF.

1. **p.7–8, Practice 3.1–3.5 #11a** — asks for P(Y′) but computes P(Y) = 82/116 = 0.7069. Correct P(Y′) = 34/116 ≈ 0.2931.
2. **p.10, Practice 12 #1b** — r² = (0.791)² is written as 0.6247; correct value 0.6257.
3. **p.12, Practice 12 #5c** — says the sign of r cannot be determined from r² = 0.342, but the slope b = 0.0068 > 0, so r = +0.585 (r always has the same sign as the slope).
4. **p.16, Practice 2.8 #2** — the key's pet-group mean/median (73.213 / 69.8) do not match the printed data (73.487 / 70.1). The app computes from the printed data.
5. **p.34, Example 9f** — 0.133/0.367 ≈ 0.362 uses rounded inputs; exact value is (4/30)/(11/30) = 4/11 ≈ 0.364.
6. **p.3, Practice 4.1 #1e** — σ² printed as 5.803; exact is 5.8011 (σ = 2.409 is correct).
7. **p.1, Exam #1 #6c** — lower fence written as Q3 − 0.1575; it should be Q1 − 0.1575 (conclusion "no outliers" unchanged).

## 7. Datasets extracted (used verbatim in the app)

Payroll 2002/2003 (p.57), actor ages (p.22/59), t‑shirt histogram (p.22), chip air (p.22/52),
AP exam histogram (p.23), corporations net worth (p.2), professors (p.20), OJ prices (p.20),
bubbles (p.21), Marines histograms (p.53), northbound speeds (p.54), hurricanes (p.55),
paint (p.50), McDonald's fat (p.51), House reps / counties summaries (p.19), concerts (p.48),
OSHA noise histograms (p.49), bank branches (p.15), heart rates (p.15), medical GPA summary (p.1),
cheese (p.2), Lyme disease (p.63), Exam #1 frequency table (p.1), favorite subject table (p.32),
Olympic medals (p.5), superheroes (p.35), AP procrastination (p.7), Pew mothers (p.8),
SCUBA (p.43), yogurt (p.45, read from plot), roller coasters (p.45), Archaeopteryx (p.10),
flowers (p.12), tablets (p.12), iPhone (p.13), spelling bee / spider bites (p.2; 11 points incl. duplicates),
snow days (p.3), spinner (p.4), slot machines (p.4), roulette (p.29), Darius Washington (p.24),
pop quiz (p.25), soccer, traffic lights, draw‑a‑three (p.27).
