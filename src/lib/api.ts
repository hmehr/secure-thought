/**
 * API client for communicating with the backend.
 * - Attaches Passage JWT (Bearer) when available
 * - Gracefully handles dev-bypass
 * - Normalizes error handling
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
 * Base API function that handles auth and error responses.
 */
export async function api(
  path: string,
  init: RequestInit = {},
  getAuthToken: () => Promise<string | null>
): Promise<any> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!baseUrl) throw new Error('VITE_API_BASE_URL environment variable is required');

  const dev = import.meta.env.VITE_DEV_AUTH === '1';

  // Resolve token (may be null)
  let token = await getAuthToken();
  if (dev && !token) token = 'user:demo';

  // Build headers safely
  const headers = new Headers(init.headers ?? {});
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Compose request
  const reqInit: RequestInit = {
    ...init,
    headers,
    credentials: 'include', // allow cookies if backend sets any
    cache: 'no-store',
  };

  // Fire request
  const res = await fetch(`${baseUrl}${path}`, reqInit);

  // Fast path: 204/205
  if (res.status === 204 || res.status === 205) return null;

  // Error handling
  if (!res.ok) {
    const raw = await res.text().catch(() => '');
    let message = raw || `${res.status} ${res.statusText}`;
    let code: string | undefined;

    try {
      const data = JSON.parse(raw);
      message = data.detail?.message || data.detail || data.message || data.error || message;
      code = data.code || data.error_code;
    } catch {
      // non-JSON, keep message
    }

    throw new APIError(message, res.status, code);
  }

  // Success payload
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return res.json();
  }
  // If you prefer to return text for non-JSON, uncomment:
  // return res.text();
  return null;
}

/**
 * Journal entries API methods.
 */
export class JournalAPI {
  constructor(private getAuthToken: () => Promise<string | null>) {}

  async getEntries(): Promise<JournalEntry[]> {
    return api('/entries', { method: 'GET' }, this.getAuthToken);
  }

  async getEntry(id: string): Promise<JournalEntry> {
    return api(`/entries/${id}`, { method: 'GET' }, this.getAuthToken);
  }

  async createEntry(entry: JournalEntryInput): Promise<JournalEntry> {
    return api('/entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    }, this.getAuthToken);
  }

  async updateEntry(id: string, entry: JournalEntryInput): Promise<JournalEntry> {
    return api(`/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry),
    }, this.getAuthToken);
  }

  async deleteEntry(id: string): Promise<{ ok: boolean }> {
    return api(`/entries/${id}`, { method: 'DELETE' }, this.getAuthToken);
  }

  async summarizeEntry(id: string): Promise<AISummary> {
    return api(`/entries/${id}/summarize`, { method: 'POST' }, this.getAuthToken);
  }
}