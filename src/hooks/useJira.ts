import { useState } from 'react';
import { jiraService } from '../services/jira/jiraService';
import { jiraRepository } from '../repositories/jiraRepository';
import { JiraIssue, JiraMyself } from '../types/jira';
import { useLiveQuery } from 'dexie-react-hooks';

export const useJira = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issues = useLiveQuery(() => jiraRepository.getAll());

  const testConnection = async (): Promise<JiraMyself | null> => {
    setLoading(true);
    setError(null);
    try {
      const { connected } = await jiraService.testConnection();
      if (connected) {
        // If test is successful, fetch the actual user info
        return await jiraService.getMyself();
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Jira');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const syncIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const remoteIssues = await jiraService.searchMyIssues();
      await jiraRepository.saveAll(remoteIssues);
    } catch (err: any) {
      setError(err.message || 'Failed to sync issues from Jira');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    await jiraRepository.clear();
  };

  return {
    issues,
    loading,
    error,
    testConnection,
    syncIssues,
    disconnect,
  };
};
