import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jiraFetch } from '../_utils/jira';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { key } = req.query;

  if (!key) {
    return res.status(400).json({ message: 'Issue key is required' });
  }

  if (req.method === 'GET') {
    try {
      const data = await jiraFetch(`/rest/api/3/issue/${key}/transitions`);
      return res.status(200).json(data);
    } catch (error: any) {
      console.error('[Jira Transitions Get Error]', error);
      return res.status(error.status || 500).json({
        message: error.message || `Failed to fetch transitions for ${key}`
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { transitionId } = req.body;
      if (!transitionId) {
        return res.status(400).json({ message: 'Transition ID is required' });
      }

      await jiraFetch(`/rest/api/3/issue/${key}/transitions`, {
        method: 'POST',
        body: JSON.stringify({ transition: { id: transitionId } }),
      });

      return res.status(204).end();
    } catch (error: any) {
      console.error('[Jira Transition Post Error]', error);
      return res.status(error.status || 500).json({
        message: error.message || `Failed to transition issue ${key}`
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
