import { JiraIssue, JiraMyself } from '../../types/jira';

class JiraService {
  private async fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(path, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
        if (isJson) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        }
      } catch (e) {
        // Fallback to status text
      }
      throw new Error(errorMessage);
    }

    if (!isJson) {
      const text = await response.text();
      // Detect if we received source code (common misconfiguration in dev)
      if (text.trim().startsWith('import') || text.trim().startsWith('export')) {
        throw new Error(
          'API returned source code instead of JSON. \n' +
          'Ensure you are running "vercel dev" and the API proxy in vite.config.ts is correctly configured.'
        );
      }

      // If it's HTML, it's likely the SPA fallback (index.html)
      if (text.trim().toLowerCase().startsWith('<!doctype html') || text.includes('<html')) {
        throw new Error(
          `API returned HTML instead of JSON.\n\n` +
          `1. Ensure you are running "vercel dev".\n` +
          `2. Ensure you are accessing the app via http://localhost:3000 (NOT the Vite port).\n` +
          `3. If using "vercel dev", check the terminal for any API compilation errors.\n\n` +
          `Requested URL: ${path}`
        );
      }

      throw new Error(`Expected JSON response but received: ${contentType || 'plain text'}\nBody: ${text.substring(0, 100)}...`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ connected: boolean }> {
    return this.fetchApi<{ connected: boolean }>('/api/jira/test');
  }

  async getMyself(): Promise<JiraMyself> {
    return this.fetchApi<JiraMyself>('/api/jira/myself');
  }

  async searchMyIssues(jql?: string): Promise<JiraIssue[]> {
    const url = jql ? `/api/jira/search?jql=${encodeURIComponent(jql)}` : '/api/jira/search';
    const issues = await this.fetchApi<any[]>(url);

    // Add client-side timestamp for sync tracking
    return issues.map(issue => ({
      ...issue,
      lastSync: Date.now(),
    }));
  }

  async getIssue(key: string): Promise<any> {
    return this.fetchApi<any>(`/api/jira/issue?key=${key}`);
  }

  async getTransitions(key: string): Promise<any> {
    return this.fetchApi<any>(`/api/jira/transitions?key=${key}`);
  }

  async doTransition(key: string, transitionId: string): Promise<void> {
    await this.fetchApi<void>(`/api/jira/transitions?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transitionId }),
    });
  }

  async getComments(key: string): Promise<any> {
    return this.fetchApi<any>(`/api/jira/comments?key=${key}`);
  }

  async addComment(key: string, body: any): Promise<any> {
    return this.fetchApi<any>(`/api/jira/comments?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
  }
}

export const jiraService = new JiraService();
