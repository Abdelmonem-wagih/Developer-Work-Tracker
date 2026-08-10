import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jiraFetch } from '../_utils/jira.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const data = await jiraFetch('/rest/api/3/myself');
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[Jira Myself Error]', error);
    return res.status(error.status || 500).json({
      message: error.message || 'Failed to fetch user info from Jira'
    });
  }
}
