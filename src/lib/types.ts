
export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface JournalEntryInput {
  title: string;
  body: string;
}

export interface AISummary {
  summary: string;
  generated_at: string;
}

export interface APIError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}