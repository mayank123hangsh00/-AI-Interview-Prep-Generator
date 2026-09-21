/**
 * Flashcard Generator — Creates study flashcards from requirements and questions.
 * LLM Call #7 in the pipeline.
 */
import { callLLM } from './llmClient.js';
import { FLASHCARD_SYSTEM, FLASHCARD_USER } from './promptTemplates.js';
/**
 * Generate flashcards from requirements and questions.
 */
export async function generateFlashcards(requirements, questions, startId = 1) {
    console.log('  📇 Generating flashcards...');
    const response = await callLLM(FLASHCARD_SYSTEM, FLASHCARD_USER(requirements, questions, startId), { temperature: 0.4, maxOutputTokens: 8192 });
    let flashcards = Array.isArray(response.data) ? response.data : [];
    // Validate and fix
    flashcards = flashcards.map((f, i) => ({
        id: f.id || `f${startId + i}`,
        front: f.front || '',
        back: f.back || '',
        requirement_ids: Array.isArray(f.requirement_ids) ? f.requirement_ids : [],
    }));
    // Filter out empty flashcards
    flashcards = flashcards.filter((f) => f.front.trim().length > 0 && f.back.trim().length > 0);
    // Re-number IDs
    flashcards.forEach((f, i) => {
        f.id = `f${i + 1}`;
    });
    console.log(`  ✅ Generated ${flashcards.length} flashcards`);
    return flashcards;
}
//# sourceMappingURL=flashcardGenerator.js.map