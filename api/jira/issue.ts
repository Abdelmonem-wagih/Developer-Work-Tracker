import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jiraFetch } from '../_utils/jira.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { key } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!key) {
    return res.status(400).json({ message: 'Issue key is required' });
  }

  try {
    console.log(`[Jira API] Fetching full issue data: ${key}`);

    // Fetch main issue data with all expansions
    const issueData = await jiraFetch(
      `/rest/api/3/issue/${key}?expand=renderedFields,names,schema,transitions,changelog,operations,editmeta,versionedRepresentations`
    );

    // Fetch supplementary data in parallel
    const [remoteLinks, watchers, worklogs] = await Promise.all([
      jiraFetch(`/rest/api/3/issue/${key}/remotelink`).catch(() => []),
      jiraFetch(`/rest/api/3/issue/${key}/watchers`).catch(() => ({ isWatching: false, watchCount: 0, watchers: [] })),
      jiraFetch(`/rest/api/3/issue/${key}/worklog`).catch(() => ({ worklogs: [] })),
    ]);

    const fullData = {
      ...issueData,
      remoteLinks,
      watchersData: watchers,
      worklogsData: worklogs,
    };

    return res.status(200).json(fullData);
  } catch (error: any) {
    console.error('[Jira Issue Get Error]', error);
    return res.status(error.status || 500).json({
      message: error.message || `Failed to fetch issue ${key} from Jira`
    });
  }
}
