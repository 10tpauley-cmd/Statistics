import type { LearnerState } from './types';
import { CONCEPTS } from '../content/concepts';
import { UNITS } from '../content/units';
import { liveStreak, masteryInfo } from './learner';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  check: (s: LearnerState) => boolean;
}

const solved = (s: LearnerState) => s.attempts.filter((a) => a.correct).length;
const unitMastered = (s: LearnerState, unit: string) => CONCEPTS.filter((c) => c.unit === unit).every((c) => masteryInfo(s, c.id).mastered);

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-lesson', title: 'First Steps', description: 'Complete your first lesson.', icon: '🎒', check: (s) => Object.values(s.lessons).some((l) => l?.completed) },
  { id: 'first-formula', title: 'First Formula', description: 'Solve a formula card\'s "Your Turn" problem.', icon: '🧮', check: (s) => s.formulasTried.length > 0 },
  { id: 'solved-10', title: '10 Problems Solved', description: 'Answer 10 problems correctly.', icon: '✅', check: (s) => solved(s) >= 10 },
  { id: 'solved-100', title: 'Century', description: 'Answer 100 problems correctly.', icon: '💯', check: (s) => solved(s) >= 100 },
  { id: 'perfect-lesson', title: 'Perfect Lesson', description: 'Finish a lesson with every check right on the first try.', icon: '🌟', check: (s) => Object.values(s.lessons).some((l) => l?.completed && l.perfect) },
  { id: 'no-hint', title: 'No-Hint Victory', description: 'Solve 5 level 5+ problems in a row without hints.', icon: '🦾', check: (s) => {
    const hi = s.attempts.filter((a) => a.level >= 5).slice(-5);
    return hi.length === 5 && hi.every((a) => a.correct && a.hints === 0);
  } },
  { id: 'first-mastery', title: 'Mastered!', description: 'Fully master your first concept.', icon: '🏅', check: (s) => CONCEPTS.some((c) => masteryInfo(s, c.id).mastered) },
  { id: 'teacher', title: 'Teacher', description: 'Score 80%+ on a Teach It explanation.', icon: '🧑‍🏫', check: (s) => s.teach.some((t) => t.score >= 0.8) },
  { id: 'survivor', title: 'Statistics Survivor', description: 'Finish a full practice exam.', icon: '🛡️', check: (s) => s.exams.some((e) => e.kind === 'exam' || e.kind === 'final') },
  { id: 'boss', title: 'Boss Slayer', description: 'Defeat a unit boss problem.', icon: '🐉', check: (s) => Object.values(s.bosses).some((b) => b.cleared) },
  { id: 'probability-master', title: 'Probability Master', description: 'Master every concept in Unit 4.', icon: '🎲', check: (s) => unitMastered(s, 'u4') },
  { id: 'chapter', title: 'Mastered an Entire Chapter', description: 'Master every concept in any unit.', icon: '📘', check: (s) => UNITS.some((u) => unitMastered(s, u.id)) },
  { id: 'streak-3', title: 'On a Roll', description: 'Study 3 days in a row.', icon: '🔥', check: (s) => Math.max(liveStreak(s), s.streak.best) >= 3 },
  { id: 'streak-7', title: 'One Week Strong', description: 'Study 7 days in a row.', icon: '📅', check: (s) => s.streak.best >= 7 },
  { id: 'mistake-fixer', title: 'Mistake Fixer', description: 'Resolve 10 mistakes from your Mistake Bank.', icon: '🔧', check: (s) => s.mistakes.filter((m) => m.resolved).length >= 10 },
  { id: 'method-detective', title: 'Method Detective', description: 'Get 10 "which method?" questions right.', icon: '🔍', check: (s) => s.attempts.filter((a) => a.type === 'method' && a.correct).length >= 10 },
];

export function newAchievements(s: LearnerState): string[] {
  return ACHIEVEMENTS.filter((a) => !s.achievements[a.id] && a.check(s)).map((a) => a.id);
}
