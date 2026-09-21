/**
 * JD Extractor — Extracts structured requirements from a job description.
 * LLM Call #1 in the pipeline.
 */

import { callLLM } from '../generation/llmClient.js';
import { JD_EXTRACTION_SYSTEM, JD_EXTRACTION_USER } from '../generation/promptTemplates.js';
import type { RoleBreakdown, Requirement } from '@shared/types/kit.js';

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
export async function extractRequirements(jobDescription: string): Promise<ExtractedRole> {
  console.log('  📋 Extracting requirements from job description...');

  const response = await callLLM<ExtractedRole>(
    JD_EXTRACTION_SYSTEM,
    JD_EXTRACTION_USER(jobDescription),
    { temperature: 0.1 } // Low temperature for precision
  );

  const result = response.data;

  // Validate and fix IDs
  result.requirements = result.requirements.map((req, i) => ({
    ...req,
    id: req.id || `r${i + 1}`,
    kind: (['technical', 'behavioural', 'domain'].includes(req.kind) ? req.kind : 'technical') as Requirement['kind'],
    priority: (['must', 'nice'].includes(req.priority) ? req.priority : 'must') as Requirement['priority'],
  }));

  console.log(`  ✅ Extracted ${result.requirements.length} requirements (${result.requirements.filter(r => r.priority === 'must').length} must, ${result.requirements.filter(r => r.priority === 'nice').length} nice)`);

  return result;
}
