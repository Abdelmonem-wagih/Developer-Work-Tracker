import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jiraFetch } from '../_utils/jira';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { jql: customJql } = req.query;

    // Improved JQL to find ANY involvement
    // We search where user is assignee, reporter, creator, watcher, or mentioned in comments
    // We also search where the user's name might be in custom fields (though JQL is limited if we don't know field names)
    // The "currentUser()" covers most standard fields.
    const jql = customJql || 'assignee = currentUser() OR reporter = currentUser() OR creator = currentUser() OR watcher = currentUser() OR commenter = currentUser() ORDER BY updated DESC';

    const data = await jiraFetch(
      "/rest/api/3/search/jql",
      {
        method: "POST",
        body: JSON.stringify({
          jql,
          maxResults: 100,
          fields: [
            "summary",
            "status",
            "priority",
            "project",
            "issuetype",
            "updated",
            "created",
            "assignee",
            "reporter",
            "creator",
            "labels",
            "components",
            "sprint",
            "customfield_10020",
            "epic",
            "parent",
            "duedate",
            "aggregatetimespent",
            "timeestimate",
            "timeoriginalestimate"
          ]
        })
      }
    );

    // Hybrid approach: If the user wants to find themselves in ANY field,
    // we could technically fetch all issues from the project and filter, but that's slow.
    // Instead, we trust JQL for now but include ALL fields in the response to allow client-side filtering if needed.

    // Actually, Jira API doesn't let us "get all fields for any user field" easily in JQL without knowing field IDs.
    // But we can fetch with fields=*all to inspect them on the server before sending back.

    const issues = data.issues.map((issue: any) => {
      const f = issue.fields;

      // Basic mapping
      return {
        jiraId: issue.id,
        key: issue.key,
        summary: f.summary,
        status: f.status?.name || 'Unknown',
        statusCategory: f.status?.statusCategory?.name || 'To Do',
        priority: f.priority?.name || 'Medium',
        project: f.project?.name || 'Unknown',
        issueType: f.issuetype?.name || 'Task',
        updated: f.updated,
        created: f.created,
        dueDate: f.duedate,
        assignee: f.assignee ? {
          displayName: f.assignee.displayName,
          avatarUrl: f.assignee.avatarUrls?.['48x48'],
          accountId: f.assignee.accountId
        } : null,
        reporter: f.reporter ? {
          displayName: f.reporter.displayName,
          avatarUrl: f.reporter.avatarUrls?.['48x48']
        } : null,
        labels: f.labels || [],
        estimation: f.timeoriginalestimate || f.timeestimate || null,
        timeSpent: f.aggregatetimespent || null,
      };
    });

    return res.status(200).json(issues);
  } catch (error: any) {
    console.error('[Jira Search Error]', error);
    return res.status(error.status || 500).json({
      message: error.message || 'Failed to search issues in Jira'
    });
  }
}
