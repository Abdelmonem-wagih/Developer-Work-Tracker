import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jiraFetch } from '../_utils/jira';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { key, commentId } = req.query;

  if (!key) {
    return res.status(400).json({ message: 'Issue key is required' });
  }

  try {
    if (req.method === 'GET') {
      const data = await jiraFetch(`/rest/api/3/issue/${key}/comment`);
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { body } = req.body;
      const data = await jiraFetch(`/rest/api/3/issue/${key}/comment`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      if (!commentId) return res.status(400).json({ message: 'Comment ID is required' });
      const { body } = req.body;
      const data = await jiraFetch(`/rest/api/3/issue/${key}/comment/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ body }),
      });
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      if (!commentId) return res.status(400).json({ message: 'Comment ID is required' });
      await jiraFetch(`/rest/api/3/issue/${key}/comment/${commentId}`, {
        method: 'DELETE',
      });
      return res.status(204).end();
    }
  } catch (error: any) {
    console.error(`[Jira Comment ${req.method} Error]`, error);
    return res.status(error.status || 500).json({
      message: error.message || `Comment operation failed`
    });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
