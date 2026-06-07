import express from 'express';
import cors from 'cors';
import './config/env';
import marketRoutes from './routes/markets';
import socialRoutes from './routes/social';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/markets', marketRoutes);
app.use('/api/social', socialRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Polymarket Dashboard API',
    version: '1.0.0',
    endpoints: {
      markets: '/api/markets',
      categories: '/api/markets/categories',
      highLiquidity: '/api/markets/high-liquidity',
      highVolume: '/api/markets/high-volume',
      topMovers: '/api/markets/top-movers',
      priceChanges: '/api/markets/price-changes',
      socialTweets: '/api/social/tweets?q=',
      socialHeat: '/api/social/heat?q=',
    },
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Polymarket Dashboard API running on port ${PORT}`);
  console.log(`📊 API URL: http://localhost:${PORT}`);
});
