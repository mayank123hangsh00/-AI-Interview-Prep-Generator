/**
 * Flashcard Generator — Creates study flashcards from requirements and questions.
 * LLM Call #7 in the pipeline.
 */
import type { Requirement, Question, Flashcard } from '@shared/types/kit.js';
/**
 * Generate flashcards from requirements and questions.
 */
export declare function generateFlashcards(requirements: Requirement[], questions: Question[], startId?: number): Promise<Flashcard[]>;
