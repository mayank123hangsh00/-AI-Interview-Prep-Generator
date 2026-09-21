export declare const env: {
    PORT: number;
    NODE_ENV: string;
    MONGODB_URI: string;
    JWT_SECRET: string;
    LLM_PROVIDER: string;
    GEMINI_API_KEY: string;
    GROQ_API_KEY: string;
    GROQ_MODEL: string;
    OPENAI_API_KEY: string;
    OPENAI_MODEL: string;
    CLIENT_URL: string;
};
/** Validate all required env vars are set */
export declare function validateEnv(): void;
