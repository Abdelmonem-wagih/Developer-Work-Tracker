export const getJiraAuthHeader = () => {
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  if (!email || !apiToken) {
    throw new Error('Missing JIRA_EMAIL or JIRA_API_TOKEN environment variables');
  }

  const credentials = `${email}:${apiToken}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
};

export const getJiraUrl = (path: string) => {
  const baseUrl = process.env.JIRA_URL;
  console.log("ENV CHECK");
  console.log({
    JIRA_URL: process.env.JIRA_URL,
    JIRA_EMAIL: process.env.JIRA_EMAIL,
    HAS_TOKEN: !!process.env.JIRA_API_TOKEN,
  });
  if (!baseUrl) {
    throw new Error('Missing JIRA_URL environment variable');
  }
  return `${baseUrl.replace(/\/$/, '')}${path}`;
};

export const jiraFetch = async (path: string, options: RequestInit = {}) => {
  const url = getJiraUrl(path);
  const authHeader = getJiraAuthHeader();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': authHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    console.error("========== JIRA ERROR ==========");
    console.error("Status:", response.status);
    console.error(errorText);
    console.error("===============================");

    const error = new Error(errorText || `Jira API error: ${response.status}`);
    (error as any).status = response.status;

    throw error;
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
};
