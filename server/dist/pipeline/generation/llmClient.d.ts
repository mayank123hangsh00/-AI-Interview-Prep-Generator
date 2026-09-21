/**
 * LLM Client — Multi-provider wrapper supporting Groq, Google Gemini, and OpenAI.
 *
 * Configurable via environment variables:
 * - LLM_PROVIDER=groq | gemini | openai
 * - GROQ_API_KEY / GROQ_MODEL (e.g. openai/gpt-oss-20b, llama-3.3-70b-versatile)
 * - GEMINI_API_KEY
 * - OPENAI_API_KEY / OPENAI_MODEL (e.g. gpt-4o-mini)
 */
export interface LLMResponse<T = any> {
    data: T;
    tokensUsed?: number;
}
/**
 * Call the configured LLM and parse JSON response.
 */
export declare function callLLM<T = any>(systemPrompt: string, userPrompt: string, options?: {
    temperature?: number;
    maxOutputTokens?: number;
    model?: string;
    retries?: number;
}): Promise<LLMResponse<T>>;
/**
 * Call LLM without JSON mode — for free text responses.
 */
export declare function callLLMText(systemPrompt: string, userPrompt: string, options?: {
    temperature?: number;
    maxOutputTokens?: number;
    model?: string;
}): Promise<string>;
