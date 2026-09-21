import { describe, it, expect } from 'vitest';
import { allocateSchedule } from '../src/pipeline/scheduling/scheduleAllocator.js';
import type { Question, Requirement } from '../../shared/types/kit.js';

describe('Schedule Allocator', () => {
  const sampleRequirements: Requirement[] = [
    { id: 'req_1', text: 'Distributed systems', priority: 'must', kind: 'technical' },
    { id: 'req_2', text: 'Go backend', priority: 'must', kind: 'technical' },
    { id: 'req_3', text: 'Leadership', priority: 'nice', kind: 'behavioural' },
  ];

  const sampleQuestions: Question[] = [
    { id: 'q1', requirement_ids: ['req_1'], category: 'technical', prompt: 'Tell me about Raft consensus algorithm', answer_outline: 'Explain quorum and leader election', difficulty: 3 },
    { id: 'q2', requirement_ids: ['req_2'], category: 'technical', prompt: 'How does Go garbage collection work?', answer_outline: 'Tri-color mark and sweep', difficulty: 2 },
    { id: 'q3', requirement_ids: ['req_3'], category: 'behavioural', prompt: 'Describe a time you led a project', answer_outline: 'STAR method response', difficulty: 1 },
    { id: 'q4', requirement_ids: ['req_1'], category: 'system-design', prompt: 'Design a distributed key-value store', answer_outline: 'Consistent hashing and replication', difficulty: 3 },
  ];

  it('allocates all questions across available days', () => {
    const daysAvailable = 3;
    const schedule = allocateSchedule(sampleQuestions, sampleRequirements, daysAvailable);

    expect(schedule.days_available).toBe(3);
    expect(schedule.days.length).toBe(3);

    const allocatedQIds = schedule.days.flatMap((d) => d.question_ids);
    expect(allocatedQIds.length).toBe(sampleQuestions.length);
    expect(new Set(allocatedQIds).size).toBe(sampleQuestions.length);
  });

  it('allocates questions evenly when days exceed questions', () => {
    const daysAvailable = 7;
    const schedule = allocateSchedule(sampleQuestions, sampleRequirements, daysAvailable);

    expect(schedule.days.length).toBe(7);
    const allocatedQIds = schedule.days.flatMap((d) => d.question_ids);
    const uniqueQIds = new Set(allocatedQIds);
    expect(uniqueQIds.size).toBe(sampleQuestions.length);
  });

  it('assigns positive minutes for each day with focus title', () => {
    const schedule = allocateSchedule(sampleQuestions, sampleRequirements, 2);

    schedule.days.forEach((day) => {
      expect(day.day).toBeGreaterThan(0);
      expect(day.focus).toBeTruthy();
      expect(day.minutes).toBeGreaterThan(0);
    });
  });
});
