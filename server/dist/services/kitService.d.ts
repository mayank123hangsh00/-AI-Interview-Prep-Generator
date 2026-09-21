/**
 * Kit Service — Business logic layer for kit operations.
 * Handles creation, pipeline execution, editing, regeneration.
 */
import { type IKit } from '../models/Kit.js';
import type { Kit, Question, Flashcard } from '../../../shared/types/kit.js';
/**
 * Create a new kit and start the generation pipeline.
 */
export declare function createKit(userId: string, jobDescription: string, companyUrl: string, daysAvailable: number): Promise<IKit>;
/**
 * Get all kits for a user.
 */
export declare function getUserKits(userId: string): Promise<IKit[]>;
/**
 * Get a single kit by ID, ensuring it belongs to the user.
 */
export declare function getKit(kitId: string, userId: string): Promise<IKit | null>;
/**
 * Update a question in the kit (edit).
 */
export declare function updateQuestion(kitId: string, userId: string, questionId: string, updates: Partial<Question>): Promise<IKit | null>;
/**
 * Add a new question to the kit (pinned).
 */
export declare function addQuestion(kitId: string, userId: string, question: Omit<Question, 'id'>): Promise<IKit | null>;
/**
 * Delete a question from the kit.
 */
export declare function deleteQuestion(kitId: string, userId: string, questionId: string): Promise<IKit | null>;
/**
 * Reorder questions in the kit.
 */
export declare function reorderQuestions(kitId: string, userId: string, questionIds: string[]): Promise<IKit | null>;
/**
 * Update a flashcard in the kit.
 */
export declare function updateFlashcard(kitId: string, userId: string, flashcardId: string, updates: Partial<Flashcard>): Promise<IKit | null>;
/**
 * Add a new flashcard to the kit.
 */
export declare function addFlashcard(kitId: string, userId: string, flashcard: Omit<Flashcard, 'id'>): Promise<IKit | null>;
/**
 * Delete a flashcard from the kit.
 */
export declare function deleteFlashcard(kitId: string, userId: string, flashcardId: string): Promise<IKit | null>;
/**
 * Update company brief.
 */
export declare function updateCompanyBrief(kitId: string, userId: string, updates: Partial<Kit['company_brief']>): Promise<IKit | null>;
/**
 * Regenerate a section of the kit without losing edits elsewhere.
 *
 * This is the hardest state problem in the assessment:
 * - 'generated' items are replaced
 * - 'edited' items are preserved
 * - 'pinned' items are preserved
 */
export declare function regenerateSection(kitId: string, userId: string, section: string): Promise<IKit | null>;
/**
 * Update practice state for a flashcard.
 */
export declare function updatePracticeState(kitId: string, userId: string, flashcardId: string, confidence: number): Promise<IKit | null>;
