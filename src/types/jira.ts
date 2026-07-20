export interface JiraConfig {
  url: string;
  email: string;
  apiToken: string;
}

export interface JiraIssue {
  id?: number;
  jiraId: string;
  key: string;
  summary: string;
  status: string;
  statusCategory?: string;
  priority: string;
  project: string;
  issueType: string;
  epic?: string;
  sprint?: string;
  updated: string;
  created?: string;
  lastSync: number;
  dueDate?: string;
  estimation?: number; // in seconds
  timeSpent?: number; // in seconds
  assignee?: {
    displayName: string;
    avatarUrl: string;
    accountId: string;
  } | null;
  reporter?: {
    displayName: string;
    avatarUrl: string;
    accountId?: string;
  } | null;
  labels?: string[];
}

export interface JiraMyself {
  accountId: string;
  displayName: string;
  emailAddress: string;
}
