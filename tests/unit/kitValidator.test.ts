/**
 * Kit Validator Tests
 *
 * Tests kit structure validation:
 * - Accepts valid kit
 * - Rejects missing fields
 * - Rejects dangling references
 * - Validates difficulty range and integer minutes
 */

import { describe, it, expect } from 'vitest';
import { validateKit, fixKit } from '../../server/src/pipeline/validation/kitValidator.js';
import type { Kit } from '../../shared/types/kit.js';

function makeValidKit(): Kit {
  return {
    source: {
      company: 'Test Corp',
      company_url: 'https://testcorp.com',
      role: 'Software Engineer',
      location: 'Remote',
      jd_chars: 500,
      researched_at: new Date().toISOString(),
      pages_used: ['https://testcorp.com'],
    },
    company_brief: {
      summary: 'A test company.',
      what_they_do: 'They make software.',
      sources: ['https://testcorp.com'],
    },
    role: {
      title: 'Software Engineer',
      seniority: 'Senior',
      responsibilities: ['Build features'],
      requirements: [
        { id: 'r1', text: '5+ years React', kind: 'technical', priority: 'must' },
        { id: 'r2', text: 'Team player', kind: 'behavioural', priority: 'nice' },
      ],
    },
    questions: [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'Tell me about React',
        answer_outline: 'Cover hooks, state management...',
        difficulty: 2,
      },
      {
        id: 'q2',
        requirement_ids: ['r2'],
        category: 'behavioural',
        prompt: 'Describe teamwork',
        answer_outline: 'Use STAR method...',
        difficulty: 1,
      },
    ],
    flashcards: [
      {
        id: 'f1',
        front: 'What are React hooks?',
        back: 'Functions that let you use state...',
        requirement_ids: ['r1'],
      },
    ],
    schedule: {
      days_available: 2,
      days: [
        { day: 1, focus: 'Technical', question_ids: ['q1'], minutes: 30 },
        { day: 2, focus: 'Behavioural', question_ids: ['q2'], minutes: 20 },
      ],
    },
    coverage: {
      uncovered_requirement_ids: [],
      passes: 2,
    },
  };
}

describe('validateKit', () => {
  it('accepts a valid kit', () => {
    const result = validateKit(makeValidKit());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects dangling question requirement_ids', () => {
    const kit = makeValidKit();
    kit.questions[0].requirement_ids = ['r999']; // Non-existent

    const result = validateKit(kit);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('r999'))).toBe(true);
  });

  it('rejects dangling schedule question_ids', () => {
    const kit = makeValidKit();
    kit.schedule.days[0].question_ids = ['q999']; // Non-existent

    const result = validateKit(kit);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('q999'))).toBe(true);
  });

  it('rejects mismatched days_available and days count', () => {
    const kit = makeValidKit();
    kit.schedule.days_available = 5; // But only 2 days

    const result = validateKit(kit);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('days_available'))).toBe(true);
  });

  it('rejects duplicate IDs', () => {
    const kit = makeValidKit();
    kit.questions[1].id = 'q1'; // Duplicate

    const result = validateKit(kit);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate'))).toBe(true);
  });

  it('rejects non-integer minutes', () => {
    const kit = makeValidKit();
    kit.schedule.days[0].minutes = 30.5;

    const result = validateKit(kit);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('integer'))).toBe(true);
  });

  it('rejects difficulty outside 1-3 range', () => {
    const kit = makeValidKit();
    kit.questions[0].difficulty = 5 as any;

    const result = validateKit(kit);
    expect(result.valid).toBe(false);
  });
});

describe('fixKit', () => {
  it('fixes non-integer minutes', () => {
    const kit = makeValidKit();
    kit.schedule.days[0].minutes = 30.7;

    const fixed = fixKit(kit);
    expect(fixed.schedule.days[0].minutes).toBe(31);
    expect(Number.isInteger(fixed.schedule.days[0].minutes)).toBe(true);
  });

  it('fixes days count mismatch by adding review days', () => {
    const kit = makeValidKit();
    kit.schedule.days_available = 4; // More than actual days

    const fixed = fixKit(kit);
    expect(fixed.schedule.days).toHaveLength(4);
  });

  it('removes dangling requirement references', () => {
    const kit = makeValidKit();
    kit.questions[0].requirement_ids = ['r1', 'r999'];

    const fixed = fixKit(kit);
    expect(fixed.questions[0].requirement_ids).toEqual(['r1']);
  });

  it('clamps difficulty to valid range', () => {
    const kit = makeValidKit();
    kit.questions[0].difficulty = 0 as any;

    const fixed = fixKit(kit);
    expect(fixed.questions[0].difficulty).toBe(1);
  });
});
