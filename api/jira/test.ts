import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jiraFetch } from '../_utils/jira';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await jiraFetch('/rest/api/3/myself');
    return res.status(200).json({ connected: true });
  } catch (error: any) {
    console.error('[Jira Test Error]', error);
    return res.status(error.status || 500).json({
      connected: false,
      message: error.message || 'Failed to connect to Jira'
    });
  }
}
