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
export declare function checkCoverage(requirements: Requirement[], questions: Question[]): CoverageResult;
/**
 * Build the coverage section for the kit.
 */
export declare function buildCoverageSection(requirements: Requirement[], questions: Question[], passes: number): Coverage;
