import { Router } from 'express';
import { searchTweets, getSocialHeat, isConfigured } from '../services/xapiService';

const router = Router();

// GET /api/social/status - whether xAPI is configured
router.get('/status', (_req, res) => {
  res.json({ success: true, data: { configured: isConfigured() } });
});

// GET /api/social/tweets?q=...&sort=Top - related tweets for a query
router.get('/tweets', async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const sort = (req.query.sort as 'Top' | 'Latest' | 'People') || 'Top';
    if (!q.trim()) {
      return res.status(400).json({ success: false, error: 'q query parameter is required' });
    }
    const tweets = await searchTweets(q, sort);
    res.json({ success: true, count: tweets.length, data: tweets });
  } catch (error: any) {
    console.error('Error in GET /social/tweets:', error?.message || error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to fetch tweets' });
  }
});

// GET /api/social/heat?q=... - social heat + sentiment for a query
router.get('/heat', async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    if (!q.trim()) {
      return res.status(400).json({ success: false, error: 'q query parameter is required' });
    }
    const heat = await getSocialHeat(q);
    res.json({ success: true, data: heat });
  } catch (error: any) {
    console.error('Error in GET /social/heat:', error?.message || error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to fetch social heat' });
  }
});

export default router;
