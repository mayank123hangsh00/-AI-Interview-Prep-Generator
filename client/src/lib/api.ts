/**
 * API Client — Centralized API communication for the frontend.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include', // Send cookies
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { code: 'UNKNOWN', message: 'Request failed' } }));
    throw new ApiError(
      response.status,
      errorData.error?.code || 'UNKNOWN',
      errorData.error?.message || 'Request failed'
    );
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return {} as T;

  return JSON.parse(text) as T;
}

// ─── Auth API ──────────────────────────────────────────────────

export const authApi = {
  register: (email: string, password: string) =>
    request('/api/auth/register', { method: 'POST', body: { email, password } }),

  login: (email: string, password: string) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } }),

  logout: () =>
    request('/api/auth/logout', { method: 'POST' }),

  me: () =>
    request('/api/auth/me'),
};

// ─── Kit API ───────────────────────────────────────────────────

export const kitApi = {
  create: (jobDescription: string, companyUrl: string, daysAvailable: number) =>
    request('/api/kits', {
      method: 'POST',
      body: { jobDescription, companyUrl, daysAvailable },
    }),

  createBatch: (cases: Array<{ jobDescription: string; companyUrl: string; daysAvailable: number }>) =>
    request('/api/kits/batch', { method: 'POST', body: { cases } }),

  list: () => request('/api/kits'),

  get: (id: string) => request(`/api/kits/${id}`),

  getProgressStream: (id: string) => {
    const eventSource = new EventSource(`${API_URL}/api/kits/${id}/progress`, {
      withCredentials: true,
    });
    return eventSource;
  },

  // Question operations
  updateQuestion: (kitId: string, questionId: string, updates: any) =>
    request(`/api/kits/${kitId}/questions/${questionId}`, { method: 'PATCH', body: updates }),

  addQuestion: (kitId: string, question: any) =>
    request(`/api/kits/${kitId}/questions`, { method: 'POST', body: question }),

  deleteQuestion: (kitId: string, questionId: string) =>
    request(`/api/kits/${kitId}/questions/${questionId}`, { method: 'DELETE' }),

  reorderQuestions: (kitId: string, questionIds: string[]) =>
    request(`/api/kits/${kitId}/questions/reorder`, { method: 'PATCH', body: { questionIds } }),

  // Flashcard operations
  updateFlashcard: (kitId: string, flashcardId: string, updates: any) =>
    request(`/api/kits/${kitId}/flashcards/${flashcardId}`, { method: 'PATCH', body: updates }),

  addFlashcard: (kitId: string, flashcard: any) =>
    request(`/api/kits/${kitId}/flashcards`, { method: 'POST', body: flashcard }),

  deleteFlashcard: (kitId: string, flashcardId: string) =>
    request(`/api/kits/${kitId}/flashcards/${flashcardId}`, { method: 'DELETE' }),

  // Company brief
  updateCompanyBrief: (kitId: string, updates: any) =>
    request(`/api/kits/${kitId}/company-brief`, { method: 'PATCH', body: updates }),

  // Regeneration
  regenerateSection: (kitId: string, section: string) =>
    request(`/api/kits/${kitId}/regenerate/${section}`, { method: 'POST' }),

  // Practice
  updatePractice: (kitId: string, flashcardId: string, confidence: number) =>
    request(`/api/kits/${kitId}/practice`, {
      method: 'PATCH',
      body: { flashcardId, confidence },
    }),
};

export { ApiError };
