import { db } from '../db';
import { JiraIssue } from '../types/jira';

export class JiraRepository {
  async getAll(): Promise<JiraIssue[]> {
    return db.jiraIssues.toArray();
  }

  async saveAll(issues: JiraIssue[]): Promise<void> {
    await db.transaction('rw', db.jiraIssues, async () => {
      // Simple sync: clear and replace or update existing?
      // For now, let's update or add.
      for (const issue of issues) {
        const existing = await db.jiraIssues.where('key').equals(issue.key).first();
        if (existing) {
          await db.jiraIssues.update(existing.id!, issue);
        } else {
          await db.jiraIssues.add(issue);
        }
      }
    });
  }

  async search(query: string): Promise<JiraIssue[]> {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return db.jiraIssues
      .filter(issue =>
        issue.key.toLowerCase().includes(lowerQuery) ||
        issue.summary.toLowerCase().includes(lowerQuery) ||
        issue.project.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  }

  async clear(): Promise<void> {
    await db.jiraIssues.clear();
  }
}

export const jiraRepository = new JiraRepository();
