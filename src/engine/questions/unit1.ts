import type { Generator } from '../types';
import { build, gen, mc, num, part, f, type Opt } from './helpers';
import { frequencyTable } from '../../lib/stats/descriptive';
import { DATASETS } from '../../content/datasets';
import type { Rng } from '../../lib/stats/random';

/* ---------------- Population / sample ---------------- */

interface Study { ctx: string; pop: string; sample: string; param: string; stat: string; variable: string; data: string; src?: number[] }
const STUDIES: Study[] = [
  { ctx: 'Ski resorts want to know the mean age at which children take their first ski lesson. They record the ages of 80 children taking a first lesson this winter.', pop: 'All children who take their first ski lesson at the resorts', sample: 'The 80 children whose ages were recorded', param: 'The mean age of all children taking their first lesson', stat: 'The mean age of the 80 recorded children', variable: 'Age of a child at their first ski lesson', data: 'The recorded ages, such as 5, 7, and 9 years', src: [66] },
  { ctx: 'Spirit Halloween wants the average amount spent by families visiting its stores. Employees record the amount spent by 150 selected families.', pop: 'All families visiting Spirit Halloween stores', sample: 'The 150 selected families', param: 'The average amount spent by all visiting families', stat: 'The average amount spent by the 150 selected families', variable: 'Amount spent by a family', data: 'The individual amounts spent, such as $42 and $87', src: [1] },
  { ctx: 'A marriage counselor wants the proportion of her clients who stay married. She reviews files for 60 of her clients.', pop: 'All of the counselor\'s clients', sample: 'The 60 clients whose files were reviewed', param: 'The proportion of all her clients who stay married', stat: 'The proportion of the 60 reviewed clients who stayed married', variable: 'Whether a client stays married', data: 'The yes/no results for each reviewed client', src: [66] },
  { ctx: 'A streaming service wants the mean hours per week its subscribers spend watching. It tracks 2,000 randomly chosen subscribers for one week.', pop: 'All subscribers of the streaming service', sample: 'The 2,000 tracked subscribers', param: 'The mean weekly viewing hours of all subscribers', stat: 'The mean weekly viewing hours of the 2,000 subscribers', variable: 'Hours a subscriber watches per week', data: 'The recorded hours, such as 6.5 and 14 hours' },
  { ctx: 'FCC\'s dining hall wants the proportion of students who eat breakfast on campus. It surveys 250 randomly selected students.', pop: 'All FCC students', sample: 'The 250 surveyed students', param: 'The proportion of all FCC students who eat breakfast on campus', stat: 'The proportion of the 250 surveyed students who eat breakfast on campus', variable: 'Whether a student eats breakfast on campus', data: 'Each student\'s yes/no answer' },
  { ctx: 'A gym chain wants the average number of workouts per week for its members. It checks the swipe records of 120 randomly chosen members.', pop: 'All members of the gym chain', sample: 'The 120 members whose records were checked', param: 'The average weekly workouts of all members', stat: 'The average weekly workouts of the 120 members', variable: 'Number of workouts a member does per week', data: 'The individual counts, such as 2, 3, and 5 workouts' },
  { ctx: 'Political pollsters want the proportion of Maryland voters who support a new ballot measure. They call 1,100 randomly selected registered voters.', pop: 'All Maryland registered voters', sample: 'The 1,100 voters who were called', param: 'The proportion of all Maryland voters who support the measure', stat: 'The proportion of the 1,100 called voters who support it', variable: 'Whether a voter supports the measure', data: 'Each voter\'s support/oppose answer', src: [66] },
];

const TERM_NAMES = ['population', 'sample', 'parameter', 'statistic', 'variable', 'data'] as const;
type Term = (typeof TERM_NAMES)[number];
const termMis: Record<Term, string> = { population: 'sample-is-population', sample: 'sample-is-population', parameter: 'param-vs-stat', statistic: 'param-vs-stat', variable: 'variable-vs-data', data: 'variable-vs-data' };

const popSample: Generator[] = [
  gen('ps-identify', 'pop-sample', 'Name the term', [1, 2, 3], 'recognition', (rng, level) => {
    const s = rng.pick(STUDIES);
    const term = rng.pick(TERM_NAMES);
    const desc: Record<Term, string> = { population: s.pop, sample: s.sample, parameter: s.param, statistic: s.stat, variable: s.variable, data: s.data };
    const opts: Opt[] = TERM_NAMES.map((t) => [t[0].toUpperCase() + t.slice(1), t === term, t === term ? 'Correct match.' : `That isn't it: "${desc[term]}" describes the ${term}.`, t === term ? undefined : termMis[term]]);
    return build({
      concept: 'pop-sample', level, type: 'recognition', context: s.ctx,
      prompt: `In this study, what is: **"${desc[term]}"**?`,
      answer: mc(rng, rng.sample(opts.filter((o) => !o[1]), 3).concat([opts.find((o) => o[1])!])),
      hints: ['Ask: is it a **group** (population/sample), a **number** (parameter/statistic), the **characteristic** (variable), or **recorded values** (data)?', 'Numbers about everyone → parameter; numbers from the people measured → statistic.'],
      solution: [`"${desc[term]}" is the **${term}**.`],
      takeaway: 'P↔P (parameter ↔ population), S↔S (statistic ↔ sample).',
      source: s.src ? { pages: s.src, section: '1.1–1.2 Practice' } : undefined,
    });
  }),
  gen('ps-param-stat', 'pop-sample', 'Parameter or statistic?', [2, 3, 4], 'conceptual', (rng, level) => {
    const census = rng.bool(0.3);
    const ctxs = [
      { who: 'adults', n: 1000, val: `$${rng.int(40, 95)}`, desc: 'average monthly spending on coffee' },
      { who: 'teens', n: 600, val: `${rng.int(3, 7)}.${rng.int(0, 9)} hours`, desc: 'mean daily screen time' },
      { who: 'nurses', n: 400, val: `${rng.int(55, 80)}%`, desc: 'percent who work night shifts' },
    ];
    const c = rng.pick(ctxs);
    const context = census
      ? `A company records the ${c.desc} for **every one** of its ${c.n} ${c.who} employees and finds ${c.val}.`
      : `A survey of ${c.n} randomly selected U.S. ${c.who} finds the ${c.desc} is ${c.val}.`;
    return build({
      concept: 'pop-sample', level, type: 'conceptual', context,
      prompt: `Is ${c.val} a parameter or a statistic?`,
      answer: mc(rng, [
        ['Parameter', census, census ? 'Every member of the population was measured, so this describes the population.' : 'It was computed from a sample, so it is a statistic.', census ? undefined : 'param-vs-stat'],
        ['Statistic', !census, !census ? 'It comes from a sample and estimates the population value.' : 'Everyone in the population (all employees) was measured, so it is a parameter.', !census ? undefined : 'param-vs-stat'],
      ], false),
      hints: ['Who was measured — a subset, or the entire group of interest?', 'If the entire population was measured, the number is a parameter.'],
      solution: [census ? 'All employees (the whole population) were measured → **parameter**.' : 'Only a sample was measured → **statistic**.'],
      takeaway: 'A census of the whole population produces parameters; samples produce statistics.',
    });
  }),
  gen('ps-six', 'pop-sample', 'Identify all six', [4, 5, 6], 'multi-step', (rng, level) => {
    const s = rng.pick(STUDIES);
    const ask = (term: Term, label: string) => {
      const desc: Record<Term, string> = { population: s.pop, sample: s.sample, parameter: s.param, statistic: s.stat, variable: s.variable, data: s.data };
      const others = rng.sample(TERM_NAMES.filter((t) => t !== term), 2);
      return part(label, `Which describes the **${term}**?`, mc(rng, [[desc[term], true, 'Correct.'], ...others.map((o): Opt => [desc[o], false, `That is the ${o}.`, termMis[term]])]), `${term[0].toUpperCase() + term.slice(1)}: ${desc[term]}.`);
    };
    const parts = [ask('population', 'Population'), ask('sample', 'Sample'), ask('parameter', 'Parameter'), ask('statistic', 'Statistic')];
    return build({
      concept: 'pop-sample', level, type: 'multi-step', context: s.ctx,
      prompt: 'Identify the population, sample, parameter, and statistic.',
      answer: parts[3].answer, parts,
      hints: ['Start with the group you want to know about (population).', 'The parameter and statistic are the same calculation on different groups.'],
      solution: [`Population: ${s.pop}.`, `Sample: ${s.sample}.`, `Parameter: ${s.param}.`, `Statistic: ${s.stat}.`, `Variable: ${s.variable}.`, `Data: ${s.data}.`],
      takeaway: 'Same calculation, two groups: parameter (population) vs. statistic (sample).',
      source: s.src ? { pages: s.src, section: '1.1–1.2 Practice / Exam #1 #1' } : undefined,
    });
  }, ['recognize', 'apply']),
];

/* ---------------- Data types ---------------- */

const VARS: [string, 'cat' | 'disc' | 'cont', string?][] = [
  ['Number of tickets sold to a concert', 'disc'], ['Percent of body fat', 'cont'], ['Favorite baseball team', 'cat'], ['Time in line to buy groceries', 'cont'],
  ['Number of students enrolled at a college', 'disc'], ['Most-watched television show', 'cat'], ['Brand of toothpaste', 'cat'], ['Distance to the closest movie theatre', 'cont'],
  ['Age of executives in Fortune 500 companies', 'cont'], ['Number of snow days in a school year', 'disc'], ['Zip code of a customer', 'cat', 'Zip codes are labels — averaging them is meaningless.'],
  ['Jersey number of a soccer player', 'cat', 'Jersey numbers are labels.'], ['Weight of a newborn baby', 'cont'], ['Number of Pirates of the Caribbean movies a student has seen', 'disc'],
  ['Eye color', 'cat'], ['Amount of air (%) in a bag of chips', 'cont'], ['Number of text messages sent today', 'disc'], ['Sodium content of a cheese (mg)', 'cont'],
  ['Type of phone (iPhone, Android, other)', 'cat'], ['Number of free throws made in 3 attempts', 'disc'], ['Heart rate during a stressful task (bpm)', 'cont'], ['Political party affiliation', 'cat'],
  ['Phone number', 'cat', 'Phone numbers identify people; arithmetic on them is meaningless.'], ['Number of hurricanes that hit Florida in a year', 'disc'], ['Length of a femur bone (cm)', 'cont'],
];
const TYPE_LABEL = { cat: 'Categorical (qualitative)', disc: 'Quantitative discrete', cont: 'Quantitative continuous' } as const;

const dataTypes: Generator[] = [
  gen('dt-classify', 'data-types', 'Classify a variable', [1, 2, 3], 'recognition', (rng, level) => {
    const [v, t, note] = rng.pick(VARS);
    return build({
      concept: 'data-types', level, type: 'recognition',
      prompt: `What type of data is: **${v}**?`,
      answer: mc(rng, (Object.keys(TYPE_LABEL) as (keyof typeof TYPE_LABEL)[]).map((k): Opt => [TYPE_LABEL[k], k === t,
        k === t ? (note ?? (t === 'disc' ? 'It is a count.' : t === 'cont' ? 'It is a measurement that can take any value in an interval.' : 'It is a label/group.')) :
          k === 'cat' ? 'Arithmetic on these values makes sense, so they are quantitative.' : t === 'cat' ? 'These values are labels, not counts or measurements.' : 'Counts are discrete; measurements are continuous.',
        k === t ? undefined : t === 'cat' ? 'numbers-are-quantitative' : 'discrete-vs-continuous']), false),
      hints: ['Label? Count? Or measurement?', '"Number of…" → discrete. Time, length, weight, percent, age → continuous.'],
      solution: [`${v}: **${TYPE_LABEL[t]}**. ${note ?? ''}`],
      takeaway: 'Count → discrete; measure → continuous; label → categorical.',
      source: { pages: [66, 1], section: '1.1–1.2 Practice #3 / Exam #1 #2' },
    });
  }),
  gen('dt-which', 'data-types', 'Pick the matching variable', [2, 3, 4], 'conceptual', (rng, level) => {
    const t = rng.pick(['cat', 'disc', 'cont'] as const);
    const correct = rng.pick(VARS.filter((v) => v[1] === t));
    const wrong = rng.sample(VARS.filter((v) => v[1] !== t), 3);
    return build({
      concept: 'data-types', level, type: 'conceptual',
      prompt: `Which variable is **${TYPE_LABEL[t].toLowerCase()}**?`,
      answer: mc(rng, [[correct[0], true, `Yes — ${TYPE_LABEL[t].toLowerCase()}.`], ...wrong.map((w): Opt => [w[0], false, `That one is ${TYPE_LABEL[w[1]].toLowerCase()}.`, w[1] === 'cat' || t === 'cat' ? 'numbers-are-quantitative' : 'discrete-vs-continuous'])]),
      hints: ['Classify each option: label, count, or measurement?'],
      solution: [`${correct[0]} is ${TYPE_LABEL[t].toLowerCase()}.`],
      takeaway: 'Classify before you calculate.',
    });
  }),
];

/* ---------------- Categorical displays ---------------- */

const catDisplays: Generator[] = [
  gen('cd-percent', 'cat-displays', 'Percent from a frequency table', [2, 3], 'calculation', (rng, level) => {
    const cats = rng.pick([['Spotify', 'Apple Music', 'YouTube Music', 'Other'], ['Pizza', 'Tacos', 'Burgers', 'Sushi'], ['Bus', 'Car', 'Walk', 'Bike']]);
    const counts = cats.map(() => rng.int(8, 60));
    const total = counts.reduce((a, b) => a + b, 0);
    const i = rng.int(0, cats.length - 1);
    const val = (counts[i] / total) * 100;
    return build({
      concept: 'cat-displays', level, type: 'calculation',
      prompt: `What percent of responses were **${cats[i]}**? (Round to one decimal.)`,
      visual: { type: 'table', headers: ['Category', 'Frequency'], rows: cats.map((c, k) => [c, counts[k]]).concat([['Total', total]]) },
      answer: num(val, 0.1, { unit: '%', wrong: [{ value: counts[i], misconception: 'relfreq-not-sum-1', why: 'That is the count; divide by the total and multiply by 100.' }] }),
      hints: ['Percent = part ÷ whole × 100.', `Part = ${counts[i]}, whole = ${total}.`, `${counts[i]} ÷ ${total} = ${f(counts[i] / total, 4)}`],
      solution: [`${counts[i]} ÷ ${total} = ${f(counts[i] / total, 4)}`, `× 100 = **${f(val, 1)}%**`],
      takeaway: 'A pie chart\'s slices are these percents; they must total 100%.',
    });
  }),
  gen('cd-which-display', 'cat-displays', 'Choose the display', [1, 2, 4], 'recognition', (rng, level) => {
    const items = [
      { d: 'Bars for each category, sorted from the most frequent to the least frequent.', a: 'Pareto chart' },
      { d: 'A circle split into slices showing each category\'s share of the whole.', a: 'Pie chart' },
      { d: 'Touching bars over equal intervals of a quantitative variable.', a: 'Histogram' },
      { d: 'Separate bars showing the count for each category, in any order.', a: 'Bar graph' },
    ];
    const it = rng.pick(items);
    return build({
      concept: 'cat-displays', level, type: 'recognition',
      prompt: `Which display is described? *${it.d}*`,
      answer: mc(rng, items.map((x): Opt => [x.a, x.a === it.a, x.a === it.a ? 'Correct.' : x.a === 'Histogram' || it.a === 'Histogram' ? 'Histograms are for quantitative data in touching intervals; bar graphs are for categories.' : 'Check the key feature in the description.', x.a === 'Histogram' || it.a === 'Histogram' ? 'histogram-vs-bar' : undefined]), false),
      hints: ['Sorted? Circle? Touching bars? Categories or numbers?'],
      solution: [`It is a **${it.a}**.`],
      takeaway: 'Pareto = sorted bar graph; histogram = quantitative.',
    });
  }),
  gen('cd-pie-valid', 'cat-displays', 'When a pie chart fails', [4, 5], 'misconception', (rng, level) => {
    const pcts = [rng.int(45, 70), rng.int(30, 55), rng.int(20, 40)];
    return build({
      concept: 'cat-displays', level, type: 'misconception',
      context: `A survey asked students which apps they use daily, and they could choose **more than one**. Results: Instagram ${pcts[0]}%, Snapchat ${pcts[1]}%, TikTok ${pcts[2]}%.`,
      prompt: 'Is a pie chart appropriate for these results?',
      answer: mc(rng, [
        ['No — the percents add to more than 100%, so they are not parts of one whole', true, `${pcts.reduce((a, b) => a + b, 0)}% > 100%: students counted in several categories.`],
        ['Yes — pie charts work for any categorical data', false, 'Pie slices must be parts of a single whole that total 100%.'],
        ['Yes, if we sort the slices from largest to smallest', false, 'Sorting doesn\'t fix percents that exceed 100%.'],
      ]),
      hints: ['Add the percents. What must pie slices add to?'],
      solution: ['The percents total more than 100%, so a **bar graph** is appropriate instead.'],
      takeaway: 'Pie charts require parts of one whole (100%).',
    });
  }, ['interpret', 'apply']),
];

/* ---------------- Sampling ---------------- */

const SAMPLING: [string, 'SRS' | 'Systematic' | 'Stratified' | 'Cluster' | 'Convenience', string][] = [
  ['A woman in the airport hands out questionnaires to travelers sitting near the gates who are not busy.', 'Convenience', 'She picked people who were easy to approach.'],
  ['A teacher randomly selects rows two and five and calls on all students in those rows.', 'Cluster', 'Whole groups (rows) were chosen at random.'],
  ['At each store location, 100 randomly selected customers get a questionnaire.', 'Stratified', 'A random sample was taken from every store (stratum).'],
  ['A librarian records whether every fourth patron who checks out books is an adult or a child.', 'Systematic', 'Every 4th patron is chosen.'],
  ['A political party\'s staff calls 1,200 randomly selected phone numbers.', 'SRS', 'Every set of phone numbers is equally likely to be chosen.'],
  ['A consultant uses a random number generator to choose 18 grocery stores from a list of all stores in Baltimore.', 'SRS', 'Random selection from the full list.'],
  ['A school randomly selects 30 freshmen, 30 sophomores, 30 juniors, and 30 seniors to survey.', 'Stratified', 'Random samples from each grade level.'],
  ['A researcher randomly chooses 6 of a city\'s 40 neighborhoods and surveys every household in them.', 'Cluster', 'Entire neighborhoods were selected.'],
  ['A YouTuber asks the first 50 people who comment on a video to fill out a survey.', 'Convenience', 'The first people available were used.'],
  ['A factory inspector picks a random starting box, then inspects every 25th box off the line.', 'Systematic', 'Random start, then every k-th item.'],
  ['A state agency randomly selects 4 counties and inspects every restaurant in those counties.', 'Cluster', 'Whole counties (clusters) were sampled.'],
  ['A gym splits members by membership tier and randomly selects 40 members from each tier.', 'Stratified', 'Random sample within each tier.'],
  ['To count wood ducks, a researcher surveys the 15 squares right next to the park entrance.', 'Convenience', 'Squares near the entrance were easiest to reach.'],
  ['A teacher puts every student\'s name in a hat and draws 10 names.', 'SRS', 'Names in a hat give every group of 10 the same chance.'],
  ['Lyme disease researcher B randomly selects one state hospital and uses all 40 patients there.', 'Cluster', 'One whole hospital (cluster) was chosen at random.'],
];
const METHODS = ['SRS', 'Systematic', 'Stratified', 'Cluster', 'Convenience'] as const;
const METHOD_LABEL: Record<(typeof METHODS)[number], string> = { SRS: 'Simple random', Systematic: 'Systematic', Stratified: 'Stratified', Cluster: 'Cluster', Convenience: 'Convenience' };
const METHOD_MIS = (a: string, b: string) => ((a === 'Stratified' && b === 'Cluster') || (a === 'Cluster' && b === 'Stratified') ? 'stratified-vs-cluster' : a === 'Convenience' || b === 'Convenience' ? 'convenience-is-random' : a === 'Systematic' || b === 'Systematic' ? 'systematic-vs-srs' : undefined);

const smName = (rng: Rng, level: number) => {
    const [ctx, m, why] = rng.pick(SAMPLING);
    return build({
      concept: 'sampling', level, type: level >= 3 ? 'real-world' : 'recognition', context: ctx,
      prompt: 'Which sampling method is this?',
      answer: mc(rng, METHODS.map((k): Opt => [METHOD_LABEL[k], k === m, k === m ? why : `Not ${METHOD_LABEL[k].toLowerCase()}: ${why}`, k === m ? undefined : METHOD_MIS(k, m)]), false),
      hints: ['Were groups involved? If so, did they sample **within every** group or choose **whole** groups?', 'Every k-th → systematic. Easy to reach → convenience. Pure random from a list → SRS.'],
      solution: [`**${METHOD_LABEL[m]}** — ${why}`],
      takeaway: 'Stratified: some from every group. Cluster: all from some groups.',
      source: { pages: [66, 1], section: '1.1–1.2 Practice #6 / Exam #1 #3' },
    });
  };

const sampling: Generator[] = [
  gen('sm-name', 'sampling', 'Name the sampling method', [1, 2], 'recognition', smName),
  gen('sm-name-rw', 'sampling', 'Sampling method in a real study', [3, 4], 'real-world', smName),
  gen('sm-best', 'sampling', 'Choose a method for a goal', [4, 5, 6], 'real-world', (rng, level) => {
    const goals = [
      { g: 'A principal wants to make sure **every grade level** (9–12) is represented in a survey about lunch options.', a: 'Stratified', why: 'Stratifying by grade guarantees each grade is represented.' },
      { g: 'A state wants to inspect restaurants, but traveling across the whole state is expensive. Restaurants are naturally grouped by county.', a: 'Cluster', why: 'Choosing a few whole counties saves travel while staying random.' },
      { g: 'A quality-control worker wants an easy, random way to check products moving down an assembly line.', a: 'Systematic', why: 'A random start and every k-th item is simple and random.' },
      { g: 'A researcher has a complete numbered list of all 5,000 students and wants every group of 100 students to have an equal chance of selection.', a: 'SRS', why: 'That is the definition of a simple random sample.' },
    ];
    const it = rng.pick(goals);
    return build({
      concept: 'sampling', level, type: 'real-world', context: it.g,
      prompt: 'Which random sampling method fits this goal best?',
      answer: mc(rng, (['SRS', 'Systematic', 'Stratified', 'Cluster'] as const).map((k): Opt => [METHOD_LABEL[k], k === it.a, k === it.a ? it.why : `Possible, but ${it.why.toLowerCase()}`, k === it.a ? undefined : METHOD_MIS(k, it.a)]), false),
      hints: ['What is the main constraint: representation of groups, cost, simplicity, or equal chance?'],
      solution: [`**${METHOD_LABEL[it.a as 'SRS']}** — ${it.why}`],
      takeaway: 'Choose the method that matches the goal.',
    });
  }, ['apply']),
  gen('sm-bias-direction', 'sampling', 'Is the sample biased?', [5, 6, 7], 'interpretation', (rng, level) => {
    const cases = [
      { c: 'To estimate the average number of hours FCC students work per week, a student surveys people in the campus library on a Saturday night.', a: 'Underestimate — students in the library on Saturday night are probably working fewer hours', alt: 'Overestimate — library visitors work more hours' },
      { c: 'To estimate how many hours per week teens spend gaming, a researcher surveys people waiting in line at a video game store launch.', a: 'Overestimate — people at a game launch probably game more than typical teens', alt: 'Underestimate — they are too busy to game' },
      { c: 'To estimate average gym attendance per week among town residents, a survey is handed out at the gym\'s front desk.', a: 'Overestimate — people at the gym attend more than typical residents', alt: 'Underestimate — gym members are busy' },
    ];
    const it = rng.pick(cases);
    return build({
      concept: 'sampling', level, type: 'interpretation', context: it.c,
      prompt: 'Is this sample likely biased, and in which direction?',
      answer: mc(rng, [[it.a, true, 'This convenience sample over-represents a particular kind of person.'], [it.alt, false, 'Think about who is likely to be at that location.'], ['Not biased — the sample is random', false, 'Choosing people at one convenient location is not random.', 'convenience-is-random']]),
      hints: ['Who is most likely to be found at that location?', 'How might those people differ from the whole population on the variable?'],
      solution: [`Convenience sample → biased. ${it.a}.`],
      takeaway: 'Convenience samples systematically miss parts of the population.',
    });
  }),
];

/* ---------------- Frequency tables ---------------- */

function randomFreq(rng: Rng) {
  const width = rng.pick([5, 10]);
  const start = 0;
  const k = rng.int(4, 6);
  const freqs = Array.from({ length: k }, () => rng.int(2, 20));
  const classes = freqs.map((_, i) => `${start + i * width}–${start + (i + 1) * width - 1}`);
  return { width, freqs, classes, n: freqs.reduce((a, b) => a + b, 0) };
}

const freqTables: Generator[] = [
  gen('ft-relfreq', 'freq-tables', 'Relative frequency', [2, 3], 'calculation', (rng, level) => {
    const t = randomFreq(rng);
    const i = rng.int(0, t.freqs.length - 1);
    const v = t.freqs[i] / t.n;
    return build({
      concept: 'freq-tables', level, type: 'calculation',
      context: 'The table shows the number of days a sample of employees missed last year.',
      visual: { type: 'table', headers: ['Days missed', 'Frequency'], rows: t.classes.map((c, k) => [c, t.freqs[k]]) },
      prompt: `Find the **relative frequency** of the class ${t.classes[i]}. (Decimal, 3 places.)`,
      answer: num(v, 0.0015, { accept: [v * 100], wrong: [{ value: t.freqs[i], misconception: 'relfreq-not-sum-1', why: 'That is the frequency; divide by the total n.' }] }),
      hints: ['Relative frequency = frequency ÷ total.', `First find n = sum of all frequencies.`, `n = ${t.n}; the class frequency is ${t.freqs[i]}.`, `${t.freqs[i]} ÷ ${t.n}`],
      solution: [`n = ${t.freqs.join(' + ')} = ${t.n}`, `${t.freqs[i]} ÷ ${t.n} = **${f(v, 3)}**`],
      takeaway: 'Relative frequencies add to 1.',
    });
  }),
  gen('ft-cumulative', 'freq-tables', 'Cumulative relative frequency', [3, 4, 5], 'calculation', (rng, level) => {
    const t = randomFreq(rng);
    const i = rng.int(1, t.freqs.length - 2);
    const cum = t.freqs.slice(0, i + 1).reduce((a, b) => a + b, 0);
    const upper = (i + 1) * t.width - 1;
    const v = cum / t.n;
    return build({
      concept: 'freq-tables', level, type: 'calculation',
      context: 'The table shows the number of minutes a sample of customers waited for a table at a restaurant.',
      visual: { type: 'table', headers: ['Minutes', 'Frequency'], rows: t.classes.map((c, k) => [c, t.freqs[k]]) },
      prompt: `What **proportion** of customers waited **at most ${upper} minutes**? (Decimal.)`,
      answer: num(v, 0.0015, { wrong: [{ value: t.freqs[i] / t.n, misconception: 'cumulative-confusion', why: 'That is only one class. "At most" includes every class up to that point.' }] }),
      hints: ['"At most" → cumulative.', 'Add the frequencies of every class up to and including the one ending at ' + upper + '.', `Cumulative frequency = ${t.freqs.slice(0, i + 1).join(' + ')} = ${cum}.`, `Divide by n = ${t.n}.`],
      solution: [`Cumulative frequency through ${t.classes[i]}: ${cum}`, `${cum} ÷ ${t.n} = **${f(v, 3)}**`],
      takeaway: 'Cumulative relative frequency answers "at most" questions.',
    });
  }),
  gen('ft-missing', 'freq-tables', 'Missing relative frequency', [3, 4], 'calculation', (rng, level) => {
    const rel = [rng.int(10, 30), rng.int(10, 30), rng.int(5, 20), rng.int(5, 15)].map((x) => x / 100);
    const missing = Math.round((1 - rel.reduce((a, b) => a + b, 0)) * 100) / 100;
    const all = [...rel, missing];
    const idx = rng.int(0, 4);
    const shown = all.map((v, i) => (i === idx ? '?' : f(v, 2)));
    return build({
      concept: 'freq-tables', level, type: 'calculation',
      context: 'A relative frequency table for favorite streaming service is missing one value.',
      visual: { type: 'table', headers: ['Service', 'Rel. freq.'], rows: ['Netflix', 'Hulu', 'Disney+', 'Max', 'Other'].map((s, i) => [s, shown[i]]) },
      prompt: 'Find the missing relative frequency.',
      answer: num(all[idx], 0.001),
      hints: ['All relative frequencies must add to 1.', 'Add the four known values, then subtract from 1.'],
      solution: [`Known sum = ${f(1 - all[idx], 2)}`, `1 − ${f(1 - all[idx], 2)} = **${f(all[idx], 2)}**`],
      takeaway: 'Relative frequencies always sum to 1.',
    });
  }),
  gen('ft-lyme', 'freq-tables', 'Lyme disease frequency tables', [5, 6, 7], 'exam', (rng, level) => {
    const which = rng.pick(['A', 'B'] as const);
    const data = DATASETS.find((d) => d.id === (which === 'A' ? 'lyme-a' : 'lyme-b'))!.data;
    const classes = Array.from({ length: 8 }, (_, i) => ({ lo: 0.5 + 6 * i, hi: 6.5 + 6 * i }));
    const t = frequencyTable(data, classes);
    const cut = rng.pick([2, 4]); // index of class whose upper bound: 18.5 or 30.5
    const v = t[cut - 1].cumRel;
    const upper = classes[cut - 1].hi;
    return build({
      concept: 'freq-tables', level, type: 'exam',
      context: `Researcher ${which} followed 40 Lyme disease patients and recorded weeks of symptoms. The frequency table (classes 0.5–6.5, 6.5–12.5, …) is shown.`,
      visual: { type: 'table', headers: ['Weeks', 'Frequency'], rows: t.map((row) => [`${row.lo}–${row.hi}`, row.f]) },
      prompt: `What proportion of Researcher ${which}'s patients had symptoms for **fewer than ${upper} weeks**?`,
      answer: num(v, 0.0015),
      hints: ['Use cumulative relative frequency.', `Add frequencies of classes up to ${upper}.`],
      solution: [`Cumulative frequency up to ${upper}: ${t[cut - 1].cum}`, `${t[cut - 1].cum} ÷ 40 = **${f(v, 3)}**`],
      takeaway: 'Frequency tables turn raw data into readable proportions.',
      source: { pages: [63], section: '1.3–1.4 Practice #1' },
    });
  }, ['calculate', 'apply']),
];

/* ---------------- Experimental design ---------------- */

const STUDIES_EXP = [
  { s: 'A streaming company randomly assigns 155 users to premium or free access and records daily listening time after a month.', exp: 'Type of access (premium or free)', resp: 'Daily listening time', type: 'experiment' as const, conf: '' },
  { s: 'Students randomly assign 12 carnations to vases with 0, 1, 2, or 3 tablespoons of sugar and record how many hours each stays fresh.', exp: 'Amount of sugar in the water', resp: 'Hours the flower stays fresh', type: 'experiment' as const, conf: '' },
  { s: 'Researchers recruit 45 dog-loving women and randomly assign them to do a stressful task alone, with a friend, or with their dog, measuring heart rate.', exp: 'Who is present (alone, friend, pet)', resp: 'Heart rate during the task', type: 'experiment' as const, conf: '' },
  { s: 'A children\'s company compares bubble diameters from its control solution and a solution with added glycerin.', exp: 'Type of bubble solution (control vs. glycerin)', resp: 'Average bubble diameter', type: 'experiment' as const, conf: '' },
  { s: 'Researchers observe that children who waited for a second marshmallow had better outcomes later in life.', exp: 'Ability to delay gratification (waiting)', resp: 'Outcomes later in life', type: 'observational' as const, conf: 'Home environment / family resources' },
  { s: 'A survey finds that students who play more video games spend less time on homework and are more likely to flunk out.', exp: 'Time spent playing video games', resp: 'Whether a student flunks out', type: 'observational' as const, conf: 'Time spent on homework' },
  { s: 'A study of cities finds that cities with more ice cream sales have more drownings.', exp: 'Ice cream sales', resp: 'Number of drownings', type: 'observational' as const, conf: 'Hot weather (temperature)' },
  { s: 'Data from many countries show that countries eating more chocolate have more Nobel laureates per 10 million people.', exp: 'Chocolate consumption', resp: 'Nobel laureates per 10 million people', type: 'observational' as const, conf: 'National wealth / research funding' },
];

const experiments: Generator[] = [
  gen('ex-vars', 'experiments', 'Explanatory vs. response', [1, 2, 3], 'recognition', (rng, level) => {
    const s = rng.pick(STUDIES_EXP);
    const askExp = rng.bool();
    return build({
      concept: 'experiments', level, type: 'recognition', context: s.s,
      prompt: `What is the **${askExp ? 'explanatory' : 'response'}** variable?`,
      answer: mc(rng, [[askExp ? s.exp : s.resp, true, askExp ? 'It is the variable that may explain or cause a change.' : 'It is the outcome measured.'], [askExp ? s.resp : s.exp, false, askExp ? 'That is the outcome being measured — the response.' : 'That is what may cause the change — the explanatory variable.', 'explanatory-vs-response'], ['The subjects in the study', false, 'Those are the experimental units/individuals, not a variable.']]),
      hints: ['Which variable might **cause** a change in the other?', 'Explanatory explains; response results.'],
      solution: [`Explanatory: ${s.exp}. Response: ${s.resp}.`],
      takeaway: 'Explanatory → response.',
    });
  }),
  gen('ex-cause', 'experiments', 'Can we conclude cause?', [4, 5, 6], 'conceptual', (rng, level) => {
    const s = rng.pick(STUDIES_EXP);
    const isExp = s.type === 'experiment';
    return build({
      concept: 'experiments', level, type: 'conceptual', context: s.s,
      prompt: `Can this study show that ${s.exp.toLowerCase()} **causes** a change in ${s.resp.toLowerCase()}?`,
      answer: mc(rng, [
        ['Yes — treatments were randomly assigned, so groups differ only by the treatment', isExp, isExp ? 'Random assignment balances other variables.' : 'Nothing was randomly assigned here — it is observational.', isExp ? undefined : 'correlation-causation-study'],
        ['No — it is observational, so confounding variables could explain the association', !isExp, !isExp ? `For example: ${s.conf}.` : 'This was a randomized experiment, which can support cause and effect.', !isExp ? undefined : 'correlation-causation-study'],
      ], false),
      hints: ['Did the researchers **assign** the explanatory variable at random, or just observe it?'],
      solution: [isExp ? 'Randomized experiment → cause-and-effect conclusions are reasonable.' : `Observational study → association only. A possible confounder: ${s.conf}.`],
      takeaway: 'Only randomized experiments support cause-and-effect conclusions.',
    });
  }, ['interpret', 'apply']),
  gen('ex-confounder', 'experiments', 'Spot the confounder', [4, 5, 6, 7], 'real-world', (rng, level) => {
    const s = rng.pick(STUDIES_EXP.filter((x) => x.type === 'observational'));
    const fakes = ['The sample size', 'The response variable itself', 'The color of the graph', 'Rounding error'];
    return build({
      concept: 'experiments', level, type: 'real-world', context: s.s,
      prompt: 'Which is the most plausible **confounding variable**?',
      answer: mc(rng, [[s.conf, true, `It is associated with ${s.exp.toLowerCase()} and also affects ${s.resp.toLowerCase()}.`], ...rng.sample(fakes, 2).map((x): Opt => [x, false, 'A confounder must be related to both the explanatory and response variables.'])]),
      hints: ['A confounder is linked to **both** the explanatory and the response variable.'],
      solution: [`${s.conf}: related to ${s.exp.toLowerCase()} and influences ${s.resp.toLowerCase()}.`],
      takeaway: 'Confounders tangle two possible causes together.',
      source: { pages: [62, 1], section: '1.3–1.4 Example 4 / Exam #1 #4' },
    });
  }, ['apply', 'interpret']),
  gen('ex-roles', 'experiments', 'Design vocabulary', [2, 3, 4], 'recognition', (rng, level) => {
    const items = [
      { d: 'A fake treatment that looks like the real one', a: 'Placebo' },
      { d: 'Neither the subjects nor the researchers know who received which treatment', a: 'Double blinding' },
      { d: 'A group that receives no treatment so it can be compared', a: 'Control group' },
      { d: 'Using chance to assign subjects to treatments', a: 'Randomization' },
      { d: 'The individuals to whom treatments are applied', a: 'Experimental units' },
      { d: 'An unmeasured factor, not part of the study, that affects the variables', a: 'Lurking variable' },
    ];
    const it = rng.pick(items);
    return build({
      concept: 'experiments', level, type: 'recognition',
      prompt: `Which term matches: *${it.d}*?`,
      answer: mc(rng, [[it.a, true, 'Correct.'], ...rng.sample(items.filter((x) => x.a !== it.a), 3).map((x): Opt => [x.a, false, `${x.a}: ${x.d.toLowerCase()}.`])]),
      hints: ['Recall the vocabulary from Section 1.3–1.4.'],
      solution: [`**${it.a}**: ${it.d}.`],
      takeaway: 'Controls, blinding, placebos, and randomization isolate the treatment effect.',
    });
  }),
];

/* ---------------- Bias ---------------- */

const BIAS: [string, 'Response' | 'Undercoverage' | 'Nonresponse' | 'Voluntary response', string, number[]?][] = [
  ['A city planner posts a poll on social media asking residents how they feel about destroying wetlands for a new building.', 'Voluntary response', 'Residents choose whether to respond — usually those with strong opinions.', [61]],
  ['A teacher emails a survey to a random sample of students about gym renovation funding; many never reply.', 'Nonresponse', 'Selected students didn\'t respond.', [61]],
  ['Students ask, "Given that ChatGPT violates the academic honesty policy and can result in discipline, have you ever used ChatGPT on an assignment?"', 'Response', 'The threatening wording pushes students to answer "no".', [61]],
  ['Whole Foods surveys a random sample of its customers to learn how often people in general shop for groceries.', 'Undercoverage', 'People who don\'t shop at Whole Foods are left out of selection.', [61]],
  ['YouPolls lets anyone answer: "Do you feel happy paying your taxes when the government ignores its own tax liabilities?" All 11 answers were "NO!"', 'Voluntary response', 'Anyone could choose to answer; the wording is also leading.', [63]],
  ['A city surveys 50 homeowners who live within walking distance of a park about increasing park funding.', 'Undercoverage', 'Residents far from parks (and renters) had no chance to be selected.', [63]],
  ['A newspaper asks readers to write in with their opinion on a school-tax referendum.', 'Voluntary response', 'Readers decide whether to write in (older residents more likely).', [63]],
  ['A district emails a random sample of teachers a survey about planning time; few respond.', 'Nonresponse', 'Selected teachers didn\'t respond.', [63]],
  ['Only about 10% of people called for a phone survey of the Frederick area answered.', 'Nonresponse', 'Most selected people didn\'t respond.', [1]],
  ['A survey question asks: "Wouldn\'t you agree that the beautiful new park deserves more funding?"', 'Response', 'Leading wording influences responses.', [1]],
  ['A radio host asks listeners to call in and say whether they support a new law.', 'Voluntary response', 'Callers select themselves.'],
  ['A phone survey uses only landline numbers to study young adults\' music habits.', 'Undercoverage', 'Young adults without landlines are excluded from selection.'],
  ['A manager asks employees face-to-face whether they are satisfied with their manager.', 'Response', 'Pressure/intimidation affects honest answers.'],
];
const BIAS_TYPES = ['Response', 'Undercoverage', 'Nonresponse', 'Voluntary response'] as const;
const biasMis = (a: string, b: string) => ((a === 'Nonresponse' && b === 'Voluntary response') || (b === 'Nonresponse' && a === 'Voluntary response') ? 'nonresponse-vs-voluntary' : (a === 'Undercoverage' && b === 'Nonresponse') || (b === 'Undercoverage' && a === 'Nonresponse') ? 'undercoverage-vs-nonresponse' : 'response-bias');

const biName = (rng: Rng, level: number) => {
    const [ctx, b, why, pages] = rng.pick(BIAS);
    return build({
      concept: 'bias', level, type: level >= 3 ? 'real-world' : 'recognition', context: ctx,
      prompt: 'Which type of bias is most present?',
      answer: mc(rng, BIAS_TYPES.map((k): Opt => [`${k} bias`.replace('Undercoverage bias', 'Undercoverage'), k === b, k === b ? why : `Not ${k.toLowerCase()}: ${why}`, k === b ? undefined : biasMis(k, b)]), false),
      hints: ['Who could be selected? Who chose to participate? Did selected people answer? Did the wording push?'],
      solution: [`**${b}**${b === 'Undercoverage' ? '' : ' bias'} — ${why}`],
      takeaway: 'Undercoverage: never had a chance. Nonresponse: chosen, didn\'t answer. Voluntary: chose themselves. Response: wording/pressure.',
      source: pages ? { pages, section: '1.3–1.4 bias examples' } : undefined,
    });
  };

const bias: Generator[] = [
  gen('bi-name', 'bias', 'Identify the bias', [1, 2], 'recognition', biName),
  gen('bi-name-rw', 'bias', 'Bias in a real survey', [3, 4, 5], 'real-world', biName),
  gen('bi-bigger', 'bias', 'Does a bigger sample fix bias?', [4, 5, 6], 'misconception', (rng, level) => {
    const n1 = rng.pick([200, 500, 800]);
    return build({
      concept: 'bias', level, type: 'misconception',
      context: `An online news site runs a voluntary poll about a new tax and gets ${n1} responses. The editor plans to keep the poll open until it has ${n1 * 20} responses so the result will be accurate.`,
      prompt: 'Will the larger number of responses fix the problem?',
      answer: mc(rng, [
        ['No — the bias comes from who chooses to respond; more biased responses are still biased', true, 'Voluntary response bias is systematic; size doesn\'t remove it.'],
        ['Yes — larger samples are always more accurate', false, 'Larger samples reduce random variation, not bias.'],
        ['Yes, as long as the poll stays online longer', false, 'Time doesn\'t change who self-selects.'],
      ]),
      hints: ['Bias is a **systematic** error. Does adding more of the same kind of respondents change who is responding?'],
      solution: ['More responses from a self-selected group still over-represent strong opinions → **still biased**.'],
      takeaway: 'Bigger samples don\'t fix bias — better sampling does.',
    });
  }, ['interpret', 'explain']),
  gen('bi-frq', 'bias', 'Explain the bias (free response)', [5, 6, 7], 'free-response', (rng, level) => {
    const [ctx, b, why] = rng.pick(BIAS);
    return build({
      concept: 'bias', level, type: 'free-response', context: ctx,
      prompt: 'Name the type of bias present and explain how it could make the results inaccurate.',
      answer: { kind: 'text', rubric: { prompt: 'Identify and explain the bias.', items: [
        { id: 'name', idea: `Names ${b.toLowerCase()} bias`, patterns: [b.toLowerCase().replace(' ', '.{0,3}')], weight: 1.5 },
        { id: 'why', idea: 'Explains who is over/under-represented or how answers are influenced', patterns: ['(only|those|people|students|residents).{0,80}(respond|answer|opinion|strong|left out|excluded|chance|pressure|influenc|word)'], weight: 1 },
        { id: 'effect', idea: 'Says how results become inaccurate (not representative / over- or underestimate)', patterns: ['represent|overestimat|underestimat|skew|inaccurat|not accurate|biased'], weight: 1 },
      ], misconceptions: [], model: `This is ${b.toLowerCase()}${b === 'Undercoverage' ? '' : ' bias'}: ${why} As a result, the sample does not represent the population, so the results could systematically over- or underestimate the true opinion.` } },
      hints: ['First name the bias type, then explain *who* is missing or *how* answers are pushed.'],
      solution: [`${b}${b === 'Undercoverage' ? '' : ' bias'}: ${why}`],
      takeaway: 'Name it, explain the mechanism, and state the effect on the results.',
    });
  }),
];

/* ---------------- Investigative questions ---------------- */

const IQS = [
  { q: 'Is there convincing statistical evidence that adding more ads to YouTube causes lower average viewing times?', missing: 'Scope of inference (population)' },
  { q: 'What is the true proportion for all fans at a University of Michigan football game?', missing: 'Variable of interest' },
  { q: 'For all college students, do they typically study in the morning, the afternoon, or the evening?', missing: 'Inference goal (estimate or test)' },
  { q: 'What proportion of the time do cars run red lights?', missing: 'Scope of inference (population)' },
  { q: 'Among all Maryland community college students, what about their commute?', missing: 'Variable of interest' },
];
const COMPONENTS = ['Variable of interest', 'Inference goal (estimate or test)', 'Scope of inference (population)', 'Nothing is missing'];

const investigative: Generator[] = [
  gen('iq-missing', 'investigative', 'Find the missing component', [2, 3, 4, 5], 'recognition', (rng, level) => {
    const it = rng.pick(IQS);
    return build({
      concept: 'investigative', level, type: 'recognition',
      prompt: `Which component is missing? *"${it.q}"*`,
      answer: mc(rng, COMPONENTS.map((c): Opt => [c, c === it.missing, c === it.missing ? 'Correct.' : 'Check each of the three components in turn.', c === it.missing ? undefined : 'missing-inference-component']), false),
      hints: ['Look for: what is measured (variable), estimate vs. test (goal), and who (population).'],
      solution: [`Missing: **${it.missing}**.`],
      takeaway: 'Variable + goal + scope.',
      source: { pages: [63], section: '1.3–1.4 Practice #3' },
    });
  }),
  gen('iq-goal', 'investigative', 'Estimate or test?', [2, 3, 4], 'conceptual', (rng, level) => {
    const items = [
      { q: 'What proportion of all Michigan high school students drive their own car to school?', a: 'Estimate' },
      { q: 'Does premium access cause app users to listen to more hours per day, on average, than free access?', a: 'Test' },
      { q: 'What is the mean difference in nightly sleep between all high school and middle school students in the district?', a: 'Estimate' },
      { q: 'Is there convincing evidence that an in-person trainer increases how often customers work out compared with an online trainer?', a: 'Test' },
    ];
    const it = rng.pick(items);
    return build({
      concept: 'investigative', level, type: 'conceptual',
      prompt: `What is the inference goal of: *"${it.q}"*`,
      answer: mc(rng, [['Estimate a value', it.a === 'Estimate', '"What is…" asks for a value.'], ['Test a claim', it.a === 'Test', '"Is there evidence…/Does … cause…" asks to evaluate a claim.']], false),
      hints: ['"What is the…?" → estimate. "Is there evidence…? Does … cause…?" → test.'],
      solution: [`Goal: **${it.a.toLowerCase()}**.`],
      takeaway: 'Estimate a parameter or test a claim.',
    });
  }),
];

export const UNIT1_GENERATORS: Generator[] = [...popSample, ...dataTypes, ...catDisplays, ...sampling, ...freqTables, ...experiments, ...bias, ...investigative];
