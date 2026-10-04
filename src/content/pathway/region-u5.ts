import type { RegionContent } from '../../engine/pathway/types';

/**
 * Region 5 — The Arena of Outcomes (Unit 5: Discrete Random Variables, Ch. 4; PDF pp. 28–30 notes 4.1–4.2,
 * pp. 3–4 practice key, pp. 24–27 notes + practice 4.3).
 * Course order: prob-dist → expected-value → transform (4.1–4.2), then binomial (4.3), interleaving as ideas return.
 * 17 levels → one mini-boss after level 9 (miniBossSlots(17) = [9]), right where Section 4.1–4.2 ends.
 * Every number computed with src/lib/stats/probability.ts (see .smoke/u5calc.ts).
 */

const SNOW_X = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SNOW_P = [0.33, 0.19, 0.14, 0.1, 0.07, 0.05, 0.04, 0.04, 0.02, 0.01, 0.01];

/** Darius Washington: X ~ B(3, 0.72). */
const P_WIN = 0.72 ** 3; // ≈ 0.373
const P_OT = 3 * 0.72 ** 2 * 0.28; // ≈ 0.435
const P_ONE = 3 * 0.72 * 0.28 ** 2; // ≈ 0.169
const P_LOSE = 1 - P_WIN - P_OT; // ≈ 0.191

export const REGION_U5: RegionContent = {
  region: {
    id: 'r5', unit: 'u5', number: 5, name: 'The Arena of Outcomes', subtitle: 'Discrete Random Variables',
    theme: 'arena', emoji: '🏟️',
    quote: 'No single throw can be foretold, but ten thousand throws settle on their expected value.',
    description: 'The Arena turns chance into numbers. Here you\'ll model **discrete random variables** with probability distributions, compute their **expected value** and **standard deviation**, see how fees and bet sizes **transform** them, and count successes with the **binomial distribution** — Sections 4.1–4.3 of the course.',
    learn: [
      'Discrete random variables and valid probability distributions: every P(x) between 0 and 1, all adding to 1',
      '"More than" vs. "at least" questions, the shape of a distribution, and the continuous uniform distribution',
      'Expected value E(X) = Σx·P(x) and the standard deviation of a random variable, read as long-run average and risk',
      'Fair games, and how a fee or a bigger bet (adding or multiplying by a constant) changes the mean, SD, and shape',
      'Combining two independent random variables, like playing two slot machines at once',
      'Binomial distributions: the four conditions, X ~ B(n, p), μ = np, σ = √(npq), and judging whether a result is surprising',
    ],
    landmarks: [
      { kind: 'arena', label: 'The Arena of Outcomes' },
      { kind: 'tower', label: 'The Tower of the Long Run', afterLevel: 'u5-ev-2' },
      { kind: 'bridge', label: 'The Bridge of Independent Trials', afterLevel: 'u5-mixed-1' },
      { kind: 'castle', label: 'The Free-Throw Citadel', afterLevel: 'u5-bn-precision' },
    ],
    boss: {
      name: 'The Colossus of Expectation', title: 'Titan of the Long Run', emoji: '🗿',
      description: 'A stone giant at the heart of the Arena who has watched ten thousand games and remembers only their averages. It insists the expected outcome must happen, and that any gamble it admires must be a smart one.',
      defeatLine: 'Cracks race across the stone. "Forty-one percent with the foul… sixty without it." The Colossus kneels in the sand. "I worshipped averages and forgot to compare the choices. Probability promises nothing about one night, but it should have guided that one."',
    },
    miniBosses: [
      { name: 'The Pit Boss of Plain Averages', emoji: '🎰', taunt: 'Lose $40, break even, or win $40: average them and you get $0. My slot machine is perfectly fair. Pull again!' },
      { name: 'Sir Charge-a-Fee', emoji: '💸', taunt: 'Pay my $5 table fee and your risk shrinks by $5 too. What a bargain!' },
      { name: 'The Hot-Hand Heckler', emoji: '🔥', taunt: 'He missed the last one, so the next one is cursed. Your "independent trials" are a fairy tale!' },
      { name: 'The At-Least-One Trickster', emoji: '🚦', taunt: 'Four lights, each 30% red, so P(at least one red) = 4 × 0.30 = 1.2. A sure thing, and then some!' },
    ],
  },

  levels: [
    /* ---------- 4.1–4.2 Probability distributions ---------- */
    {
      id: 'u5-dist-1', title: 'The Snow-Day Ledger', type: 'lesson', concepts: ['prob-dist'], lessonSteps: [0, 4],
      intro: 'Today you\'ll meet random variables and probability distributions, then use the rule that every distribution adds to 1 to find a missing probability and decide how likely a Maryland school year is to be extended.',
      npc: { npc: 'quill', text: 'A probability distribution is a complete list: every possible value, each with its chance, nothing left out. That is why the probabilities must add to exactly 1, and why one missing entry is never truly lost.' },
      generators: ['pd-missing', 'pd-valid', 'pd-range'],
      summary: [
        'A **discrete random variable** X has countable values; its **probability distribution** lists every value with its probability.',
        'Every P(x) is between 0 and 1, and all of them **add to 1**, so a missing probability is 1 minus the rest (snow days: 1 − 0.67 = 0.33).',
        '**More than 5** means 6, 7, 8, … (0.12 for snow days); **at least 3** includes 3 itself.',
      ],
    },
    {
      id: 'u5-dist-2', title: 'The Shape of Chance', type: 'lesson', concepts: ['prob-dist'], lessonSteps: [5, 7],
      intro: 'Today you\'ll draw a distribution as a histogram and describe its shape, then step into the continuous world with the uniform distribution, where probability is a fraction of an interval.',
      hook: {
        title: 'Dismissed early',
        body: 'Back at the Maryland high school, most years bring only a few snow days, but now and then a winter brings eight, nine, or ten. What does that do to the *picture* of the distribution?\n\nAnd on an early-dismissal snow day, school can end at **any** moment between 10:00 am and 1:00 pm. You can\'t list every possible moment in a table, so how do you find a probability?',
      },
      generators: ['pd-uniform', 'pd-range'],
      summary: [
        'The snow-day histogram has a long tail to the right: **skewed right**. Most years have few snow days; a few have many.',
        'A **continuous** random variable (like a time) can take any value in an interval, so we find probabilities of intervals, not single values.',
        '**Uniform** from 0 to 180: probability = interval length ÷ 180, so P(Y < 75) = 75/180 ≈ 0.4167.',
      ],
    },

    {
      id: 'u5-dist-precision', title: 'More Than or At Least?', type: 'precision', concepts: ['prob-dist'],
      intro: 'Today you\'ll defeat the three classic traps of reading a distribution: probabilities that don\'t add to 1, mixing up "more than" with "at least," and calling a measurement like time discrete.',
      hook: {
        title: 'One table, two answers',
        body: 'Practice 4.1–4.2 #1: the school year is extended if there are **more than 5** snow days. One student adds P(5) through P(10) and gets **0.17**. Another adds P(6) through P(10) and gets **0.12**.\n\nOnly one of them read the words correctly, and the gap between their answers is a whole column of the table. Which one is right? By the end of this level, you won\'t have to think twice.',
        visual: { type: 'probdist', x: SNOW_X, p: SNOW_P, xLabel: 'Number of snow days' },
      },
      generators: ['pd-range', 'pd-valid', 'pd-missing'],
      recall: [
        { prompt: 'Translate each phrase into an inequality: "more than 5," "at least 5," "at most 5," "fewer than 5."', answer: 'X > 5 (6, 7, …), X ≥ 5 (5, 6, …), X ≤ 5 (…, 4, 5), X < 5 (…, 3, 4). "More than" and "fewer than" **exclude** 5; "at least" and "at most" **include** it.' },
      ],
      summary: [
        '**More than** and **fewer than** exclude the boundary; **at least** and **at most** include it. For snow days, P(X > 5) = 0.12 but P(X ≥ 5) = 0.17.',
        'Check every distribution: each P(x) between 0 and 1, and ΣP(x) = 1.',
        '**Counts** (snow days, movies seen) are discrete; **measurements** like time are continuous.',
      ],
    },
    /* ---------- 4.1–4.2 Expected value & SD ---------- */
    {
      id: 'u5-ev-1', title: 'The House Edge', type: 'lesson', concepts: ['expected-value'], lessonSteps: [0, 3],
      intro: 'Today you\'ll discover expected value, the long-run average of a random variable, by betting $100 on black at a roulette wheel and watching what happens over thousands of spins.',
      npc: { npc: 'odalys', text: 'The casino can\'t know who wins the next spin, but it knows almost exactly what it earns per thousand. That certainty has a name: expected value.' },
      generators: ['ev-compute', 'ev-terms', 'ev-game'],
      summary: [
        '$E(X) = \\sum x \\cdot P(x)$ is a **weighted average**: likelier outcomes count more.',
        'A $100 bet on black: E(X) = 100(18/38) + (−100)(20/38) ≈ **−$5.26** per bet, about $5,263 lost over 1,000 bets.',
        'Single bets swing by about $100 either way (σ ≈ $99.86), but the long-run average settles on E(X).',
      ],
    },
    {
      id: 'u5-dist-practice', title: 'Plain Average or Weighted?', type: 'practice', concepts: ['prob-dist', 'expected-value'],
      intro: 'Today you\'ll work distribution problems on your own ("more than" and "at least" sums, uniform intervals, and building a game\'s distribution) and compute expected values straight from a table.',
      hook: {
        title: 'How many movies?',
        body: 'Example 1 (p.28) surveys a class: X = the number of *Pirates of the Caribbean* movies a student has seen, from 0 to 5. A table of P(X) turns that survey into a probability distribution.\n\nPart (c) asks for the plain average of the X\'s, (0 + 1 + 2 + 3 + 4 + 5)/6 = 2.5, and whether it represents the center. It only would if every value were equally likely. The **expected value** fixes this by weighting each value by its probability.',
      },
      generators: ['pd-range', 'pd-uniform', 'pd-game', 'ev-compute'],
      summary: [
        'Missing probability = 1 − (sum of the others).',
        'Uniform: probability = length of the interval ÷ total length.',
        'E(X) multiplies each value by its probability and adds. A plain average of the x-values ignores how likely each one is (snow days: the plain average of 0 through 10 is 5, but E(X) = 2.17, as the next level shows).',
      ],
    },
    {
      id: 'u5-ev-2', title: 'Making the Game Fair', type: 'lesson', concepts: ['expected-value'], lessonSteps: [4, 7],
      intro: 'Today you\'ll compute a mean and standard deviation from a distribution table, interpret both in context, and solve for the grand prize that makes a spinner game fair.',
      hook: {
        title: 'A $3 spinner',
        body: 'Practice 4.1–4.2 #2: a spinner has **16 equal sections**. Half pay $1, four pay $5, three pay nothing, and one will be the **grand prize**. It costs $3 to play.\n\nHow big must the grand prize be so that neither the player nor the house has an advantage? First, you\'ll warm up on the snow days.',
      },
      npc: { npc: 'thorne', text: 'Fair means E(X) = 0, exactly. Write the expected value with the unknown prize in it, set it equal to zero, and let the algebra do the bargaining.' },
      generators: ['ev-compute', 'ev-sd', 'ev-fair'],
      summary: [
        'Snow days: μ = 2.17 days and σ ≈ 2.409 days. You can\'t have 2.17 snow days, but the long-run average can be 2.17.',
        '$\\sigma^2 = \\sum x^2 P(x) - \\mu^2$: the mean of the squares minus the square of the mean.',
        'A game is **fair** when E(X) = 0; the spinner needs a $20 grand prize.',
      ],
    },
    {
      id: 'u5-ev-experiment', title: 'Fair Isn\'t Safe', type: 'experiment', concepts: ['expected-value'],
      intro: 'Today you\'ll run casino games side by side and discover what E(X) predicts, what it doesn\'t, and what the standard deviation adds to the story.',
      predict: {
        prompt: 'The spinner game with a $20 grand prize is **fair**: E(X) = $0. You play it just **10 times**. What should you expect?',
        input: {
          type: 'mc', options: [
            { id: 'a', text: 'Your average winnings will be exactly $0, because the game is fair', why: 'E(X) describes the long run. Ten plays are far too few for the average to lock onto $0.' },
            { id: 'b', text: 'Your average could land noticeably above or below $0; only over many plays does it settle near $0', correct: true, why: 'Short runs wander. The running average approaches E(X) as the number of plays grows.' },
            { id: 'c', text: 'You will lose money, because every play costs $3', why: 'The $3 cost is already built into the net winnings (−$3, −$2, +$2, +$17), and those outcomes balance out to E(X) = 0.' },
          ],
        },
        reveal: 'Ten plays can easily leave you ahead or behind. **E(X) is a long-run average**: it predicts where your average settles over many plays, not what happens in one short session.',
      },
      widget: {
        id: 'expected-value', props: { preset: 'spinner' },
        mission: '1. On the **Spinner** game, press **Play 10** a few times (Reset between runs) and note how much *Your average* jumps around.\n2. Now press **Play 10,000** and watch the running-average line flatten onto E(X) = $0.\n3. Switch to **$100 on black** and repeat. Compare the two σ values ($4.77 vs. $99.86) and how wildly each line wobbles before it settles.',
        takeaway: 'Every running average settles on its E(X): $0 for the spinner, −$5.26 for roulette. σ measures how wild the ride is on the way there. Roulette\'s σ is more than 20 times the spinner\'s, so its short-run results swing far more. E(X) is the long-run center; σ is the risk.',
      },
      generators: ['ev-game', 'ev-terms', 'ev-sd'],
      summary: [
        'E(X) predicts the **long-run** average, not the result of a few plays.',
        'σ measures risk: the spinner (σ ≈ $4.77) and roulette (σ ≈ $99.86) differ hugely in how much single results swing.',
        'A fair game (E = 0) can still win or lose money in the short run.',
      ],
    },

    /* ---------- 4.1–4.2 Transforming & combining ---------- */
    {
      id: 'u5-tr-1', title: 'Slide and Stretch', type: 'lesson', concepts: ['transform'], lessonSteps: [0, 6],
      intro: 'Today you\'ll find out what happens to a random variable\'s mean, standard deviation, and shape when a casino charges a fee or you cut your bet in half, and how to combine two independent slot machines into one distribution.',
      generators: ['tr-linear', 'tr-concept'],
    },
    {
      id: 'u5-mixed-1', title: 'Trial of the Casino Floor', type: 'mixed', concepts: ['prob-dist', 'expected-value', 'transform'],
      intro: 'Today you\'ll switch rapidly between distributions, expected values, and transformations: the exact mix the Pit Boss is waiting to test.',
      hook: {
        title: 'One evening, three tools',
        body: 'A night on the casino floor of Section 4.1–4.2:\n\n- Is a payout table a **valid** distribution? Check that each probability is between 0 and 1 and that they add to 1.\n- What does a $100 bet on black earn **in the long run**? E(X) ≈ −$5.26.\n- What changes when the table adds a **$5 fee**? E(X) ≈ −$10.26, but σ stays ≈ $99.86.\n\nEach problem below needs a different tool. Decide which one before you calculate.',
      },
      generators: ['pd-valid', 'pd-range', 'ev-compute', 'ev-game', 'tr-linear', 'tr-concept'],
      summary: [
        'Valid distribution: each P(x) between 0 and 1, and the probabilities sum to 1.',
        'E(X) = Σx·P(x) is the long-run average; σ measures risk.',
        'A fee shifts the mean but not σ; scaling the bet scales both.',
      ],
    },

    /* ---------- 4.3 Binomial distributions ---------- */
    {
      id: 'u5-bn-1', title: 'Three Shots at the Buzzer', type: 'lesson', concepts: ['binomial'], lessonSteps: [0, 3],
      intro: 'Today you\'ll step to the free-throw line with Darius Washington, find the chances of a win, a loss, or overtime, and learn the four conditions that make a situation binomial.',
      npc: { npc: 'juno', text: 'Watch the probabilities update after every shot. Each free throw is the same 72% gamble no matter what happened on the last one, and that is the key to all of Section 4.3.' },
      generators: ['bn-conditions', 'bn-exact', 'bn-mean-sd'],
      summary: [
        'Win = 0.72³ ≈ **0.373**; overtime = 3(0.72²)(0.28) ≈ **0.435** (three orders); lose ≈ **0.191**.',
        '**BINS**: **B**inary outcomes, **I**ndependent trials, a fixed **N**umber of trials, the **S**ame p each time.',
        'Then X ~ B(n, p), with μ = np and σ = √(npq), where q = 1 − p.',
      ],
    },
    {
      id: 'u5-tr-precision', title: 'The Fee That Fooled Everyone', type: 'precision', concepts: ['transform', 'expected-value'],
      intro: 'Today you\'ll defeat the two transformation traps (believing a fee changes the spread, and scaling the variance by c instead of c²) using the roulette bet you already know.',
      hook: {
        title: 'The $5 table',
        body: 'Example 2 (p.29): a $100 bet on black has E(X) ≈ −$5.26 and σ ≈ $99.86. A casino table now charges **$5 per bet**.\n\nOne gambler says the fee makes the bet less risky: "σ drops to $94.86." Another says it makes the bet riskier: "σ jumps to $104.86." Who is right? By the end of this level you\'ll know, and you\'ll know why.',
      },
      generators: ['tr-linear', 'tr-concept', 'ev-sd'],
      recall: [
        { prompt: 'A random variable has mean $20 and SD $6. Give the new mean and SD after (a) adding $5 to every outcome and (b) doubling every outcome.', answer: '(a) Mean $25, SD $6: adding shifts the center only. (b) Mean $40, SD $12: multiplying scales both, and the variance goes from 36 to 144 (×2² = 4).' },
      ],
      summary: [
        'Neither gambler: subtracting $5 moves every outcome equally, so **σ stays ≈ $99.86** while E(X) drops to ≈ −$10.26.',
        'Multiply or divide by c: the mean and σ scale by c, and the **variance by c²** (half bet: E ≈ −$2.63, σ ≈ $49.93).',
        'Shape never changes under either transformation.',
      ],
    },
    {
      id: 'u5-bn-2', title: 'The Pop Quiz and the Free Lunch', type: 'lesson', concepts: ['binomial'], lessonSteps: [4, 8],
      intro: 'Today you\'ll use technology to find binomial probabilities for Mr. Halter\'s pop quiz, compute a binomial standard deviation, and decide whether only 10 free-lunch winners out of 250 customers is suspicious.',
      hook: {
        title: 'POP QUIZ!',
        body: 'Example 2 (p.25): Mr. Halter springs a surprise quiz of **ten multiple-choice questions with four choices each**. You haven\'t studied, so you guess on every one.\n\nEach guess is right with probability 0.25, independently of the others. How many should you expect to get right, and what are your chances of a respectable score?',
      },
      generators: ['bn-mean-sd', 'bn-exact', 'bn-surprise'],
      summary: [
        'Pop quiz X ~ B(10, 0.25): μ = 2.5 correct, σ ≈ 1.369, P(X = 6) ≈ 0.0162.',
        'Independence matters: traffic lights on a pre-programmed cycle would break the binomial model.',
        'Draw a three: P(X ≤ 10) ≈ 0.013. Judge surprise with "this extreme or more," not with one exact value.',
      ],
    },
    {
      id: 'u5-bn-lab', title: 'The Penalty Kick Drill', type: 'graph-lab', concepts: ['binomial'],
      intro: 'Today you\'ll read binomial histograms in the explorer: find the most likely number of goals in a six-kick drill and the chance of five or more, then compare two towns\' traffic lights.',
      predict: {
        prompt: 'A professional soccer player converts **75%** of penalty kicks and takes **6** in a practice drill. Which number of goals is **most likely**?',
        input: {
          type: 'mc', options: [
            { id: 'a', text: '6, because she almost always scores', why: 'P(X = 6) = 0.75⁶ ≈ 0.178. Making all six in a row is less likely than missing exactly one.' },
            { id: 'b', text: '5', correct: true, why: 'P(X = 5) ≈ 0.356 is the tallest bar: a single miss can happen in any of 6 positions.' },
            { id: 'c', text: '4.5, because that is the mean', why: 'μ = np = 4.5 is the long-run average, but X counts goals and can never equal 4.5.', misconception: 'ev-must-occur' },
            { id: 'd', text: '4', why: 'P(X = 4) ≈ 0.297. Close, but the bar at 5 is taller.' },
          ],
        },
        reveal: 'The tallest bar is at **5 goals** (≈ 0.356), even though the mean is μ = 4.5. With p = 0.75 the distribution is skewed left, and about 83% of drills end with 4, 5, or 6 goals.',
      },
      widget: {
        id: 'binomial', props: { n: 6, p: 0.75 },
        mission: '1. Press **Penalty kicks** (n = 6, p = 0.75). With **X ≥ k** and k = 5, read P(X ≥ 5): the chance she wins her teammates\' lunch bet.\n2. Switch to **X = k** and slide k from 0 to 6. Which bar is tallest? Where does the μ line sit?\n3. Now model traffic lights. Mount Airy: set n = 4, p = 0.30 and note μ and σ. New Market: n = 3, p = 0.45. Which town stops you more often on average? Which is more consistent?',
        takeaway: 'Penalty kicks: P(X ≥ 5) ≈ 0.534, μ = 4.5 goals, σ ≈ 1.061. Mount Airy M ~ B(4, 0.30): μ = 1.2 stops, σ ≈ 0.917. New Market N ~ B(3, 0.45): μ = 1.35 stops, σ ≈ 0.862. You expect **more** stops in New Market, and its smaller σ makes the pattern **more consistent**.',
      },
      generators: ['bn-exact', 'bn-compare', 'bn-mean-sd'],
      summary: [
        'The most likely value (the tallest bar) need not equal the mean μ = np.',
        'Penalty kicks B(6, 0.75): P(X ≥ 5) ≈ 0.534, μ = 4.5, σ ≈ 1.061.',
        'Compare binomial variables by μ (how many on average) and σ (how consistent).',
      ],
    },
    {
      id: 'u5-bn-precision', title: 'Binomial Traps on Route 27', type: 'precision', concepts: ['binomial', 'prob-dist'],
      intro: 'Today you\'ll target the five binomial traps: broken conditions, np as the SD, swapping p and q, "more than" versus "at least," and the "at least one" shortcut.',
      npc: { npc: 'vera', text: 'Before you type anything into Stapplet, check the conditions. A flawless binomial calculation on a situation that isn\'t binomial is still wrong.' },
      hook: {
        title: 'Red lights on Route 27',
        body: 'Practice 4.3 #2: four traffic lights in Mount Airy each turn red with probability **0.30**, and they do **not** run on a pre-programmed cycle. M = the number of red lights you hit.\n\nA classmate writes: "σ = np = 1.2 lights, and P(at least one red) = 4(0.30) = 1.2." That is two mistakes in one line, and the second one is a "probability" bigger than 1. Find both before you start.',
      },
      generators: ['bn-conditions', 'bn-mean-sd', 'bn-exact', 'pd-range'],
      recall: [
        { prompt: 'Why is P(at least one red light) = 1 − P(no red lights), and what is it for Mount Airy?', answer: '"At least one" covers every outcome except "none," so subtract P(none) from 1: 1 − 0.70⁴ = 1 − 0.2401 ≈ **0.760**.' },
      ],
      summary: [
        'σ = √(npq), never np: Mount Airy σ = √(4 · 0.30 · 0.70) ≈ 0.917 lights (μ = np = 1.2).',
        'P(at least one) = 1 − P(none) = 1 − 0.70⁴ ≈ 0.760.',
        'p is the probability of the outcome you are **counting**; q = 1 − p.',
        '"At least 5" includes 5; "more than 5" does not.',
      ],
    },
    {
      id: 'u5-bn-teach', title: 'Explain the Binomial', type: 'teach', concepts: ['binomial'],
      intro: 'Today you\'ll teach the binomial distribution in your own words: when it applies, how to write X ~ B(n, p), and what μ = np and σ = √(npq) mean in context.',
      hook: {
        title: 'A friend who missed class',
        body: 'A friend asks: "Why can we model Darius Washington\'s three free throws with B(3, 0.72), but we couldn\'t model traffic lights that run on a pre-programmed cycle as binomial?"\n\nExplain it so they could solve the pop-quiz problem on their own: the four conditions, the notation, and what the mean and standard deviation tell you.',
      },
      summary: [
        'Binomial when there are two outcomes, a fixed n, independent trials, and the same p; then X ~ B(n, p).',
        'μ = np is the long-run average number of successes; σ = √(npq) is the typical distance from it.',
        'Pop quiz: μ = 2.5 correct answers, σ ≈ 1.37.',
      ],
    },
    {
      id: 'u5-challenge', title: 'The Lunch-Bet Gambit', type: 'challenge', concepts: ['binomial', 'expected-value', 'transform'],
      intro: 'Today you\'ll combine everything in this region (binomial probabilities, expected value, and transformations) on exam-level problems with no hints and no scaffolding.',
      hook: {
        title: 'Lunch on the line',
        body: 'Practice 4.3 #1f: a soccer player who converts **75%** of penalty kicks takes **6** in a drill. Her teammates bet that if she converts **five or more**, they\'ll buy her lunch (about $10). Y = the money she wins from the bet.\n\nTechnology gives P(X ≥ 5) ≈ 0.534. Build the distribution of Y: what is the bet worth to her, on average, per drill? Every problem below chains tools together like this.',
      },
      generators: ['bn-exact', 'bn-surprise', 'bn-compare', 'ev-fair', 'ev-game', 'tr-sum'],
      summary: [
        'Lunch bet: Y = $10 with probability P(X ≥ 5) ≈ 0.534, otherwise $0, so E(Y) ≈ **$5.34** per drill.',
        'Chain the tools: check BINS → technology for P(X ≥ k) → E(X) = Σx·P(x).',
        'Judge surprise with "this extreme or more," and always interpret in context.',
      ],
    },
    {
      id: 'u5-review', title: 'The Arena Gauntlet', type: 'review', concepts: ['binomial', 'expected-value', 'transform', 'prob-dist'],
      intro: 'Today you\'ll review the whole region in one sweep (distributions, expected value and SD, transformations, and binomial models) before you face the Colossus of Expectation.',
      npc: { npc: 'quill', text: 'The Colossus will ask whether a strategy was smart. Every answer comes back to one question: which choice gives the better probability?' },
      generators: ['bn-exact', 'bn-mean-sd', 'bn-conditions', 'ev-compute', 'ev-sd', 'tr-linear', 'tr-concept', 'pd-range', 'pd-missing'],
    },
  ],

  encounters: [
    {
      id: 'u5-enc-shrine', kind: 'shrine', afterLevel: 'u5-dist-2', title: 'The Shrine of Countable Things', concepts: ['prob-dist'],
      npc: { npc: 'juno', text: 'Ask one question of any variable: could I count it, or would I measure it?' },
      question: {
        prompt: 'Which of these random variables is **continuous**?',
        input: {
          type: 'mc', options: [
            { id: 'a', text: 'X = number of snow days at a Maryland high school in a random school year', why: 'A count (0, 1, 2, …), so it is discrete.', misconception: 'discrete-vs-continuous' },
            { id: 'b', text: 'X = number of *Pirates of the Caribbean* movies a student has seen', why: 'Also a count (0 to 5): discrete.', misconception: 'discrete-vs-continuous' },
            { id: 'c', text: 'Y = minutes after 10 am that school ends on an early-dismissal day', correct: true, why: 'Time can take any value in the interval from 0 to 180 minutes, so Y is continuous. That is why the course models it with a uniform distribution.' },
            { id: 'd', text: 'X = number of free throws Darius Washington makes in 3 attempts', why: 'Only 0, 1, 2, or 3 are possible: discrete (binomial, in fact).', misconception: 'discrete-vs-continuous' },
          ],
        },
        explain: '**Counts** are discrete; **measurements** like time are continuous. For a continuous variable you find probabilities of *intervals*, like P(Y < 75) = 75/180 ≈ 0.4167, not of single values.',
      },
    },
    {
      id: 'u5-enc-formula', kind: 'lost-formula', afterLevel: 'u5-ev-2', title: 'The Shattered Variance Tablet', concepts: ['expected-value'], formula: 'rv-variance',
      npc: { npc: 'thorne', text: 'Two sums and one subtraction. Forget the − μ² and the tablet crumbles all over again.' },
    },
    {
      id: 'u5-enc-slots', kind: 'lab', afterLevel: 'u5-tr-1', title: 'The Twin Slot Machines', concepts: ['transform', 'expected-value'],
      npc: { npc: 'odalys', text: 'Two independent games, one wallet. Multiply the probabilities to build the new distribution, then let the machines run.' },
      widget: {
        id: 'expected-value', props: { preset: 'slots' },
        mission: 'Practice 4.1–4.2 #3: one $20 slot machine doubles your bet 20% of the time, a second one 30% of the time, and you play both. Choose **Two slot machines (Z)**, where Z = −$40 (0.56), $0 (0.38), or +$40 (0.06). Play 10 rounds, then 10,000, and watch your average per round settle. Read off E(Z) and σ.',
        takeaway: 'Your average settles at E(Z) = −$20 per round, with σ ≈ $24.33 (σ² = 592). That −$20 is exactly the two machines\' separate averages combined: −$12 + (−$8). Combining independent games builds a brand-new distribution with the multiplication rule.',
      },
    },
    {
      id: 'u5-enc-scholar', kind: 'scholar', afterLevel: 'u5-bn-lab', title: 'The Quizmaster\'s Riddle', concepts: ['binomial'],
      question: {
        prompt: 'Mr. Athey thinks Mr. Halter\'s 4-choice pop quiz is too harsh, so his 10-question quiz offers only **3** choices per question. For a student who guesses on everything, how do the two quizzes compare?',
        input: {
          type: 'mc', options: [
            { id: 'a', text: 'Athey\'s quiz gives a higher mean **and** more variability', correct: true, why: 'Y ~ B(10, 1/3): μ ≈ 3.33 and σ = √(10 · ⅓ · ⅔) ≈ 1.491, versus μ = 2.5 and σ ≈ 1.369 for X ~ B(10, 0.25).' },
            { id: 'b', text: 'Athey\'s quiz gives a higher mean but less variability', why: 'σ = √(npq), and 10(1/3)(2/3) ≈ 2.22 is bigger than 10(0.25)(0.75) = 1.875, so Athey\'s scores vary more.' },
            { id: 'c', text: 'Both have the same SD, because both have n = 10', why: 'σ depends on p as well as n: σ = √(npq).' },
            { id: 'd', text: 'Halter\'s quiz gives the higher mean, because it has more answer choices', why: 'More choices means a smaller chance of guessing right: p = 0.25 < 1/3, so μ = np is smaller.' },
          ],
        },
        explain: 'Halter: μ = 2.5, σ ≈ 1.369. Athey: μ ≈ 3.33, σ ≈ 1.491. Athey\'s students score higher on average, with more spread, and are more likely to get 6 or more right: P(Y ≥ 6) ≈ 0.077 vs. P(X ≥ 6) ≈ 0.020.',
      },
    },
  ],

  boss: {
    id: 'boss-u5',
    story: '2005 Conference USA final: Louisville leads Memphis **75–73** with no time left. Darius Washington, a **72%** free-throw shooter, was fouled on a three-point attempt and gets **3 free throws**. Make all 3 and Memphis wins; make 2 and the game goes to overtime; make 0 or 1 and Memphis loses. Had Louisville *not* fouled, his three-pointer would have gone in **40%** of the time.\n\nAt the heart of the Arena, the Colossus of Expectation replays the moment and proclaims Louisville\'s foul a stroke of genius. Model the free throws, compute every outcome, and deliver the verdict: was fouling smart?',
    visual: { type: 'table', headers: ['Free throws made (X)', '0', '1', '2', '3'], rows: [['Result', 'Memphis loses', 'Memphis loses', 'Overtime', 'Memphis wins']], caption: 'Memphis trails 75–73 with no time left' },
    source: { pages: [24, 25, 29, 30, 3], section: 'Unit 5 — 4.3 Example 1 (Darius Washington), with 4.1–4.2 distributions and transformations' },
    phases: [
      {
        title: 'Phase 1 — Recognition', kind: 'recognition',
        intro: '"Three free throws, one shooter. Name the model, mortal, or be crushed beneath it."',
        tasks: [
          { kind: 'boss-step', boss: 'boss-u5', index: 0 },
          {
            kind: 'step',
            context: 'Memphis trails 75–73. X = free throws made out of 3.',
            step: {
              concept: 'binomial', dims: ['recognize'], label: 'Losing event',
              prompt: 'Memphis **loses** in regulation if Washington makes 0 or 1 free throw. Which event is that?',
              answer: {
                kind: 'mc', options: [
                  { id: 'a', text: 'X ≤ 1', correct: true, why: '"0 or 1 made" means "at most 1": X ≤ 1 includes the boundary value 1.' },
                  { id: 'b', text: 'X < 1', why: 'X < 1 is only X = 0. Making exactly one free throw also loses the game.', misconception: 'strict-vs-inclusive' },
                  { id: 'c', text: 'X ≥ 1', why: 'X ≥ 1 means 1, 2, or 3 makes, which includes the overtime and win outcomes.' },
                  { id: 'd', text: 'X = 1', why: 'Zero makes loses too, so the event needs both values.' },
                ],
              },
              explain: 'Lose ↔ X ≤ 1 (X = 0 or 1). Overtime ↔ X = 2. Win ↔ X = 3. The three events cover every possible outcome exactly once.',
              hint: 'List the values of X that lose, then pick the inequality that includes exactly those.',
            },
          },
        ],
      },
      {
        title: 'Phase 2 — Calculation', kind: 'calculation',
        intro: '"Calculate if you must. The expected outcome always happens anyway."',
        tasks: [
          { kind: 'boss-step', boss: 'boss-u5', index: 1 },
          { kind: 'boss-step', boss: 'boss-u5', index: 2 },
          {
            kind: 'step',
            step: {
              concept: 'prob-dist', dims: ['calculate'], label: 'Lose',
              prompt: 'Win, overtime, and lose form a probability distribution. With P(win) = P(X = 3) ≈ 0.373 and P(overtime) = P(X = 2) ≈ 0.435, find P(Memphis loses) = P(X ≤ 1).',
              answer: {
                kind: 'numeric', value: P_LOSE, tol: 0.002,
                wrong: [
                  { value: 1 - P_WIN, misconception: 'dist-sum-1', why: '1 − 0.373 is P(Memphis doesn\'t win outright), which still includes overtime. Subtract both win and overtime from 1.' },
                  { value: P_ONE, misconception: 'strict-vs-inclusive', why: 'That is P(X = 1) only. Zero makes (P ≈ 0.022) also loses, so include it.' },
                ],
              },
              explain: 'The three results cover every possibility, so they add to 1: P(lose) = 1 − 0.373 − 0.435 ≈ **0.192** (0.191 with unrounded values). Check: P(X = 0) + P(X = 1) ≈ 0.022 + 0.169 ≈ 0.191.',
              hint: 'All probabilities in a distribution add to 1.',
            },
          },
          { kind: 'boss-step', boss: 'boss-u5', index: 3 },
        ],
      },
      {
        title: 'Phase 3 — Interpretation', kind: 'interpretation',
        intro: '"He averages 2.16 makes, so 2.16 makes he shall have!"',
        tasks: [
          {
            kind: 'step',
            step: {
              concept: 'binomial', dims: ['interpret'], label: 'Mean',
              prompt: 'For X ~ B(3, 0.72), μ = np = 2.16. Which is the correct interpretation?',
              answer: {
                kind: 'mc', options: [
                  { id: 'a', text: 'If Washington shot three free throws in many situations like this, he would make about 2.16 of them on average', correct: true, why: 'μ is a long-run average over many repetitions of the three-shot trip to the line.' },
                  { id: 'b', text: 'Washington will make 2.16 of these three free throws', why: 'Nobody can make 2.16 free throws. The mean need not be a possible value; it describes the long run.', misconception: 'ev-must-occur' },
                  { id: 'c', text: 'Washington will most likely make exactly 2, so the game will go to overtime', why: 'X = 2 is the most likely single value (≈ 0.435), but that is not what μ means, and 0.435 is still less than half.' },
                  { id: 'd', text: '2.16 is the standard deviation of the number of makes', why: 'np is the mean. The SD is √(npq) ≈ 0.778.', misconception: 'binom-sd-np' },
                ],
              },
              explain: 'μ = 3(0.72) = 2.16 free throws: in the long run, a 72% shooter makes about 2.16 of every 3 free throws on average, even though any single trip ends in 0, 1, 2, or 3.',
              hint: 'The mean is a long-run average. Does it have to be a possible value?',
            },
          },
          {
            kind: 'step',
            context: 'Memphis has 73 points before the free throws.',
            step: {
              concept: 'transform', dims: ['interpret', 'calculate'], label: 'Final score',
              prompt: 'Memphis\'s score after the free throws is S = 73 + X, where X ~ B(3, 0.72) has μ = 2.16 and σ ≈ 0.778. What are the mean and standard deviation of S?',
              answer: {
                kind: 'mc', options: [
                  { id: 'a', text: 'Mean 75.16 points, SD ≈ 0.778 points', correct: true, why: 'Adding the constant 73 shifts the center by 73 but leaves the spread unchanged.' },
                  { id: 'b', text: 'Mean 75.16 points, SD ≈ 73.78 points', why: 'Adding a constant doesn\'t change the spread: every outcome moves up by the same 73 points.', misconception: 'add-const-sd' },
                  { id: 'c', text: 'Mean 2.16 points, SD ≈ 0.778 points', why: 'Those describe X, the free throws made. Adding 73 shifts the mean to 75.16.' },
                  { id: 'd', text: 'Mean 157.68 points, SD ≈ 56.77 points', why: 'That multiplies by 73. S adds 73 to X; it doesn\'t multiply it.' },
                ],
              },
              explain: 'E(S) = 73 + 2.16 = **75.16** points, and the SD of S equals the SD of X, ≈ **0.778** points. Adding a constant slides the distribution; its spread and shape stay the same.',
              hint: 'Add slides, multiply stretches.',
            },
          },
        ],
      },
      {
        title: 'Phase 4 — Application', kind: 'application',
        intro: '"Nerves, streaks, coin-flip overtimes: nothing can crack my verdict that the foul was genius."',
        tasks: [
          {
            kind: 'step',
            step: {
              concept: 'binomial', dims: ['apply', 'recognize'], label: 'Nerves',
              prompt: 'A commentator claims Washington tightens up after a miss, so his chance on the next shot drops below 72%. If that were true, why would B(3, 0.72) be the wrong model?',
              answer: {
                kind: 'mc', options: [
                  { id: 'a', text: 'The shots would no longer be independent with the same p: the chance of a make would depend on the previous shot', correct: true, why: 'A binomial model requires independent trials with the same probability of success on every trial.' },
                  { id: 'b', text: 'There would no longer be a fixed number of trials', why: 'He still takes exactly 3 free throws, so n = 3 is fixed.', misconception: 'binom-conditions' },
                  { id: 'c', text: 'Each free throw would have more than two outcomes', why: 'Each shot is still a make or a miss.', misconception: 'binom-conditions' },
                  { id: 'd', text: 'Nothing changes, as long as his season average is 72%', why: 'A season average can\'t rescue the model if each shot\'s chance depends on the last result: the trials would be dependent.', misconception: 'binom-conditions' },
                ],
              },
              explain: 'The model assumes each free throw is an independent trial with the same p = 0.72. It is the same assumption the traffic-light problem protects by saying the lights do not run on a pre-programmed cycle.',
              hint: 'Check BINS. Which conditions would the commentator\'s claim break?',
            },
          },
          { kind: 'boss-step', boss: 'boss-u5', index: 4 },
          { kind: 'gen', concept: 'expected-value', generators: ['ev-fair', 'ev-game'], level: 6, excludeTypes: ['free-response'] },
        ],
      },
      {
        title: 'Final Phase — The Verdict', kind: 'final',
        intro: '"Weigh the foul against my stone certainty, if you dare."',
        tasks: [
          { kind: 'gen', concept: 'binomial', generators: ['bn-surprise', 'bn-compare'], level: 6, excludeTypes: ['free-response'] },
          { kind: 'boss-step', boss: 'boss-u5', index: 5 },
        ],
      },
    ],
  },
};
