/**
 * Coverage Checker — Pure code, no LLM.
 *
 * Compares generated questions against extracted requirements to find gaps.
 * This is deterministic logic that belongs in code, not in a prompt.
 */

import type { Requirement, Question, Coverage } from '@shared/types/kit.js';

export interface CoverageResult {
  /** All uncovered requirement IDs */
  uncoveredIds: string[];
  /** Uncovered must-have requirements */
  uncoveredMust: Requirement[];
  /** Uncovered nice-to-have requirements */
  uncoveredNice: Requirement[];
  /** Whether all must-have requirements are covered */
  allMustCovered: boolean;
  /** Map of requirement ID to question IDs covering it */
  coverageMap: Map<string, string[]>;
  /** Total coverage percentage */
  coveragePercentage: number;
}

/**
 * Check which requirements are covered by the generated questions.
 *
 * A requirement is "covered" if at least one question references it
 * in its requirement_ids array.
 */
export function checkCoverage(
  requirements: Requirement[],
  questions: Question[]
): CoverageResult {
  // Build coverage map: requirementId → questionIds
  const coverageMap = new Map<string, string[]>();

  for (const req of requirements) {
    coverageMap.set(req.id, []);
  }

  for (const question of questions) {
    for (const reqId of question.requirement_ids) {
      const existing = coverageMap.get(reqId);
      if (existing) {
        existing.push(question.id);
      }
    }
  }

  // Find uncovered requirements
  const uncoveredReqs = requirements.filter((req) => {
    const covering = coverageMap.get(req.id);
    return !covering || covering.length === 0;
  });

  const uncoveredMust = uncoveredReqs.filter((r) => r.priority === 'must');
  const uncoveredNice = uncoveredReqs.filter((r) => r.priority === 'nice');

  const coveredCount = requirements.length - uncoveredReqs.length;
  const coveragePercentage = requirements.length > 0
    ? Math.round((coveredCount / requirements.length) * 100)
    : 100;

  return {
    uncoveredIds: uncoveredReqs.map((r) => r.id),
    uncoveredMust,
    uncoveredNice,
    allMustCovered: uncoveredMust.length === 0,
    coverageMap,
    coveragePercentage,
  };
}

/**
 * Build the coverage section for the kit.
 */
export function buildCoverageSection(
  requirements: Requirement[],
  questions: Question[],
  passes: number
): Coverage {
  const result = checkCoverage(requirements, questions);

  return {
    uncovered_requirement_ids: result.uncoveredIds,
    passes,
  };
}
