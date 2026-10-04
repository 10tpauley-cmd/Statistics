import type { RegionContent } from '../../engine/pathway/types';

/**
 * Region 2 — The Histogram Highlands (Unit 2: Describing Data, Ch. 2).
 * Course order: 2.1–2.2/2.5 graphs & center → 2.4/2.6 shape, position, boxplots → 2.7 spread, outliers,
 * SDs from the mean → 2.8 comparing distributions. Every number below comes from the packet or was computed
 * with src/lib/stats/descriptive (sample SD, Stapplet quartiles).
 */

const PAYROLL_2003 = [20, 41, 41, 48, 49, 49, 49, 50, 51, 51, 52, 55, 56, 59, 67, 71, 71, 74, 79, 80, 81, 83, 83, 87, 100, 103, 106, 106, 117, 153];

const HIST_2003 = {
  type: 'histogram' as const,
  xLabel: '2003 Payroll ($ millions)',
  bins: [
    { lo: 20, hi: 40, count: 1 }, { lo: 40, hi: 60, count: 13 }, { lo: 60, hi: 80, count: 5 }, { lo: 80, hi: 100, count: 5 },
    { lo: 100, hi: 120, count: 5 }, { lo: 120, hi: 140, count: 0 }, { lo: 140, hi: 160, count: 1 },
  ],
};

export const REGION_U2: RegionContent = {
  region: {
    id: 'r2', unit: 'u2', number: 2, name: 'The Histogram Highlands', subtitle: 'Describing Data',
    theme: 'highlands', emoji: '🏔️',
    quote: 'Every dataset has a landscape — learn to read its peaks and tails before you measure it.',
    description: 'The Highlands are where raw numbers become a landscape you can read: stem plots, dotplots, histograms, and boxplots. You will measure **center, shape, position, and spread**, hunt outliers with the 1.5 × IQR and 2 SD rules, and compare two distributions the way Section 2.8 demands — like with like, in context.',
    learn: [
      'Build and read stem-and-leaf plots, dotplots, and histograms',
      'Compute the mean and median — and decide which one is the typical value',
      'Name a distribution\'s shape and read skew from the mean and median',
      'Find percentiles, quartiles, and the five-number summary; draw and read boxplots',
      'Measure spread with the range, IQR, variance, and standard deviation',
      'Flag outliers, measure distance in standard deviations, and compare distributions in context',
    ],
    landmarks: [
      { kind: 'gate', label: 'The Stem-and-Leaf Gate' },
      { kind: 'camp', label: 'Median Camp', afterLevel: 'u2-center-precision' },
      { kind: 'mountain', label: 'The Boxplot Crags', afterLevel: 'u2-boxplot-lab' },
      { kind: 'bridge', label: 'The Fence Bridge', afterLevel: 'u2-outliers-2' },
    ],
    boss: {
      name: 'The Skew Wyrm', title: 'Serpent of the Long Tail', emoji: '🐉',
      description: 'A dragon whose tail stretches far to the right of every distribution it touches, dragging careless means along behind it.',
      defeatLine: 'The Wyrm\'s tail goes slack. "Medians, IQRs, fences… you described me honestly. The Highlands are yours."',
    },
    miniBosses: [
      { name: 'The Meanstone Troll', emoji: '🧌', taunt: 'Toss one boulder onto my pile and watch your precious average roll wherever I please.' },
      { name: 'The Whisker Wraith', emoji: '👻', taunt: 'My whiskers stretch for miles — surely that is where most of your data hides?' },
      { name: 'The Variance Viper', emoji: '🐍', taunt: 'Square every deviation, forget the root, and wander lost in squared units forever.' },
      { name: 'The Fence-Breaker Ogre', emoji: '👹', taunt: 'Build both fences from Q3 and I will stroll right through them.' },
    ],
  },

  levels: [
    /* ---------- 2.1–2.2, 2.5 Graphs of quantitative data & measures of center ---------- */
    {
      id: 'u2-stems', title: 'Stems and Leaves', type: 'lesson', concepts: ['quant-graphs'], lessonSteps: [0, 2],
      intro: 'Today you\'ll organize real data — Moneyball payrolls and Academy Award ages — into stem-and-leaf plots, a display that shows the shape *and* keeps every value.',
      npc: { npc: 'juno', text: 'Before we compute anything, let\'s *look*. A good display shows where the data pile up and where they thin out.' },
      generators: ['qg-stem-read'],
      summary: [
        'Stem = every digit but the last; leaf = the last digit.',
        'List every stem in order — even empty ones — with the leaves in increasing order.',
        'Always include a key (7|7 = 77). A side-by-side stem plot shares one column of stems between two data sets.',
      ],
    },
    {
      id: 'u2-histograms', title: 'Bars That Touch', type: 'lesson', concepts: ['quant-graphs'], lessonSteps: [3, 7],
      intro: 'Today you\'ll trade individual values for intervals — dotplots, then histograms — and read counts and percents straight off the bars.',
      hook: {
        title: 'Thirty teams, one picture',
        body: 'Stem plots and dotplots show every value — fine for 30 payrolls, hopeless for 3,000. So the course switches to a **histogram**: the 2003 payrolls grouped into $20 million intervals, with **13 teams** in the tallest bar ($40–60 million) and a lone bar out at $140–160 million.',
        visual: HIST_2003,
      },
      generators: ['qg-hist-read', 'qg-which-display'],
    },
    {
      id: 'u2-stems-lab', title: 'Two Seasons, One Stem', type: 'graph-lab', concepts: ['quant-graphs'],
      intro: 'Today you\'ll build the 2003 payroll stem plot value by value, set it beside 2002 — the side-by-side view the course uses for Moneyball — and see what a stem plot keeps that a histogram hides.',
      predict: {
        prompt: 'In the 2003 payroll stem plot (stems in tens of millions), which stem do you expect to hold the **most** leaves?',
        input: { type: 'mc', options: [
          { id: 'a', text: 'The 5 stem ($50–59 million)', correct: true, why: 'Seven teams: 50, 51, 51, 52, 55, 56, 59.' },
          { id: 'b', text: 'The 4 stem ($40–49 million)', why: 'Close — six teams (41, 41, 48, 49, 49, 49), one fewer than the 5 stem.' },
          { id: 'c', text: 'The 15 stem, because the biggest payroll stands out', why: 'Standing out is not the same as holding many values — the 15 stem has a single leaf.' },
        ] },
        reveal: 'The 5 stem wins with **7** leaves and the 4 stem is right behind with **6**: 13 of the 30 teams spent between $40M and $59M. The lone leaf on the 15 stem is the one payroll that stands apart from the pack.',
      },
      widget: {
        id: 'stemleaf', props: { dataset: 'payroll-2003' },
        mission: 'Press **Place next value** a few times to watch leaves drop onto their stems, then **Place all**. Find the lonely leaf far below the rest (15|3 = $153 million) and count the empty stems above it. Then switch the dataset to **MLB payroll 2002** and compare: where does each season pile up, and does 2002 have a value that far from the pack?',
        takeaway: 'Both seasons pile up on the 4 and 5 stems ($40–59 million) and thin out toward high payrolls — the shape shows up sideways. In 2003 the $153M payroll sits three empty stems past the next-highest ($117M), the kind of gap that makes you suspect an outlier; 2002\'s top payroll ($126M) is only one empty stem past $108M. Unlike a histogram bar, the stem plot still tells you the exact value: 15|3 = $153 million.',
      },
      generators: ['qg-stem-read', 'qg-hist-read', 'qg-claim'],
    },
    {
      id: 'u2-center-1', title: 'Finding the Center', type: 'lesson', concepts: ['center'], lessonSteps: [0, 5],
      intro: 'Today you\'ll compute the mean and the median, then drag a data point to see which of the two an extreme value can push around.',
      npc: { npc: 'quill', text: 'Two players can share an average and still be nothing alike. The question is the *typical* game — and the mean does not always answer it.' },
      generators: ['ce-mean', 'ce-median', 'ce-resistant'],
      summary: [
        'Mean = sum ÷ count ($\\bar{x}$ for a sample, μ for a population).',
        'Median (MD) = the middle of the **sorted** data.',
        'One extreme value drags the mean; the median barely moves — it is **resistant**.',
      ],
    },
    {
      id: 'u2-center-exp', title: 'The Big Spender\'s Pull', type: 'experiment', concepts: ['center', 'quant-graphs'],
      intro: 'Today you\'ll experiment on the 2003 payrolls: shrink, stretch, and remove the biggest spender, and measure exactly how far it drags the mean — and the median.',
      predict: {
        prompt: 'The 2003 payrolls have mean $71.067M and median $69M. If the top payroll were cut from $153M to $117M (tying the next-highest team), what would happen to the **median**?',
        input: { type: 'mc', options: [
          { id: 'a', text: 'It stays at $69M', correct: true, why: 'The median depends only on the middle of the sorted list — the top value is still at the top.' },
          { id: 'b', text: 'It drops by about $1.2M, just like the mean', why: 'That is what happens to the mean: (153 − 117)/30 = 1.2. The median only cares about order.' },
          { id: 'c', text: 'It drops by $36M', why: 'Only one of 30 values changed, and it was not one of the middle values.' },
        ] },
        reveal: 'The median stays at **$69M**, while the mean falls from $71.067M to about **$69.867M**. That one big payroll was adding $1.2 million to the "average" team all by itself.',
      },
      widget: {
        id: 'drag-mean', props: { data: PAYROLL_2003, label: '2003 MLB payroll ($ millions)' },
        mission: 'Find the far-right dot (the $153M payroll) and drag it left to about 117, watching both markers. Drag it out past 250 and watch again. Then press **Reset**, press **− Remove point** once (it drops the $153M team) and compare the mean and median with the originals.',
        takeaway: 'Cutting the top payroll from $153M to $117M lowers the mean by exactly 36/30 = $1.2M and leaves the median at $69M. Removing the team entirely drops the mean to about $68.24M and the median to $67M — the median moved only because n changed and the middle position shifted. The mean chases extreme values; the median is **resistant**.',
      },
      generators: ['ce-resistant', 'ce-best', 'ce-mean', 'qg-claim', 'qg-hist-read'],
    },
    {
      id: 'u2-center-2', title: 'Center from a Histogram', type: 'lesson', concepts: ['center'], lessonSteps: [6, 9],
      intro: 'Today you\'ll estimate a mean and median when all you have is a histogram, find a median when n is even, and decide when the median should be reported instead of the mean.',
      hook: {
        title: '111 shoppers, no raw data',
        body: 'A t-shirt store asked **111 shoppers** how many shirts costing more than $19 each they own — but published only a histogram (1 to 6 shirts). Can you still estimate the typical number of shirts?',
      },
      generators: ['ce-grouped', 'ce-median', 'ce-best'],
    },
    {
      id: 'u2-center-precision', title: 'Sort Before You Split', type: 'precision', concepts: ['center'],
      intro: 'Today you\'ll hunt down the classic center mistakes: medians from unsorted lists, even-n medians, and trusting the mean on skewed data.',
      npc: { npc: 'vera', text: 'A number can look precise and still be wrong. Before you trust any median, ask one question: was the list sorted first?' },
      hook: {
        title: 'The careless median',
        body: 'A classmate finds the median of the McDonald\'s fat data — 27, 11, 22, 21, 40, 8, 17, 15, 29, 31, 27, 26 grams — by averaging the two middle numbers *as listed*: (8 + 17)/2 = **12.5 g**. Sorted, the middle two are 22 and 26, so the median is really **24 g**.',
      },
      generators: ['ce-median', 'ce-resistant', 'ce-best', 'ce-mean'],
      summary: [
        'Sort first — the median is the middle of the **sorted** list.',
        'Even n: average the two middle values.',
        'The mean is pulled by outliers and long tails; the median is resistant.',
        'Skewed data or outliers → report the median as the typical value.',
      ],
    },
    {
      id: 'u2-mixed-1', title: 'The Payroll Crossroads', type: 'mixed', concepts: ['quant-graphs', 'center'],
      intro: 'Today you\'ll switch back and forth between reading displays and measuring center — the same moves every Moneyball question demands — before the first guardian blocks the road.',
      hook: {
        title: 'Two seasons in summary',
        body: '- **2002**: n = 30, μ = $67.433M, MD = $61M, from $34M to $126M\n- **2003**: n = 30, μ = $71.067M, MD = $69M, from $20M to $153M\n\nIn both seasons the mean sits above the median. Graphs show you *why*; the measures of center tell you *how much*.',
      },
      generators: ['qg-hist-read', 'qg-stem-read', 'qg-claim', 'ce-best', 'ce-grouped', 'ce-resistant'],
    },

    /* ---------- 2.4, 2.6 Shape, position, and boxplots ---------- */
    {
      id: 'u2-shape', title: 'Which Way the Tail Points', type: 'lesson', concepts: ['shape'], lessonSteps: [0, 7],
      intro: 'Today you\'ll name the five shapes — symmetric, skewed right, skewed left, uniform, bimodal — and read skew from nothing but the mean and median.',
      generators: ['sh-identify', 'sh-mean-median', 'sh-order'],
    },
    {
      id: 'u2-shape-lab', title: 'Reading Real Skew', type: 'graph-lab', concepts: ['shape', 'center'],
      intro: 'Today you\'ll put the shape rules to work on real course data — chip bags, heart rates, and payrolls — and check whether the mean really follows the tail.',
      npc: { npc: 'juno', text: 'Shapes are named for the tail, not the peak. Find the stragglers first, then look where the mean went.' },
      predict: {
        prompt: 'Chip bags: x̄ = 42.571% air and MD = 45.5%. Before you look at the histogram, which way is the long tail?',
        input: { type: 'mc', options: [
          { id: 'a', text: 'To the left — a few bags with very little air', correct: true, why: 'Mean < median means low values are dragging the mean down.' },
          { id: 'b', text: 'To the right — a few bags with lots of air', why: 'A right tail would pull the mean **above** the median.', misconception: 'mean-median-skew' },
          { id: 'c', text: 'No tail — the distribution is symmetric', why: 'The mean sits almost 3 points below the median, which signals a low tail.' },
        ] },
        reveal: 'Mean < median → **skewed left**. The histogram confirms it: Fritos (19%) and Pringles (28%) trail off to the left, while 10 of the 14 bags sit between 39% and 50%.',
      },
      widget: {
        id: 'histogram-builder', props: { dataset: 'chips' },
        mission: 'Start with **Air in chip bags**: are the stragglers on the low side or the high side, and where does the dashed mean sit compared with the median? Then switch to **Heart rate — pet** and **MLB payroll 2003** and repeat. For each data set, name the shape and say which way the mean was pulled.',
        takeaway: 'Chips: a low tail pulls the mean (42.57) below the median (45.5) → skewed left. Pet heart rates: the 97.5 bpm value pulls the mean (73.49) above the median (70.1) → skewed right. 2003 payrolls: the $153M team stretches a right tail, so the mean ($71.07M) is above the median ($69M). The mean follows the tail.',
      },
      generators: ['sh-identify', 'sh-context', 'sh-mean-median', 'ce-best'],
    },
    {
      id: 'u2-position', title: 'Percentiles at the Speed Trap', type: 'lesson', concepts: ['position'], lessonSteps: [0, 7],
      intro: 'Today you\'ll describe where a value stands — percentiles, quartiles, and the five-number summary — finding the quartiles by hand with the same method Stapplet uses.',
      generators: ['po-percentile', 'po-quartile', 'po-interpret'],
    },
    {
      id: 'u2-position-practice', title: 'Ranking the States', type: 'practice', concepts: ['position', 'center'],
      intro: 'Today you\'ll compute positions in real course data — percentiles, quartiles, and five-number summaries — and connect the median to the 50th percentile.',
      hook: {
        title: 'Seats in the House',
        body: 'House representatives per state (2019): n = 50, min 1, Q1 = 3, median 6, Q3 = 10, max 53. Maryland has 8 representatives and **29 states have fewer**, so Maryland sits at the **58th percentile** — above the median, below Q3.',
      },
      generators: ['po-percentile', 'po-quartile', 'po-five', 'po-interpret', 'ce-median', 'ce-best'],
    },
    {
      id: 'u2-boxplots', title: 'Anatomy of a Boxplot', type: 'lesson', concepts: ['boxplots'], lessonSteps: [0, 6],
      intro: 'Today you\'ll turn a five-number summary into a boxplot and read comparative boxplots of hurricane deaths — including what a long whisker does (and doesn\'t) mean.',
      npc: { npc: 'vera', text: 'A headline says female-named hurricanes are deadlier. Before you believe it, check which measure of center the claim is built on.' },
      generators: ['bx-parts', 'bx-percent', 'bx-compare'],
    },
    {
      id: 'u2-boxplot-lab', title: 'Building the Juice Box', type: 'graph-lab', concepts: ['boxplots', 'position'],
      intro: 'Today you\'ll build a boxplot of Baltimore orange-juice prices one step at a time and watch a modified boxplot pull the $5.99 carton out as a dot.',
      predict: {
        prompt: 'OJ prices (18 cartons): Q1 = $3.59, Q3 = $4.29, max = $5.99. In a **modified** boxplot, will the $5.99 carton be drawn as a separate dot?',
        input: { type: 'mc', options: [
          { id: 'a', text: 'Yes — it is beyond the upper fence of $5.34', correct: true, why: 'IQR = 0.70, 1.5 × 0.70 = 1.05, and 4.29 + 1.05 = 5.34 < 5.99.' },
          { id: 'b', text: 'No — the whisker always runs to the maximum', why: 'That is a standard boxplot. A modified boxplot stops the whisker at the last non-outlier and plots outliers as dots.' },
          { id: 'c', text: 'Yes — any value more than $1 above Q3 is an outlier', why: 'The cutoff is 1.5 × IQR above Q3 ($1.05 here), not a fixed dollar amount.' },
        ] },
        reveal: 'Upper fence = 4.29 + 1.5(0.70) = **$5.34**, so $5.99 is an outlier: the modified boxplot shows it as a dot and ends the whisker at $4.89, the highest regular price.',
      },
      widget: {
        id: 'boxplot-builder', props: { dataset: 'oj' },
        mission: 'Step through all six stages for **Orange juice prices** and write down the five-number summary as it appears. At the last step, toggle **Modified boxplot** off and on: where does the right whisker end each time? Then switch to **Paint Brand A** and **Paint Brand B** (switching starts the steps over — step through to the boxplot again) and compare the widths of their boxes.',
        takeaway: 'OJ: 2.99, 3.59, 3.985, 4.29, 5.99, with fences at $2.54 and $5.34 — so $5.99 becomes a dot and the whisker stops at $4.89. Paint A\'s box (15 to 55 months) is four times as wide as Paint B\'s (30 to 40): the same median of 35 months, far more spread.',
      },
      generators: ['bx-percent', 'bx-compare', 'bx-parts', 'po-five', 'po-quartile'],
    },
    {
      id: 'u2-boxplot-precision', title: 'Long Whiskers Lie', type: 'precision', concepts: ['boxplots', 'shape'],
      intro: 'Today you\'ll defeat the boxplot traps: longer sections don\'t hold more data, boxplots hide the sample size, and skew is named for the long side.',
      hook: {
        title: 'Bubbles and glycerin',
        body: 'A bubble company compared average bubble diameters (cm):\n\n- Control: 2.5, 4.5, 7, 10, 12.5\n- Glycerin: 4, 6, 8.5, 10.5, 16\n\nThe glycerin boxplot has a long right whisker (10.5 → 16). Does that whisker hold more bubbles than the rest of the plot?',
        visual: { type: 'boxplot', xLabel: 'Average bubble diameter (cm)', groups: [{ label: 'Control', min: 2.5, q1: 4.5, median: 7, q3: 10, max: 12.5 }, { label: 'Glycerin', min: 4, q1: 6, median: 8.5, q3: 10.5, max: 16 }] },
      },
      generators: ['bx-misconception', 'bx-percent', 'bx-compare', 'sh-context', 'sh-mean-median'],
      recall: [{ prompt: 'About what percent of the data does each of the four sections of a boxplot hold?', answer: 'About 25% each — so a longer section means more spread, not more data.' }],
      summary: [
        'Every section — whisker, half-box, half-box, whisker — holds about 25% of the data.',
        'A longer section means more spread, not more values.',
        'Boxplots do not show the sample size.',
        'A long right whisker (glycerin: 10.5 → 16 cm) suggests right skew.',
      ],
    },
    {
      id: 'u2-review-1', title: 'The Quartile Lookout', type: 'review', concepts: ['shape', 'position', 'boxplots', 'center'],
      intro: 'Today you\'ll review the first half of the Highlands — center, shape, position, and boxplots — in one cumulative climb before the second guardian.',
      hook: {
        title: 'Three professors',
        body: 'Three engineering professors gave the same exam: Gamma (μ = 67.3, MD = 72), Delta (μ = 75.7, MD = 68), Epsilon (μ = 66.8, MD = 67). From two numbers each you can already tell the shape, the better measure of center, and where outliers might hide.',
      },
      generators: ['sh-mean-median', 'sh-context', 'sh-order', 'po-quartile', 'po-interpret', 'po-percentile', 'bx-compare', 'bx-percent', 'bx-misconception', 'ce-best', 'ce-resistant'],
    },

    /* ---------- 2.7 Measures of spread ---------- */
    {
      id: 'u2-range-iqr', title: 'Roof Minus Floor', type: 'lesson', concepts: ['range-iqr'], lessonSteps: [0, 6],
      intro: 'Today you\'ll measure spread two quick ways — the range and the interquartile range — and see why only one of them shrugs off outliers.',
      npc: { npc: 'quill', text: 'Two paints can last 35 months on average and still be very different gambles. Center is half the story; spread is the other half.' },
      generators: ['ri-compute', 'ri-terms', 'ri-resistant'],
    },
    {
      id: 'u2-range-practice', title: 'The Middle Fifty', type: 'practice', concepts: ['range-iqr', 'position'],
      intro: 'Today you\'ll compute and interpret ranges and IQRs — finding the quartiles yourself — for chip bags, juice prices, and bank branches, always in context and with units.',
      hook: {
        title: 'Chips: 40 points or 10?',
        body: 'The 14 chip bags run from 19% air (Fritos) to 59% (Cheetos): **range = 40**. But Q1 = 39 and Q3 = 49, so **IQR = 10** — the middle 50% of bags are within 10 percentage points of each other. Which number better describes the spread of a *typical* bag?',
      },
      generators: ['ri-compute', 'ri-branches', 'ri-resistant', 'po-quartile'],
    },
    {
      id: 'u2-sd-1', title: 'Who Is More Consistent?', type: 'lesson', concepts: ['std-dev'], lessonSteps: [0, 3],
      intro: 'Today you\'ll discover why "average distance from the mean" needs squaring, and meet the variance and the standard deviation.',
      generators: ['sd-compare', 'sd-interpret'],
      summary: [
        'Deviations from the mean always add to 0, so we square them.',
        'Variance = the average **squared** distance from the mean (a sample divides by n − 1).',
        'Standard deviation $s = \\sqrt{s^2}$ — back in the original units.',
      ],
    },
    {
      id: 'u2-sd-2', title: 'Square, Sum, Divide, Root', type: 'lesson', concepts: ['std-dev'], lessonSteps: [4, 9],
      intro: 'Today you\'ll compute a sample standard deviation by table — Paint Brand A, step by step — and interpret it in context.',
      hook: {
        title: 'Back to the paint lab',
        body: 'Brand A (10, 60, 55, 22, 48, 15 months) and Brand B (35, 45, 30, 35, 40, 25 months) both average **35 months**. The range already said Brand A is more spread out. Now put an exact number on each brand\'s typical distance from 35.',
      },
      generators: ['sd-compute', 'sd-interpret'],
    },
    {
      id: 'u2-sd-exp', title: 'Stretch the Spread', type: 'experiment', concepts: ['std-dev', 'range-iqr'],
      intro: 'Today you\'ll stretch and squeeze Player B\'s games around their mean and watch how the deviations, their squares, and the standard deviation respond.',
      predict: {
        prompt: 'Player B\'s scores (5, 35, 8, 40, 12) have a mean of 20 and s ≈ 16.26 points. If every game moved only **half as far** from 20, what would the standard deviation become?',
        input: { type: 'mc', options: [
          { id: 'a', text: 'About 8.13 — half as big', correct: true, why: 'Every distance from the mean is halved, so the typical distance is halved.' },
          { id: 'b', text: 'About 4.07 — a quarter as big', why: 'That is what happens to the **variance** (½ squared = ¼). The SD is its square root, so it halves.', misconception: 'sd-no-sqrt' },
          { id: 'c', text: 'Still about 16.26 — the mean is still 20', why: 'The center did not move, but every distance from it shrank — and spread is about distance.' },
        ] },
        reveal: 'Halving every distance halves the SD (16.26 → **8.13**) and cuts the variance to a quarter (264.5 → 66.1). The mean never moves — center and spread are separate ideas.',
      },
      widget: {
        id: 'spread', props: { data: [5, 35, 8, 40, 12], compare: [19, 20, 21, 20, 20] },
        mission: 'Slide **Spread Player B\'s games** to ×0.5 and read B\'s SD. Then try ×0 (every game exactly 20) and ×1.6. Keep an eye on **Σ deviations** the whole time. Finally tick **Square the deviations** and watch the squares grow and shrink as you slide.',
        takeaway: 'B\'s SD scales with the slider: ×0.5 → 8.13, ×0 → 0, ×1.6 → about 26.02. Σ deviations stays at 0 no matter what — that is exactly why we square before averaging. An SD of 0 means every value equals the mean.',
      },
      generators: ['sd-compare', 'sd-compute', 'sd-decide', 'ri-branches', 'ri-compute'],
    },
    {
      id: 'u2-sd-teach', title: 'Explain the Spread', type: 'teach', concepts: ['std-dev'],
      intro: 'Today you\'ll teach the standard deviation in your own words: what it measures, how it is built, and why we square and then take the square root.',
      hook: {
        title: 'A friend asks',
        body: 'Your friend sees "s = $0.68" on the orange-juice summary and asks: *"So every carton is exactly 68 cents away from the average price?"* Explain what the number really means — and how it was computed.',
      },
      recall: [{ prompt: 'Paint Brand A has s ≈ 21.85 months and Brand B has s ≈ 7.07 months, and both average 35 months. Which brand is more consistent, and what does its SD mean?', answer: 'Brand B. On average, a can of Brand B lasts about 7.07 months away from the 35-month mean — its fading times cluster much more tightly than Brand A\'s.' }],
    },
    {
      id: 'u2-recall', title: 'Thorne\'s Formula Vault', type: 'recall', concepts: ['std-dev', 'range-iqr', 'position'],
      intro: 'Today you\'ll pull the spread formulas from memory — range, IQR, variance, standard deviation — along with the quartile method that feeds them.',
      npc: { npc: 'thorne', text: 'Write it before you look it up. Retrieval today is what keeps these formulas yours on exam day.' },
      recall: [
        { prompt: 'Write the formulas for the range and the IQR, and say which one is resistant to outliers.', answer: 'Range = max − min; IQR = Q3 − Q1. The IQR is resistant; the range is not.' },
        { prompt: 'Write the sample variance and standard deviation formulas. Why divide by $n - 1$?', answer: '$s^2 = \\frac{\\sum (x - \\bar{x})^2}{n - 1}$ and $s = \\sqrt{s^2}$. Dividing by n − 1 corrects for a sample\'s tendency to underestimate the population\'s spread.' },
        { prompt: 'Brand B paint lasts 25, 30, 35, 35, 40, 45 months. Find Q1, Q3, and the IQR without a calculator.', answer: 'Lower half 25, 30, 35 → Q1 = 30; upper half 35, 40, 45 → Q3 = 40; IQR = 10 months.' },
      ],
      generators: ['sd-interpret', 'sd-compare', 'ri-resistant', 'ri-compute'],
    },
    {
      id: 'u2-mixed-2', title: 'Spread Showdown', type: 'mixed', concepts: ['range-iqr', 'std-dev', 'boxplots', 'shape'],
      intro: 'Today you\'ll choose and compute the right measure of spread — range, IQR, or standard deviation — for data with different shapes, right before the third guardian.',
      hook: {
        title: 'Which spread fits?',
        body: 'Orange-juice prices: s = $0.68, IQR = $0.70, range = $3 — and a single $5.99 carton creates a right skew. The course\'s verdict: with a high outlier present, the **IQR** is the better description of typical variation.',
      },
      generators: ['ri-compute', 'ri-branches', 'ri-resistant', 'sd-interpret', 'sd-decide', 'sd-compare', 'bx-compare', 'sh-context'],
    },
    {
      id: 'u2-outliers-1', title: 'Fences for the Big Tasty', type: 'lesson', concepts: ['outliers'], lessonSteps: [0, 3],
      intro: 'Today you\'ll learn the course\'s two outlier rules — the 1.5 × IQR fences and the 2 SD rule — and put the 54-gram Big Tasty on trial.',
      npc: { npc: 'vera', text: '"Outlier" is a verdict, not a feeling. Show the fence, show the value, then decide.' },
      generators: ['ol-fence', 'ol-2sd', 'ol-terms'],
      summary: [
        '1.5 × IQR rule: outliers fall below Q1 − 1.5·IQR or above Q3 + 1.5·IQR.',
        '2 SD rule: typical values lie within $\\bar{x} \\pm 2s$.',
        'The Big Tasty (54 g) is beyond both the upper fence (46 g) and the 2 SD bound (about 40.96 g).',
      ],
    },
    {
      id: 'u2-outliers-2', title: 'What an Outlier Distorts', type: 'lesson', concepts: ['outliers'], lessonSteps: [4, 8],
      intro: 'Today you\'ll drag an outlier around to see which statistics it distorts, then meet a case where the two outlier rules disagree.',
      hook: {
        title: 'Fritos on trial',
        body: 'The 14 chip bags: Q1 = 39, Q3 = 49, x̄ = 42.571, s = 10.181. The fences are 24 and 64; the 2 SD band runs from 22.209 to 62.933. Fritos, at 19% air, falls outside **both**. But what happens to each statistic when an outlier is added or removed?',
      },
      generators: ['ol-which', 'ol-effect', 'ol-fence'],
    },
    {
      id: 'u2-outliers-precision', title: 'Q1 Down, Q3 Up', type: 'precision', concepts: ['outliers', 'range-iqr'],
      intro: 'Today you\'ll defeat the fence mistakes — the wrong quartile, the forgotten 1.5 — and stop trusting the mean and SD when an outlier is in the data.',
      hook: {
        title: 'Juice on trial',
        body: 'OJ prices: Q1 = $3.59 and Q3 = $4.29, so IQR = $0.70 and 1.5 × IQR = $1.05. Correct fences: **$2.54** and **$5.34**, so only the $5.99 carton is an outlier. A common slip builds both fences from Q3 ($3.24 and $5.34), which would wrongly flag the $2.99 and $3.19 cartons too.',
      },
      generators: ['ol-fence', 'ol-which', 'ol-effect', 'ol-2sd', 'ri-resistant'],
      recall: [{ prompt: 'State both outlier rules from memory. Which quartile does each fence start from?', answer: 'Lower fence = Q1 − 1.5·IQR; upper fence = Q3 + 1.5·IQR. 2 SD rule: values outside x̄ ± 2s are outliers.' }],
      summary: [
        'Lower fence starts at **Q1**, upper fence at **Q3** — 1.5 × IQR in each direction.',
        'The mean, SD, and range are not resistant; the median and IQR are.',
        'The two rules can disagree — always say which rule you used.',
      ],
    },
    {
      id: 'u2-zscore', title: 'The SD Ruler', type: 'lesson', concepts: ['z-score'], lessonSteps: [0, 6],
      intro: 'Today you\'ll measure distance from the mean in standard deviations — the tool that lets you compare Maryland\'s representatives with its counties.',
      npc: { npc: 'quill', text: 'Raw distances mislead when spreads differ. Measure in standard deviations and every distribution speaks the same language.' },
      generators: ['z-compute', 'z-interpret'],
    },
    {
      id: 'u2-zscore-practice', title: 'Equally Unusual', type: 'practice', concepts: ['z-score', 'outliers'],
      intro: 'Today you\'ll standardize values from different distributions, decide which ones are truly unusual, and connect the SD ruler to the 2 SD outlier rule.',
      hook: {
        title: 'Oakland, measured in SDs',
        body: 'Moneyball\'s Oakland A\'s spent $40M in 2002 (mean $67.433M, SD $24.804M) and, after a $10M raise, $50M in 2003 (mean $71.067M, SD $27.903M). (SDs as Stapplet reports them.)\n\n- 2002: (40 − 67.433)/24.804 ≈ **−1.11** SDs\n- 2003: (50 − 71.067)/27.903 ≈ **−0.76** SDs\n\nStill below average both years — but the raise moved Oakland closer to the league\'s center, measured on the SD ruler.',
      },
      generators: ['z-compute', 'z-compare', 'z-interpret', 'ol-2sd', 'ol-which'],
    },

    /* ---------- 2.8 Comparing distributions ---------- */
    {
      id: 'u2-compare', title: 'Does a Dog Lower Your Heart Rate?', type: 'lesson', concepts: ['compare'], lessonSteps: [0, 7],
      intro: 'Today you\'ll write a complete comparison of distributions — center, shape, spread, and outliers, in context — and state how far the conclusion can reach.',
      generators: ['cp-measures', 'cp-interpret', 'cp-scope'],
    },
    {
      id: 'u2-compare-challenge', title: 'The Cheese Verdict', type: 'challenge', concepts: ['compare', 'boxplots'],
      intro: 'Today you\'ll take on exam-level comparisons with no scaffolding: choose the measures, compare like with like, and write the conclusion in context.',
      hook: {
        title: 'Processed vs. unprocessed cheese',
        body: 'Sodium content (mg per 100 g), Exam #1 Review #8:\n\n- **Processed**: min 50, Q1 = 235, median 610, Q3 = 915, max 1200; x̄ = 598.077, s = 360.68 — approximately symmetric\n- **Unprocessed**: min 10, Q1 = 142.5, median 290, Q3 = 352.5, max 380; x̄ = 242.692, s = 121.323 — roughly skewed left\n\nNeither set has outliers. Which cheese has more sodium, and which is more consistent?',
        visual: { type: 'boxplot', xLabel: 'Sodium (mg per 100 g)', groups: [{ label: 'Processed', min: 50, q1: 235, median: 610, q3: 915, max: 1200 }, { label: 'Unprocessed', min: 10, q1: 142.5, median: 290, q3: 352.5, max: 380 }] },
      },
      generators: ['cp-interpret', 'cp-scope', 'cp-frq', 'bx-compare', 'bx-hurricanes'],
      summary: [
        'Choose measures by shape: if either group is skewed or has outliers, use medians and IQRs for **both**.',
        'Processed cheese: median 610 vs. 290 mg — more sodium; IQR 680 vs. 210 mg — far less consistent.',
        'Write every comparison in context, with units.',
      ],
    },
    {
      id: 'u2-review-final', title: 'The Highlands Summit', type: 'review', concepts: ['compare', 'outliers', 'z-score', 'std-dev', 'center', 'shape'],
      intro: 'Today you\'ll climb the last ridge: a cumulative review of every Highlands skill, from medians to fences to full comparisons, before you face the Skew Wyrm.',
      npc: { npc: 'quill', text: 'The Wyrm will ask for shape, center, spread, and outliers — in context, every time. Make each answer a sentence about the data, not just a number.' },
      hook: {
        title: 'The Wyrm\'s lair',
        body: 'Ahead, the Skew Wyrm guards the 2002 and 2003 payroll ledgers: medians $61M and $69M, IQRs $35M and $33M, and one 2003 payroll out at $153M. Every skill from the Highlands will be tested on them.',
      },
      generators: ['cp-measures', 'cp-interpret', 'ol-which', 'ol-effect', 'z-compare', 'z-interpret', 'sd-interpret', 'sd-decide', 'ce-best', 'ce-grouped', 'sh-context'],
    },
  ],

  encounters: [
    {
      id: 'u2-enc-shrine', kind: 'shrine', afterLevel: 'u2-center-precision', title: 'Shrine of the Middle Value', concepts: ['center'],
      question: {
        prompt: '2002 payrolls: μ = $67.433M and MD = $61M, ranging from $34M to $126M. A sportswriter says "the typical team spent about $67 million." What is the best response?',
        input: { type: 'mc', options: [
          { id: 'a', text: 'The median ($61M) is more typical — a handful of big payrolls pull the mean up', correct: true, why: 'Mean > median signals right skew, and the resistant median describes the typical team better.' },
          { id: 'b', text: 'The mean is always the typical value — that is what "average" means', why: 'The mean is a good "typical value" only for roughly symmetric data.', misconception: 'wrong-measure-skew' },
          { id: 'c', text: 'Use the midrange: (34 + 126)/2 = $80M', why: 'The midrange uses only the two extremes, so it is even further from a typical payroll.' },
        ] },
        explain: 'Mean > median → skewed right. The few big spenders drag the mean upward, so the median ($61M) is the better description of a typical 2002 payroll.',
      },
    },
    {
      id: 'u2-enc-formula', kind: 'lost-formula', afterLevel: 'u2-sd-2', title: 'The Torn Variance Page', concepts: ['std-dev'], formula: 'variance',
      npc: { npc: 'thorne', text: 'Every symbol earns its place: the square, the sum, the n − 1. Restore them all.' },
    },
    {
      id: 'u2-enc-lab', kind: 'lab', afterLevel: 'u2-outliers-2', title: 'The Helium Chips Field Lab', concepts: ['outliers', 'center'],
      widget: {
        id: 'outliers', props: { dataset: 'chips' },
        mission: 'The orange point is a new bag added to the 14 chip brands. Drag it to about 78% air — the course\'s "Helium Chips" — and read the table: how far do the mean and median move? Is 78 beyond the fences? Then drag it below 20% and see which statistics react.',
        takeaway: 'With Helium Chips at 78%, the mean rises from 42.57 to 44.93 but the median only from 45.5 to 46; the range jumps from 40 to 59 while the IQR moves from 10 to 11. The upper fence becomes 66.5, so 78% is an outlier — and the resistant measures barely notice it.',
      },
    },
    {
      id: 'u2-enc-scholar', kind: 'scholar', afterLevel: 'u2-compare', title: 'The Scholar of Like with Like', concepts: ['compare'],
      question: {
        prompt: 'A student writes: "The pet group\'s median heart rate (70.1 bpm) is lower than the alone group\'s mean (82.52 bpm), so pets lower heart rate." What is the main problem with this comparison?',
        input: { type: 'mc', options: [
          { id: 'a', text: 'It compares a median to a mean — compare medians to medians (70.1 vs. 84.7 bpm)', correct: true, why: 'Like with like. The alone group\'s median is 84.7 bpm, so the conclusion survives — but only a fair comparison earns it.' },
          { id: 'b', text: 'Nothing — both numbers are measures of center', why: 'Mixing a median with a mean is exactly the mix-and-match the course forbids.', misconception: 'mix-measures' },
          { id: 'c', text: 'It should compare the means, because the mean uses every value', why: 'The pet group is skewed right with a high outlier (97.5), so the resistant median is the right choice for all groups.', misconception: 'wrong-measure-skew' },
        ] },
        explain: 'Compare means to means and medians to medians. Because the pet group is skewed with an outlier, use medians for every group: 70.1 (pet) vs. 84.7 (alone) bpm.',
      },
    },
  ],

  boss: {
    id: 'boss-u2',
    story: 'It\'s 2003. A sports journalist asks you whether MLB payrolls changed from 2002 to 2003 — and whether the biggest spenders are outliers. You have all 30 payrolls for each year.\n\nCoiled around the ledgers is **the Skew Wyrm**, its tail stretched out to a single $153 million payroll. Describe both seasons honestly — shape, center, position, spread, and outliers — and its tail loses its power.',
    source: { pages: [57, 58, 54, 51, 52], section: 'Unit 2 — Moneyball payroll data (2.1–2.2, 2.4–2.7)' },
    phases: [
      {
        title: 'Phase 1 — Recognition', kind: 'recognition',
        intro: '"My tail reaches all the way to $153 million. Tell me which way I lean — if you can."',
        tasks: [
          {
            kind: 'step', visual: HIST_2003,
            context: 'The course\'s histogram of the 2003 payrolls (p. 58).',
            step: {
              concept: 'quant-graphs', dims: ['recognize', 'interpret'], label: 'Histogram',
              prompt: 'The Wyrm coils around the 2003 payroll histogram: $20 million bars holding 1, 13, 5, 5, 5, 0, and 1 teams from $20M up to $160M. Which reading of the graph is correct?',
              answer: { kind: 'mc', options: [
                { id: 'a', text: 'The tallest bar holds 13 of the 30 teams — about 43% spent $40M up to $60M', correct: true, why: 'Bar heights are counts: 13/30 ≈ 0.433, nearly half the league.' },
                { id: 'b', text: 'Most teams spent $100M or more, because the bars stretch out to $160M', why: 'Only 6 of the 30 teams (5 + 0 + 1) are at $100M or more. How far the axis reaches says nothing about where the data pile up.' },
                { id: 'c', text: 'The distribution is bimodal — the $140–160M bar is a second peak', why: 'That bar holds a single team. A lone bar after an empty gap marks a possible outlier, not a second peak.' },
              ] },
              explain: '13/30 ≈ **43.3%** of teams spent $40M up to $60M. From there the bars step down to the right, and one team sits alone at $140–160M — a long right tail.',
              hint: 'Bar heights are counts of teams. Percent = count ÷ 30.',
            },
          },
          { kind: 'boss-step', boss: 'boss-u2', index: 0 },
          { kind: 'boss-step', boss: 'boss-u2', index: 1 },
        ],
      },
      {
        title: 'Phase 2 — Calculation', kind: 'calculation',
        intro: '"Quartiles, fences, rulers… one slip and the numbers are mine."',
        tasks: [
          { kind: 'boss-step', boss: 'boss-u2', index: 2 },
          { kind: 'boss-step', boss: 'boss-u2', index: 3 },
          { kind: 'boss-step', boss: 'boss-u2', index: 4 },
          {
            kind: 'step',
            step: {
              concept: 'z-score', dims: ['calculate'], label: 'SD ruler',
              prompt: '2003 payrolls: mean $71.067M, standard deviation $27.903M (as Stapplet reports it). How many standard deviations above the mean is the $153M payroll?',
              answer: { kind: 'numeric', value: (153 - 71.067) / 27.903, tol: 0.01, wrong: [
                { value: (153 - 71.067) / 27.903 ** 2, tol: 0.005, misconception: 'z-divide-variance', why: 'Divide by the standard deviation (27.903), not the variance.' },
                { value: 153 - 71.067, tol: 0.01, why: 'That is the distance in millions of dollars. Divide it by the SD to measure it in standard deviations.' },
              ] },
              explain: '(153 − 71.067)/27.903 = 81.933/27.903 ≈ **2.94** standard deviations above the mean — more than 2, so the 2 SD rule flags it as well.',
              hint: '(value − mean) ÷ standard deviation.',
            },
          },
        ],
      },
      {
        title: 'Phase 3 — Interpretation', kind: 'interpretation',
        intro: '"You have numbers. But do you know what they *mean*?"',
        tasks: [
          { kind: 'boss-step', boss: 'boss-u2', index: 5 },
          {
            kind: 'step',
            context: '2003 modified boxplot: min 20, Q1 = 50, median 69, Q3 = 83, whisker to 117, outlier at 153.',
            step: {
              concept: 'boxplots', dims: ['interpret'], label: 'Whisker',
              prompt: 'In the 2003 boxplot, the left half of the box (Q1 = 50 to the median, 69) spans $19M, while the right whisker (Q3 = 83 to 117, the largest non-outlier) spans $34M. What does the longer whisker tell you?',
              answer: { kind: 'mc', options: [
                { id: 'a', text: 'Those top payrolls are more spread out — each section still holds about 25% of the teams', correct: true, why: 'Quartiles split the teams into equal-count quarters; a section\'s length shows spread, not count.' },
                { id: 'b', text: 'More teams spent $83M–$117M than spent $50M–$69M', why: 'Each section holds about a quarter of the teams. Longer only means more spread out.', misconception: 'box-length-count' },
                { id: 'c', text: 'The whisker is longer because the 2003 data set is bigger', why: 'Boxplots do not show sample size — and both seasons have exactly 30 teams.', misconception: 'boxplot-sample-size' },
              ] },
              explain: 'A longer section means that quarter of the data is more spread out — not that it holds more data. The long upper whisker plus the $153M dot is the right skew, drawn.',
              hint: 'What percent of the data does each section of a boxplot hold?',
            },
          },
          {
            kind: 'step',
            step: {
              concept: 'std-dev', dims: ['interpret'], label: 'Meaning of SD',
              prompt: 'The standard deviation of the 2003 payrolls is about $27.90 million. Which interpretation is correct?',
              answer: { kind: 'mc', options: [
                { id: 'a', text: 'On average, a team\'s payroll is about $27.90 million away from the mean payroll of $71.067 million', correct: true, why: 'SD is the typical distance of a value from the mean, in the data\'s units.' },
                { id: 'b', text: 'Every team\'s payroll is within $27.90 million of the mean', why: 'SD is a typical distance, not a maximum — the $153M payroll is about $82M above the mean.', misconception: 'sd-meaning' },
                { id: 'c', text: 'The middle 50% of payrolls are within $27.90 million of each other', why: 'That sentence describes the IQR, which is $33M for 2003.', misconception: 'sd-meaning' },
              ] },
              explain: 'SD = typical distance from the mean: a 2003 payroll typically sits about $27.90M from the $71.067M mean.',
              hint: 'The SD answers one question: how far from the mean is a typical value?',
            },
          },
        ],
      },
      {
        title: 'Phase 4 — Application', kind: 'application',
        intro: '"New season, new rule, new team — does your method still hold?"',
        tasks: [
          {
            kind: 'step',
            step: {
              concept: 'outliers', dims: ['apply', 'calculate'], label: '2 SD rule',
              prompt: 'Switch rules. For 2002, the mean is $67.433M and the standard deviation is $24.804M. Under the **2 SD rule**, is 2002\'s top payroll of $126M an outlier? (Its 1.5 × IQR fence was 132.5, so that rule said no.)',
              answer: { kind: 'mc', options: [
                { id: 'a', text: 'Yes — 67.433 + 2(24.804) ≈ 117.04 and 126 is above it, so the two rules disagree', correct: true, why: '126 > 117.04. The IQR fence (132.5) is wider here, so only the 2 SD rule flags it.' },
                { id: 'b', text: 'No — the IQR fence is 132.5, so $126M cannot be an outlier under any rule', why: 'Each rule has its own cutoff. The 2 SD bound for 2002 is about $117.04M.' },
                { id: 'c', text: 'No — it is only about 2.36 SDs above the mean, and the rule needs 3', why: 'The course\'s rule flags values more than **2** SDs from the mean, and 2.36 > 2.' },
              ] },
              explain: '2 SD band: 67.433 ± 2(24.804) → 17.83 to 117.04. $126M is outside it even though it is inside the IQR fences. Like the medical-school GPAs, the rules can disagree — so always say which rule you used.',
              hint: 'Compute mean + 2·SD and compare it with 126.',
            },
          },
          {
            kind: 'step',
            step: {
              concept: 'position', dims: ['calculate', 'apply'], label: 'Oakland',
              prompt: 'Moneyball\'s Oakland A\'s raised their payroll by $10M, from $40M in 2002 to $50M in 2003. The lowest 2003 payrolls are 20, 41, 41, 48, 49, 49, 49, 50, 51, … Using the course definition (the percent of values that are **lower**), find Oakland\'s 2003 percentile among the 30 teams.',
              answer: { kind: 'numeric', value: (7 / 30) * 100, tol: 0.2, unit: 'th percentile', wrong: [{ value: (8 / 30) * 100, tol: 0.2, why: 'Count only payrolls strictly **less than** $50M — Oakland\'s own value is not below itself.' }] },
              explain: '7 of the 30 payrolls are lower → 7/30 ≈ **23.3rd percentile**. (In 2002, $40M beat only 2 teams — the 6.7th percentile.) Even after the raise, 22 of the 30 teams outspent Oakland.',
              hint: 'Percentile = (number of values below) ÷ n.',
            },
          },
        ],
      },
      {
        title: 'Final Phase — The Verdict', kind: 'final',
        intro: '"Two seasons, one verdict. Write it true — or be swept away by my tail."',
        tasks: [
          { kind: 'gen', concept: 'compare', level: 6, excludeTypes: ['free-response'] },
          { kind: 'boss-step', boss: 'boss-u2', index: 6 },
        ],
      },
    ],
  },
};
