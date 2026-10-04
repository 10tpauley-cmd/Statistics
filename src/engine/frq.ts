import type { FrqFeedback, TeachRubric } from './types';

/**
 * Offline rubric evaluation for free-response answers (Teach It, interpretation FRQs).
 * Used when AI feedback is unavailable, and as a cross-check. It looks for the key ideas
 * each rubric item names (regex patterns) and for known misconception phrasings.
 */
export function evaluateOffline(rubric: TeachRubric, text: string): FrqFeedback {
  const clean = text.trim();
  const words = clean ? clean.split(/\s+/).length : 0;
  const sentences = clean.split(/[.!?]+/).filter((s) => s.trim().length > 3).length;
  const test = (patterns: string[]) => patterns.some((p) => {
    try {
      return new RegExp(p, 'i').test(clean);
    } catch {
      return false;
    }
  });

  const rubricResults = rubric.items.map((it) => {
    const met = test(it.patterns);
    return { id: it.id, idea: it.idea, met: met ? ('yes' as const) : ('no' as const), comment: met ? 'Included.' : 'Not found in your answer.' };
  });
  const total = rubric.items.reduce((a, b) => a + b.weight, 0);
  const got = rubric.items.reduce((a, it, i) => a + (rubricResults[i].met === 'yes' ? it.weight : 0), 0);
  const misconceptions = rubric.misconceptions.filter((m) => test(m.patterns)).map((m) => ({ text: 'Possible misconception detected', correction: m.message }));

  let score = total ? (got / total) * 100 : 0;
  score -= misconceptions.length * 12;
  if (words < 8) score = Math.min(score, 25);
  else if (words < 15) score = Math.min(score, 55);
  score = Math.max(0, Math.min(100, Math.round(score)));

  const clarityScore = words < 8 ? 1 : words < 20 ? 2 : sentences >= 2 && words >= 35 ? 5 : sentences >= 2 ? 4 : 3;
  const clarityComment =
    clarityScore <= 2 ? 'Your explanation is very short — teach it fully, as if the listener has never heard of it.' :
    clarityScore === 3 ? 'Clear start. Break your explanation into a few sentences and add an example.' :
    'Well organized and complete in length.';

  const verdict: FrqFeedback['verdict'] = score >= 85 ? 'excellent' : score >= 65 ? 'good' : score >= 40 ? 'partial' : 'needs-work';
  const missing = rubricResults.filter((r) => r.met === 'no').map((r) => r.idea);
  return {
    score,
    verdict,
    rubric: rubricResults,
    strengths: rubricResults.filter((r) => r.met === 'yes').map((r) => r.idea),
    missing,
    misconceptions,
    clarity: { score: clarityScore, comment: clarityComment },
    improvedAnswer: rubric.model,
    followUp: missing.length ? `Can you add: ${missing[0].charAt(0).toLowerCase() + missing[0].slice(1)}?` : 'Can you give a new real-world example of this idea?',
    source: 'offline',
  };
}
