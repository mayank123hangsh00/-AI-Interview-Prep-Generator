import dotenv from 'dotenv';
import path from 'path';

// Try multiple candidate paths for .env file
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
];

for (const p of envPaths) {
  dotenv.config({ path: p });
}

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/prepkit',
  JWT_SECRET: process.env.JWT_SECRET || 'prepkit-dev-jwt-secret-key-2026',
  LLM_PROVIDER: process.env.LLM_PROVIDER || (process.env.GROQ_API_KEY ? 'groq' : 'gemini'),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
};

/** Validate all required env vars are set */
export function validateEnv(): void {
  const missing: string[] = [];

  if (!env.MONGODB_URI) missing.push('MONGODB_URI');
  if (!env.JWT_SECRET) missing.push('JWT_SECRET');

  const hasApiKey = !!(env.GEMINI_API_KEY || env.GROQ_API_KEY || env.OPENAI_API_KEY);
  if (!hasApiKey) {
    missing.push('LLM_API_KEY (GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY)');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Copy .env.example to .env and fill in the values.`
    );
  }
}
