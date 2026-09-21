/** Requirement kind */
export type RequirementKind = 'technical' | 'behavioural' | 'domain';
/** Requirement priority */
export type RequirementPriority = 'must' | 'nice';
/** Question category */
export type QuestionCategory = 'technical' | 'behavioural' | 'system-design' | 'company-fit';
/** Difficulty level (1-3) */
export type Difficulty = 1 | 2 | 3;
/** Confidence level for practice (1-5) */
export type Confidence = 1 | 2 | 3 | 4 | 5;
/** Edit state for items in the kit */
export type EditState = 'generated' | 'edited' | 'pinned';
export interface KitSource {
    company: string;
    company_url: string;
    role: string;
    location: string;
    jd_chars: number;
    researched_at: string;
    pages_used: string[];
}
export interface CompanyBrief {
    summary: string;
    what_they_do: string;
    hiring_process?: string;
    culture_notes?: string;
    sources: string[];
}
export interface Requirement {
    id: string;
    text: string;
    kind: RequirementKind;
    priority: RequirementPriority;
}
export interface RoleBreakdown {
    title: string;
    seniority: string;
    responsibilities: string[];
    requirements: Requirement[];
}
export interface Question {
    id: string;
    requirement_ids: string[];
    category: QuestionCategory;
    prompt: string;
    answer_outline: string;
    difficulty: Difficulty;
}
export interface Flashcard {
    id: string;
    front: string;
    back: string;
    requirement_ids: string[];
}
export interface ScheduleDay {
    day: number;
    focus: string;
    question_ids: string[];
    minutes: number;
}
export interface Schedule {
    days_available: number;
    days: ScheduleDay[];
}
export interface Coverage {
    uncovered_requirement_ids: string[];
    passes: number;
}
/** The complete kit structure (Appendix A) */
export interface Kit {
    source: KitSource;
    company_brief: CompanyBrief;
    role: RoleBreakdown;
    questions: Question[];
    flashcards: Flashcard[];
    schedule: Schedule;
    coverage: Coverage;
}
export interface BatchInputCase {
    id: string;
    jd: string;
    company_url: string;
    days: number;
}
export interface BatchOutputSuccess {
    id: string;
    status: 'ok';
    kit: Kit;
    error: null;
}
export interface BatchOutputFailure {
    id: string;
    status: 'failed';
    kit: null;
    error: {
        code: string;
        message: string;
    };
}
export type BatchOutputEntry = BatchOutputSuccess | BatchOutputFailure;
export interface BatchOutput {
    version: string;
    generated_at: string;
    kits: BatchOutputEntry[];
}
export interface PracticeState {
    [flashcardId: string]: {
        seen: boolean;
        confidence: Confidence;
        lastPracticed: string;
    };
}
export interface KitEditState {
    [itemId: string]: EditState;
}
export interface KitDocument {
    _id?: string;
    userId: string;
    status: 'generating' | 'ready' | 'failed';
    progress: PipelineStep[];
    jobDescription: string;
    companyUrl: string;
    daysAvailable: number;
    kit: Kit | null;
    editState: KitEditState;
    practiceState: PracticeState;
    jdHash: string;
    createdAt: string;
    updatedAt: string;
}
export interface PipelineStep {
    step: number;
    label: string;
    status: 'pending' | 'running' | 'done' | 'failed';
    detail?: string;
}
/** Input for creating a new kit */
export interface CreateKitInput {
    jobDescription: string;
    companyUrl: string;
    daysAvailable: number;
}
/** Pipeline run options (used by both web and batch) */
export interface PipelineRunOptions {
    jobDescription: string;
    companyUrl: string;
    daysAvailable: number;
    onProgress?: (step: PipelineStep) => void;
}
