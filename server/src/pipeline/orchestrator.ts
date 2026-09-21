/**
 * Pipeline Orchestrator — Coordinates the full kit generation pipeline.
 *
 * Sequence:
 * 1. Validate inputs
 * 2. Crawl company site
 * 3. Search public discussion
 * 4. Extract requirements from JD (LLM #1)
 * 5. Generate company brief (LLM #2)
 * 6. Generate questions per category (LLM #3-6)
 * 7. Coverage check #1 (code)
 * 8. Gap-fill questions if needed (LLM)
 * 9. Coverage check #2 (code)
 * 10. Final gap-fill if needed (LLM)
 * 11. Generate flashcards (LLM #7)
 * 12. Allocate schedule (code)
 * 13. Validate kit structure
 * 14. Return completed kit
 */

import type { Kit, PipelineStep, PipelineRunOptions } from '@shared/types/kit.js';
import { crawlCompany } from './retrieval/companyCrawler.js';
import { searchPublicDiscussion, fetchDiscussionContent } from './retrieval/publicDiscussion.js';
import { extractRequirements } from './extraction/jdExtractor.js';
import { generateCompanyBrief } from './generation/companyBrief.js';
import { generateAllQuestions, generateGapFillingQuestions } from './generation/questionGenerator.js';
import { generateFlashcards } from './generation/flashcardGenerator.js';
import { checkCoverage, buildCoverageSection } from './coverage/coverageChecker.js';
import { allocateSchedule } from './scheduling/scheduleAllocator.js';
import { validateKit, fixKit } from './validation/kitValidator.js';
import { extractDomain } from '../utils/urlValidator.js';

const MAX_COVERAGE_PASSES = 3;

/**
 * Run the full pipeline to generate a kit.
 */
export async function runPipeline(options: PipelineRunOptions): Promise<Kit> {
  const { jobDescription, companyUrl, daysAvailable, onProgress } = options;

  const steps: PipelineStep[] = [
    { step: 1, label: 'Validating inputs', status: 'pending' },
    { step: 2, label: 'Crawling company website', status: 'pending' },
    { step: 3, label: 'Searching public discussion', status: 'pending' },
    { step: 4, label: 'Extracting requirements', status: 'pending' },
    { step: 5, label: 'Generating company brief', status: 'pending' },
    { step: 6, label: 'Generating interview questions', status: 'pending' },
    { step: 7, label: 'Checking coverage', status: 'pending' },
    { step: 8, label: 'Generating flashcards', status: 'pending' },
    { step: 9, label: 'Building study schedule', status: 'pending' },
    { step: 10, label: 'Validating kit', status: 'pending' },
  ];

  function updateStep(stepNum: number, status: PipelineStep['status'], detail?: string) {
    const step = steps.find((s) => s.step === stepNum);
    if (step) {
      step.status = status;
      if (detail) step.detail = detail;
      onProgress?.({ ...step });
    }
  }

  // ── Step 1: Validate inputs ──
  updateStep(1, 'running');
  if (!jobDescription || jobDescription.trim().length === 0) {
    throw new Error('Job description is required');
  }
  if (!companyUrl || companyUrl.trim().length === 0) {
    throw new Error('Company URL is required');
  }
  if (!daysAvailable || daysAvailable < 1) {
    throw new Error('Days available must be at least 1');
  }
  updateStep(1, 'done');

  // ── Step 2: Crawl company website ──
  updateStep(2, 'running');
  let crawlResult;
  try {
    crawlResult = await crawlCompany(companyUrl);
    updateStep(2, 'done', `Fetched ${crawlResult.pages.length} pages`);
  } catch (error: any) {
    console.error('Crawl failed:', error.message);
    crawlResult = { pages: [], pagesUsed: [], errors: [error.message], hiringPageFound: false };
    updateStep(2, 'failed', `Crawl failed: ${error.message}`);
  }

  // ── Step 3: Search public discussion ──
  updateStep(3, 'running');
  let discussionResult;
  try {
    const companyName = extractDomain(companyUrl);
    discussionResult = await searchPublicDiscussion(companyName);

    // Optionally fetch full discussion content
    if (discussionResult.found) {
      const contents = await fetchDiscussionContent(discussionResult.discussions, 2);
      // Append content to discussion snippets
      for (const content of contents) {
        const disc = discussionResult.discussions.find((d) => d.url === content.url);
        if (disc) {
          disc.snippet = content.content.substring(0, 2000);
        }
      }
    }

    updateStep(3, 'done', `Found ${discussionResult.discussions.length} discussions`);
  } catch (error: any) {
    console.error('Discussion search failed:', error.message);
    discussionResult = { found: false, discussions: [], errors: [error.message] };
    updateStep(3, 'failed', `Search failed: ${error.message}`);
  }

  // ── Step 4: Extract requirements from JD ──
  updateStep(4, 'running');
  const extractedRole = await extractRequirements(jobDescription);
  updateStep(4, 'done', `${extractedRole.requirements.length} requirements found`);

  // ── Step 5: Generate company brief ──
  updateStep(5, 'running');
  const companyBrief = await generateCompanyBrief(
    crawlResult.pages,
    discussionResult,
    companyUrl
  );
  updateStep(5, 'done');

  // ── Step 6: Generate questions per category ──
  updateStep(6, 'running');

  // Build hiring context for question generation
  let hiringContext = '';
  if (crawlResult.hiringPageFound) {
    hiringContext = 'The company has a documented hiring process. ';
    const hiringPages = crawlResult.pages.filter((p) =>
      p.content.toLowerCase().includes('interview') ||
      p.content.toLowerCase().includes('hiring')
    );
    if (hiringPages.length > 0) {
      hiringContext += hiringPages.slice(0, 2).map((p) => p.content.substring(0, 800)).join('\n');
    }
  }
  if ((companyBrief as any).hiring_process) {
    hiringContext += '\n' + (companyBrief as any).hiring_process;
  }

  let allQuestions = await generateAllQuestions(
    extractedRole.requirements,
    hiringContext,
    extractedRole.responsibilities
  );
  updateStep(6, 'done', `${allQuestions.length} questions generated`);

  // ── Step 7: Coverage loop ──
  updateStep(7, 'running');
  let passes = 1;

  for (let pass = 2; pass <= MAX_COVERAGE_PASSES; pass++) {
    const coverage = checkCoverage(extractedRole.requirements, allQuestions);
    console.log(`  📊 Coverage check #${pass - 1}: ${coverage.coveragePercentage}% (${coverage.uncoveredMust.length} must-have gaps)`);

    if (coverage.allMustCovered) {
      console.log(`  ✅ All must-have requirements covered after ${pass - 1} pass(es)`);
      break;
    }

    // Generate gap-filling questions
    const nextId = allQuestions.length + 1;
    const gapQuestions = await generateGapFillingQuestions(coverage.uncoveredMust, nextId);

    // Add gap-filling questions (with sequential IDs)
    for (let i = 0; i < gapQuestions.length; i++) {
      gapQuestions[i].id = `q${allQuestions.length + i + 1}`;
    }
    allQuestions = [...allQuestions, ...gapQuestions];
    passes = pass;
  }

  // Final coverage check
  const finalCoverage = checkCoverage(extractedRole.requirements, allQuestions);
  console.log(`  📊 Final coverage: ${finalCoverage.coveragePercentage}% after ${passes} pass(es)`);
  updateStep(7, 'done', `${finalCoverage.coveragePercentage}% coverage in ${passes} passes`);

  // ── Step 8: Generate flashcards ──
  updateStep(8, 'running');
  const flashcards = await generateFlashcards(extractedRole.requirements, allQuestions);
  updateStep(8, 'done', `${flashcards.length} flashcards generated`);

  // ── Step 9: Build schedule ──
  updateStep(9, 'running');
  const schedule = allocateSchedule(allQuestions, extractedRole.requirements, daysAvailable);
  updateStep(9, 'done', `${schedule.days.length}-day schedule`);

  // ── Step 10: Assemble and validate kit ──
  updateStep(10, 'running');

  const kit: Kit = {
    source: {
      company: extractDomain(companyUrl),
      company_url: companyUrl,
      role: extractedRole.title,
      location: extractedRole.location,
      jd_chars: jobDescription.length,
      researched_at: new Date().toISOString(),
      pages_used: crawlResult.pagesUsed,
    },
    company_brief: companyBrief,
    role: {
      title: extractedRole.title,
      seniority: extractedRole.seniority,
      responsibilities: extractedRole.responsibilities,
      requirements: extractedRole.requirements,
    },
    questions: allQuestions,
    flashcards,
    schedule,
    coverage: buildCoverageSection(extractedRole.requirements, allQuestions, passes),
  };

  // Validate and fix
  const validation = validateKit(kit);
  if (!validation.valid) {
    console.log(`  ⚠️ Kit validation issues: ${validation.errors.length}`);
    validation.errors.forEach((e) => console.log(`    - ${e}`));

    const fixed = fixKit(kit);
    const revalidation = validateKit(fixed);
    if (revalidation.valid) {
      console.log('  ✅ Kit auto-fixed successfully');
      updateStep(10, 'done');
      return fixed;
    } else {
      console.log('  ⚠️ Some validation issues remain after auto-fix');
      revalidation.errors.forEach((e) => console.log(`    - ${e}`));
    }
  }

  updateStep(10, 'done');
  return kit;
}
