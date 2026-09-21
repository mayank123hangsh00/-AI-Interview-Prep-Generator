/**
 * Kit Controller — Handles HTTP requests for kit operations.
 */
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
/**
 * POST /api/kits — Create a new kit.
 */
export declare function createKit(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * POST /api/kits/batch — Create multiple kits from a file upload.
 */
export declare function createBatchKits(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/kits — List user's kits.
 */
export declare function listKits(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/kits/:id — Get a single kit.
 */
export declare function getKit(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * GET /api/kits/:id/progress — SSE stream for generation progress.
 */
export declare function getKitProgress(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * PATCH /api/kits/:id/questions/:qid — Edit a question.
 */
export declare function updateQuestion(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * POST /api/kits/:id/questions — Add a question.
 */
export declare function addQuestion(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * DELETE /api/kits/:id/questions/:qid — Delete a question.
 */
export declare function deleteQuestion(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * PATCH /api/kits/:id/questions/reorder — Reorder questions.
 */
export declare function reorderQuestions(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * PATCH /api/kits/:id/flashcards/:fid — Edit a flashcard.
 */
export declare function updateFlashcard(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * POST /api/kits/:id/flashcards — Add a flashcard.
 */
export declare function addFlashcard(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * DELETE /api/kits/:id/flashcards/:fid — Delete a flashcard.
 */
export declare function deleteFlashcard(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * PATCH /api/kits/:id/company-brief — Edit company brief.
 */
export declare function updateCompanyBrief(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * POST /api/kits/:id/regenerate/:section — Regenerate a section.
 */
export declare function regenerateSection(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * PATCH /api/kits/:id/practice — Update practice state.
 */
export declare function updatePracticeState(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
