/**
 * API client for communicating with the backend
 * Automatically attaches Passage JWT tokens to requests
 */

import { JournalEntry, JournalEntryInput, AISummary } from './types';

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Base API function that handles authentication and error responses
 */
export async function api(
  path: string, 
  init: RequestInit = {},
  getAuthToken: () => Promise<string>
): Promise<any> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL environment variable is required');
  }

  try {
    const token = await getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(init.headers || {})
    };

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorText;
      } catch {
        // Use raw text if not JSON
      }

      throw new APIError(errorMessage, response.status);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0
    );
  }
}

/**
 * Journal entries API methods
 */
export class JournalAPI {
  constructor(private getAuthToken: () => Promise<string>) {}

  async getEntries(): Promise<JournalEntry[]> {
    return api('/entries', { method: 'GET' }, this.getAuthToken);
  }

  async getEntry(id: string): Promise<JournalEntry> {
    return api(`/entries/${id}`, { method: 'GET' }, this.getAuthToken);
  }

  async createEntry(entry: JournalEntryInput): Promise<JournalEntry> {
    return api('/entries', {
      method: 'POST',
      body: JSON.stringify(entry)
    }, this.getAuthToken);
  }

  async updateEntry(id: string, entry: JournalEntryInput): Promise<JournalEntry> {
    return api(`/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry)
    }, this.getAuthToken);
  }

  async deleteEntry(id: string): Promise<{ ok: boolean }> {
    return api(`/entries/${id}`, { method: 'DELETE' }, this.getAuthToken);
  }

  async summarizeEntry(id: string): Promise<AISummary> {
    return api(`/entries/${id}/summarize`, { method: 'POST' }, this.getAuthToken);
  }
}