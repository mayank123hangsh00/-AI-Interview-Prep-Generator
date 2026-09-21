/**
 * Schedule Allocator Tests
 *
 * Tests the pure-code schedule allocation logic:
 * - Correct number of days
 * - All must-haves included
 * - Harder material first
 * - Integer minutes
 * - Edge cases: 1 day, 60 days, no questions
 */

import { describe, it, expect } from 'vitest';
import { allocateSchedule } from '../../server/src/pipeline/scheduling/scheduleAllocator.js';
import type { Question, Requirement } from '../../shared/types/kit.js';

// Test fixtures
const makeRequirement = (id: string, priority: 'must' | 'nice' = 'must'): Requirement => ({
  id,
  text: `Requirement ${id}`,
  kind: 'technical',
  priority,
});

const makeQuestion = (
  id: string,
  reqIds: string[],
  difficulty: 1 | 2 | 3 = 2,
  category: 'technical' | 'behavioural' | 'system-design' | 'company-fit' = 'technical'
): Question => ({
  id,
  requirement_ids: reqIds,
  category,
  prompt: `Question ${id}`,
  answer_outline: `Answer for ${id}`,
  difficulty,
});

describe('allocateSchedule', () => {
  it('produces exactly the requested number of days', () => {
    const reqs = [makeRequirement('r1'), makeRequirement('r2')];
    const qs = [
      makeQuestion('q1', ['r1'], 2),
      makeQuestion('q2', ['r2'], 1),
      makeQuestion('q3', ['r1'], 3),
    ];

    const schedule = allocateSchedule(qs, reqs, 3);
    expect(schedule.days_available).toBe(3);
    expect(schedule.days).toHaveLength(3);
  });

  it('works with 1-day schedule', () => {
    const reqs = [makeRequirement('r1'), makeRequirement('r2')];
    const qs = [
      makeQuestion('q1', ['r1'], 2),
      makeQuestion('q2', ['r2'], 3),
    ];

    const schedule = allocateSchedule(qs, reqs, 1);
    expect(schedule.days_available).toBe(1);
    expect(schedule.days).toHaveLength(1);
    expect(schedule.days[0].question_ids).toContain('q1');
    expect(schedule.days[0].question_ids).toContain('q2');
  });

  it('works with a large number of days (60)', () => {
    const reqs = [makeRequirement('r1')];
    const qs = [makeQuestion('q1', ['r1'], 2)];

    const schedule = allocateSchedule(qs, reqs, 60);
    expect(schedule.days_available).toBe(60);
    expect(schedule.days).toHaveLength(60);
  });

  it('places harder material earlier', () => {
    const reqs = [makeRequirement('r1'), makeRequirement('r2')];
    const qs = [
      makeQuestion('q1', ['r1'], 1), // Easy
      makeQuestion('q2', ['r2'], 3), // Hard
      makeQuestion('q3', ['r1'], 2), // Medium
    ];

    const schedule = allocateSchedule(qs, reqs, 3);
    // Hardest questions should be in day 1
    const day1Questions = schedule.days[0].question_ids;
    expect(day1Questions).toContain('q2'); // Hard question should be first
  });

  it('ensures all must-have requirements are covered in schedule', () => {
    const reqs = [
      makeRequirement('r1', 'must'),
      makeRequirement('r2', 'must'),
      makeRequirement('r3', 'nice'),
    ];
    const qs = [
      makeQuestion('q1', ['r1'], 2),
      makeQuestion('q2', ['r2'], 1),
      makeQuestion('q3', ['r3'], 1),
    ];

    const schedule = allocateSchedule(qs, reqs, 2);
    const allQuestionIds = schedule.days.flatMap((d) => d.question_ids);

    // Must-have questions should be included
    expect(allQuestionIds).toContain('q1');
    expect(allQuestionIds).toContain('q2');
  });

  it('produces integer minutes for every day', () => {
    const reqs = [makeRequirement('r1'), makeRequirement('r2')];
    const qs = [
      makeQuestion('q1', ['r1'], 1),
      makeQuestion('q2', ['r2'], 2),
      makeQuestion('q3', ['r1'], 3),
    ];

    const schedule = allocateSchedule(qs, reqs, 2);

    for (const day of schedule.days) {
      expect(Number.isInteger(day.minutes)).toBe(true);
      expect(day.minutes).toBeGreaterThanOrEqual(0);
    }
  });

  it('handles empty questions array', () => {
    const schedule = allocateSchedule([], [], 3);
    expect(schedule.days_available).toBe(3);
    expect(schedule.days).toHaveLength(3);
  });

  it('every day has a focus label', () => {
    const reqs = [makeRequirement('r1')];
    const qs = [makeQuestion('q1', ['r1'], 2)];

    const schedule = allocateSchedule(qs, reqs, 3);

    for (const day of schedule.days) {
      expect(day.focus).toBeTruthy();
      expect(typeof day.focus).toBe('string');
    }
  });

  it('day numbers are sequential starting from 1', () => {
    const reqs = [makeRequirement('r1')];
    const qs = [makeQuestion('q1', ['r1'], 2)];

    const schedule = allocateSchedule(qs, reqs, 5);

    schedule.days.forEach((day, i) => {
      expect(day.day).toBe(i + 1);
    });
  });
});
