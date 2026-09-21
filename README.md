# 🎯 PrepKit — AI Interview Prep Generator

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-green.svg)](https://expressjs.com/)
[![Vitest](https://img.shields.io/badge/Vitest-2.0-yellow.svg)](https://vitest.dev/)

**PrepKit** turns any job description and company website URL into a personalized, structured interview preparation kit in minutes.

---

## 🌟 Key Features

- **🕸️ Autonomous Company Crawler**: Smartly discovers and crawls company overview pages, engineering blogs, and public hiring processes while respecting `robots.txt` and rate limits.
- **💬 Public Discussion Search**: Integrates public interview insights and discussion snippets (Reddit, Glassdoor, tech forums) for genuine context on how the target company hires.
- **📊 Guaranteed Requirement Coverage**: Pure code coverage checker ensures **100% of must-have requirements** from the job description are mapped to generated practice questions, automatically triggering gap-filling passes if necessary.
- **⚡ Deterministic Study Schedule Allocator**: Math-driven schedule allocator distributes questions across available days based on difficulty and requirement priority in integer minutes.
- **🎨 State-Preserving Dynamic Builder**: Edit, pin, or delete questions, flashcards, or company brief sections. Re-generating a section replaces generated content while preserving all user edits and pinned items.
- **🎴 Practice Studio**: Interactive 3D flashcard player (with SRS mastery status) and a Mock Interview timer mode with ideal answer outlines and 1-5 self-performance rating.
- **🛡️ Enterprise Security**: Built-in SSRF protection blocking local/private IP ranges (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16` in production).

---

## 🛠 Tech Stack & Architecture

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React.
- **Backend**: Node.js, Express, TypeScript, Mongoose.
- **Database**: MongoDB.
- **LLM Provider**: **Groq API** (`openai/gpt-oss-20b` / `llama-3.3-70b-versatile`) with dynamic fallback to **Google Gemini API** (`gemini-2.5-flash`).
  - *Free Tier Rate Limit Handling*: Free tier Groq enforces an 8,000 Tokens-Per-Minute (TPM) limit. Our client handles rate limits via `retryWithBackoff`, automatically parsing Groq error headers (`Please try again in X.XXs`), sleeping, and retrying exponentially with jitter.

---

## 🏗️ High-Level Architecture & Pipeline Sequencing

```
                                  +-------------------+
                                  |    User Input     |
                                  | (JD + URL + Days) |
                                  +---------+---------+
                                            |
                                            v
                                  +-------------------+
                                  |    SSRF Check     |
                                  +---------+---------+
                                            |
                         +------------------+------------------+
                         |                                     |
                         v                                     v
              +--------------------+                 +-------------------+
              |  Company Crawler   |                 | Discussion Search |
              | (Robots.txt aware) |                 | (Public Insights) |
              +----------+---------+                 +---------+---------+
                         |                                     |
                         +------------------+------------------+
                                            |
                                            v
                                 +--------------------+
                                 |  Requirement Extr. | (LLM Pass 1)
                                 +----------+---------+
                                            |
                                            v
                                 +--------------------+
                                 |   Company Brief    | (LLM Pass 2)
                                 +----------+---------+
                                            |
                                            v
                                 +--------------------+
                                 | Question Generator | (LLM Pass 3)
                                 +----------+---------+
                                            |
                                            v
                                 +--------------------+
                           +---->|  Coverage Checker  | (Pure Code)
                           |     +----------+---------+
              Gap-fill Pass|                |
             (if uncovered)|                v
                           +-----+ Is Must Covered?
                                 | (Yes)
                                 v
                         +-----------------------+
                         | Flashcard Generator   | (LLM Pass 4)
                         +-----------+-----------+
                                     |
                                     v
                         +-----------------------+
                         |  Schedule Allocator   | (Pure Code)
                         +-----------+-----------+
                                     |
                                     v
                         +-----------------------+
                         | Schema Validator/Fix  | (Zod)
                         +-----------+-----------+
                                     |
                                     v
                         +-----------------------+
                         | Full Kit Output (App A|
                         +-----------------------+
```

### Deterministic vs. LLM Responsibilities
- **Pure Code (Deterministic)**: 
  - `coverageChecker.ts`: Compares question requirement IDs against extracted must-have requirement IDs.
  - `scheduleAllocator.ts`: Spans exact `days_available`, calculates integer minutes, and front-loads hard/must-have requirements earlier in the schedule.
- **LLM Assisted**: Requirement extraction, company brief synthesis, question prompt creation, and flashcard concept extraction.

---

## 💾 Edit, Generated, and Pinned State Handling

Every item in a kit tracks an `editState`:
- `generated`: Content generated by the pipeline.
- `edited`: Content modified by the user inline.
- `pinned`: Content explicitly locked by the user.

When a user triggers **Regenerate Category** or **Regenerate Brief**, the server re-runs LLM generation for that specific section but performs a **smart merge**:
- All items marked `edited` or `pinned` are strictly preserved in place.
- Only un-edited `generated` items in that section are refreshed.

---

## ⚡ Batch Entry Point (Evaluator)

Run evaluation against any batch file of cases:

```bash
npm run evaluate -- --input eval_inputs.json --output eval_output.json
```

- Accepts an array of `{ id, jd, company_url, days }`.
- Outputs Appendix B standard JSON schema.
- Continues on individual case failure without crashing the batch run.

---

## 🚀 Quick Start

### 1. Installation
```bash
npm run install:all
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/prepkit
JWT_SECRET=super-secret-jwt-key
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=openai/gpt-oss-20b
CLIENT_URL=http://localhost:3000
```

### 3. Run Locally
```bash
npm run dev
```
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

---

## 🧪 Testing

Run Vitest unit tests covering pure deterministic algorithms:
```bash
npm test
```
- `coverageChecker.test.ts` (3 tests)
- `scheduleAllocator.test.ts` (3 tests)
- `kitValidator.test.ts` (3 tests)
- `urlValidator.test.ts` (4 tests)
- Total: **13/13 passed**
