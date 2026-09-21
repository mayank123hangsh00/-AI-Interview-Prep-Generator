/**
 * Question Generator — Generates interview questions per category.
 * LLM Calls #3-6 in the pipeline (one per category).
 *
 * Key design: questions are generated separately per category because
 * "5 years of React" → technical questions, while
 * "mentoring junior engineers" → behavioural questions.
 * These should not come from the same call with the same instructions.
 */
import type { Requirement, Question, QuestionCategory } from '@shared/types/kit.js';
/**
 * Generate questions for a specific category of requirements.
 */
export declare function generateQuestionsForCategory(category: QuestionCategory, requirements: Requirement[], hiringContext: string, startId: number): Promise<Question[]>;
/**
 * Generate all questions across categories.
 * Splits requirements by kind and generates per-category.
 */
export declare function generateAllQuestions(requirements: Requirement[], hiringContext: string, responsibilities: string[]): Promise<Question[]>;
/**
 * Generate gap-filling questions for uncovered requirements.
 */
export declare function generateGapFillingQuestions(uncoveredRequirements: Requirement[], startId: number): Promise<Question[]>;
