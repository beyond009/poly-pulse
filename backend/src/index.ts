import express from 'express';
import cors from 'cors';
import './config/env';
import marketRoutes from './routes/markets';
import socialRoutes from './routes/social';

const app = express();
const PORT = process.env.PORT || 3001;
const apiInfo = {
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
};

// Middleware
app.use(cors());
app.use(express.json());

// Health check
const healthHandler = (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// API Routes
app.use('/api/markets', marketRoutes);
app.use('/api/social', socialRoutes);
app.use('/markets', marketRoutes);
app.use('/social', socialRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json(apiInfo);
});

app.get('/api', (req, res) => {
  res.json(apiInfo);
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Polymarket Dashboard API running on port ${PORT}`);
    console.log(`📊 API URL: http://localhost:${PORT}`);
  });
}

export default app;
