import { JiraConfig } from '../../types/jira';

/**
 * Jira Configuration Provider (Frontend)
 *
 * This layer now only provides non-sensitive configuration.
 * Credentials (Email and API Token) are handled exclusively by Vercel Functions.
 */

export const getJiraConfig = (): Partial<JiraConfig> => {
  return {
    url: import.meta.env.VITE_JIRA_URL || 'https://shifteg.atlassian.net',
  };
};

export const isJiraConfigured = (): boolean => {
  // We assume it's configured if we have the URL,
  // the server side will handle the rest.
  return !!import.meta.env.VITE_JIRA_URL;
};
