import type { RegionContent } from '../../engine/pathway/types';

/**
 * Region 3 — The Starfall Observatory (Unit 3: Two Quantitative Variables, Ch. 12; PDF pp. 43–47 notes,
 * pp. 10–14 practice key, p. 2 Exam #1 Review #9).
 * Course order: scatter → correlation → regression → r-squared → residuals, interleaving earlier ideas as they return.
 * 20 levels → mini-bosses land after levels 7 and 13 (miniBossSlots(20) = [7, 13]).
 * Numbers computed with src/lib/stats/regression.ts (see .smoke/u3calc.ts).
 */

const SCUBA_PTS: [number, number][] = [[50, 80], [60, 55], [70, 45], [80, 35], [90, 25], [100, 22], [130, 10]];
const FOSSIL_PTS: [number, number][] = [[38, 41], [56, 63], [59, 70], [64, 72], [74, 84]];
const COASTER_PTS: [number, number][] = [[116.5, 47], [51.8, 35], [305, 90], [72.2, 46.6], [205, 71], [195, 67], [124.6, 43.5]];
const SPELLING_PTS: [number, number][] = [[9, 6], [8, 5], [11, 5], [12, 10], [11, 8], [13, 14], [12, 10], [9, 4], [9, 8], [7, 5], [9, 6]];
const IPHONE_PTS: [number, number][] = [[0, 0.5], [1, 1], [2, 1], [3, 1.7], [4, 4], [5, 5], [6, 9], [7, 10], [8, 13]];

/** Archaeopteryx least-squares line from the answer key (Practice 12 #2c). */
const archPredict = (x: number) => -3.6596 + 1.1969 * x;

export const REGION_U3: RegionContent = {
  region: {
    id: 'r3', unit: 'u3', number: 3, name: 'The Starfall Observatory', subtitle: 'Two Quantitative Variables',
    theme: 'observatory', emoji: '🔭',
    quote: 'Two stars that rise together are not bound together — measure the pattern, then question it.',
    description: 'The Observatory charts **two quantitative variables** at once. Here you\'ll read scatterplots, measure linear relationships with the correlation coefficient **r**, fit and interpret the least-squares regression line $\\hat{y} = a + bx$, explain variation with **r²**, and judge a model by its **residuals** — the Chapter 12 material that completes Exam #1.',
    learn: [
      'Explanatory vs. response variables, and describing a scatterplot by direction, strength, form, and outliers',
      'The correlation coefficient r: always between −1 and 1, sign = direction, size = strength — and why correlation is not causation',
      'The least-squares regression line ŷ = a + bx: interpret the slope and intercept, predict, solve for x, and avoid extrapolation',
      'The coefficient of determination r²: the percent of variation in y explained by x, and recovering r from r² with the slope\'s sign',
      'Residuals (observed − predicted), residual plots, and choosing between linear, quadratic, and exponential models using s and r²',
    ],
    landmarks: [
      { kind: 'observatory', label: 'The Starfall Observatory' },
      { kind: 'tower', label: 'The Correlation Spire', afterLevel: 'u3-corr-2' },
      { kind: 'mountain', label: 'Mount Extrapolation', afterLevel: 'u3-reg-2' },
      { kind: 'river', label: 'The Residual Stream', afterLevel: 'u3-resid-2' },
    ],
    boss: {
      name: 'The Trendseer', title: 'Prophet of Endless Lines', emoji: '🔮',
      description: 'A robed fortune-teller who reads destiny in scatterplots. It extends every trend line forever, treats every correlation as fate, and waves away any point that refuses to fit.',
      defeatLine: 'The orb clouds over. "Eighty centimeters predicted, forty observed… a residual no prophecy can explain." The Trendseer lowers its hood. "Inside the data only. Observed minus predicted. Association, not destiny. From now on, I read the residuals."',
    },
    miniBosses: [
      { name: 'The Chocolate Oracle', emoji: '🍫', taunt: 'r = 0.791 between chocolate and Nobel Prizes! Eat a bar a day and the prize committee will come knocking.' },
      { name: 'Extrapolus the Far-Seer', emoji: '🌠', taunt: 'Your flower line stops at 3 tablespoons of sugar? I\'ll pour in 10 and promise you 338.8 hours of freshness!' },
      { name: 'The Percent Phantom', emoji: '👻', taunt: 'r = 0.9 means 90% of the points sit on the line. Obviously. Boo!' },
      { name: 'The Residual Wraith', emoji: '🌑', taunt: 'Predicted minus observed, observed minus predicted — in the dark, who can tell the signs apart?' },
    ],
  },

  levels: [
    /* ---------- 12.1 Scatterplots ---------- */
    {
      id: 'u3-scatter-1', title: 'The Scatterplot Sky', type: 'lesson', concepts: ['scatter'], lessonSteps: [0, 5],
      intro: 'Today you\'ll learn to read a scatterplot — which variable belongs on which axis, and how to describe its direction, strength, form, and outliers — starting with SCUBA dive limits.',
      npc: { npc: 'juno', text: 'Every dot is one individual measured twice. Before you compute anything, look at the cloud — it tells you whether a line even makes sense.' },
      generators: ['sc-roles', 'sc-describe'],
    },
    {
      id: 'u3-scatter-practice', title: 'Direction, Strength, Form', type: 'practice', concepts: ['scatter'],
      intro: 'Today you\'ll practice naming the explanatory and response variables and describing scatterplots in context, until all four features come out automatically.',
      hook: {
        title: 'Taller coasters, faster coasters?',
        body: 'Example 3: the **height (ft)** and **maximum speed (mph)** of a random sample of seven roller coasters from the Roller Coaster Database. Heights run from 51.8 ft to 305 ft.\n\nBefore any calculation, part (a) just asks for a scatterplot. Which variable belongs on the x-axis — and how would you describe what you see?',
        visual: { type: 'scatter', points: COASTER_PTS, xLabel: 'Height (ft)', yLabel: 'Max speed (mph)' },
      },
      generators: ['sc-roles', 'sc-describe', 'sc-linear'],
      summary: [
        'The **explanatory** variable (x, horizontal) explains or predicts; the **response** (y, vertical) is the outcome.',
        'Describe **direction, strength, form, and outliers** — always naming both variables in context.',
        'A **curved** form means a straight line is not the right model, even if the points rise together.',
      ],
    },

    /* ---------- Correlation coefficient r ---------- */
    {
      id: 'u3-corr-1', title: 'The Number Called r', type: 'lesson', concepts: ['correlation'], lessonSteps: [0, 3],
      intro: 'Today you\'ll meet Karl Pearson\'s correlation coefficient **r** — one number between −1 and 1 that measures the direction and strength of a *linear* relationship — and test it by dragging points yourself.',
      generators: ['co-interpret', 'co-match'],
      summary: [
        'r measures the **direction** and **strength** of a **linear** relationship and is always between −1 and 1.',
        'Sign → direction. Close to ±1 → strong. Near 0 → weak or no *linear* relationship.',
        'Dragging a single point far from the cloud can change r dramatically.',
      ],
    },
    {
      id: 'u3-corr-curve', title: 'When r Goes Blind', type: 'experiment', concepts: ['correlation', 'scatter'],
      intro: 'Today you\'ll experiment on r itself: build a perfect curve, then send one point astray, and discover the two situations where r misleads you.',
      predict: {
        prompt: 'The widget\'s **Make a curve** button places 14 points exactly on an upside-down U (a "frown"). Every point fits that pattern perfectly. Predict r.',
        input: {
          type: 'mc', options: [
            { id: 'a', text: 'Close to +1 — the points follow their pattern perfectly', why: 'r only rewards points that follow a *straight line*. A perfect curve is not a line.', misconception: 'r-nonlinear' },
            { id: 'b', text: 'Close to −1 — the right half goes downhill', why: 'The left half climbs just as steeply as the right half falls, so the two cancel out.' },
            { id: 'c', text: 'Close to 0', correct: true, why: 'The uphill half and the downhill half cancel: there is no *linear* trend at all, even though the pattern is perfect.' },
          ],
        },
        reveal: 'r ≈ **0**. The uphill and downhill halves cancel, so there is no linear trend — yet the relationship is perfect. **r only measures linear association**, which is why you always look at the scatterplot before trusting r.',
      },
      widget: {
        id: 'correlation', props: { mode: 'drag' },
        mission: '1. Press **Make a curve** and read r. Keep **Show regression line** checked: what does a flat line say about this perfect pattern? Is the relationship weak — or just not linear?\n2. Drag only the **right-most point** of the curve up into the top-right corner. Watch r: one point moves it from 0 to roughly +0.45.\n3. Press **Reset points** for a roughly linear cloud and note r. Drag a single point to the corner that goes *against* the trend. How far can one point push r?',
        takeaway: 'r measures only **linear** association: a perfect curve scores r ≈ 0, and its least-squares line is flat. And r is easily moved by outliers — moving one point of the curve dragged r from 0 to about +0.45. Graph first, then compute r.',
      },
      generators: ['co-match', 'co-interpret', 'sc-linear'],
      summary: [
        'r ≈ 0 means no *linear* relationship — not necessarily no relationship.',
        'A single outlier can raise or lower r dramatically.',
        'Check the scatterplot\'s form before you interpret r.',
      ],
    },
    {
      id: 'u3-corr-2', title: 'Spelling Bees and Spider Bites', type: 'lesson', concepts: ['correlation'], lessonSteps: [4, 7],
      intro: 'Today you\'ll interpret r in a complete sentence — strength, direction, and form, in context — and see why even r = .806 can\'t prove that one variable causes another.',
      hook: {
        title: 'A suspicious pair',
        body: 'Exam #1 Review #9: in years when the winning Spelling Bee word had more letters, more people tended to die from spider bites — **r = .806**.\n\nA strong correlation — between two things that have nothing to do with each other. How can that be?',
        visual: { type: 'scatter', points: SPELLING_PTS, xLabel: 'Letters in winning word', yLabel: 'Spider-bite deaths' },
      },
      npc: { npc: 'vera', text: 'When someone shows me a strong r, my first question is: what else could make both of these rise together — or is it pure coincidence?' },
      generators: ['co-interpret', 'co-causation'],
    },
    {
      id: 'u3-corr-precision', title: 'The Sign and the Size', type: 'precision', concepts: ['correlation', 'scatter'],
      intro: 'Today you\'ll defeat the classic traps about r — calling a negative r weak, reading r as a percent or as the slope, using r on curves, and treating correlation as causation.',
      hook: {
        title: 'Four sentences, four mistakes',
        body: 'A study guide summarized three Chapter 12 data sets like this:\n\n- "SCUBA depth vs. maximum dive time has r = −0.9323. It\'s negative, so the relationship is weak."\n- "Femur vs. humerus has r = 0.9941, so 99.41% of the fossils lie on the line."\n- "Since r = 0.9941, each extra centimeter of femur adds 0.9941 cm of humerus."\n- "Chocolate vs. Nobel Prizes has r = 0.791, so eating chocolate makes a country win prizes."\n\nEvery sentence is wrong (the fossils\' actual slope is 1.1969). By the end of this level you\'ll be able to fix each one.',
      },
      generators: ['co-interpret', 'co-match', 'co-causation', 'sc-roles'],
      recall: [
        { prompt: 'Fix this sentence: "SCUBA has r = −0.9323, so the relationship between depth and dive time is weak."', answer: 'The **size** |r| = 0.9323 is close to 1, so the relationship is **strong**; the negative **sign** only gives the direction. Correct version: "There is a strong, negative, linear relationship between depth and maximum dive time."' },
      ],
    },
    {
      id: 'u3-mixed-1', title: 'Constellations and Correlations', type: 'mixed', concepts: ['scatter', 'correlation'],
      intro: 'Today you\'ll switch rapidly between describing scatterplots and interpreting r — exactly the mix the Chocolate Oracle is waiting to test.',
      hook: {
        title: 'Seven scatterplots in a row',
        body: 'The Chapter 12 notes open with seven scatterplots lined up from **strong positive** through **no relationship** to **strong negative**. Picture that row as you work: the sign of r tells you which end of the row you\'re on, and its size tells you how far you are from the middle.',
      },
      generators: ['sc-describe', 'sc-linear', 'co-match', 'co-causation', 'co-interpret'],
      summary: [
        'Scatterplot: x = explanatory, y = response; describe direction, strength, form, and outliers.',
        'r: sign = direction, |r| = strength, linear only, and easily moved by outliers.',
        'A strong r shows an association — never proof of cause.',
      ],
    },

    /* ---------- Least-squares regression line ---------- */
    {
      id: 'u3-reg-1', title: 'How Long Can You Dive?', type: 'lesson', concepts: ['regression'], lessonSteps: [0, 4],
      intro: 'Today you\'ll fit a line to the SCUBA data by eye, learn what a, b, and $\\hat{y}$ mean in $\\hat{y} = a + bx$, and predict the maximum dive time at 115 feet.',
      npc: { npc: 'thorne', text: 'Mind the hat on ŷ. It marks a *prediction*, not an observation — drop it and you claim to know something you only estimated.' },
      generators: ['rg-terms', 'rg-predict', 'rg-slope'],
      summary: [
        '$\\hat{y} = a + bx$: a = predicted y when x = 0; b = predicted change in y for every one-unit increase in x.',
        'The least-squares line makes the **sum of the squared residuals** as small as possible.',
        'SCUBA: ŷ = 106.3421 − 0.8145(115) ≈ 12.67 minutes at 115 ft.',
      ],
    },
    {
      id: 'u3-reg-lab', title: 'Fit the Spelling-Bee Line', type: 'graph-lab', concepts: ['regression', 'correlation'],
      intro: 'Today you\'ll fit the least-squares line to the Exam #1 spelling-bee data yourself, then reveal the line technology finds and read its slope and intercept.',
      predict: {
        prompt: 'The winning words in the data run from **7 to 13 letters**, and the trend rises. If you extend the least-squares line all the way back to a **0-letter** word, what will it predict?',
        input: {
          type: 'mc', options: [
            { id: 'a', text: 'About 4 deaths — the lowest value in the data', why: 'The line doesn\'t stop at the smallest observed y; it keeps falling as x decreases.' },
            { id: 'b', text: 'Exactly 0 deaths', why: 'Nothing forces a regression line through the origin. Its intercept is wherever least squares puts it.' },
            { id: 'c', text: 'A negative number of deaths', correct: true, why: 'The line rises about 1.28 deaths per letter, so seven letters back from x = 7 it falls below zero.' },
          ],
        },
        reveal: 'The intercept is $a = -5.4141$: for a 0-letter word, the line predicts **−5.4141 deaths** — impossible. The line isn\'t broken; x = 0 is simply far outside the 7–13-letter data, so this intercept has no real meaning. (Exam #1 Review #9c asks for this interpretation; #9h limits the model to words of 7 to 13 letters.)',
      },
      widget: {
        id: 'scatter-fit', props: { dataset: 'spelling' },
        mission: 'Use the two sliders to move your line\'s ends at x = 7 and x = 13. The orange squares are the squared residuals: make **Your Σ residual²** as small as you can. When you think you\'re close, press **Reveal least-squares line** — how close did you get, and what are a and b?',
        takeaway: 'Technology finds the one line with the smallest total squared residual: $\\hat{y} = -5.4141 + 1.2778x$. For every additional letter in the winning word, the predicted spider-bite deaths increase by 1.2778. The line describes the data between 7 and 13 letters — and says nothing about cause.',
      },
      generators: ['rg-predict', 'rg-slope', 'rg-intercept', 'co-causation', 'co-tech'],
      summary: [
        'Least squares picks the line with the smallest sum of squared residuals.',
        'Spelling bee: $\\hat{y} = -5.4141 + 1.2778x$; slope = +1.2778 predicted deaths per extra letter.',
        'An intercept far outside the data (0 letters → −5.4141 deaths) has no real meaning.',
      ],
    },
    {
      id: 'u3-reg-2', title: 'The Edge of the Data', type: 'lesson', concepts: ['regression'], lessonSteps: [5, 8],
      intro: 'Today you\'ll predict from a regression line, decide when a prediction is extrapolation, interpret an intercept that makes no sense, and solve the line backward for x.',
      hook: {
        title: 'A femur without a humerus',
        body: 'Practice 12 #2f: an Archaeopteryx specimen is found with a **45 cm femur**, but its humerus is missing. The known fossils have femurs from 38 to 74 cm, and technology gives $\\hat{y} = -3.6596 + 1.1969x$.\n\nCan the line fill in the missing bone — and when should you refuse to use it?',
      },
      generators: ['rg-predict', 'rg-extrapolate', 'rg-intercept', 'rg-solve-x'],
    },
    {
      id: 'u3-reg-precision', title: 'Slope, Intercept, and the Sugar Trap', type: 'precision', concepts: ['regression', 'correlation'],
      intro: 'Today you\'ll target the regression traps that cost the most exam points: backwards slope sentences, literal intercepts, extrapolation, and confusing r with the slope.',
      hook: {
        title: 'Sugar for carnations',
        body: 'Practice 12 #4: two students randomly assigned 12 carnations to vases with **0, 1, 2, or 3 tablespoons of sugar** and recorded how many hours each stayed fresh. Technology gives $\\hat{y} = 180.8 + 15.8x$.\n\nThree classmates wrote:\n\n- "For every extra hour of freshness, the sugar goes up 15.8 tablespoons."\n- "The correlation between sugar and freshness is 15.8."\n- "With 10 tablespoons, a flower will stay fresh 338.8 hours."\n\nEach sentence falls into a different trap. Keep them in mind as you meet the traps one by one.',
      },
      generators: ['rg-slope', 'rg-intercept', 'rg-extrapolate', 'co-interpret'],
      recall: [
        { prompt: 'Rewrite the slope sentence correctly for $\\hat{y} = 180.8 + 15.8x$ (x = tablespoons of sugar, y = hours fresh).', answer: '"For every additional tablespoon of sugar, the **predicted** freshness increases by **15.8 hours**." The x-variable drives the sentence; y is what changes.' },
      ],
    },

    /* ---------- Coefficient of determination r² ---------- */
    {
      id: 'u3-r2-1', title: 'How Much Does the Femur Explain?', type: 'lesson', concepts: ['r-squared'], lessonSteps: [0, 6],
      intro: 'Today you\'ll learn the coefficient of determination **r²** — the percent of the variation in the response explained by the explanatory variable — and how to recover r from r² using the slope\'s sign.',
      npc: { npc: 'quill', text: 'r tells you how tightly the points hug the line; r² tells you how much of the up-and-down in y the line accounts for. Same ingredients, different questions.' },
      generators: ['r2-compute', 'r2-interpret', 'r2-terms'],
    },
    {
      id: 'u3-mixed-2', title: 'The Orrery of Slope, r, and r²', type: 'mixed', concepts: ['regression', 'r-squared', 'correlation'],
      intro: 'Today you\'ll interleave predictions, slope interpretations, r, and r² — deciding each time which number answers which question.',
      hook: {
        title: 'Back to the dive tables',
        body: 'Example 1c asks for **r** and **r²** for the SCUBA data. Technology gives $\\hat{y} = 106.3421 - 0.8145x$ with **r = −0.9323** and **r² = 0.8691**.\n\n- **r**: a strong, negative, linear relationship between depth and maximum dive time.\n- **r²**: about 86.91% of the variation in maximum dive time is explained by the variation in depth.\n- **Slope**: for every additional foot of depth, the predicted maximum dive time *decreases* by 0.8145 minutes.\n\nThree numbers, three different jobs. Keep them separate.',
        visual: { type: 'scatter', points: SCUBA_PTS, line: { a: 106.3421, b: -0.8145 }, xLabel: 'Depth (ft)', yLabel: 'Max dive time (min)' },
      },
      generators: ['rg-predict', 'rg-slope', 'rg-solve-x', 'r2-compute', 'r2-interpret', 'r2-models', 'co-interpret', 'co-match'],
      summary: [
        '**Slope b**: the predicted change in y per one-unit increase in x (it has units).',
        '**r**: the strength and direction of the linear relationship (no units, not a percent).',
        '**r²**: the percent of the variation in y explained by x using the line.',
      ],
    },

    /* ---------- Residuals & residual plots ---------- */
    {
      id: 'u3-resid-1', title: 'The Sugary Flower', type: 'lesson', concepts: ['residuals'], lessonSteps: [0, 3],
      intro: 'Today you\'ll compute residuals — observed minus predicted — decide whether the line overpredicted or underpredicted, and read your first residual plots.',
      generators: ['re-compute', 're-terms'],
      summary: [
        'Residual = observed − predicted = $y - \\hat{y}$.',
        'Positive residual → point above the line → the model **underpredicted**. Negative → **overpredicted**.',
        'Flower with 2 tbsp: 204 − 212.4 = −8.4 hours, so the line overpredicted.',
        'A random residual plot supports a line; a curve says try another model.',
      ],
    },
    {
      id: 'u3-resid-lab', title: 'The Coaster That Broke the Line', type: 'lab', concepts: ['residuals', 'regression'],
      intro: 'Today you\'ll hunt residuals in two real data sets: find the roller coaster the line misses most (Example 3e), then uncover a hidden curve in the SCUBA dive data.',
      predict: {
        prompt: 'Technology fits $\\hat{y} = 24.3362 + 0.2147x$ to the seven roller coasters (x = height in ft, y = maximum speed in mph), with r = 0.9738. The **124.6 ft** coaster has a maximum speed of **43.5 mph**. What is the sign of its residual?',
        input: {
          type: 'mc', options: [
            { id: 'a', text: 'Negative — the line predicts about 51.1 mph, faster than its actual 43.5 mph', correct: true, why: 'Residual = 43.5 − 51.09 ≈ −7.59 mph, so the line overpredicts this coaster.' },
            { id: 'b', text: 'Positive — 43.5 mph is still a fast coaster', why: 'A residual compares the actual value to the *predicted* value, not to other coasters. Here actual < predicted, so it\'s negative.', misconception: 'residual-sign-meaning' },
            { id: 'c', text: 'Zero — with r = 0.9738, every coaster is on the line', why: 'A strong r means the points are *close* to the line, not on it. Nearly every point still has a nonzero residual.' },
          ],
        },
        reveal: 'ŷ = 24.3362 + 0.2147(124.6) ≈ 51.09 mph, so the residual is 43.5 − 51.09 ≈ **−7.59 mph**: the line **overpredicts** this coaster\'s speed. It turns out to be the largest absolute residual of all seven coasters.',
      },
      widget: {
        id: 'residuals', props: { datasets: ['coasters', 'scuba'] },
        mission: '1. With **Roller coasters** selected, click each of the seven points and read its residual. Which coaster has the **largest absolute residual**? Which one is the biggest *under*prediction?\n2. Switch to **SCUBA dive times**. Its r is −0.9323 — strong — but study the residual plot: are the residuals randomly scattered, or do they form a shape?',
        takeaway: 'Coasters: the 124.6 ft coaster has the largest absolute residual (≈ −7.59 mph, overpredicted), and the 72.2 ft coaster is the biggest underprediction (≈ +6.76 mph). SCUBA: the residuals are positive at both ends and negative in the middle — a **U-shaped curve**. Even with a strong r, a curved residual plot means a straight line misses part of the pattern.',
      },
      generators: ['re-compute', 're-plot', 'rg-predict'],
      summary: [
        'Residual = observed − predicted; the largest |residual| marks the point the line misses most.',
        'Negative → overprediction (point below the line); positive → underprediction (point above).',
        'A strong r does not guarantee a good linear model — check the residual plot for curves.',
      ],
    },
    {
      id: 'u3-resid-2', title: 'Curves in the Leftovers', type: 'lesson', concepts: ['residuals'], lessonSteps: [4, 8],
      intro: 'Today you\'ll judge whole models by their residual plots, use **s** (the typical prediction error) and **r²** to choose between linear, quadratic, and exponential fits, and practice reading residual signs.',
      hook: {
        title: 'Opening-weekend iPhones',
        body: 'Practice 12 #6: opening-weekend iPhone sales grew from **0.5 million** units (2007) to **13 million** (2015) — slowly at first, then faster every year. A straight line gives r² = 0.9138, which sounds excellent.\n\nBut is a line actually the right *shape* for this data?',
        visual: { type: 'scatter', points: IPHONE_PTS, xLabel: 'Years since 2007', yLabel: 'Units sold (millions)' },
      },
      npc: { npc: 'juno', text: 'A high r² can hide the wrong shape. The residual plot is where a model confesses what it missed.' },
      generators: ['re-plot', 're-models', 're-compute'],
    },

    /* ---------- Retrieval, teaching, and the final push ---------- */
    {
      id: 'u3-recall', title: 'Templates from Memory', type: 'recall', concepts: ['r-squared', 'correlation', 'regression'],
      intro: 'Today you\'ll pull the three Chapter 12 interpretation templates — for r², r, and the slope — out of memory, then use them on fresh problems.',
      recall: [
        { prompt: 'Femur and humerus: r² = 0.9883. Write the full interpretation sentence from memory.', answer: '"About **98.83%** of the variation in humerus length is explained by the variation in femur length (using the regression line)."' },
        { prompt: 'SCUBA: r = −0.9323. Interpret it in context — strength, direction, and form.', answer: '"There is a **strong, negative, linear** relationship between depth and maximum dive time."' },
        { prompt: 'Spelling bee: $\\hat{y} = -5.4141 + 1.2778x$. Interpret the slope from memory.', answer: '"For every additional letter in the winning word, the **predicted** number of spider-bite deaths increases by **1.2778**."' },
      ],
      generators: ['r2-terms', 'r2-interpret', 'co-interpret', 'rg-slope'],
      summary: [
        'r²: "About __% of the variation in [y] is explained by the variation in [x]."',
        'r: "There is a [strong/moderate/weak], [positive/negative], linear relationship between [x] and [y]."',
        'Slope: "For every one-unit increase in [x], the predicted [y] increases/decreases by [b]."',
      ],
    },
    {
      id: 'u3-teach', title: 'Teach the Trendline', type: 'teach', concepts: ['regression'],
      intro: 'Today you\'ll explain the least-squares regression line in your own words — what a and b mean, how to predict, and when a prediction can\'t be trusted — as if teaching a classmate before Exam #1.',
      hook: {
        title: 'A classmate asks for help',
        body: 'Your study partner has the SCUBA line $\\hat{y} = 106.3421 - 0.8145x$ (depths 50–130 ft) and three questions: *What do the two numbers mean? How do I predict the dive time at 115 ft? And why won\'t you let me use it for 30 ft?*\n\nAnswer all three in one short paragraph.',
      },
    },
    {
      id: 'u3-challenge', title: 'Trial of the Tablet Batteries', type: 'challenge', concepts: ['residuals', 'r-squared', 'regression'],
      intro: 'Today you\'ll take on exam-level regression problems with no scaffolding — residual plots, r², and predictions — starting from the tablet battery study.',
      hook: {
        title: 'Can price predict battery life?',
        body: 'Practice 12 #5: for a sample of **15 tablets**, technology gives $\\hat{y} = 4.67 + 0.0068x$ (x = price in dollars, y = battery life in hours) with **r² = 0.342**. The residual plot of the 15 tablets shows points scattered above and below zero with no curve or trend.\n\nIs a linear model appropriate? What does r² = 0.342 say about battery life — and what is r, *including its sign*? Work it out without hints.',
      },
      generators: ['re-plot', 're-models', 'r2-models', 'r2-interpret', 'rg-data', 'rg-slope'],
    },
    {
      id: 'u3-review', title: 'The Full Night Sky', type: 'review', concepts: ['scatter', 'correlation', 'regression', 'r-squared', 'residuals'],
      intro: 'Today you\'ll review all of Chapter 12 in one sweep — scatterplots, r, the regression line, r², and residuals — before you face the Trendseer.',
      npc: { npc: 'vera', text: 'The Trendseer will show you a fossil that doesn\'t fit. Remember: a strong pattern among the known points is exactly what makes an outlier stand out.' },
      generators: ['sc-describe', 'sc-linear', 'co-causation', 'co-match', 'rg-predict', 'rg-solve-x', 'r2-interpret', 're-compute', 're-plot'],
    },
  ],

  encounters: [
    {
      id: 'u3-enc-scholar', kind: 'scholar', afterLevel: 'u3-corr-precision', title: 'The Astronomer\'s Riddle', concepts: ['correlation'],
      question: {
        prompt: 'An astronomer shows you correlations from four different studies: r = 0.62, r = −0.91, r = 0.05, and r = 0.88. Which shows the **strongest** linear relationship?',
        input: {
          type: 'mc', options: [
            { id: 'a', text: 'r = 0.88 — it is the largest number', why: 'Strength depends on |r|, the distance from 0. |−0.91| = 0.91 is larger than 0.88.', misconception: 'r-strength-sign' },
            { id: 'b', text: 'r = −0.91', correct: true, why: 'Its absolute value, 0.91, is the closest to 1. The negative sign only means the relationship goes downhill.' },
            { id: 'c', text: 'r = 0.05 — it is closest to 0', why: 'Close to 0 means a *weak* or nonexistent linear relationship.' },
            { id: 'd', text: 'r = 0.62 — positive and moderate', why: 'Being positive doesn\'t make a correlation stronger; 0.62 is farther from ±1 than both −0.91 and 0.88.' },
          ],
        },
        explain: 'Strength = how close |r| is to 1, regardless of sign. r = −0.91 is a **strong, negative** linear relationship — stronger than r = 0.88.',
      },
    },
    {
      id: 'u3-enc-formula', kind: 'lost-formula', afterLevel: 'u3-reg-2', title: 'The Torn Star Chart', concepts: ['regression'], formula: 'regression-line',
      npc: { npc: 'thorne', text: 'Every symbol in ŷ = a + bx has a job. Name each one, and the chart is whole again.' },
    },
    {
      id: 'u3-enc-yogurt', kind: 'lab', afterLevel: 'u3-resid-1', title: 'The Yogurt Anomaly', concepts: ['residuals', 'regression'],
      widget: {
        id: 'scatter-fit', props: { dataset: 'yogurt' },
        mission: 'Example 2 plots protein (g) against calories for 10 brands of flavored yogurt. Fit your best line with the sliders and watch the orange squares: one brand — **9 g of protein, 310 calories** — owns a giant square. Then reveal the least-squares line: does it pass anywhere near that brand, or do the other nine points sit mostly *below* it?',
        takeaway: 'The 310-calorie yogurt sits far above the line, with a residual of roughly +156 calories (values read from the PDF plot): the line badly *under*predicts it. Least squares squares every miss, so one outlier like this pulls the line up toward itself and leaves most of the other brands below it — which is why it stands alone near +150 on the residual plot in Example 2.',
      },
    },
    { id: 'u3-enc-treasure', kind: 'treasure', afterLevel: 'u3-recall', title: 'The Comet\'s Cache', concepts: ['r-squared', 'correlation'] },
  ],

  boss: {
    id: 'boss-u3',
    story: 'Deep in the Starfall Observatory\'s vault lie five Archaeopteryx fossils, with femur and humerus lengths (cm): (38, 41), (56, 63), (59, 70), (64, 72), (74, 84). If they are one species that differ only in age, the bones should follow a **positive linear** pattern — and a fossil far off that pattern would suggest a **different species** (Practice 12 #2).\n\nNow a new fossil arrives: a **70 cm femur** but only a **40 cm humerus**. The Trendseer gazes into its orb and proclaims it "obviously the same species — every line runs on forever." Test the prophecy with regression.',
    source: { pages: [10, 11, 46], section: 'Unit 3 — 12.1–12.3 Practice #2 (Archaeopteryx)' },
    phases: [
      {
        title: 'Phase 1 — Recognition', kind: 'recognition',
        intro: '"Bones are bones — who cares which one goes on which axis?"',
        tasks: [
          { kind: 'boss-step', boss: 'boss-u3', index: 0 },
          {
            kind: 'step',
            context: 'Femur (cm): 38, 56, 59, 64, 74. Humerus (cm): 41, 63, 70, 72, 84.',
            visual: { type: 'scatter', points: FOSSIL_PTS, xLabel: 'Femur (cm)', yLabel: 'Humerus (cm)' },
            step: {
              concept: 'scatter', dims: ['recognize', 'interpret'], label: 'Pattern',
              prompt: 'Plot the five known fossils with femur on x and humerus on y. How would you describe the scatterplot?',
              answer: {
                kind: 'mc', options: [
                  { id: 'a', text: 'Strong, positive, and linear, with no obvious outliers', correct: true, why: 'The five points rise together in a nearly straight line — r = 0.9941 confirms it.' },
                  { id: 'b', text: 'Strong, negative, and linear', why: 'Longer femurs go with longer humeri. That\'s uphill, so the direction is positive.' },
                  { id: 'c', text: 'Curved — humerus length levels off for larger femurs', why: 'The points climb at a steady rate; there is no bend.' },
                  { id: 'd', text: 'No relationship — the specimens differ greatly in size', why: 'The differing sizes are exactly what reveal the relationship: bigger femurs come with bigger humeri.' },
                ],
              },
              explain: 'Strong, positive, linear, no outliers. The answer key (Practice 12 #2b) concludes the five known specimens likely belong to one species because they follow a roughly linear pattern.',
              hint: 'Check direction, strength, form, and outliers.',
            },
          },
        ],
      },
      {
        title: 'Phase 2 — Calculation', kind: 'calculation',
        intro: '"My orb already knows every answer — go ahead, waste your time computing."',
        tasks: [
          { kind: 'boss-step', boss: 'boss-u3', index: 2 },
          {
            kind: 'step',
            step: {
              concept: 'residuals', dims: ['calculate'], label: 'Known fossil',
              prompt: 'One of the five known fossils has a **59 cm femur** and a **70 cm humerus**. Using $\\hat{y} = -3.6596 + 1.1969x$, find its residual (cm).',
              answer: {
                kind: 'numeric', value: 70 - archPredict(59), tol: 0.02, unit: 'cm',
                wrong: [
                  { value: archPredict(59) - 70, misconception: 'residual-order', why: 'That is predicted − observed. A residual is observed − predicted.' },
                  { value: archPredict(59), why: 'That is the predicted humerus length (≈ 66.96 cm), not the residual. Subtract it from the observed 70 cm.' },
                ],
              },
              explain: 'ŷ = −3.6596 + 1.1969(59) ≈ 66.96 cm, so the residual is 70 − 66.96 ≈ **3.04 cm**. The line underpredicts this fossil by about 3 cm — a small miss, typical of a strong fit.',
              hint: 'Predict first, then compute observed − predicted.',
            },
          },
          {
            kind: 'step',
            step: {
              concept: 'regression', dims: ['calculate'], label: 'Missing femur',
              prompt: 'Practice 12 #2g: a specimen has a **78 cm humerus** but no measurable femur. Solve $\\hat{y} = -3.6596 + 1.1969x$ for the femur length x (cm).',
              answer: {
                kind: 'numeric', value: (78 + 3.6596) / 1.1969, tol: 0.02, unit: 'cm',
                wrong: [{ value: archPredict(78), why: 'That plugs 78 in as the femur (x). Here 78 cm is the humerus — the y-value — so set ŷ = 78 and solve for x.' }],
              },
              explain: '78 = −3.6596 + 1.1969x → 81.6596 = 1.1969x → x ≈ **68.23 cm** (answer key: 68.2259 cm).',
              hint: 'Set ŷ = 78, add 3.6596 to both sides, then divide by 1.1969.',
            },
          },
        ],
      },
      {
        title: 'Phase 3 — Interpretation', kind: 'interpretation',
        intro: '"r, r², the slope — they are all the same number wearing different hats."',
        tasks: [
          { kind: 'boss-step', boss: 'boss-u3', index: 1 },
          {
            kind: 'step',
            step: {
              concept: 'regression', dims: ['interpret'], label: 'Slope',
              prompt: 'Interpret the slope of $\\hat{y} = -3.6596 + 1.1969x$ in context.',
              answer: {
                kind: 'mc', options: [
                  { id: 'a', text: 'For every 1 cm increase in femur length, the predicted humerus length increases by 1.1969 cm', correct: true, why: 'Slope = predicted change in y for each one-unit increase in x, with units.' },
                  { id: 'b', text: 'For every 1 cm increase in humerus length, the femur length increases by 1.1969 cm', why: 'That swaps the roles. The femur (x) drives the sentence; the humerus (y) is what changes.', misconception: 'slope-wording' },
                  { id: 'c', text: 'The correlation between femur and humerus length is 1.1969', why: 'r can never exceed 1. The slope and r are different numbers (r = 0.9941).', misconception: 'r-is-slope' },
                  { id: 'd', text: 'A fossil with a 0 cm femur has a humerus of −3.6596 cm', why: 'That describes the intercept — read literally, which makes no sense: 0 cm is far outside the 38–74 cm data.', misconception: 'intercept-literal' },
                ],
              },
              explain: 'Answer key (Practice 12 #2c): "For every 1 cm increase of the femur length, we expect a 1.1969 cm increase of the humerus length."',
              hint: 'Template: "For every one-unit increase in x, the predicted y…"',
            },
          },
          { kind: 'boss-step', boss: 'boss-u3', index: 5 },
        ],
      },
      {
        title: 'Phase 4 — Application', kind: 'application',
        intro: '"Lines run on forever, and one stray point changes nothing — my orb has spoken."',
        tasks: [
          {
            kind: 'step',
            step: {
              concept: 'regression', dims: ['apply', 'interpret'], label: 'Beyond the data',
              prompt: 'The Trendseer uses the same line to "predict" a giant specimen with a **120 cm femur**: ŷ = −3.6596 + 1.1969(120) ≈ 139.97 cm. Should you trust that prediction?',
              answer: {
                kind: 'mc', options: [
                  { id: 'a', text: 'No — 120 cm is far outside the observed femurs (38–74 cm), so this is extrapolation', correct: true, why: 'The line is supported only by femurs between 38 and 74 cm; nothing says the pattern continues beyond them.' },
                  { id: 'b', text: 'Yes — r = 0.9941, so the line is reliable for any femur length', why: 'A strong r describes the data you have. It says nothing about femur lengths you never observed.', misconception: 'extrapolation' },
                  { id: 'c', text: 'Yes — the arithmetic is correct, so the prediction is correct', why: 'The arithmetic is fine. The problem is using the line outside the domain of the data.', misconception: 'extrapolation' },
                ],
              },
              explain: 'Only predict for x-values within the domain of the sample data (38–74 cm). A 120 cm femur is extrapolation, so 139.97 cm can\'t be trusted.',
              hint: 'Which femur lengths were actually measured?',
            },
          },
          {
            kind: 'step',
            step: {
              concept: 'correlation', dims: ['apply', 'interpret'], label: 'One stray fossil',
              prompt: 'Suppose you add the new fossil (70 cm femur, 40 cm humerus) to the five known fossils and recompute r. What happens?',
              answer: {
                kind: 'mc', options: [
                  { id: 'a', text: 'r drops sharply, from 0.9941 to about 0.51', correct: true, why: 'Recomputing with all six fossils gives r ≈ 0.5114. A single point far from the pattern can weaken r dramatically.' },
                  { id: 'b', text: 'r stays about 0.99 — five of the six fossils still fit', why: 'r uses every point, and one far-off point can drag it down a lot.' },
                  { id: 'c', text: 'r becomes negative, because the new fossil lies below the line', why: 'The overall trend is still uphill, so r stays positive — just much weaker (≈ 0.51).' },
                  { id: 'd', text: 'r rises above 1, because there is more data', why: 'r is always between −1 and 1, and more data doesn\'t automatically make a relationship stronger.' },
                ],
              },
              explain: 'With the new fossil included, r ≈ 0.5114 (r² ≈ 0.26). One point wrecked a near-perfect linear relationship — exactly the kind of outlier that, in Practice 12 #2, suggests a different species.',
              hint: 'Is r resistant to outliers?',
            },
          },
          { kind: 'gen', concept: 'correlation', generators: ['co-causation'], level: 6, excludeTypes: ['free-response'] },
        ],
      },
      {
        title: 'Final Phase — The Verdict', kind: 'final',
        intro: '"Very well — measure my fossil, and let the line decide."',
        tasks: [
          { kind: 'boss-step', boss: 'boss-u3', index: 3 },
          { kind: 'boss-step', boss: 'boss-u3', index: 4 },
          { kind: 'boss-step', boss: 'boss-u3', index: 6 },
        ],
      },
    ],
  },
};
