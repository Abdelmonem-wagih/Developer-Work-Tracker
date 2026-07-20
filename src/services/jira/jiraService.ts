import { JiraIssue, JiraMyself } from '../../types/jira';

class JiraService {
  private async fetchApi<T>(path: string): Promise<T> {
    const response = await fetch(path, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `API error: ${response.status}`);
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
    const response = await fetch(`/api/jira/transitions?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transitionId }),
    });
    if (!response.ok) throw new Error('Failed to transition issue');
  }

  async getComments(key: string): Promise<any> {
    return this.fetchApi<any>(`/api/jira/comments?key=${key}`);
  }

  async addComment(key: string, body: any): Promise<any> {
    const response = await fetch(`/api/jira/comments?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    return response.json();
  }
}

export const jiraService = new JiraService();
