/**
 * JD Extractor — Extracts structured requirements from a job description.
 * LLM Call #1 in the pipeline.
 */
import type { Requirement } from '@shared/types/kit.js';
export interface ExtractedRole {
    title: string;
    seniority: string;
    location: string;
    responsibilities: string[];
    requirements: Requirement[];
}
/**
 * Extract structured role information from a raw job description.
 */
export declare function extractRequirements(jobDescription: string): Promise<ExtractedRole>;
