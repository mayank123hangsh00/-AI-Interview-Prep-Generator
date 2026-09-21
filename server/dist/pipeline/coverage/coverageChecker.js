/**
 * Coverage Checker — Pure code, no LLM.
 *
 * Compares generated questions against extracted requirements to find gaps.
 * This is deterministic logic that belongs in code, not in a prompt.
 */
/**
 * Check which requirements are covered by the generated questions.
 *
 * A requirement is "covered" if at least one question references it
 * in its requirement_ids array.
 */
export function checkCoverage(requirements, questions) {
    // Build coverage map: requirementId → questionIds
    const coverageMap = new Map();
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
export function buildCoverageSection(requirements, questions, passes) {
    const result = checkCoverage(requirements, questions);
    return {
        uncovered_requirement_ids: result.uncoveredIds,
        passes,
    };
}
//# sourceMappingURL=coverageChecker.js.map