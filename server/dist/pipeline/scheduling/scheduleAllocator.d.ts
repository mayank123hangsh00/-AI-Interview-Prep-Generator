/**
 * Schedule Allocator — Pure code, no LLM.
 *
 * Distributes questions across exactly N days.
 * This is arithmetic and allocation — it belongs in code, not in a prompt.
 *
 * Rules:
 * - Every must-have requirement appears somewhere in the schedule
 * - Harder and higher-priority material lands earlier
 * - Each day has integer minutes
 * - Number of days === days_available exactly
 */
import type { Question, Requirement, Schedule } from '@shared/types/kit.js';
/**
 * Allocate questions across the given number of days.
 */
export declare function allocateSchedule(questions: Question[], requirements: Requirement[], daysAvailable: number): Schedule;
