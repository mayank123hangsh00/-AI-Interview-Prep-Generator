/**
 * Kit Routes — All API routes for kit operations.
 */
import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as kitCtrl from '../controllers/kitController.js';
const router = Router();
// All kit routes require authentication
router.use(authMiddleware);
// Validation schemas
const createKitSchema = z.object({
    jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
    companyUrl: z.string().url('Invalid company URL'),
    daysAvailable: z.number().int().min(1, 'Days must be at least 1').max(365, 'Days must be at most 365'),
});
const batchSchema = z.object({
    cases: z.array(z.object({
        jobDescription: z.string().min(10),
        companyUrl: z.string().url(),
        daysAvailable: z.number().int().min(1),
    })).min(1, 'At least one case is required'),
});
// Kit CRUD
router.post('/', validate(createKitSchema), kitCtrl.createKit);
router.post('/batch', validate(batchSchema), kitCtrl.createBatchKits);
router.get('/', kitCtrl.listKits);
router.get('/:id', kitCtrl.getKit);
router.get('/:id/progress', kitCtrl.getKitProgress);
// Question operations
router.patch('/:id/questions/reorder', kitCtrl.reorderQuestions);
router.patch('/:id/questions/:qid', kitCtrl.updateQuestion);
router.post('/:id/questions', kitCtrl.addQuestion);
router.delete('/:id/questions/:qid', kitCtrl.deleteQuestion);
// Flashcard operations
router.patch('/:id/flashcards/:fid', kitCtrl.updateFlashcard);
router.post('/:id/flashcards', kitCtrl.addFlashcard);
router.delete('/:id/flashcards/:fid', kitCtrl.deleteFlashcard);
// Company brief
router.patch('/:id/company-brief', kitCtrl.updateCompanyBrief);
// Regeneration
router.post('/:id/regenerate/:section', kitCtrl.regenerateSection);
// Practice
router.patch('/:id/practice', kitCtrl.updatePracticeState);
export default router;
//# sourceMappingURL=kits.js.map