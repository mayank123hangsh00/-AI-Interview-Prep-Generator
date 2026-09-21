/**
 * Coverage Checker Tests
 *
 * Tests the pure-code coverage checking logic:
 * - Identifies uncovered requirements
 * - Distinguishes must vs nice
 * - Returns empty uncovered when all covered
 */

import { describe, it, expect } from 'vitest';
import { checkCoverage, buildCoverageSection } from '../../server/src/pipeline/coverage/coverageChecker.js';
import type { Question, Requirement } from '../../shared/types/kit.js';

const makeReq = (id: string, priority: 'must' | 'nice' = 'must'): Requirement => ({
  id,
  text: `Requirement ${id}`,
  kind: 'technical',
  priority,
});

const makeQ = (id: string, reqIds: string[]): Question => ({
  id,
  requirement_ids: reqIds,
  category: 'technical',
  prompt: `Question ${id}`,
  answer_outline: `Answer ${id}`,
  difficulty: 2,
});

describe('checkCoverage', () => {
  it('identifies all requirements as covered when each has a question', () => {
    const reqs = [makeReq('r1'), makeReq('r2'), makeReq('r3')];
    const qs = [
      makeQ('q1', ['r1']),
      makeQ('q2', ['r2']),
      makeQ('q3', ['r3']),
    ];

    const result = checkCoverage(reqs, qs);
    expect(result.allMustCovered).toBe(true);
    expect(result.uncoveredIds).toHaveLength(0);
    expect(result.coveragePercentage).toBe(100);
  });

  it('identifies uncovered requirements', () => {
    const reqs = [makeReq('r1'), makeReq('r2'), makeReq('r3')];
    const qs = [makeQ('q1', ['r1'])]; // r2 and r3 uncovered

    const result = checkCoverage(reqs, qs);
    expect(result.uncoveredIds).toContain('r2');
    expect(result.uncoveredIds).toContain('r3');
    expect(result.uncoveredIds).not.toContain('r1');
  });

  it('distinguishes must from nice uncovered requirements', () => {
    const reqs = [
      makeReq('r1', 'must'),
      makeReq('r2', 'nice'),
      makeReq('r3', 'must'),
    ];
    const qs = [makeQ('q1', ['r1'])]; // r2 (nice) and r3 (must) uncovered

    const result = checkCoverage(reqs, qs);
    expect(result.uncoveredMust).toHaveLength(1);
    expect(result.uncoveredMust[0].id).toBe('r3');
    expect(result.uncoveredNice).toHaveLength(1);
    expect(result.uncoveredNice[0].id).toBe('r2');
    expect(result.allMustCovered).toBe(false);
  });

  it('reports allMustCovered true when only nice requirements are uncovered', () => {
    const reqs = [
      makeReq('r1', 'must'),
      makeReq('r2', 'nice'),
    ];
    const qs = [makeQ('q1', ['r1'])]; // Only r2 (nice) is uncovered

    const result = checkCoverage(reqs, qs);
    expect(result.allMustCovered).toBe(true);
    expect(result.uncoveredNice).toHaveLength(1);
  });

  it('handles questions covering multiple requirements', () => {
    const reqs = [makeReq('r1'), makeReq('r2')];
    const qs = [makeQ('q1', ['r1', 'r2'])]; // One question covers both

    const result = checkCoverage(reqs, qs);
    expect(result.allMustCovered).toBe(true);
    expect(result.uncoveredIds).toHaveLength(0);
  });

  it('handles empty requirements', () => {
    const result = checkCoverage([], [makeQ('q1', ['r1'])]);
    expect(result.allMustCovered).toBe(true);
    expect(result.coveragePercentage).toBe(100);
  });

  it('handles empty questions', () => {
    const reqs = [makeReq('r1', 'must')];
    const result = checkCoverage(reqs, []);
    expect(result.allMustCovered).toBe(false);
    expect(result.uncoveredIds).toContain('r1');
    expect(result.coveragePercentage).toBe(0);
  });

  it('builds correct coverage section for the kit', () => {
    const reqs = [makeReq('r1'), makeReq('r2')];
    const qs = [makeQ('q1', ['r1'])];

    const coverage = buildCoverageSection(reqs, qs, 2);
    expect(coverage.passes).toBe(2);
    expect(coverage.uncovered_requirement_ids).toContain('r2');
  });
});
