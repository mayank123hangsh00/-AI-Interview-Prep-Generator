import { describe, it, expect } from 'vitest';
import { validateKit, fixKit } from '../src/pipeline/validation/kitValidator.js';
import type { Kit } from '../../shared/types/kit.js';

describe('Kit Validator & Auto-fixer', () => {
  const validKit: Kit = {
    source: {
      company: 'stripe.com',
      company_url: 'https://stripe.com',
      role: 'Backend Engineer',
      location: 'Remote',
      jd_chars: 500,
      researched_at: new Date().toISOString(),
      pages_used: ['https://stripe.com'],
    },
    company_brief: {
      summary: 'Stripe provides financial infrastructure for the internet.',
      what_they_do: 'Processes online payments and financial software APIs.',
      hiring_process: 'Initial call, technical screen, virtual onsite.',
      culture_notes: 'Engineering excellence and rigorous documentation.',
      sources: ['https://stripe.com'],
    },
    role: {
      title: 'Senior Backend Engineer',
      seniority: 'Senior',
      responsibilities: ['Build APIs', 'Optimize database queries'],
      requirements: [
        { id: 'req_1', text: 'Go expertise', priority: 'must', kind: 'technical' },
      ],
    },
    questions: [
      { id: 'q1', requirement_ids: ['req_1'], category: 'technical', prompt: 'Explain Go channels', answer_outline: 'Buffered vs unbuffered channels', difficulty: 2 },
    ],
    flashcards: [
      { id: 'fc_1', front: 'What is a Go goroutine?', back: 'A lightweight thread managed by Go runtime', requirement_ids: ['req_1'] },
    ],
    schedule: {
      days_available: 3,
      days: [
        { day: 1, focus: 'Go Core & Concurrency', question_ids: ['q1'], minutes: 60 },
        { day: 2, focus: 'System Design', question_ids: [], minutes: 60 },
        { day: 3, focus: 'Mock Practice', question_ids: [], minutes: 60 },
      ],
    },
    coverage: {
      passes: 1,
      uncovered_requirement_ids: [],
    },
  };

  it('validates a complete, correctly-formed kit', () => {
    const result = validateKit(validKit);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('detects invalid schedule day count or missing orphan IDs', () => {
    const badKit: Kit = {
      ...validKit,
      schedule: {
        days_available: 2, // Mismatch: 3 days provided
        days: validKit.schedule.days,
      },
    };

    const result = validateKit(badKit);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('days_available'))).toBe(true);
  });

  it('fixes orphan requirement IDs and validates successfully', () => {
    const orphanKit: Kit = {
      ...validKit,
      questions: [
        { id: 'q1', requirement_ids: ['req_1', 'req_nonexistent'], category: 'technical', prompt: 'Sample prompt', answer_outline: 'Sample outline', difficulty: 1 },
      ],
    };

    const fixed = fixKit(orphanKit);
    expect(fixed.questions[0].requirement_ids).toEqual(['req_1']);

    const revalidation = validateKit(fixed);
    expect(revalidation.errors).toEqual([]);
    expect(revalidation.valid).toBe(true);
  });
});
