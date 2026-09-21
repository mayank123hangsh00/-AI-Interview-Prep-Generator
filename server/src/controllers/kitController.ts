/**
 * Kit Controller — Handles HTTP requests for kit operations.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';
import * as kitService from '../services/kitService.js';
import { KitModel } from '../models/Kit.js';

/**
 * POST /api/kits — Create a new kit.
 */
export async function createKit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { jobDescription, companyUrl, daysAvailable } = req.body;
    const kit = await kitService.createKit(req.userId!, jobDescription, companyUrl, daysAvailable);
    res.status(201).json({ kit });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/kits/batch — Create multiple kits from a file upload.
 */
export async function createBatchKits(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cases } = req.body; // Array of { jobDescription, companyUrl, daysAvailable }

    if (!Array.isArray(cases) || cases.length === 0) {
      throw createError(400, 'Cases array is required', 'INVALID_INPUT');
    }

    const results = [];
    for (const c of cases) {
      try {
        const kit = await kitService.createKit(req.userId!, c.jobDescription, c.companyUrl, c.daysAvailable);
        results.push({ id: kit._id, status: 'created' });
      } catch (error: any) {
        results.push({ id: null, status: 'failed', error: error.message });
      }
    }

    res.status(201).json({ results });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/kits — List user's kits.
 */
export async function listKits(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kits = await kitService.getUserKits(req.userId!);
    res.json({ kits });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/kits/:id — Get a single kit.
 */
export async function getKit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kitId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const kit = await kitService.getKit(kitId, req.userId!);
    if (!kit) {
      throw createError(404, 'Kit not found', 'KIT_NOT_FOUND');
    }
    res.json({ kit });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/kits/:id/progress — SSE stream for generation progress.
 */
export async function getKitProgress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kitId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const kitDoc = await KitModel.findOne({ _id: kitId, userId: req.userId });
    if (!kitDoc) {
      throw createError(404, 'Kit not found', 'KIT_NOT_FOUND');
    }

    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Send initial progress
    res.write(`data: ${JSON.stringify({ progress: kitDoc.progress, status: kitDoc.status })}\n\n`);

    // Poll for updates (simple approach — works reliably)
    const interval = setInterval(async () => {
      try {
        const updated = await KitModel.findById(kitId).lean();
        if (!updated) {
          clearInterval(interval);
          res.end();
          return;
        }

        res.write(`data: ${JSON.stringify({ progress: updated.progress, status: updated.status })}\n\n`);

        // Stop polling when done or failed
        if (updated.status === 'ready' || updated.status === 'failed') {
          clearInterval(interval);
          res.write(`data: ${JSON.stringify({ done: true, status: updated.status })}\n\n`);
          res.end();
        }
      } catch {
        clearInterval(interval);
        res.end();
      }
    }, 2000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/kits/:id/questions/:qid — Edit a question.
 */
export async function updateQuestion(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kitId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const qid = Array.isArray(req.params.qid) ? req.params.qid[0] : req.params.qid;
    const kit = await kitService.updateQuestion(kitId, req.userId!, qid, req.body);
    if (!kit) throw createError(404, 'Kit or question not found', 'NOT_FOUND');
    res.json({ kit });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/kits/:id/questions — Add a question.
 */
export async function addQuestion(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kitId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const kit = await kitService.addQuestion(kitId, req.userId!, req.body);
    if (!kit) throw createError(404, 'Kit not found', 'NOT_FOUND');
    res.json({ kit });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/kits/:id/questions/:qid — Delete a question.
 */
export async function deleteQuestion(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kitId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const qid = Array.isArray(req.params.qid) ? req.params.qid[0] : req.params.qid;
    const kit = await kitService.deleteQuestion(kitId, req.userId!, qid);
    if (!kit) throw createError(404, 'Kit or question not found', 'NOT_FOUND');
    res.json({ kit });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/kits/:id/questions/reorder — Reorder questions.
 */
export async function reorderQuestions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kitId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds)) {
      throw createError(400, 'questionIds array is required', 'INVALID_INPUT');
    }
    const kit = await kitService.reorderQuestions(kitId, req.userId!, questionIds);
    if (!kit) throw createError(404, 'Kit not found', 'NOT_FOUND');
    res.json({ kit });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/kits/:id/flashcards/:fid — Edit a flashcard.
 */
export async function updateFlashcard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kitId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const fid = Array.isArray(req.params.fid) ? req.params.fid[0] : req.params.fid;
    const kit = await kitService.updateFlashcard(kitId, req.userId!, fid, req.body);
    if (!kit) throw createError(404, 'Kit or flashcard not found', 'NOT_FOUND');
    res.json({ kit });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/kits/:id/flashcards — Add a flashcard.
 */
export async function addFlashcard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kitId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const kit = await kitService.addFlashcard(kitId, req.userId!, req.body);
    if (!kit) throw createError(404, 'Kit not found', 'NOT_FOUND');
    res.json({ kit });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/kits/:id/flashcards/:fid — Delete a flashcard.
 */
export async function deleteFlashcard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kitId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const fid = Array.isArray(req.params.fid) ? req.params.fid[0] : req.params.fid;
    const kit = await kitService.deleteFlashcard(kitId, req.userId!, fid);
    if (!kit) throw createError(404, 'Kit or flashcard not found', 'NOT_FOUND');
    res.json({ kit });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/kits/:id/company-brief — Edit company brief.
 */
export async function updateCompanyBrief(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kitId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const kit = await kitService.updateCompanyBrief(kitId, req.userId!, req.body);
    if (!kit) throw createError(404, 'Kit not found', 'NOT_FOUND');
    res.json({ kit });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/kits/:id/regenerate/:section — Regenerate a section.
 */
export async function regenerateSection(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kitId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const section = Array.isArray(req.params.section) ? req.params.section[0] : req.params.section;
    const validSections = ['company_brief', 'questions', 'technical', 'behavioural', 'system-design', 'company-fit', 'flashcards', 'schedule'];
    if (!validSections.includes(section)) {
      throw createError(400, `Invalid section: ${section}`, 'INVALID_SECTION');
    }

    const kit = await kitService.regenerateSection(kitId, req.userId!, section);
    if (!kit) throw createError(404, 'Kit not found', 'NOT_FOUND');
    res.json({ kit });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/kits/:id/practice — Update practice state.
 */
export async function updatePracticeState(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kitId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { flashcardId, confidence } = req.body;
    if (!flashcardId || !confidence) {
      throw createError(400, 'flashcardId and confidence are required', 'INVALID_INPUT');
    }

    const kit = await kitService.updatePracticeState(kitId, req.userId!, flashcardId, confidence);
    if (!kit) throw createError(404, 'Kit not found', 'NOT_FOUND');
    res.json({ kit });
  } catch (error) {
    next(error);
  }
}
