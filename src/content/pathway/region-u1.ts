import type { RegionContent } from '../../engine/pathway/types';

/**
 * Region 1 — Hearthstone Village (Unit 1: Sampling & Data, PDF pp. 60–66 and the Exam #1 Review key, p. 1).
 * Course order: pop-sample → data-types → cat-displays → sampling (1.1–1.2), then
 * freq-tables → experiments → bias → investigative (1.3–1.4). Mini-bosses land after levels 9 and 17.
 */
export const REGION_U1: RegionContent = {
  region: {
    id: 'r1', unit: 'u1', number: 1, name: 'Hearthstone Village', subtitle: 'Sampling & Data',
    theme: 'village', emoji: '🏘️',
    quote: 'Before you can trust a single number, you must know who it came from and how it was gathered.',
    description: 'Hearthstone is where every study begins: deciding **who you care about** (the population), **who you actually measure** (the sample), and **what kind of data** you collect. Here you will choose random samples, organize data in frequency tables, design experiments that can show cause and effect, and catch the biases that make surveys mislead.',
    learn: [
      'Population vs. sample, parameter vs. statistic, variable vs. data',
      'Classify data as categorical, quantitative discrete, or quantitative continuous, and display categories with bar graphs, Pareto charts, and pie charts',
      'The four random sampling methods (simple random, systematic, stratified, cluster) and why convenience samples are biased',
      'Build and read frequency tables: relative frequency and cumulative relative frequency',
      'Experimental design: explanatory and response variables, confounding, randomization, control groups, blinding',
      'Survey bias (response, undercoverage, nonresponse, voluntary response) and complete investigative questions',
    ],
    landmarks: [
      { kind: 'village', label: 'Hearthstone Village' },
      { kind: 'forest', label: 'The Wood-Duck Park', afterLevel: 'u1-sampling-1' },
      { kind: 'tower', label: 'The Tally Tower', afterLevel: 'u1-freq-lab' },
      { kind: 'bridge', label: 'The Pollsters\' Bridge', afterLevel: 'u1-bias-2' },
    ],
    boss: {
      name: 'The Biased Herald', title: 'Crier of Crooked Polls', emoji: '📯',
      description: 'A trumpet-blowing town crier who announces "what everyone thinks" from polls of his own followers, leading questions, hand-picked samples, and charts that confuse association with cause.',
      defeatLine: 'The Herald\'s trumpet sputters out. "Random samples, neutral questions, randomized experiments… fine. From now on I announce only what the data can actually support."',
    },
    miniBosses: [
      { name: 'Grumble the Census Troll', emoji: '🧌', taunt: 'Samples are for cowards! I call every number a parameter, and every jersey number is a quantity!' },
      { name: 'The Convenience Crow', emoji: '🐦', taunt: 'Why wander the whole park? I only count the squares by the gate — so much easier!' },
      { name: 'The Lurking Shade', emoji: '👤', taunt: 'You saw two things rise together. You never saw me standing behind them both.' },
      { name: 'Madam Leading-Question', emoji: '🎙️', taunt: 'Wouldn\'t you agree that my perfectly fair questions deserve a "yes"?' },
    ],
  },

  levels: [
    /* ---------- 1.1–1.2 Key terms ---------- */
    {
      id: 'u1-pop-1', title: 'The Spoonful and the Pot', type: 'lesson', concepts: ['pop-sample'], lessonSteps: [0, 3],
      intro: 'Today you\'ll meet the six words every statistics problem starts with — population, sample, variable, data, statistic, parameter — using Knoll Academy\'s uniform survey.',
      npc: { npc: 'quill', text: 'Nobody drinks the whole pot to check the soup. Statistics is the art of learning about everyone from a well-chosen few.' },
      generators: ['ps-identify', 'ps-param-stat'],
      summary: [
        '**Population** = the entire group you care about; **sample** = the subset you actually measure.',
        'A **statistic** (computed from the sample) estimates a **parameter** (the same number for the population).',
        'The **variable** is the characteristic measured; the **data** are the recorded values.',
      ],
    },
    {
      id: 'u1-pop-2', title: 'Six Words, One Study', type: 'lesson', concepts: ['pop-sample'], lessonSteps: [4, 7],
      intro: 'Today you\'ll identify all six terms in real course problems — Federal contractors\' salaries and Lake Tahoe absences — and lock in the parameter-versus-statistic difference.',
      hook: {
        title: 'First lessons on the slopes',
        body: 'Practice 1.1–1.2 #1a: ski resorts are interested in the **mean age that children take their first ski and snowboard lessons**, so they can plan their classes. They can\'t ask every child who has ever skied.\n\nBefore any data are collected, you should already be able to say who the population is — and what the parameter would be.',
      },
      generators: ['ps-param-stat', 'ps-six'],
    },
    {
      id: 'u1-pop-precision', title: 'Parameter or Statistic?', type: 'precision', concepts: ['pop-sample'],
      intro: 'Today you\'ll defeat the three classic mix-ups — parameter vs. statistic, variable vs. data, and sample vs. population — before they cost you points on Exam #1.',
      hook: {
        title: 'The Halloween spending study',
        body: 'Exam #1 Review #1b: a study looks at the **average amount spent by all families visiting Spirit Halloween stores** by recording what **selected** families spend.\n\n- Parameter: the average for *all* families visiting the stores.\n- Statistic: the average for the *selected* families.\n- Variable: the amount a family spends. Data: the individual amounts recorded.\n\nThe same calculation, applied to two different groups — that is exactly where the traps hide.',
      },
      generators: ['ps-param-stat', 'ps-six', 'ps-identify'],
      recall: [
        { prompt: 'Practice 1.1–1.2 #1c: a marriage counselor wants the proportion of all the clients she counsels who stay married, and she checks the records of some of them. Name the population, the parameter, and the statistic.', answer: 'Population: **all** the clients she counsels. Parameter: the proportion of *all* her clients who stay married. Statistic: the proportion among the clients whose records she checked.' },
      ],
    },

    /* ---------- Types of data & categorical displays ---------- */
    {
      id: 'u1-types', title: 'Can You Average a Jersey?', type: 'lesson', concepts: ['data-types'], lessonSteps: [0, 7],
      intro: 'Today you\'ll learn to sort any variable into categorical, quantitative discrete, or quantitative continuous — and see why digits alone don\'t make data quantitative.',
      npc: { npc: 'juno', text: 'Before you graph anything, ask what kind of data you have. It decides which pictures and summaries are even allowed.' },
      generators: ['dt-classify', 'dt-which'],
    },
    {
      id: 'u1-types-practice', title: 'Label, Count, or Measure', type: 'practice', concepts: ['data-types', 'pop-sample'],
      intro: 'Today you\'ll classify variables at speed and connect each one back to its study — the population, the variable, and the kind of data it produces.',
      hook: {
        title: 'Counting absences',
        body: 'The Lake Tahoe Community College instructor defines **X = number of days a math student is absent** during a quarter, and her sample\'s mean is **3.5 days**.\n\nX counts days, so its data are **quantitative discrete** — and a mean of 3.5 is still perfectly sensible. The *data* are whole numbers; a *statistic* computed from them doesn\'t have to be.',
      },
      generators: ['dt-which', 'dt-summary', 'ps-six'],
    },
    {
      id: 'u1-displays', title: 'Bars, Slices, and Podiums', type: 'lesson', concepts: ['cat-displays'], lessonSteps: [0, 4],
      intro: 'Today you\'ll display categorical data with bar graphs, Pareto charts, and pie charts — and learn why every pie chart needs slices that total 100%.',
      generators: ['cd-which-display', 'cd-percent'],
    },
    {
      id: 'u1-recall-1', title: 'The Village Notice Board', type: 'recall', concepts: ['cat-displays', 'data-types'],
      intro: 'Today you\'ll pull categorical displays and data types from memory — no peeking — before sampling arrives.',
      npc: { npc: 'thorne', text: 'Attempt every answer before you reveal it. A definition you struggled to retrieve is one you will keep.' },
      generators: ['cd-which-display', 'cd-pie-valid', 'dt-which'],
      recall: [
        { prompt: 'A histogram and a bar graph both use bars. When do you use each one?', answer: 'A **bar graph** shows **categorical** data with separate bars (sorted from tallest to shortest, it becomes a Pareto chart). A **histogram** shows **quantitative** data in touching intervals.' },
      ],
    },

    /* ---------- Sampling ---------- */
    {
      id: 'u1-sampling-1', title: 'Counting Wood Ducks', type: 'lesson', concepts: ['sampling'], lessonSteps: [0, 3],
      intro: 'Today you\'ll try to estimate the wood ducks in a park — and discover why letting chance pick your sample beats picking it yourself.',
      generators: ['sm-name', 'sm-name-rw'],
      summary: [
        'Choosing whatever is easy to reach (**convenience sampling**) produces **sampling bias** — estimates that systematically miss.',
        'The four random methods: **simple random**, **systematic**, **stratified**, **cluster**.',
        'Random samples differ from one another, but their estimates center on the truth.',
      ],
    },
    {
      id: 'u1-mixed-1', title: 'Market Day Muddle', type: 'mixed', concepts: ['pop-sample', 'data-types', 'cat-displays', 'sampling'],
      intro: 'Today you\'ll switch between the six key terms, data types, displays, and sampling methods on every question — the way Exam #1 mixes them.',
      hook: {
        title: 'Cans of soda',
        body: 'Practice 1.1–1.2 #5: you want the **mean number of cans of soda drunk each month by students in their twenties at your school**.\n\n- Population: all students in their twenties at your school. Parameter: their mean cans per month.\n- Variable: cans of soda per month — a count, so **quantitative discrete**.\n- Sampling: you can\'t ask everyone, so *how* you choose matters. Asking your friends would be convenience sampling; drawing names at random from a list of every student in their twenties would be a simple random sample.\n\nOne scenario touches every idea so far. Now the questions will too.',
      },
      generators: ['ps-param-stat', 'ps-identify', 'dt-which', 'dt-summary', 'cd-pie-valid', 'cd-which-display', 'sm-name-rw', 'sm-best'],
    },
    {
      id: 'u1-sampling-2', title: 'Every Group, or Whole Groups?', type: 'lesson', concepts: ['sampling'], lessonSteps: [4, 8],
      intro: 'Today you\'ll name the sampling method in real course scenarios and nail the difference that trips up most students: stratified versus cluster.',
      hook: {
        title: 'Back to the duck park',
        body: 'The researchers want their wood-duck sample to include **both forest squares and lake squares**, because ducks gather near the water. One researcher suggests randomly picking a few **whole rows** of the grid instead.\n\nDo those two plans do the same thing? By the end of this level you\'ll know exactly why not.',
      },
      generators: ['sm-name', 'sm-name-rw'],
    },
    {
      id: 'u1-sampling-lab', title: 'The Hundred-Sample Test', type: 'lab', concepts: ['sampling'],
      intro: 'Today you\'ll run each sampling method 100 times on the duck park and see the difference between *sampling variability* and *sampling bias* with your own eyes.',
      npc: { npc: 'odalys', text: 'Chance plays no favorites. Let it choose the squares and the errors cancel out on average; choose them yourself and they all lean the same way.' },
      predict: {
        prompt: 'You will run each sampling method **100 times** on the duck park. What will the results table show?',
        input: { type: 'mc', options: [
          { id: 'a', text: 'Every random method\'s average estimate lands near the true total, while the convenience sample gives the same estimate every time — and misses', correct: true, why: 'Random samples vary but center on the truth. The convenience sample never changes, so its error never averages out.' },
          { id: 'b', text: 'The convenience sample is most accurate, because its 12 squares sit right next to each other', why: 'Neighboring squares are alike — they share the same distance from the lake — so together they misrepresent the park as a whole.', misconception: 'convenience-is-random' },
          { id: 'c', text: 'All five methods miss by about the same amount, because every sample has only 12 squares', why: 'Small random samples vary, but they still center on the truth. Only the biased method misses in one direction every time.' },
        ] },
        reveal: 'Random methods show **sampling variability**: each sample differs, but the estimates center on the true total. The convenience sample shows **sampling bias**: it misses in the same direction every time, and repeating it can\'t help.',
      },
      widget: {
        id: 'sampling',
        mission: 'Pick **Convenience** and press **Repeat 100×**. Then do the same for **Simple random**, **Stratified**, and **Cluster**. Tick **Reveal every square** to see the true total, and compare each method\'s *Average estimate* and *Spread (SD)* in the table. Notice where the convenience squares sit relative to the lake.',
        takeaway: 'The convenience squares hug the entrance, far from the lake where the ducks gather, so that sample underestimates the total every single time — sampling bias. The random methods\' averages land near the truth. Cluster estimates swing the most here, because one whole column may cross the lake or miss it entirely: unbiased, but highly variable.',
      },
      generators: ['sm-bias-direction', 'sm-best'],
      summary: [
        'Random samples vary from sample to sample (**sampling variability**), but they center on the truth.',
        'A convenience sample misses in the same direction every time (**sampling bias**).',
        'Repeating a biased method doesn\'t fix it — only changing *how* you choose does.',
      ],
    },
    {
      id: 'u1-sampling-precision', title: 'The Convenience Trap', type: 'precision', concepts: ['sampling'],
      intro: 'Today you\'ll defeat the three sampling mix-ups: convenience vs. random, stratified vs. cluster, and systematic vs. simple random.',
      hook: {
        title: 'The airport questionnaire',
        body: 'Practice 1.1–1.2 #6a: a woman in an airport hands out questionnaires about the airport\'s service. She skips travelers hurrying through with luggage and instead asks **all travelers sitting near gates and not napping**.\n\nShe never planned exactly who to ask — so isn\'t that "random"? It isn\'t: she chose whoever was easy to approach. That\'s **convenience** sampling, and calm, seated travelers may rate the airport very differently from rushed ones.',
      },
      generators: ['sm-name-rw', 'sm-best', 'sm-bias-direction'],
      recall: [
        { prompt: 'A librarian records every fourth patron who checks out books. Name the method — and explain why it is *not* a simple random sample.', answer: '**Systematic** sampling. In a simple random sample every group of patrons has the same chance of being chosen; with every-fourth sampling, two patrons standing next to each other in line can never both be in the sample.' },
      ],
    },

    /* ---------- 1.3–1.4 Frequency tables ---------- */
    {
      id: 'u1-freq-1', title: 'From Raw List to Frequency Table', type: 'lesson', concepts: ['freq-tables'], lessonSteps: [0, 6],
      intro: 'Today you\'ll organize raw data into a frequency table and use its relative and cumulative columns to answer "at most" and "fewer than" questions.',
      generators: ['ft-terms', 'ft-relfreq', 'ft-interpret'],
    },
    {
      id: 'u1-freq-lab', title: 'Building the Lyme Table', type: 'graph-lab', concepts: ['freq-tables'],
      intro: 'Today you\'ll build Researcher B\'s Lyme disease frequency table yourself and discover what changing the class width reveals — and hides.',
      npc: { npc: 'juno', text: 'Forty raw numbers are a fog. Group them into classes and the shape of the data steps out of it.' },
      hook: {
        title: 'Weeks of symptoms',
        body: 'Practice 1.3–1.4 #1: a new antibody drug to treat Lyme disease is under study. **Researcher B** followed **40 patients** from the start of treatment until they no longer had symptoms, recording how many **weeks** each patient showed symptoms.\n\nForty raw values are hard to read. A frequency table makes them talk.',
      },
      predict: {
        prompt: 'If you change the class width from 6 weeks to 12 weeks, what happens to the relative frequency column?',
        input: { type: 'mc', options: [
          { id: 'a', text: 'There are fewer classes, each holding more patients — and the relative frequencies still add to 1', correct: true, why: 'Every patient still lands in exactly one class, so the shares always total 1.' },
          { id: 'b', text: 'The relative frequencies add to 2, because each class is twice as wide', why: 'A relative frequency is a share of all 40 patients, and the shares always total 1.', misconception: 'relfreq-not-sum-1' },
          { id: 'c', text: 'The last cumulative relative frequency drops below 1', why: 'The running total eventually includes every patient, so the final cumulative relative frequency is always 1.', misconception: 'cumulative-confusion' },
        ] },
        reveal: 'Class width changes how much **detail** you see, never the total: the relative frequencies sum to 1 and the last cumulative relative frequency is 1, whatever the width.',
      },
      widget: {
        id: 'freq-table', props: { dataset: 'lyme-b' },
        mission: 'Start at class width **6** — the course template (0.5–6.5, 6.5–12.5, …). Find the class with the highest frequency. Then read the *Cum. rel. f* column: what proportion of Researcher B\'s patients had symptoms for fewer than 18.5 weeks? Finally, drag the width to **12** and try to answer the same question.',
        takeaway: 'At width 6 the busiest class is 12.5–18.5 weeks (11 patients), and the cumulative relative frequency at 18.5 weeks is 0.425. At width 12 the boundaries become 12.5, 24.5 and 36.5 — there is no 18.5 boundary any more, so the table can no longer answer that question. Wider classes are simpler but hide detail; the relative frequencies still total 1.',
      },
      generators: ['ft-interpret', 'ft-cumulative'],
      summary: [
        'Relative frequency = f ÷ n, and the relative frequencies always total 1.',
        'Read "fewer than" questions from the **cumulative relative frequency** at a class boundary.',
        'Class width trades detail for simplicity — it never changes the total.',
      ],
    },
    {
      id: 'u1-freq-practice', title: 'Running Totals', type: 'practice', concepts: ['freq-tables', 'cat-displays'],
      intro: 'Today you\'ll compute relative and cumulative relative frequencies by hand, fill in missing entries, and turn category counts into percents.',
      hook: {
        title: 'A frequency table you\'ve already met',
        body: 'The p.64 ethnicity table is a frequency table for **categorical** data: 8,794 of 24,382 students are Asian, so that category\'s relative frequency is 8,794 ÷ 24,382 ≈ 0.361, or 36.1%.\n\nThe same columns — frequency, relative frequency, cumulative — work for quantitative classes too. First, a worked example from the Exam #1 Review.',
      },
      generators: ['ft-relfreq', 'ft-cumulative', 'ft-missing', 'cd-percent'],
    },

    /* ---------- Experimental design ---------- */
    {
      id: 'u1-exp-1', title: 'The Marshmallow Test', type: 'lesson', concepts: ['experiments'], lessonSteps: [0, 3],
      intro: 'Today you\'ll learn the vocabulary of experiments — explanatory and response variables, treatments, confounding — through one of psychology\'s most famous studies.',
      npc: { npc: 'vera', text: 'Two things rising together is a clue, not a verdict. My first question is always: what else could be causing both?' },
      generators: ['ex-vars', 'ex-roles'],
      summary: [
        'The **explanatory** variable may cause a change; the **response** variable is the outcome measured.',
        'A **confounding variable** is tied to the explanatory variable *and* affects the response — like home environment in the Marshmallow Test.',
        'Randomization, control groups, blinding, and placebos help isolate the effect of the treatment.',
      ],
    },
    {
      id: 'u1-mixed-2', title: 'Samples, Tallies, and Treatments', type: 'mixed', concepts: ['freq-tables', 'sampling', 'experiments', 'cat-displays'],
      intro: 'Today you\'ll switch between sampling methods, frequency tables, experiment vocabulary, and displays — deciding which idea each question needs before you answer.',
      hook: {
        title: 'The electronics chain',
        body: 'Practice 1.1–1.2 #6c: an electronics chain gives questionnaires to **100 randomly selected customers at each store location**, asking their ages.\n\n- *Sampling:* a random sample from every store → **stratified**.\n- *Organizing:* the ages could be grouped into classes with relative and cumulative columns.\n- *Design:* nobody is assigned a treatment, so this is an **observational** survey, not an experiment.\n\nThree ideas in one study — keep all of them in mind.',
      },
      generators: ['ft-interpret', 'ft-cumulative', 'sm-name-rw', 'sm-best', 'ex-vars', 'ex-roles', 'cd-percent', 'cd-pie-valid'],
    },
    {
      id: 'u1-exp-2', title: 'Confounders in the Shadows', type: 'lesson', concepts: ['experiments'], lessonSteps: [4, 8],
      intro: 'Today you\'ll identify the variables in a true randomized experiment, untangle a confounder from the Exam #1 Review, and see why blinding matters.',
      hook: {
        title: 'Premium or free?',
        body: 'Section 1.3–1.4 Example 5: a major music-streaming company wants to know whether **premium access causes users to listen more hours per day** than free access. It selects a random sample of **155 app users** and **randomly assigns** each one to premium or free access. After one month, it records each user\'s daily listening time.',
      },
      generators: ['ex-roles', 'ex-cause', 'ex-confounder'],
    },
    {
      id: 'u1-exp-lab', title: 'Experiment or Observation?', type: 'experiment', concepts: ['experiments'],
      intro: 'Today you\'ll label every part of a randomized experiment and sort real studies into experiments and observational studies — the line that decides whether "cause" is allowed.',
      predict: {
        prompt: 'Suppose the streaming company had let users **choose** premium or free, instead of assigning them at random. What would go wrong?',
        input: { type: 'mc', options: [
          { id: 'a', text: 'The groups could differ in other ways — heavy listeners might pick premium — so a difference in listening time couldn\'t be blamed on access type alone', correct: true, why: 'Self-selection creates a confounder (existing listening habits) tied to both access type and listening time.' },
          { id: 'b', text: 'Nothing — it would still be an experiment with the same conclusions', why: 'If users choose, the researchers no longer assign the treatment; it becomes an observational study that can\'t establish cause.', misconception: 'correlation-causation-study' },
          { id: 'c', text: 'Daily listening time would become the explanatory variable', why: 'The roles don\'t change: access type is still explanatory and listening time is still the response.', misconception: 'explanatory-vs-response' },
        ] },
        reveal: '**Random assignment** makes the groups alike on average in everything except the treatment. Without it, confounders creep in and cause-and-effect conclusions fall apart.',
      },
      widget: {
        id: 'experiment-design',
        mission: 'Label all six parts of the streaming study and press **Check my labels** until you score 6/6. Then work through *Experiment or observational study?*: for each study, ask whether the researchers **assigned** the treatment. For the observational ones, note the confounder the feedback names.',
        takeaway: 'Only a study that **randomly assigns** treatments can support cause and effect. In the Marshmallow Test and the video-game survey nobody assigned anything, so home environment or homework time stays tangled with the explanatory variable.',
      },
      generators: ['ex-confounder', 'ex-cause', 'ex-roles'],
      summary: [
        'Experiment = researchers **assign** treatments; observational study = they only watch.',
        'Random assignment balances confounders, so a difference in the response can be blamed on the treatment.',
        'Observational associations (marshmallows, video games) can\'t prove cause.',
      ],
    },

    /* ---------- Bias in surveys ---------- */
    {
      id: 'u1-bias-1', title: 'The Poll That Couldn\'t Lose', type: 'lesson', concepts: ['bias'], lessonSteps: [0, 3],
      intro: 'Today you\'ll learn the four kinds of survey bias from p.60 and hunt for them in ten real scenarios.',
      generators: ['bi-name', 'bi-name-rw'],
      summary: [
        '**Response bias** — the wording or situation pushes the answer.',
        '**Undercoverage** — some people never had a chance to be selected.',
        '**Nonresponse** — selected, but didn\'t answer. **Voluntary response** — people chose themselves.',
      ],
    },
    {
      id: 'u1-teach-exp', title: 'Why Randomize?', type: 'teach', concepts: ['experiments'],
      intro: 'Today you\'ll teach the most important idea in study design — explanatory vs. response, confounding, and why random assignment is what lets us claim cause and effect.',
      npc: { npc: 'quill', text: 'If you can explain random assignment to a friend, no headline about what "causes" what will fool you again.' },
      hook: {
        title: 'Do video games make students flunk?',
        body: 'Exam #1 Review #4b: students who play video games spend less time on homework, and students who spend less time on homework are more likely to flunk out.\n\nA friend concludes: "So video games make you flunk." Your job: explain — clearly enough to change their mind — what\'s wrong with that conclusion and what kind of study could actually show cause and effect.',
      },
      recall: [
        { prompt: 'Warm-up: in the streaming study (155 users randomly assigned to premium or free access), name the explanatory variable, the response variable, and the experimental units.', answer: 'Explanatory: **type of access** (premium or free — categorical). Response: **daily listening time** (quantitative). Experimental units: the **155 app users**.' },
      ],
    },
    {
      id: 'u1-bias-2', title: 'Selected, Silent, or Self-Chosen?', type: 'lesson', concepts: ['bias'], lessonSteps: [4, 7],
      intro: 'Today you\'ll separate the biases that are easiest to confuse: undercoverage vs. nonresponse, and nonresponse vs. voluntary response.',
      hook: {
        title: 'Letters to the editor',
        body: 'Practice 1.3–1.4 #2c: people over age 65 are known to be more likely to write letters to the local newspaper. A school district is considering a referendum that would raise property taxes to fund its schools, and the town\'s newspaper **asks people to write in** with their opinions.\n\nWhose voices will fill the Opinions page — and whose will be missing?',
      },
      generators: ['bi-name', 'bi-name-rw', 'bi-bigger'],
    },
    {
      id: 'u1-bias-precision', title: 'Nonresponse or Volunteer?', type: 'precision', concepts: ['bias', 'sampling'],
      intro: 'Today you\'ll defeat the most common bias mix-ups — and see why neither a bigger sample nor a random selection automatically cures a biased survey.',
      npc: { npc: 'vera', text: 'Bias is a steady push in one direction. Collect more data the same way and you only get a more confident wrong answer.' },
      hook: {
        title: 'Two surveys, two different problems',
        body: '- **Kentwood Public Schools** emails a survey to a **random sample of teachers** about daily planning time, and some never reply.\n- **YouPolls** lets **anyone** answer its tax question; 11 people did, every one answering "NO!"\n\nBoth surveys end up hearing from too few of the right people — but for different reasons. Ask: who chose whom?',
      },
      generators: ['bi-name-rw', 'bi-bigger', 'sm-bias-direction'],
      recall: [
        { prompt: 'Exam #1 Review #4d: a phone survey of the Frederick area hears back from only 10% of the people called. Name the bias and explain who is likely to answer.', answer: '**Nonresponse bias** — the people were selected, but 90% didn\'t respond, and those who do respond tend to be the ones most passionate about the subject, so the results may not represent the whole Frederick area.' },
      ],
    },

    /* ---------- Investigative questions ---------- */
    {
      id: 'u1-investigate', title: 'Asking the Right Question', type: 'lesson', concepts: ['investigative'], lessonSteps: [0, 5],
      intro: 'Today you\'ll write complete investigative questions — variable of interest, inference goal, and scope of inference — the way statisticians frame a study before collecting any data.',
      generators: ['iq-missing', 'iq-goal'],
    },
    {
      id: 'u1-challenge', title: 'The Thanksgiving Flights', type: 'challenge', concepts: ['sampling', 'investigative', 'bias'],
      intro: 'Today you\'ll critique a flawed real-world survey and take on exam-level sampling, question-writing, and bias problems with no scaffolding.',
      hook: {
        title: 'Babies on board',
        body: 'Practice 1.1–1.2 #4: airlines want to know how consistent the **number of babies on each flight** is, so they carry adequate safety equipment. One airline surveys **six flights from Boston to Salt Lake City over Thanksgiving weekend** and decides how much safety equipment to carry based on the result.\n\nThe practice set asks for **three errors** in this survey and a correction for each. Spot them before you start — the problems below demand the same critical eye.',
      },
      generators: ['sm-best', 'sm-bias-direction', 'iq-write', 'bi-frq'],
      summary: [
        'A single holiday weekend isn\'t typical: sample flights from across the year.',
        'One route can\'t speak for every route: randomly sample flights from all routes (stratifying by route guarantees each is represented).',
        'Six flights is very few: a larger random sample gives a more reliable estimate.',
        'Before collecting data, name the variable of interest, the inference goal, and the scope.',
      ],
    },
    {
      id: 'u1-review', title: 'Review at the Hearth', type: 'review', concepts: ['sampling', 'bias', 'experiments', 'investigative', 'freq-tables', 'pop-sample'],
      intro: 'Today you\'ll review every Unit 1 skill in one sitting — sampling, bias, experiments, investigative questions, frequency tables, and the six key terms — before facing the Biased Herald.',
      npc: { npc: 'thorne', text: 'Say each definition to yourself before you answer. The Herald preys on words that are almost right.' },
      hook: {
        title: 'In-person or online trainer?',
        body: 'Practice 1.3–1.4 #4a: a fitness company took 200 customers who requested a trainer and **randomly assigned** half to an in-person trainer and half to an online trainer. After 3 months, each customer was classified as working out "rarely", "occasionally", or "frequently".\n\nOne study, many ideas: an explanatory variable (trainer type), a **categorical** response, random assignment (so cause *can* be studied), and a population to name in an investigative question.',
      },
    },
  ],

  encounters: [
    {
      id: 'u1-enc-zip', kind: 'scholar', afterLevel: 'u1-types-practice', title: 'The Zip-Code Scholar', concepts: ['data-types'],
      question: {
        prompt: 'A survey records each respondent\'s **zip code**, and a student computes the "average zip code" of the respondents. What is the problem?',
        input: { type: 'mc', options: [
          { id: 'a', text: 'Zip codes are categorical labels, so an average of them is meaningless', correct: true, why: 'They are written with digits, but they name places. The "average zip code" points to no real place.' },
          { id: 'b', text: 'Zip codes are continuous, so they must be grouped into a histogram first', why: 'Zip codes aren\'t measurements, so they aren\'t continuous — and they aren\'t quantitative at all.', misconception: 'numbers-are-quantitative' },
          { id: 'c', text: 'Zip codes are discrete counts, so the average must be rounded to a whole number', why: 'Zip codes don\'t count anything. (And even for real counts, a mean doesn\'t have to be a whole number.)', misconception: 'numbers-are-quantitative' },
        ] },
        explain: 'Digits don\'t make data quantitative. Ask whether arithmetic on the values makes sense; for zip codes, jersey numbers, and phone numbers it doesn\'t, so they are **categorical**.',
      },
    },
    {
      id: 'u1-enc-tally', kind: 'lost-formula', afterLevel: 'u1-freq-1', title: 'The Torn Tally Sheet', concepts: ['freq-tables'], formula: 'rel-freq',
    },
    {
      id: 'u1-enc-shade', kind: 'shrine', afterLevel: 'u1-exp-lab', title: 'Shrine of the Hidden Variable', concepts: ['experiments'],
      question: {
        prompt: 'Exam #1 Review #4b: gamers spend less time on homework, and students who spend less time on homework are more likely to flunk out. The answer key calls **time spent on homework** a…',
        input: { type: 'mc', options: [
          { id: 'a', text: 'Confounding variable — a known factor tied to gaming that also affects flunking out', correct: true, why: 'It is associated with the explanatory variable (gaming) and influences the response (flunking out), so their effects can\'t be separated.' },
          { id: 'b', text: 'Lurking variable', why: 'In the course\'s definitions, lurking variables are *unmeasured* factors outside the study. Homework time is a known, identified factor tangled with both variables — that makes it confounding.' },
          { id: 'c', text: 'Response variable', why: 'The response is whether a student flunks out.', misconception: 'explanatory-vs-response' },
          { id: 'd', text: 'Explanatory variable', why: 'The explanatory variable is playing video games.', misconception: 'explanatory-vs-response' },
        ] },
        explain: 'A **confounding variable** is a known factor that correlates with the explanatory variable and also affects the response. Without random assignment, its effect can\'t be separated from the explanatory variable\'s.',
      },
    },
    {
      id: 'u1-enc-gauntlet', kind: 'lab', afterLevel: 'u1-bias-precision', title: 'The Bias Gauntlet', concepts: ['bias'],
      widget: {
        id: 'bias-spotter',
        mission: 'Play all ten scenarios in a row and aim for at least **9 out of 10** — the widget\'s *Bias detective* rank. Before each pick, ask in order: Was anyone **left out** of selection? Did people **choose themselves**? Were people **selected but silent**? Did the **wording** push?',
        takeaway: 'Four questions, four biases: left out → undercoverage; chose themselves → voluntary response; selected but didn\'t answer → nonresponse; pushed by the wording → response bias.',
      },
    },
  ],

  boss: {
    id: 'boss-u1',
    story: 'FCC\'s student government wants to know whether students support **moving the first class period from 8:00 to 9:30 am** — and whether later starts *cause* better grades. You\'re their statistician.\n\nBut the **Biased Herald** got there first. He has trumpeted an Instagram poll, a leading question, and a GPA chart "proving" that late classes make students smarter — and now he waves a second scroll: a Lyme disease drug trial whose numbers he swears by. Expose every flaw, then show the council how to do it right.',
    source: { pages: [60, 61, 62, 63, 64, 65, 1], section: 'Unit 1 — Sampling & Data (1.1–1.4); Practice 1.3–1.4 #1 (Lyme disease)' },
    phases: [
      {
        title: 'Phase 1 — The Proclamation', kind: 'recognition',
        intro: '"Hear ye! I already know what ALL students think — I asked my followers!"',
        tasks: [
          { kind: 'boss-step', boss: 'boss-u1', index: 0 },
          {
            kind: 'step',
            context: 'The council\'s survey form will record, for each student: **student ID number**, **number of classes** taken this term, and **commute time** in minutes.',
            step: {
              concept: 'data-types', dims: ['recognize', 'apply'], label: 'Data types',
              prompt: 'Classify the three variables, in order: student ID number, number of classes, commute time.',
              answer: { kind: 'mc', options: [
                { id: 'a', text: 'Categorical; quantitative discrete; quantitative continuous', correct: true, why: 'IDs are labels (averaging them is meaningless), classes are counted, and time is measured.' },
                { id: 'b', text: 'Quantitative discrete; quantitative discrete; quantitative continuous', correct: false, why: 'Student ID numbers are written with digits but act as labels — arithmetic on them makes no sense.', misconception: 'numbers-are-quantitative' },
                { id: 'c', text: 'Categorical; quantitative continuous; quantitative discrete', correct: false, why: 'Swapped: "number of classes" is a count (discrete), and commute time is a measurement (continuous).', misconception: 'discrete-vs-continuous' },
              ] },
              explain: 'Label → categorical. Count → discrete. Measurement → continuous.',
              hint: 'For each variable: is it a label, a count, or a measurement?',
            },
          },
          { kind: 'boss-step', boss: 'boss-u1', index: 5 },
        ],
      },
      {
        title: 'Phase 2 — Rigging the Sample', kind: 'application',
        intro: '"Why trouble the evening students? The cafeteria at noon is so much more convenient!"',
        tasks: [
          { kind: 'boss-step', boss: 'boss-u1', index: 1 },
          { kind: 'boss-step', boss: 'boss-u1', index: 2 },
          { kind: 'boss-step', boss: 'boss-u1', index: 3 },
        ],
      },
      {
        title: 'Phase 3 — The Second Scroll', kind: 'calculation',
        intro: '"Behold my trial data! Surely no villager can read a frequency table."',
        tasks: [
          {
            kind: 'step',
            context: 'The Herald\'s scroll (Practice 1.3–1.4 #1): two researchers each followed **40 Lyme disease patients** on a new antibody drug and recorded weeks of symptoms. Researcher B\'s table uses the course classes.',
            visual: { type: 'table', headers: ['Weeks of symptoms', 'Frequency'], rows: [['0.5–6.5', 4], ['6.5–12.5', 2], ['12.5–18.5', 11], ['18.5–24.5', 8], ['24.5–30.5', 6], ['30.5–36.5', 5], ['36.5–42.5', 3], ['42.5–48.5', 1]], caption: 'Researcher B — 40 patients' },
            step: {
              concept: 'freq-tables', dims: ['calculate', 'interpret'], label: 'Under half a year',
              prompt: 'What proportion of Researcher B\'s patients had symptoms for **fewer than 24.5 weeks** (less than about half a year)? Give a decimal.',
              answer: { kind: 'numeric', value: 0.625, tol: 0.002, wrong: [
                { value: 0.2, why: '0.2 is only the 18.5–24.5 class (8 ÷ 40). "Fewer than 24.5 weeks" needs every class up to 24.5 — the cumulative relative frequency.', misconception: 'cumulative-confusion' },
                { value: 25, why: '25 is the cumulative *frequency* — a count of patients. Divide by n = 40 to get a proportion.' },
              ] },
              explain: 'Cumulative frequency through 18.5–24.5: 4 + 2 + 11 + 8 = 25 patients. Proportion = 25 ÷ 40 = **0.625**.',
              hint: 'Add the frequencies of every class below 24.5 weeks, then divide by 40.',
            },
          },
          {
            kind: 'step',
            context: 'Researcher A\'s table shows a cumulative frequency of **7** patients through the 6.5–12.5 class; Researcher B\'s shows **6**. The Herald wants one number for both groups together.',
            step: {
              concept: 'freq-tables', dims: ['calculate', 'apply'], label: 'Both groups',
              prompt: 'What proportion of **all 80 subjects** had symptoms for about three months or less (the classes up to 12.5 weeks)? Give a decimal.',
              answer: { kind: 'numeric', value: 0.1625, tol: 0.002, wrong: [
                { value: 0.325, why: 'You added the two groups\' proportions (0.175 + 0.15). Proportions don\'t add like that — combine the counts first: (7 + 6) ÷ 80.' },
                { value: 13, why: '13 is the combined count of patients. Divide by the combined total of 80.' },
              ] },
              explain: '(7 + 6) ÷ (40 + 40) = 13 ÷ 80 = **0.1625**.',
              hint: 'Combine the counts from both researchers, then divide by the combined number of subjects.',
            },
          },
          { kind: 'gen', concept: 'freq-tables', level: 5, excludeTypes: ['free-response'] },
        ],
      },
      {
        title: 'Phase 4 — Whose Data?', kind: 'interpretation',
        intro: '"Researcher A studied people A knows personally — the most trustworthy folk in the village!"',
        tasks: [
          {
            kind: 'step',
            context: 'Researcher A acquired their sample by selecting **40 subjects they knew personally**.',
            step: {
              concept: 'sampling', dims: ['interpret', 'explain'], label: 'Researcher A',
              prompt: 'Why does this invalidate Researcher A\'s sample?',
              answer: { kind: 'mc', options: [
                { id: 'a', text: 'It is a convenience sample: people A knows weren\'t chosen at random and may differ systematically from all Lyme patients, so the results can be biased', correct: true, why: 'Non-random selection invites sampling bias — the statistic can over- or underestimate the truth.' },
                { id: 'b', text: '40 patients is too few to say anything', correct: false, why: 'Size isn\'t the flaw — Researcher B also used 40. The problem is *how* A chose them.' },
                { id: 'c', text: 'It\'s fine — A had no particular plan for choosing, so it is basically random', correct: false, why: 'Haphazard is not random. Random means chance decides who is chosen, not the researcher\'s social circle.', misconception: 'convenience-is-random' },
                { id: 'd', text: 'It is a cluster sample, so only one group is represented', correct: false, why: 'A cluster sample *randomly* selects whole groups. Researcher A didn\'t randomly select anything.' },
              ] },
              explain: 'Only random selection protects against sampling bias. A sample of acquaintances is a **convenience** sample.',
              hint: 'Did chance decide who was in the sample?',
            },
          },
          {
            kind: 'step',
            context: 'Researcher B acquired their sample by **randomly selecting a state hospital**, then using **all 40 Lyme disease patients** within that hospital.',
            step: {
              concept: 'sampling', dims: ['recognize', 'apply'], label: 'Researcher B',
              prompt: 'Which sampling method did Researcher B use?',
              answer: { kind: 'mc', options: [
                { id: 'a', text: 'Cluster', correct: true, why: 'Hospitals are the groups: one whole group was chosen at random, and everyone in it was used.' },
                { id: 'b', text: 'Stratified', correct: false, why: 'Stratified sampling would take a random sample of patients from **every** hospital, not all the patients from one.', misconception: 'stratified-vs-cluster' },
                { id: 'c', text: 'Simple random', correct: false, why: 'In a simple random sample every group of 40 patients is equally likely; here, patients from different hospitals can never end up in the same sample.' },
                { id: 'd', text: 'Convenience', correct: false, why: 'The hospital was chosen at random, not because it was easy to reach.' },
              ] },
              explain: 'Randomly choose whole groups and use everyone in them → **cluster** sampling.',
              hint: 'Was one whole group chosen, or some patients from every group?',
            },
          },
          { kind: 'boss-step', boss: 'boss-u1', index: 4 },
        ],
      },
      {
        title: 'Final Phase — The Council Decides', kind: 'final',
        intro: '"Bah! Even if my poll was crooked, a bigger poll would fix it — wouldn\'t it?"',
        tasks: [
          { kind: 'gen', concept: 'bias', generators: ['bi-bigger'], level: 6, excludeTypes: ['free-response'] },
          { kind: 'boss-step', boss: 'boss-u1', index: 6 },
        ],
      },
    ],
  },
};
