import type { RegionContent } from '../../engine/pathway/types';

/**
 * Region 4 — The Whispering Woods of Chance (Unit 4: Probability, Section 3.1–3.5, PDF pp. 31–42 and the
 * practice key pp. 5–9). Course order: prob-basics → prob-rules → conditional → independence → trees-venn.
 * 22 levels → mini-bosses land after levels 7 and 15. Every number below was computed with the stats engine
 * (.smoke/u4-numbers.ts) and matches the packet's key.
 */
export const REGION_U4: RegionContent = {
  region: {
    id: 'r4', unit: 'u4', number: 4, name: 'The Whispering Woods of Chance', subtitle: 'Probability',
    theme: 'woods', emoji: '🌲',
    quote: 'A single flip is a whisper anyone can mishear; ten thousand flips speak plainly.',
    description: 'The Whispering Woods are where randomness lives: you will describe chance with **sample spaces** and **events**, and treat probability as a long-run relative frequency. Then you will combine probabilities with the complement, addition, and multiplication rules, condition on what you already know, test whether events are **independent**, and untangle multi-stage problems with **tree** and **Venn diagrams** — all from Section 3.1–3.5 of the course packet.',
    learn: [
      'Sample spaces, events, and probability as a long-run relative frequency (experimental vs. theoretical)',
      'The complement rule, the addition rule for "or", and mutually exclusive events',
      'Conditional probability P(A | B) from two-way tables and from percentages',
      'Independence, the multiplication rule for "and", and "at least one" = 1 − P(none)',
      'Tree diagrams (multiply along, add across, reverse conditionals) and Venn diagrams (only A, both, only B, neither)',
    ],
    landmarks: [
      { kind: 'gate', label: 'The Coin-Toss Gate' },
      { kind: 'bridge', label: 'The Overlap Bridge', afterLevel: 'u4-rules-2' },
      { kind: 'camp', label: 'The Card-Sharps\' Camp', afterLevel: 'u4-indep-1' },
      { kind: 'forest', label: 'The Branching Grove', afterLevel: 'u4-trees-1' },
    ],
    boss: {
      name: 'The Oddskeeper', title: 'Keeper of the Crooked Odds', emoji: '🎲',
      description: 'A hooded dice-roller who guards the clinic at the heart of the woods, handing every traveler a rapid flu-test result and daring them to say what a positive really means — knowing most will answer the reverse question.',
      defeatLine: 'The Oddskeeper\'s bone dice clatter to a stop. "Point nine one three, not point nine six three… You read my tree the right way round. The woods are yours."',
    },
    miniBosses: [
      { name: 'The Gambler\'s Ghost', emoji: '👻', taunt: 'Five tails in a row — heads is *due*! The coin remembers, and so do I.' },
      { name: 'The Backwards Owl', emoji: '🦉', taunt: 'Who-who cares which side of the bar? P(A | B), P(B | A) — it\'s all the same to me!' },
      { name: 'The Double-Counting Toad', emoji: '🐸', taunt: 'Sport or club? Ninety-five plus one hundred twenty-four! Why ever would I subtract the ones who do both?' },
      { name: 'Madame Mutex', emoji: '🕸️', taunt: 'Two events that never meet must surely ignore each other. Independent — obviously!' },
    ],
  },

  levels: [
    /* ---------- 3.1 Probability basics ---------- */
    {
      id: 'u4-basics-1', title: 'Is the Coin Fair?', type: 'lesson', concepts: ['prob-basics'], lessonSteps: [0, 3],
      intro: 'Today you\'ll learn the language of chance — experiment, outcome, sample space, event — and the difference between probability you *observe* and probability you *predict*.',
      npc: { npc: 'vera', text: 'Seven heads in ten flips proves very little. Before you accuse a coin, ask how many flips the claim is built on.' },
      generators: ['pb-space', 'pb-equally'],
      recall: [{ prompt: 'Example 1: list the sample space for picking a one-digit number at random.', answer: 'S = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9} — ten equally likely outcomes (don\'t forget 0).' }],
      summary: [
        'A **probability experiment** has well-defined outcomes; the **sample space** S lists them all; an **event** is a set of outcomes.',
        'Probability is a **long-run relative frequency**, always between **0 and 1**.',
        'Equally likely outcomes: P(A) = (outcomes in A) ÷ (outcomes in S).',
        '**Experimental** probability comes from trials; **theoretical** probability comes from the sample space.',
      ],
    },
    {
      id: 'u4-basics-2', title: 'The Long Run', type: 'lesson', concepts: ['prob-basics'], lessonSteps: [4, 7],
      intro: 'Today you\'ll watch experimental probability settle toward theoretical probability, then compute theoretical probabilities for one die and for two dice.',
      hook: {
        title: 'Does the long run listen?',
        body: 'Experimental probability comes from running trials; theoretical probability comes from the sample space before anything happens. The packet makes a bold promise, the one Lab #3 explores: **as the number of trials increases, the experimental probability gets closer to the theoretical probability.**\n\nA fair coin\'s theoretical P(heads) is 0.5, and a fair die\'s P(six) is 1/6 ≈ 0.167. Time to test the promise — then compute theoretical probabilities for one die (Example 2) and two dice (Example 7).',
      },
      generators: ['pb-lln', 'pb-dice', 'pb-equally'],
    },
    {
      id: 'u4-basics-precision', title: 'The Gambler\'s Whisper', type: 'precision', concepts: ['prob-basics'],
      intro: 'Today you\'ll defeat the two classic beginner traps: believing a coin is "due" after a streak, and accepting a "probability" bigger than 1 or below 0.',
      hook: {
        title: 'Five tails in a row',
        body: 'A fair coin has landed tails five times in a row. A voice in the trees whispers: *"Heads is due — it has to balance out."*\n\nThe coin has no memory: P(heads) on the next flip is still **0.5**. Long-run proportions settle down because the number of trials grows **so large** that a short streak barely matters — not because the coin "corrects" itself.',
      },
      generators: ['pb-valid', 'pb-lln', 'pb-dice'],
      recall: [{ prompt: 'Which of these could be probabilities: 1.2, −0.1, 0, 3/4, 100%?', answer: '**0**, **3/4**, and **100%** (= 1). A probability is always between 0 and 1 inclusive, so 1.2 and −0.1 are impossible.' }],
      summary: [
        'Independent trials have **no memory** — a streak does not make the other outcome "due."',
        'The long-run proportion approaches the theoretical probability because **n grows**, not because results balance out.',
        'Every probability satisfies **0 ≤ P(A) ≤ 1**; anything outside that range signals an error.',
      ],
    },

    /* ---------- 3.1–3.3 Complement, "or", "and" ---------- */
    {
      id: 'u4-rules-1', title: 'Sport or Club?', type: 'lesson', concepts: ['prob-rules'], lessonSteps: [0, 3],
      intro: 'Today you\'ll learn the rules that build every probability — **not** (the complement), **and**, and **or** — and why "or" can\'t simply mean "add."',
      npc: { npc: 'quill', text: 'Every rule in this unit is really about counting each outcome exactly once. Hold onto that and the formulas explain themselves.' },
      generators: ['pr-or', 'pr-words'],
    },
    {
      id: 'u4-rules-lab', title: 'The 36-Dot Clearing', type: 'lab', concepts: ['prob-rules', 'prob-basics'],
      intro: 'Today you\'ll use the two-dice dot array — 36 equally likely outcomes — to find "or" probabilities, spot mutually exclusive events, and use the complement as a shortcut.',
      predict: {
        prompt: 'Example 7c: two fair dice are rolled. What is P(sum of 7 **or** sum of 11)?',
        input: { type: 'mc', options: [
          { id: 'a', text: '8/36 = 2/9', correct: true, why: 'Six dots sum to 7 and two dots — (5, 6) and (6, 5) — sum to 11. No roll does both, so just add: 6/36 + 2/36.' },
          { id: 'b', text: '7/36', why: 'That subtracts an overlap of 1/36, but a roll can\'t sum to 7 and 11 at once — there is nothing to subtract.' },
          { id: 'c', text: '2/36', why: 'That is only P(sum of 11). "Or" includes the sevens too.' },
        ] },
        reveal: 'P(7 or 11) = 6/36 + 2/36 = **8/36 = 2/9 ≈ 0.222**. The two events share no dots — they are **mutually exclusive** — so the overlap term P(A and B) is 0.',
      },
      widget: {
        id: 'dice',
        mission: '1. Set **A = Sum is 7** and **B = Doubles**. Do any dots light up in both colors? Read P(A or B).\n2. Set **A = Doubles** and **B = Different numbers**. Check that P(A) + P(B) = 36/36 — these events are complements.\n3. Set **A = Sum ≥ 10** and **B = Doubles**. Now (5, 5) and (6, 6) sit in both. Confirm P(A or B) = 6/36 + 6/36 − 2/36 = 10/36.',
        takeaway: 'No shared dots → mutually exclusive → just add (sum 7 or doubles = 12/36). Shared dots → subtract them once (sum ≥ 10 or doubles = 10/36). And "different numbers" is the complement of doubles: 1 − 6/36 = **30/36 = 5/6** (Example 7d).',
      },
      generators: ['pr-or', 'pr-mutex', 'pb-dice', 'pb-equally'],
      summary: [
        'With equally likely outcomes, count dots: P(A) = n(A)/36 on the two-dice array.',
        '**Mutually exclusive** (no shared outcomes): P(A or B) = P(A) + P(B).',
        'Overlapping events: subtract the shared outcomes once.',
        'Complement shortcut: P(different numbers) = 1 − P(doubles) = 5/6.',
      ],
    },
    {
      id: 'u4-rules-2', title: 'Mapping the Overlap', type: 'lesson', concepts: ['prob-rules'], lessonSteps: [4, 8],
      intro: 'Today you\'ll see the addition rule as a picture — a Venn diagram — then learn when you may simply add (mutually exclusive events) and how to find "neither."',
      hook: {
        title: 'More cars than the lot holds',
        body: 'At Chapman\'s Budget Car Rental, **42%** of cars are four-door sedans, **77%** have built-in Bluetooth, and **31%** are both.\n\nAdd 42% and 77% and you get **119%** — more than the whole lot. The cars with both features were counted twice. Today you\'ll draw that overlap and handle it properly.',
      },
      generators: ['pr-neither', 'pr-mutex', 'pr-words'],
    },
    {
      id: 'u4-mixed-1', title: 'Crossroads of Chance', type: 'mixed', concepts: ['prob-basics', 'prob-rules'],
      intro: 'Today you\'ll switch between sample spaces, equally likely outcomes, complements, and the addition rule on every question — with no warning which rule comes next.',
      hook: {
        title: 'One table, two rules',
        body: 'Practice #2: the top 24 countries at the 2004 Summer Olympics won **1,080** medals — 340 gold, 338 silver, and 402 bronze. One medal is chosen at random.\n\n- *Not* bronze → complement: (340 + 338)/1080 ≈ **0.6277**.\n- Gold *or* British → Great Britain won 65 medals, 22 of them gold: (340 + 65 − 22)/1080 ≈ **0.3546**.\n\nSame table, two different rules. Choosing the rule is the real skill.',
      },
      generators: ['pb-space', 'pb-equally', 'pb-valid', 'pb-lln', 'pr-or', 'pr-neither', 'pr-mutex', 'pr-medals', 'pr-words'],
      summary: [
        '**Not A** → 1 − P(A).',
        '**A or B** → P(A) + P(B) − P(A and B); the last term is 0 for mutually exclusive events.',
        '**Neither** → 1 − P(A or B).',
        'Probabilities live between 0 and 1 and describe the long run, not the next trial.',
      ],
    },

    /* ---------- 3.2–3.3 Conditional probability ---------- */
    {
      id: 'u4-cond-1', title: 'Given the Row', type: 'lesson', concepts: ['conditional'], lessonSteps: [0, 3],
      intro: 'Today you\'ll learn what the word **given** does to a probability: it shrinks the sample space down to one row or one column of the table.',
      npc: { npc: 'juno', text: 'Put your finger on the "given" row before you compute anything. Everything outside it just left the room.' },
      generators: ['cd-table', 'cd-identify'],
    },
    {
      id: 'u4-cond-2', title: 'The Shrinking Sample Space', type: 'lesson', concepts: ['conditional'], lessonSteps: [4, 7],
      intro: 'Today you\'ll compute conditional probabilities from counts, from percentages, and from the Pew Research survey of mothers — and interpret them in a complete sentence.',
      hook: {
        title: '"Of the seniors…"',
        body: 'Example 3h asks for a student who, **of the seniors**, selected Social Studies. The words *of the seniors* are a condition in disguise: only the **50** seniors count, and **14** of them chose Social Studies → P(Social Studies | senior) = 14/50 = **7/25 = 0.28**.\n\nConditions hide behind words like *given*, *of the*, *among*, and *assuming*. Spot them, then divide by the right total.',
      },
      generators: ['cd-formula', 'cd-table', 'cd-medals'],
    },
    {
      id: 'u4-cond-precision', title: 'Which Way Does the Bar Point?', type: 'precision', concepts: ['conditional'],
      intro: 'Today you\'ll defeat the two conditional-probability traps: reversing the condition, and dividing by the grand total instead of the given total.',
      hook: {
        title: 'Same 22 medals, three answers',
        body: 'Practice #2f: one 2004 Olympic medal is chosen at random. Australia won **22** of the **402** bronze medals, and **46** medals in all, out of **1,080** total.\n\n- P(Australia | bronze) = 22/402 ≈ **0.0547** — only bronze medals count.\n- P(bronze | Australia) = 22/46 ≈ **0.478** — only Australia\'s medals count.\n- P(Australia and bronze) = 22/1080 ≈ **0.0204** — every medal counts.\n\nThe numerator never changed. Only the denominator — the sample space — did.',
      },
      generators: ['cd-table', 'cd-formula', 'cd-identify'],
      recall: [{ prompt: 'Practice #1: O = outfielder, H = great hitter. Put "O | H" and "H | O" into words.', answer: '**O | H**: selecting an outfielder, *given* the player is a great hitter (only great hitters count). **H | O**: selecting a great hitter, *given* the player is an outfielder (only outfielders count). Different sample spaces, so usually different probabilities.' }],
      summary: [
        'In P(A | B), **B** is the new sample space — its total is the denominator.',
        '**P(A | B) ≠ P(B | A)** in general: swapping the bar swaps the denominator.',
        'P(A and B) uses the **grand total**; P(A | B) uses only **B\'s total**.',
      ],
    },

    /* ---------- 3.2–3.3 Independence & the multiplication rule ---------- */
    {
      id: 'u4-indep-1', title: 'Two Hearts in a Row', type: 'lesson', concepts: ['independence'], lessonSteps: [0, 3],
      intro: 'Today you\'ll learn when one event changes the chances of another — and why drawing cards *without replacement* makes the draws dependent.',
      npc: { npc: 'odalys', text: 'A coin has no memory, but a deck of cards does: every card you keep changes what is left for the next draw.' },
      generators: ['in-identify', 'in-replacement', 'in-check'],
      summary: [
        '**Independent**: P(A | B) = P(A), which is the same as P(A and B) = P(A)·P(B).',
        '**Dependent**: P(A and B) = P(A)·P(B | A).',
        'With replacement → independent (1/16 for two hearts); without replacement → dependent (1/17).',
      ],
    },
    {
      id: 'u4-indep-experiment', title: 'Does Knowing Change Anything?', type: 'experiment', concepts: ['independence', 'conditional'],
      intro: 'Today you\'ll test independence the way the course does — compare P(A) with P(A | B) — by conditioning on different survey years in the Pew Research study of mothers.',
      predict: {
        prompt: 'Pew Research surveyed 100 mothers in each of 1976, 1994, and 2014. Of all 300, **66** have 4 or more children, so P(4+) = 0.22. What is P(4+ | surveyed in 1976)?',
        input: { type: 'mc', options: [
          { id: 'a', text: 'About 0.22 — the year shouldn\'t matter', why: 'That would mean the events are independent. Check the 1976 column: 40 of its 100 mothers have 4+ children.' },
          { id: 'b', text: '0.40', correct: true, why: '40 of the 100 mothers surveyed in 1976 had 4 or more children.' },
          { id: 'c', text: '40/300 ≈ 0.133', why: 'That is P(4+ and 1976). "Given 1976" means divide by the 100 mothers from 1976, not all 300.', misconception: 'cond-grand-total' },
        ] },
        reveal: 'P(4+ | 1976) = 40/100 = **0.40**, but P(4+) = 66/300 = **0.22**. Knowing the year changes the probability, so "surveyed in 1976" and "4 or more children" are **dependent** (Practice #13c).',
      },
      widget: {
        id: 'contingency', props: { table: 'mothers' },
        mission: '1. In **event** mode, click the **4+ children** row header: P(4+) = 66/300 = 0.22.\n2. Switch the toggle to **given** and click the **1976** column header. Does P(4+ | 1976) match 0.22?\n3. Give **2014** instead: P(4+ | 2014) = 13/100 = 0.13. Still not 0.22.\n4. Switch to the **superheroes** table. Set the toggle back to **event** and click **Spiderman**, then switch to **given** and click **10th**: compare P(Spiderman) = 30/84 with P(Spiderman | 10th) = 8/22.',
        takeaway: 'The independence test: compare **P(A)** with **P(A | B)**. Equal → independent; different → dependent. Here P(4+) = 0.22, but P(4+ | 1976) = 0.40 and P(4+ | 2014) = 0.13 — family size depends on the survey year. Even the superheroes\' 0.357 vs. 0.364 counts as dependent in this course.',
      },
      generators: ['in-check', 'in-identify', 'cd-table'],
      summary: [
        'Independent ⇔ **P(A) = P(A | B)** ⇔ P(A and B) = P(A)·P(B).',
        'Pew: P(4+) = 0.22 but P(4+ | 1976) = 0.40 → dependent.',
        'Always back an independence claim with a probability calculation.',
      ],
    },
    {
      id: 'u4-indep-2', title: 'At Least One', type: 'lesson', concepts: ['independence'], lessonSteps: [4, 8],
      intro: 'Today you\'ll master the "at least one" shortcut — 1 minus P(none) — then test independence in a real table and on the two-dice dot array.',
      hook: {
        title: 'Thirty-one ways to say "at least one"',
        body: 'Practice #3: about **60%** of Chemistry PhD students have a teaching-assistant role. Pick 5 at random.\n\n"All five are TAs" is a single path: (0.60)⁵ ≈ **0.0778**. But "at least one is a TA" covers 1, 2, 3, 4, or 5 TAs — **31** different yes/no sequences. There is a much faster way, and it runs through the one sequence that *doesn\'t* count.',
      },
      generators: ['in-at-least', 'in-repeated', 'in-check'],
    },
    {
      id: 'u4-indep-precision', title: 'Apart Is Not Independent', type: 'precision', concepts: ['independence'],
      intro: 'Today you\'ll defeat three independence traps: confusing *independent* with *mutually exclusive*, forgetting that draws without replacement change the odds, and adding probabilities for "at least one."',
      npc: { npc: 'vera', text: '"They can\'t happen together" and "they don\'t affect each other" sound alike, but mutually exclusive events are actually *dependent*: if one happens, the other becomes impossible.' },
      hook: {
        title: 'The model-railroad switches',
        body: 'Practice #4: a circuit has **8** switches and **2** are defective. You test two switches, chosen at random **without replacement**.\n\nAfter one defective switch is pulled, only **1** defective remains among **7** switches: P(2nd defective | 1st defective) = **1/7 ≈ 0.143**, not 2/8 = 0.25. The first draw changed the second — the draws are **dependent**.',
      },
      generators: ['in-vs-me', 'in-replacement', 'in-at-least'],
      recall: [{ prompt: 'Practice #10: each of 5 independent fights has a 15% chance of a special enemy. Why is P(at least one) **not** 5 × 0.15 = 0.75?', answer: 'Adding counts the outcomes with two or more special enemies more than once — with 7 fights the "answer" would be 1.05, which is impossible. Use the complement: 1 − 0.85⁵ ≈ **0.5563**.' }],
      summary: [
        '**Mutually exclusive** (P(A and B) = 0) is not **independent** (P(A and B) = P(A)·P(B)); with nonzero probabilities they can never both hold.',
        'Without replacement, the second draw\'s probability changes: 1/7, not 2/8.',
        '**At least one = 1 − P(none)** — never add the single-trial probabilities.',
      ],
    },
    {
      id: 'u4-mixed-2', title: 'The Lane-Splitting Ballot', type: 'mixed', concepts: ['conditional', 'independence', 'prob-rules'],
      intro: 'Today you\'ll face conditional probability, independence checks, and the addition rule shuffled together — deciding each time which rule the question actually needs.',
      hook: {
        title: 'Three rules, one survey',
        body: 'Practice #8: **48%** of Marylanders support a law making lane splitting illegal (C). About **51%** are over 45 (L), and **72%** of those over 45 support the law.\n\n- **And** → P(L and C) = P(L)·P(C | L) = 0.51 × 0.72 = **0.3672**.\n- **Independent?** → P(L)·P(C) = 0.51 × 0.48 = 0.2448 ≠ 0.3672, so no.\n- **Or** → P(L or C) = 0.51 + 0.48 − 0.3672 = **0.6228**.\n\nThe questions ahead won\'t tell you which rule is coming.',
      },
      generators: ['cd-table', 'cd-formula', 'cd-medals', 'in-check', 'in-vs-me', 'in-at-least', 'in-replacement', 'pr-neither', 'pr-mutex'],
      summary: [
        '**Given** → divide by the given event\'s total: P(A | B) = P(A and B)/P(B).',
        '**And** → P(A)·P(B | A); it simplifies to P(A)·P(B) only when independent.',
        '**Or** → add, then subtract the overlap.',
        'Independence test: P(A and B) = P(A)·P(B)? Mutually exclusive test: P(A and B) = 0?',
      ],
    },

    /* ---------- 3.4–3.5 Tree diagrams & Venn diagrams ---------- */
    {
      id: 'u4-trees-1', title: 'The Flu Test Tree', type: 'lesson', concepts: ['trees-venn'], lessonSteps: [0, 4],
      intro: 'Today you\'ll build tree diagrams — multiply along the branches, add across the paths — and use one to answer a question that fools most people: what does a positive flu test really mean?',
      generators: ['tv-total', 'tv-coins', 'tv-concept'],
      summary: [
        'Branches leaving one point add to **1**; later branches are **conditional** on the branch they grow from.',
        '**Multiply along** a path for "this, then that."',
        '**Add across** every path that ends in the event (P(+) = 0.2119 + 0.0203 = 0.2321).',
        'Reverse question → path ÷ total of matching paths: P(flu | +) ≈ 0.913.',
      ],
    },
    {
      id: 'u4-trees-experiment', title: 'When the Flu Is Rare', type: 'experiment', concepts: ['trees-venn', 'conditional'],
      intro: 'Today you\'ll change how common the flu is — keeping the test exactly the same — and watch P(flu | positive) swing.',
      npc: { npc: 'odalys', text: 'Here is the twist that fools doctors too: how well a test catches the flu and what a positive result means are two different conditional probabilities.' },
      predict: {
        prompt: 'The test still catches 96.3% of flu cases and still falsely flags 2.6% of healthy patients. **Suppose** only **2%** of patients had the flu instead of 22%. P(flu | +) would be about…',
        input: { type: 'mc', options: [
          { id: 'a', text: 'Still about 0.91 — the test hasn\'t changed', why: 'The test\'s accuracy is P(+ | flu). P(flu | +) also depends on how many healthy patients are around to produce false positives.' },
          { id: 'b', text: 'About 0.43', correct: true, why: 'True positives: 0.02 × 0.963 ≈ 0.0193. False positives: 0.98 × 0.026 ≈ 0.0255. The false positives now outnumber the true ones.' },
          { id: 'c', text: 'About 0.963', why: '0.963 is P(+ | flu) — the reverse conditional, and it never changes with the flu rate.', misconception: 'cond-reversed' },
        ] },
        reveal: 'P(+) = 0.02(0.963) + 0.98(0.026) ≈ 0.0447, so P(flu | +) ≈ 0.0193/0.0447 ≈ **0.43**. With the packet\'s 22% flu rate it is ≈ **0.913**. Same test, very different meaning.',
      },
      widget: {
        id: 'tree', props: { preset: 'flu' },
        mission: '1. Start at the packet\'s values. Click the **P(Flu and Test +)** button to condition on a positive test and confirm P(Flu | Test +) ≈ 0.913.\n2. Drag **P(Flu)** down to **0.02**. Watch P(Test +) and P(Flu | Test +).\n3. Drag P(Flu) up to **0.50**. What happens to P(Flu | Test +) now?\n4. Return P(Flu) to 0.22 and drag **P(Test + | No flu)**, the false-positive rate, from 0.026 all the way down to 0. What does P(Flu | Test +) become, and why?',
        takeaway: 'P(flu | +) = (flu-and-positive path) ÷ (all positive paths). When the flu is rare, the healthy group is huge, so even a 2.6% false-positive rate produces many positives: P(flu | +) falls to ≈ 0.43 at 2% and rises to ≈ 0.974 at 50%. With no false positives at all, every positive is a true positive and P(flu | +) = 1. The test didn\'t change — the tree did.',
      },
      generators: ['tv-concept', 'tv-reverse', 'cd-formula'],
      summary: [
        'P(+ | flu) = 0.963 is a property of the test; P(flu | +) depends on how common the flu is.',
        'Rare condition → false positives can outnumber true positives.',
        'Reverse conditionals always come from the tree: path ÷ total of matching paths.',
      ],
    },
    {
      id: 'u4-trees-2', title: 'Two Pictures of Chance', type: 'lesson', concepts: ['trees-venn'], lessonSteps: [5, 8],
      intro: 'Today you\'ll finish tree diagrams with the carnival duck pools, then switch to Venn diagrams to split overlapping events into *only A*, *both*, *only B*, and *neither*.',
      hook: {
        title: 'Sequences and overlaps',
        body: 'Example 9: at a carnival, a die roll decides which pool you draw a duck from — roll 1–4 → Pool #1 (8 red, 2 gold); roll 5–6 → Pool #2 (3 red, 7 gold). That is a **sequence** of chance steps, so it calls for a **tree**.\n\nNot every situation is a sequence. When two events simply **overlap** — four-door sedans and Bluetooth at Chapman\'s — a **Venn diagram** shows the pieces better. Today you\'ll use both.',
      },
      generators: ['tv-venn', 'tv-total'],
    },
    {
      id: 'u4-trees-practice', title: 'Routes Through the Grove', type: 'practice', concepts: ['trees-venn', 'conditional'],
      intro: 'Today you\'ll work tree problems from start to finish — single paths, total probability, and reverse conditionals — with less help each round.',
      hook: {
        title: 'Three coins, eight paths',
        body: 'Example 8: flip three fair coins. The tree has 2 × 2 × 2 = **8** equally likely paths, each with probability (1/2)³ = 1/8.\n\n- T, H, T in that order: one path → **1/8**.\n- All the same side: HHH or TTT → **2/8 = 1/4**.\n- Exactly two heads: HHT, HTH, THH → **3/8**.\n\nOne path → multiply. Several paths → add. That is the whole game.',
      },
      generators: ['tv-total', 'tv-reverse', 'tv-coins', 'cd-formula', 'cd-table'],
      summary: [
        'Count the paths that match the event before you calculate.',
        'P(event) = sum of (products along each matching path).',
        'Reverse conditional = one path ÷ total of matching paths (Jed: P(bus | late) = 0.028/0.067 ≈ 0.418).',
      ],
    },
    {
      id: 'u4-trees-teach', title: 'Explain the Branches', type: 'teach', concepts: ['trees-venn'],
      intro: 'Today you\'ll teach how a tree diagram finds the probability of an outcome that can happen several ways — and how it answers a "reverse" question like P(bus | late).',
      hook: {
        title: 'A classmate asks "why?"',
        body: 'You are explaining Practice #9 to a classmate: Jed drives 30% of the time, walks 30%, and takes the bus 40%, and he is late 3%, 10%, and 7% of the time on each.\n\nYour classmate can follow the arithmetic — P(late) = 0.067 and P(bus | late) ≈ 0.418 — but asks **why** you multiply in one place, add in another, and divide at the end. Your explanation should work for *any* tree, not just Jed\'s.',
      },
      recall: [{ prompt: 'In Jed\'s tree, why is P(bus | late) = 0.028/0.067 and not simply 0.07?', answer: '0.07 is P(late | bus) — the branch label. The reverse question looks only at the late paths: P(bus and late) = 0.40 × 0.07 = 0.028, divided by the total of all late paths, 0.067 → ≈ **0.418**.' }],
      summary: [
        'Multiply along a path: each branch is conditional on the one before it.',
        'Add the paths that end in the event — different paths are mutually exclusive.',
        'Reverse conditional: divide the path you want by the sum of all matching paths.',
      ],
    },
    {
      id: 'u4-challenge', title: 'The Duck-Pool Gambit', type: 'challenge', concepts: ['trees-venn', 'conditional', 'independence'],
      intro: 'Today you\'ll take on exam-level probability problems — trees, reverse conditionals, and independence checks — with no hints and no worked examples.',
      hook: {
        title: 'You won a gold duck',
        body: 'Example 9, played to the end: roll a die; 1–4 → Pool #1 (8 red, 2 gold), 5–6 → Pool #2 (3 red, 7 gold).\n\n- P(gold) = (4/6)(2/10) + (2/6)(7/10) = **11/30 ≈ 0.367**.\n- You win a gold duck. P(it came from Pool #1) = (4/30) ÷ (11/30) = **4/11 ≈ 0.364** — even though Pool #1 is chosen 2/3 of the time.\n- "Gold" and "Pool #1" are **dependent**: P(gold | Pool #1) = 0.2 ≠ 0.367.\n\nThe problems ahead demand exactly these moves, on new scenarios, with no scaffolding.',
      },
      generators: ['tv-reverse', 'tv-total', 'cd-medals', 'cd-formula', 'in-vs-me', 'in-at-least'],
      summary: [
        'Total probability: add the products along every matching path.',
        'Reverse conditional: path ÷ total — it can be far from the branch label.',
        'Justify independence with numbers: compare P(A) with P(A | B).',
      ],
    },
    {
      id: 'u4-review', title: 'Every Path Through the Woods', type: 'review', concepts: ['prob-basics', 'prob-rules', 'conditional', 'independence', 'trees-venn'],
      intro: 'Today you\'ll review the whole unit — sample spaces, complements and "or", conditional probability, independence, and trees — in one cumulative run before you face the Oddskeeper.',
      npc: { npc: 'thorne', text: 'Before each problem, name the rule out loud. The arithmetic is the easy part; choosing the rule is where points are won.' },
      hook: {
        title: 'Which rule, when?',
        body: '- **Not A** → 1 − P(A).\n- **A or B** → P(A) + P(B) − P(A and B).\n- **A given B** → P(A and B) ÷ P(B): the given event is the new sample space.\n- **A and B** → P(A)·P(B | A); just P(A)·P(B) if independent.\n- **At least one** → 1 − P(none).\n- **Several stages** → a tree: multiply along, add across, divide for reverse questions.',
      },
      generators: ['pb-equally', 'pb-lln', 'pr-or', 'pr-neither', 'pr-mutex', 'cd-table', 'cd-formula', 'in-check', 'in-at-least', 'in-vs-me', 'tv-total', 'tv-venn', 'tv-concept'],
      summary: [
        '**Probability basics** — sample space, events, 0 ≤ P ≤ 1, long-run relative frequency.',
        '**Complement & "or"** — 1 − P(A); add then subtract the overlap.',
        '**Conditional** — the given event\'s total is the denominator.',
        '**Independence & trees** — compare P(A) with P(A | B); multiply along, add across.',
      ],
    },
  ],

  encounters: [
    {
      id: 'u4-shrine-overlap', kind: 'shrine', afterLevel: 'u4-rules-2', title: 'Shrine of the Single Count', concepts: ['prob-rules'],
      question: {
        prompt: 'Example 6: of 200 Middletown High seniors, 140 plan to enroll in college and 40 plan to work (the rest take a gap year). Why is P(college or work) simply 140/200 + 40/200 = 0.9, with nothing subtracted?',
        input: { type: 'mc', options: [
          { id: 'a', text: 'As planned, no senior does both, so the events are mutually exclusive and P(college and work) = 0', correct: true, why: 'With zero overlap, the addition rule\'s last term vanishes.' },
          { id: 'b', text: '"Or" always means add', why: 'Only when the overlap is zero. For "sport or college," 62 seniors are in both, so 62/200 must be subtracted: 0.84.', misconception: 'or-double-count' },
          { id: 'c', text: 'Because college and work are independent', why: 'Independence is about one event changing the other\'s probability. The addition rule needs the overlap, which is zero here because the plans can\'t both happen.', misconception: 'indep-vs-mutex' },
        ] },
        explain: 'Mutually exclusive → P(A and B) = 0 → P(A or B) = P(A) + P(B) = 0.9. Overlapping events (sport or college) → 90/200 + 140/200 − 62/200 = **0.84**.',
      },
    },
    {
      id: 'u4-formula-conditional', kind: 'lost-formula', afterLevel: 'u4-cond-precision', title: 'The Torn Page of "Given"', concepts: ['conditional'],
      formula: 'conditional',
      npc: { npc: 'thorne', text: 'Every symbol in this formula has a job. The event after the bar decides your denominator.' },
    },
    {
      id: 'u4-scholar-jerseys', kind: 'scholar', afterLevel: 'u4-indep-precision', title: 'The Scholar at the Stadium Gate', concepts: ['independence', 'prob-rules'],
      question: {
        prompt: 'Practice #7: at a Ravens–Eagles game, 30% of attendees root for the Eagles (E), 25% wear a team jersey (J), and 67% of Eagles fans wear a jersey. Which statement is true?',
        input: { type: 'mc', options: [
          { id: 'a', text: 'E and J are neither mutually exclusive nor independent', correct: true, why: 'P(E and J) = 0.67 × 0.30 = 0.201. That is not 0 (so not mutually exclusive) and not 0.30 × 0.25 = 0.075 (so not independent).' },
          { id: 'b', text: 'They are mutually exclusive — Eagles fans and jersey-wearers are different groups', why: '20.1% of attendees are both Eagles fans and jersey-wearers, so the events overlap.' },
          { id: 'c', text: 'They are independent, because P(E and J) is not 0', why: 'A nonzero overlap only rules out mutually exclusive. Independence needs P(E and J) = P(E)·P(J) = 0.075, and 0.201 ≠ 0.075.', misconception: 'indep-vs-mutex' },
          { id: 'd', text: 'They are both mutually exclusive and independent', why: 'Events with nonzero probabilities can never be both: if they can\'t occur together, knowing one occurred drops the other\'s probability to 0.' },
        ] },
        explain: 'Ask two separate questions. Mutually exclusive: is P(E and J) = 0? Independent: is P(E and J) = P(E)·P(J)? Here P(E and J) = P(E)·P(J | E) = 0.201 answers "no" to both.',
      },
    },
    {
      id: 'u4-lab-procrastination', kind: 'lab', afterLevel: 'u4-trees-2', title: 'The Procrastinators\' Field Lab', concepts: ['trees-venn', 'conditional'],
      widget: {
        id: 'contingency', props: { table: 'procrastination' },
        mission: 'Practice #11 surveyed 116 high school students: X = taking an AP class, Y = procrastinates often.\n1. In **event** mode, click the **AP: Yes** column: P(X) = 70/116.\n2. Read off the four Venn regions: AP and procrastinate (58), AP only (12), procrastinate only (24), neither (22).\n3. Set the event to the procrastinate **Yes** row, switch to **given** mode, and give **AP: Yes**. Compare P(Y | X) = 58/70 with P(Y) = 82/116.',
        takeaway: 'A two-way table holds the same four regions as a Venn diagram. P(Y) = 82/116 ≈ 0.707 but P(Y | X) = 58/70 ≈ 0.829, so in this sample taking an AP class and procrastinating often are **dependent**.',
      },
    },
  ],

  boss: {
    id: 'boss-u4',
    story: 'At the heart of the Whispering Woods, the Oddskeeper has set his dice table outside the urgent care center in Kentwood, Michigan, during a November flu week. **22%** of the patients who get rapid flu tests actually have the flu. The test misses **3.7%** of flu cases (false negatives) and wrongly flags **2.6%** of healthy patients (false positives).\n\nEvery patient leaves with a result — and the Oddskeeper\'s riddle: *what does that result really mean?* Read his tree the right way round, or be lost in the woods.',
    source: { pages: [8, 34], section: '3.1–3.5 Practice #12 (rapid flu test) and tree diagrams' },
    phases: [
      {
        title: 'Phase 1 — Read the Branches', kind: 'recognition',
        intro: '"Before you calculate, read my tree. Every label is a riddle about who is *given*."',
        tasks: [
          {
            kind: 'step',
            step: {
              concept: 'conditional', dims: ['recognize'], label: 'Read the branch',
              prompt: 'On the Oddskeeper\'s tree, the branch from **Flu** to **Test −** is labeled **0.037**. Which probability is that?',
              answer: { kind: 'mc', options: [
                { id: 'a', text: 'P(Test − | flu): the chance a patient with the flu tests negative', correct: true, why: 'Second-stage branches are conditional on the branch they grow from.' },
                { id: 'b', text: 'P(flu | Test −): the chance a patient who tests negative has the flu', correct: false, why: 'That reverses the condition. P(flu | −) is a reverse question: it is never a branch label, and you have to divide one path by a total to find it.', misconception: 'cond-reversed' },
                { id: 'c', text: 'P(flu and Test −): the chance a patient has the flu and tests negative', correct: false, why: 'That is the whole path: 0.22 × 0.037 ≈ 0.0081.' },
              ] },
              explain: 'Branches after the first split are conditional probabilities: given the flu, 3.7% test negative (false negatives). Joint probabilities come from multiplying along a path.',
              hint: 'Where does the branch start? That is the "given."',
            },
          },
          {
            kind: 'step',
            step: {
              concept: 'prob-rules', dims: ['recognize'], label: 'Why add?',
              prompt: 'To find P(Test +), you will add two paths: flu-and-positive plus no-flu-and-positive. Which fact makes plain addition legitimate?',
              answer: { kind: 'mc', options: [
                { id: 'a', text: 'A patient can\'t both have the flu and not have it, so the two paths are mutually exclusive', correct: true, why: 'Different paths never overlap, so the addition rule\'s P(A and B) term is 0.' },
                { id: 'b', text: 'Having the flu and testing positive are independent', correct: false, why: 'Independence is a different question. Adding without subtracting needs zero overlap (mutually exclusive), not independence.', misconception: 'indep-vs-mutex' },
                { id: 'c', text: '"Or" always means add', correct: false, why: 'Only when there is no overlap; otherwise subtract P(A and B).', misconception: 'or-double-count' },
              ] },
              explain: 'Paths on a tree are mutually exclusive, so P(path 1 or path 2) = P(path 1) + P(path 2) with nothing to subtract.',
              hint: 'What must be true about the overlap for plain addition to work?',
            },
          },
          { kind: 'gen', concept: 'prob-rules', generators: ['pr-mutex'], level: 5, excludeTypes: ['free-response'] },
        ],
      },
      {
        title: 'Phase 2 — Walk the Paths', kind: 'calculation',
        intro: '"Multiply, add, subtract from one — show me you can walk my branches without stumbling."',
        tasks: [
          { kind: 'boss-step', boss: 'boss-u4', index: 0 },
          { kind: 'boss-step', boss: 'boss-u4', index: 1 },
          {
            kind: 'step',
            step: {
              concept: 'prob-rules', dims: ['calculate'], label: 'P(−)',
              prompt: 'Using P(Test +) ≈ 0.2321, what is P(Test −) for a randomly selected patient?',
              answer: { kind: 'numeric', value: 1 - (0.22 * 0.963 + 0.78 * 0.026), tol: 0.0006, wrong: [
                { value: 0.974, why: '0.974 is P(− | no flu), a single branch. Use the complement of P(+), or add both negative paths.' },
                { value: 0.037 + 0.974, misconception: 'tree-add-along', why: 'Adding branch labels gives 1.011 — more than 1! Multiply along each path first.' },
              ] },
              explain: 'Complement: 1 − 0.2321 = **0.7679**. Check with the tree: 0.22(0.037) + 0.78(0.974) = 0.0081 + 0.7597 = 0.7679.',
              hint: '"Not positive" — use the complement rule.',
            },
          },
          { kind: 'boss-step', boss: 'boss-u4', index: 2 },
        ],
      },
      {
        title: 'Phase 3 — Which Way Is Given?', kind: 'interpretation',
        intro: '"Ninety-six point three… surely that is the number your patients want to hear?"',
        tasks: [
          {
            kind: 'step',
            step: {
              concept: 'conditional', dims: ['interpret'], label: 'In context',
              prompt: 'P(flu | +) ≈ 0.913. Which sentence interprets it correctly?',
              answer: { kind: 'mc', options: [
                { id: 'a', text: 'Of all patients who test positive, about 91.3% actually have the flu', correct: true, why: 'The given event (a positive test) is the group we look inside.' },
                { id: 'b', text: 'About 91.3% of patients with the flu test positive', correct: false, why: 'That describes P(+ | flu), which is 0.963.', misconception: 'cond-reversed' },
                { id: 'c', text: 'About 91.3% of all patients at the clinic have the flu and test positive', correct: false, why: 'That would be P(flu and +), which is only 0.2119. The denominator is all positives, not all patients.', misconception: 'cond-grand-total' },
                { id: 'd', text: 'A patient who tests positive has a 91.3% chance of testing positive again', correct: false, why: 'Retesting isn\'t part of the scenario; the conditional is about actually having the flu.' },
              ] },
              explain: 'Name the given group first ("of the patients who test positive…"), then the event ("…about 91.3% have the flu").',
              hint: 'The event after the bar is the group you look inside.',
            },
          },
          { kind: 'boss-step', boss: 'boss-u4', index: 4 },
        ],
      },
      {
        title: 'Phase 4 — The Waiting Room', kind: 'application',
        intro: '"Now the patients stream in — the negatives, the many, the at-least-ones. Sort them, if you can."',
        tasks: [
          { kind: 'boss-step', boss: 'boss-u4', index: 3 },
          {
            kind: 'step',
            context: 'A patient tests **negative** and wants to skip every flu precaution.',
            step: {
              concept: 'trees-venn', dims: ['apply', 'calculate'], label: 'P(flu | −)',
              prompt: 'Given a negative test, what is the probability the patient actually has the flu?',
              answer: { kind: 'numeric', value: (0.22 * 0.037) / (0.22 * 0.037 + 0.78 * 0.974), tol: 0.0008, wrong: [
                { value: 0.037, misconception: 'cond-reversed', why: '0.037 is P(− | flu). Reverse it: the flu-and-negative path ÷ all negative paths.' },
                { value: 0.22 * 0.037, tol: 0.0004, misconception: 'cond-grand-total', why: 'That is P(flu and −) out of all patients. Divide by P(−) ≈ 0.7679 to condition on the negative result.' },
              ] },
              explain: 'P(flu | −) = 0.22(0.037) ÷ 0.7679 = 0.00814 ÷ 0.7679 ≈ **0.0106**. About 1 in 94 patients who test negative still has the flu — small, but not zero.',
              hint: 'Path ÷ total of the matching (negative) paths.',
            },
          },
          { kind: 'gen', concept: 'trees-venn', level: 6, excludeTypes: ['free-response'] },
        ],
      },
      {
        title: 'Final Phase — The Oddskeeper\'s Riddle', kind: 'final',
        intro: '"One last riddle. Explain it so plainly that even I cannot twist it."',
        tasks: [
          { kind: 'gen', concept: 'independence', level: 6, excludeTypes: ['free-response'] },
          { kind: 'boss-step', boss: 'boss-u4', index: 5 },
        ],
      },
    ],
  },
};
