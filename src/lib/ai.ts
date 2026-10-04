/**
 * Claude integration (browser-side, user-supplied API key stored only in this browser).
 *
 * - gradeFreeResponse: rubric-based feedback on written answers, returned as validated JSON
 *   via structured outputs (client.beta.messages.parse + zodOutputFormat).
 * - streamTutorReply: streaming chat for the "Mu" mascot tutor, grounded in course content.
 *
 * Both opt into server-side refusal fallbacks (`fallbacks: "default"`), and the app falls back
 * to offline rubric checking / offline help if no key is set or a request fails.
 */
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import * as z from 'zod/v4';
import type { FrqFeedback, TeachRubric } from '../engine/types';

export const AI_MODEL = 'claude-opus-5-5';
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

let cached: { key: string; client: Anthropic } | null = null;
function client(apiKey: string) {
  if (cached?.key === apiKey) return cached.client;
  // The key belongs to the learner and never leaves their browser except to call the API.
  const c = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
  cached = { key: apiKey, client: c };
  return c;
}

export class AiError extends Error {
  constructor(message: string, readonly kind: 'auth' | 'rate' | 'refusal' | 'network' | 'other') {
    super(message);
    this.name = 'AiError';
  }
}

function toAiError(e: unknown): AiError {
  if (e instanceof AiError) return e;
  if (e instanceof Anthropic.AuthenticationError) return new AiError('Your API key was rejected. Check it in Settings.', 'auth');
  if (e instanceof Anthropic.PermissionDeniedError) return new AiError('This API key does not have permission for that model.', 'auth');
  if (e instanceof Anthropic.RateLimitError) return new AiError('Rate limited by the API — try again in a moment.', 'rate');
  if (e instanceof Anthropic.APIConnectionError) return new AiError('Could not reach the Claude API (check your connection).', 'network');
  if (e instanceof Anthropic.APIError) return new AiError(`Claude API error ${e.status ?? ''}: ${e.message}`, 'other');
  return new AiError(e instanceof Error ? e.message : 'Unknown error', 'other');
}

/* ---------------- Free-response grading ---------------- */

const FeedbackSchema = z.object({
  score: z.number().describe('0-100 overall score against the rubric'),
  verdict: z.enum(['excellent', 'good', 'partial', 'needs-work']),
  rubric: z.array(
    z.object({
      id: z.string(),
      met: z.enum(['yes', 'partial', 'no']),
      comment: z.string().describe('One short sentence explaining the judgement'),
    }),
  ),
  strengths: z.array(z.string()).describe('What the student got right, specific to their wording'),
  missing: z.array(z.string()).describe('Important ideas the student left out'),
  misconceptions: z.array(z.object({ text: z.string().describe('Quote or paraphrase of the incorrect idea'), correction: z.string() })),
  clarity: z.object({ score: z.number().describe('1-5'), comment: z.string() }),
  improvedAnswer: z.string().describe('A model answer in plain student-friendly language, at most 5 sentences'),
  followUp: z.string().describe('One follow-up question that targets the biggest gap'),
});

export interface FrqRequest {
  apiKey: string;
  conceptTitle: string;
  conceptSummary: string; // course facts for grounding
  source: string; // "PDF p.50 — 2.7 Measures of Spread"
  context?: string;
  prompt: string;
  rubric: TeachRubric;
  answer: string;
  mode: 'teach' | 'frq';
}

const GRADER_SYSTEM = `You are a warm but rigorous statistics professor grading a student's written answer for FCC MA120 (an introductory statistics course).
Grade ONLY against the course material and rubric provided. Do not reward or require ideas outside the course.
Be specific: quote or paraphrase the student's own words when praising or correcting.
Never say just "incorrect" — explain exactly which idea is wrong and why.
If the student's answer is correct but phrased differently from the rubric, give full credit.
Keep every comment short and in plain language a college freshman understands.`;

export async function gradeFreeResponse(req: FrqRequest): Promise<FrqFeedback> {
  const rubricText = req.rubric.items.map((i) => `- [${i.id}] (weight ${i.weight}) ${i.idea}`).join('\n');
  const user = `COURSE TOPIC: ${req.conceptTitle}
COURSE SOURCE: ${req.source}
COURSE FACTS:
${req.conceptSummary}

TASK TYPE: ${req.mode === 'teach' ? 'The student is explaining the concept as if teaching another student (a major mastery test). Judge accuracy, completeness, misconceptions, and clarity.' : 'Free-response interpretation question.'}
${req.context ? `SCENARIO: ${req.context}\n` : ''}QUESTION: ${req.prompt}

RUBRIC (use these ids in your rubric array, one entry per id):
${rubricText}

REFERENCE ANSWER (for your judgement only; the student does not need to match its wording):
${req.rubric.model}

STUDENT ANSWER:
"""
${req.answer}
"""`;
  try {
    const res = await client(req.apiKey).beta.messages.parse({
      model: AI_MODEL,
      max_tokens: 16000,
      betas: [FALLBACK_BETA],
      fallbacks: 'default',
      system: GRADER_SYSTEM,
      output_config: { effort: 'medium', format: zodOutputFormat(FeedbackSchema) },
      messages: [{ role: 'user', content: user }],
    });
    if (res.stop_reason === 'refusal') throw new AiError('Claude declined to grade this answer.', 'refusal');
    const out = res.parsed_output;
    if (!out) throw new AiError('Claude returned feedback that could not be read.', 'other');
    const ideas = Object.fromEntries(req.rubric.items.map((i) => [i.id, i.idea]));
    return {
      ...out,
      score: Math.max(0, Math.min(100, Math.round(out.score))),
      clarity: { score: Math.max(1, Math.min(5, Math.round(out.clarity.score))), comment: out.clarity.comment },
      rubric: out.rubric.map((r) => ({ ...r, idea: ideas[r.id] ?? r.id })),
      source: 'ai',
    };
  } catch (e) {
    throw toAiError(e);
  }
}

/* ---------------- Mascot tutor chat ---------------- */

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface TutorContext {
  page: string;
  conceptTitle?: string;
  conceptFacts?: string;
  source?: string;
  currentQuestion?: string; // the problem on screen, if any
  questionAnswered?: boolean;
  learnerSummary?: string; // weak areas, mistakes, mastery
}

const TUTOR_SYSTEM = `You are Mu, a friendly little statistics tutor (shaped like a bell curve) inside a study app for FCC MA120 Statistics.
Course scope: sampling & data, describing data (graphs, center, shape, position, spread, outliers, comparing distributions), scatterplots/correlation/regression/residuals, probability (rules, conditional, independence, trees, Venn), discrete random variables, expected value, and binomial distributions. The course does NOT cover normal distributions, confidence intervals, or hypothesis tests — if asked, say briefly that it's outside this course and offer the closest in-course idea.
Tutoring rules:
- Be concise: usually 2–6 short sentences or a few bullets. Use plain language and everyday analogies (sports, games, money, school).
- If the student is working on a problem they haven't answered yet, DO NOT give the final answer. Give the next small hint or ask a guiding question instead. If they ask for the answer outright, encourage one more try first and offer a stronger hint.
- After they have answered, you may explain fully.
- Use the course's notation (x̄, s, MD, IQR, ŷ = a + bx, P(A | B), X ~ B(n, p), E(X)). Write math in plain text, not LaTeX.
- When it helps, point them to an app feature: the Calculator (step-by-step), Formula Sheet, Glossary, Simulations Lab, Teach It, or a lesson.`;

export async function* streamTutorReply(apiKey: string, history: ChatTurn[], ctx: TutorContext): AsyncGenerator<string, void, void> {
  const contextBlock = [
    `Current page: ${ctx.page}`,
    ctx.conceptTitle ? `Current concept: ${ctx.conceptTitle}${ctx.source ? ` (${ctx.source})` : ''}` : '',
    ctx.conceptFacts ? `Course facts for this concept:\n${ctx.conceptFacts}` : '',
    ctx.currentQuestion ? `Problem on screen (${ctx.questionAnswered ? 'already answered' : 'NOT yet answered — no final answers'}):\n${ctx.currentQuestion}` : '',
    ctx.learnerSummary ? `Learner profile: ${ctx.learnerSummary}` : '',
  ].filter(Boolean).join('\n\n');
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((t) => ({ role: t.role, content: t.content }));
  try {
    const stream = client(apiKey).beta.messages.stream({
      model: AI_MODEL,
      max_tokens: 4000,
      betas: [FALLBACK_BETA],
      fallbacks: 'default',
      system: [{ type: 'text', text: TUTOR_SYSTEM }, { type: 'text', text: contextBlock }],
      output_config: { effort: 'low' },
      messages,
    });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') yield event.delta.text;
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal') yield '\n\n(I can\'t help with that one — try asking about a course topic.)';
  } catch (e) {
    throw toAiError(e);
  }
}

/** Lightweight key check used in Settings. */
export async function testApiKey(apiKey: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await client(apiKey).messages.create({ model: AI_MODEL, max_tokens: 64, messages: [{ role: 'user', content: 'Reply with the word OK.' }] });
    return res.content.length ? { ok: true } : { ok: false, message: 'Empty response.' };
  } catch (e) {
    return { ok: false, message: toAiError(e).message };
  }
}
