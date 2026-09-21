/**
 * Pipeline Orchestrator — Coordinates the full kit generation pipeline.
 *
 * Sequence:
 * 1. Validate inputs
 * 2. Crawl company site
 * 3. Search public discussion
 * 4. Extract requirements from JD (LLM #1)
 * 5. Generate company brief (LLM #2)
 * 6. Generate questions per category (LLM #3-6)
 * 7. Coverage check #1 (code)
 * 8. Gap-fill questions if needed (LLM)
 * 9. Coverage check #2 (code)
 * 10. Final gap-fill if needed (LLM)
 * 11. Generate flashcards (LLM #7)
 * 12. Allocate schedule (code)
 * 13. Validate kit structure
 * 14. Return completed kit
 */
import type { Kit, PipelineRunOptions } from '@shared/types/kit.js';
/**
 * Run the full pipeline to generate a kit.
 */
export declare function runPipeline(options: PipelineRunOptions): Promise<Kit>;
