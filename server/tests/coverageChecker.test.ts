import { describe, it, expect } from 'vitest';
import { checkCoverage, buildCoverageSection } from '../src/pipeline/coverage/coverageChecker.js';
import type { Question, Requirement } from '../../shared/types/kit.js';

describe('Coverage Checker', () => {
  const requirements: Requirement[] = [
    { id: 'req_1', text: 'Node.js', priority: 'must', kind: 'technical' },
    { id: 'req_2', text: 'MongoDB', priority: 'must', kind: 'technical' },
    { id: 'req_3', text: 'Docker', priority: 'nice', kind: 'technical' },
  ];

  it('correctly identifies covered and uncovered requirements', () => {
    const questions: Question[] = [
      { id: 'q1', requirement_ids: ['req_1'], category: 'technical', prompt: 'Node.js event loop?', answer_outline: 'Single-threaded event loop', difficulty: 2 },
    ];

    const result = checkCoverage(requirements, questions);

    expect(result.coveragePercentage).toBe(33); // 1 out of 3 total
    expect(result.uncoveredMust.length).toBe(1); // req_2
    expect(result.uncoveredMust[0].id).toBe('req_2');
    expect(result.uncoveredNice.length).toBe(1); // req_3
    expect(result.allMustCovered).toBe(false);
  });

  it('returns 100% coverage when all requirements are mapped', () => {
    const questions: Question[] = [
      { id: 'q1', requirement_ids: ['req_1'], category: 'technical', prompt: 'Node.js event loop?', answer_outline: 'Explain', difficulty: 2 },
      { id: 'q2', requirement_ids: ['req_2', 'req_3'], category: 'technical', prompt: 'MongoDB and Docker setup?', answer_outline: 'Explain containerization and indexing', difficulty: 2 },
    ];

    const result = checkCoverage(requirements, questions);

    expect(result.coveragePercentage).toBe(100);
    expect(result.allMustCovered).toBe(true);
    expect(result.uncoveredMust.length).toBe(0);
  });

  it('builds full coverage section object', () => {
    const questions: Question[] = [
      { id: 'q1', requirement_ids: ['req_1'], category: 'technical', prompt: 'Node.js event loop?', answer_outline: 'Explain', difficulty: 2 },
    ];

    const section = buildCoverageSection(requirements, questions, 1);

    expect(section.passes).toBe(1);
    expect(section.uncovered_requirement_ids).toContain('req_2');
    expect(section.uncovered_requirement_ids).toContain('req_3');
  });
});
