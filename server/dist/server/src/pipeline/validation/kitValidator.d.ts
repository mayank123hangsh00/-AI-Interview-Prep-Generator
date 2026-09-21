/**
 * Kit Validator — Validates a generated kit against the Appendix A schema.
 * Uses Zod for structural validation plus custom referential integrity checks.
 */
import type { Kit } from '@shared/types/kit.js';
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
/**
 * Validate a kit against the expected structure and referential integrity.
 */
export declare function validateKit(kit: Kit): ValidationResult;
/**
 * Fix common validation issues automatically.
 */
export declare function fixKit(kit: Kit): Kit;
