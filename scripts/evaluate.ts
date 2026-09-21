import fs from 'fs';
import path from 'path';
import { runPipeline } from '../server/src/pipeline/orchestrator.js';

interface EvalInput {
  company: string;
  url: string;
  jd: string;
  days_available: number;
}

async function main() {
  console.log('🚀 Starting AI Interview Prep Kit Evaluation Suite...\n');

  const inputPath = process.argv[2] || path.join(process.cwd(), '../eval_inputs.json');
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const evalInputs: EvalInput[] = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(`Loaded ${evalInputs.length} benchmark job descriptions.\n`);

  const results = [];

  for (let i = 0; i < evalInputs.length; i++) {
    const item = evalInputs[i];
    console.log(`==================================================`);
    console.log(`[${i + 1}/${evalInputs.length}] Processing: ${item.company} (${item.url})`);
    console.log(`==================================================`);

    const startTime = Date.now();
    try {
      const kit = await runPipeline({
        jobDescription: item.jd,
        companyUrl: item.url,
        daysAvailable: item.days_available,
        onProgress: (step) => {
          if (step.status === 'running') {
            console.log(`  ⏳ Step ${step.step}: ${step.label}...`);
          } else if (step.status === 'done') {
            console.log(`  ✅ Step ${step.step}: ${step.label} (${step.detail || 'Done'})`);
          } else if (step.status === 'failed') {
            console.log(`  ❌ Step ${step.step}: ${step.label} (${step.detail || 'Failed'})`);
          }
        }
      });

      const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
      const mustCoverage = kit.coverage ? 
        ((kit.role.requirements.filter(r => r.priority === 'must').length - kit.coverage.uncovered_requirement_ids.length) / Math.max(1, kit.role.requirements.filter(r => r.priority === 'must').length) * 100).toFixed(1)
        : '100';

      console.log(`\n🎉 Kit generated in ${durationSec}s!`);
      console.log(`  - Role: ${kit.role.title}`);
      console.log(`  - Requirements: ${kit.role.requirements.length}`);
      console.log(`  - Questions: ${kit.questions.length}`);
      console.log(`  - Flashcards: ${kit.flashcards.length}`);
      console.log(`  - Must Coverage: ${mustCoverage}%`);
      console.log(`  - Coverage Passes: ${kit.coverage.passes}\n`);

      results.push({
        company: item.company,
        status: 'SUCCESS',
        durationSec,
        title: kit.role.title,
        requirementsCount: kit.role.requirements.length,
        questionsCount: kit.questions.length,
        flashcardsCount: kit.flashcards.length,
        scheduleDays: kit.schedule.days.length,
        mustCoverage: `${mustCoverage}%`,
        passes: kit.coverage.passes,
      });
    } catch (err: any) {
      const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`❌ Kit generation failed in ${durationSec}s:`, err.message);
      results.push({
        company: item.company,
        status: 'FAILED',
        error: err.message,
        durationSec,
      });
    }
  }

  console.log('\n==================================================');
  console.log('EVALUATION SUMMARY REPORT');
  console.log('==================================================');
  console.table(results);

  // Write output report JSON
  const reportPath = path.join(process.cwd(), '../eval_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nReport written to: ${reportPath}`);
}

main().catch(console.error);
