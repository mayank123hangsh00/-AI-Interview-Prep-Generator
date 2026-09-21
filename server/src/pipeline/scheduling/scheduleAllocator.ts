/**
 * Schedule Allocator — Pure code, no LLM.
 *
 * Distributes questions across exactly N days.
 * This is arithmetic and allocation — it belongs in code, not in a prompt.
 *
 * Rules:
 * - Every must-have requirement appears somewhere in the schedule
 * - Harder and higher-priority material lands earlier
 * - Each day has integer minutes
 * - Number of days === days_available exactly
 */

import type { Question, Requirement, Schedule, ScheduleDay, QuestionCategory } from '@shared/types/kit.js';

/** Minutes per question based on difficulty */
const MINUTES_BY_DIFFICULTY: Record<number, number> = {
  1: 10,  // Easy: 10 min
  2: 20,  // Medium: 20 min
  3: 30,  // Hard: 30 min
};

/** Priority weight by category */
const CATEGORY_WEIGHT: Record<QuestionCategory, number> = {
  'technical': 4,
  'system-design': 3,
  'behavioural': 2,
  'company-fit': 1,
};

interface ScoredQuestion {
  question: Question;
  score: number;
  minutes: number;
}

/**
 * Allocate questions across the given number of days.
 */
export function allocateSchedule(
  questions: Question[],
  requirements: Requirement[],
  daysAvailable: number
): Schedule {
  // Ensure at least 1 day
  const days = Math.max(1, Math.round(daysAvailable));

  if (questions.length === 0) {
    // No questions — create empty schedule
    return {
      days_available: days,
      days: Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        focus: i === 0 ? 'Review job description' : 'General preparation',
        question_ids: [],
        minutes: 30,
      })),
    };
  }

  // Build a set of must-have requirement IDs for priority scoring
  const mustRequirementIds = new Set(
    requirements.filter((r) => r.priority === 'must').map((r) => r.id)
  );

  // ── Step 1: Score each question ──
  const scored: ScoredQuestion[] = questions.map((q) => {
    let score = 0;

    // Must-have requirement bonus
    const coversMust = q.requirement_ids.some((id: string) => mustRequirementIds.has(id));
    if (coversMust) score += 10;

    // Difficulty bonus (harder = higher priority)
    score += q.difficulty * 3;

    // Category weight
    score += CATEGORY_WEIGHT[q.category] || 0;

    // Minutes estimate
    const minutes = MINUTES_BY_DIFFICULTY[q.difficulty] || 15;

    return { question: q, score, minutes };
  });

  // ── Step 2: Sort by score descending (hardest/most important first) ──
  scored.sort((a, b) => b.score - a.score);

  // ── Step 3: Calculate total minutes and per-day target ──
  const totalMinutes = scored.reduce((sum, sq) => sum + sq.minutes, 0);
  const minutesPerDay = Math.max(30, Math.ceil(totalMinutes / days));

  // ── Step 4: Distribute questions across days ──
  const scheduleDays: ScheduleDay[] = [];
  let currentQuestions: ScoredQuestion[] = [];
  let currentMinutes = 0;

  for (const sq of scored) {
    // Check if we should start a new day
    if (
      currentMinutes + sq.minutes > minutesPerDay * 1.2 && // Allow 20% overflow
      scheduleDays.length < days - 1 && // Don't create more days than available
      currentQuestions.length > 0 // Must have at least one question per day
    ) {
      scheduleDays.push(buildDay(scheduleDays.length + 1, currentQuestions, currentMinutes));
      currentQuestions = [];
      currentMinutes = 0;
    }

    currentQuestions.push(sq);
    currentMinutes += sq.minutes;
  }

  // Push the last batch
  if (currentQuestions.length > 0) {
    scheduleDays.push(buildDay(scheduleDays.length + 1, currentQuestions, currentMinutes));
  }

  // ── Step 5: Ensure exactly N days ──
  // If we have fewer days than requested, add review/practice days
  while (scheduleDays.length < days) {
    const dayNum = scheduleDays.length + 1;
    const isLastDay = dayNum === days;

    // Review days reference earlier questions
    const reviewQuestionIds = getReviewQuestions(scheduleDays, dayNum);

    scheduleDays.push({
      day: dayNum,
      focus: isLastDay ? 'Final review and confidence building' : `Review and practice (Day ${dayNum})`,
      question_ids: reviewQuestionIds,
      minutes: Math.max(30, Math.round(totalMinutes / days)),
    });
  }

  // If we have more days than requested, merge the extras into the last day
  while (scheduleDays.length > days) {
    const extra = scheduleDays.pop()!;
    const lastDay = scheduleDays[scheduleDays.length - 1];
    lastDay.question_ids.push(...extra.question_ids);
    lastDay.minutes += extra.minutes;
  }

  // Re-number days
  scheduleDays.forEach((day, i) => {
    day.day = i + 1;
  });

  return {
    days_available: days,
    days: scheduleDays,
  };
}

/**
 * Build a single schedule day from scored questions.
 */
function buildDay(dayNum: number, questions: ScoredQuestion[], totalMinutes: number): ScheduleDay {
  // Determine the dominant category for the "focus" label
  const categoryCounts = new Map<string, number>();
  for (const sq of questions) {
    const cat = sq.question.category;
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  }

  let dominantCategory = 'General preparation';
  let maxCount = 0;
  for (const [cat, count] of categoryCounts) {
    if (count > maxCount) {
      maxCount = count;
      dominantCategory = formatCategoryLabel(cat);
    }
  }

  return {
    day: dayNum,
    focus: dominantCategory,
    question_ids: questions.map((sq) => sq.question.id),
    minutes: Math.round(totalMinutes), // Ensure integer
  };
}

/**
 * Format a category into a human-readable focus label.
 */
function formatCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'technical': 'Technical fundamentals and coding',
    'behavioural': 'Behavioural and soft skills',
    'system-design': 'System design and architecture',
    'company-fit': 'Company culture and fit',
  };
  return labels[category] || 'General preparation';
}

/**
 * Select review questions from earlier days for review/consolidation days.
 * Prioritizes questions from the earliest days (spaced repetition principle).
 */
function getReviewQuestions(existingDays: ScheduleDay[], currentDayNum: number): string[] {
  const review: string[] = [];
  const maxReview = 5;

  // Take questions from the earliest days first
  for (const day of existingDays) {
    for (const qId of day.question_ids) {
      if (review.length >= maxReview) break;
      review.push(qId);
    }
    if (review.length >= maxReview) break;
  }

  return review;
}
