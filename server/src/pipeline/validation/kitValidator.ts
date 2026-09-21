/**
 * Kit Validator — Validates a generated kit against the Appendix A schema.
 * Uses Zod for structural validation plus custom referential integrity checks.
 */

import { z } from 'zod';
import type { Kit } from '@shared/types/kit.js';

// ─── Zod Schema ────────────────────────────────────────────────

const requirementSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  kind: z.enum(['technical', 'behavioural', 'domain']),
  priority: z.enum(['must', 'nice']),
});

const questionSchema = z.object({
  id: z.string().min(1),
  requirement_ids: z.array(z.string()),
  category: z.enum(['technical', 'behavioural', 'system-design', 'company-fit']),
  prompt: z.string().min(1),
  answer_outline: z.string().min(1),
  difficulty: z.number().int().min(1).max(3),
});

const flashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  requirement_ids: z.array(z.string()),
});

const scheduleDaySchema = z.object({
  day: z.number().int().min(1),
  focus: z.string().min(1),
  question_ids: z.array(z.string()),
  minutes: z.number().int().min(0),
});

const kitSchema = z.object({
  source: z.object({
    company: z.string(),
    company_url: z.string(),
    role: z.string(),
    location: z.string(),
    jd_chars: z.number().int().min(0),
    researched_at: z.string(),
    pages_used: z.array(z.string()),
  }),
  company_brief: z.object({
    summary: z.string(),
    what_they_do: z.string(),
    sources: z.array(z.string()),
  }),
  role: z.object({
    title: z.string(),
    seniority: z.string(),
    responsibilities: z.array(z.string()),
    requirements: z.array(requirementSchema),
  }),
  questions: z.array(questionSchema),
  flashcards: z.array(flashcardSchema),
  schedule: z.object({
    days_available: z.number().int().min(1),
    days: z.array(scheduleDaySchema),
  }),
  coverage: z.object({
    uncovered_requirement_ids: z.array(z.string()),
    passes: z.number().int().min(1),
  }),
});

// ─── Validation ────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a kit against the expected structure and referential integrity.
 */
export function validateKit(kit: Kit): ValidationResult {
  const errors: string[] = [];

  // 1. Schema validation
  const schemaResult = kitSchema.safeParse(kit);
  if (!schemaResult.success) {
    for (const issue of schemaResult.error.issues) {
      errors.push(`Schema: ${issue.path.join('.')}: ${issue.message}`);
    }
  }

  // 2. Referential integrity checks
  const requirementIds = new Set(kit.role?.requirements?.map((r: any) => r.id) || []);
  const questionIds = new Set(kit.questions?.map((q: any) => q.id) || []);

  // Check question requirement_ids reference existing requirements
  for (const question of kit.questions || []) {
    for (const reqId of question.requirement_ids) {
      if (!requirementIds.has(reqId)) {
        errors.push(`Question ${question.id}: references non-existent requirement ${reqId}`);
      }
    }
  }

  // Check flashcard requirement_ids reference existing requirements
  for (const flashcard of kit.flashcards || []) {
    for (const reqId of flashcard.requirement_ids) {
      if (!requirementIds.has(reqId)) {
        errors.push(`Flashcard ${flashcard.id}: references non-existent requirement ${reqId}`);
      }
    }
  }

  // Check schedule question_ids reference existing questions
  for (const day of kit.schedule?.days || []) {
    for (const qId of day.question_ids) {
      if (!questionIds.has(qId)) {
        errors.push(`Schedule day ${day.day}: references non-existent question ${qId}`);
      }
    }
  }

  // 3. Days count must match days_available
  if (kit.schedule) {
    if (kit.schedule.days.length !== kit.schedule.days_available) {
      errors.push(
        `Schedule: days_available is ${kit.schedule.days_available} but has ${kit.schedule.days.length} days`
      );
    }
  }

  // 4. Unique IDs
  const reqIdSet = new Set<string>();
  for (const req of kit.role?.requirements || []) {
    if (reqIdSet.has(req.id)) {
      errors.push(`Duplicate requirement ID: ${req.id}`);
    }
    reqIdSet.add(req.id);
  }

  const qIdSet = new Set<string>();
  for (const q of kit.questions || []) {
    if (qIdSet.has(q.id)) {
      errors.push(`Duplicate question ID: ${q.id}`);
    }
    qIdSet.add(q.id);
  }

  const fIdSet = new Set<string>();
  for (const f of kit.flashcards || []) {
    if (fIdSet.has(f.id)) {
      errors.push(`Duplicate flashcard ID: ${f.id}`);
    }
    fIdSet.add(f.id);
  }

  // 5. Minutes must be integers
  for (const day of kit.schedule?.days || []) {
    if (!Number.isInteger(day.minutes)) {
      errors.push(`Schedule day ${day.day}: minutes must be an integer, got ${day.minutes}`);
    }
  }

  // 6. Difficulty must be 1-3
  for (const q of kit.questions || []) {
    if (![1, 2, 3].includes(q.difficulty)) {
      errors.push(`Question ${q.id}: difficulty must be 1-3, got ${q.difficulty}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Fix common validation issues automatically.
 */
export function fixKit(kit: Kit): Kit {
  const fixed = JSON.parse(JSON.stringify(kit)) as Kit;

  // Fix difficulty range
  for (const q of fixed.questions) {
    if (q.difficulty < 1) q.difficulty = 1;
    if (q.difficulty > 3) q.difficulty = 3;
    q.difficulty = Math.round(q.difficulty) as 1 | 2 | 3;
  }

  // Fix minutes to integers
  for (const day of fixed.schedule.days) {
    day.minutes = Math.round(day.minutes);
  }

  // Remove dangling requirement references
  const validReqIds = new Set(fixed.role.requirements.map((r: any) => r.id));

  for (const q of fixed.questions) {
    q.requirement_ids = q.requirement_ids.filter((id: string) => validReqIds.has(id));
  }

  for (const f of fixed.flashcards) {
    f.requirement_ids = f.requirement_ids.filter((id: string) => validReqIds.has(id));
  }

  // Remove dangling question references from schedule
  const validQIds = new Set(fixed.questions.map((q: any) => q.id));

  for (const day of fixed.schedule.days) {
    day.question_ids = day.question_ids.filter((id: string) => validQIds.has(id));
  }

  // Ensure days count matches
  while (fixed.schedule.days.length < fixed.schedule.days_available) {
    fixed.schedule.days.push({
      day: fixed.schedule.days.length + 1,
      focus: 'Review and practice',
      question_ids: [],
      minutes: 30,
    });
  }

  while (fixed.schedule.days.length > fixed.schedule.days_available) {
    const extra = fixed.schedule.days.pop()!;
    const lastDay = fixed.schedule.days[fixed.schedule.days.length - 1];
    lastDay.question_ids.push(...extra.question_ids);
    lastDay.minutes += extra.minutes;
  }

  return fixed;
}
