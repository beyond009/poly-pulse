import { Router } from 'express';
import {
  getMarkets,
  getMarketById,
  getHighLiquidityMarkets,
  getHighVolumeMarkets,
  getTopMovers,
  getCategories,
  getOrderBook,
  analyzeSpread,
  getPriceChanges,
} from '../services/polymarketService';

const router = Router();

// GET /api/markets - List all markets with filters
router.get('/', async (req, res) => {
  try {
    const {
      liquidity_min,
      volume_24h_min,
      category,
      sort_by,
      sort_order,
      limit,
      offset,
    } = req.query;

    const filter = {
      liquidity_min: liquidity_min ? parseFloat(liquidity_min as string) : undefined,
      volume_24h_min: volume_24h_min ? parseFloat(volume_24h_min as string) : undefined,
      category: category as string | undefined,
      sort_by: sort_by as any,
      sort_order: sort_order as 'asc' | 'desc' | undefined,
      limit: limit ? parseInt(limit as string) : 100,
      offset: offset ? parseInt(offset as string) : 0,
    };

    const markets = await getMarkets(filter);
    res.json({
      success: true,
      count: markets.length,
      data: markets,
    });
  } catch (error) {
    console.error('Error in GET /markets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch markets',
    });
  }
});

// GET /api/markets/categories - Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error in GET /markets/categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
});

// GET /api/markets/high-liquidity - High liquidity markets
router.get('/high-liquidity', async (req, res) => {
  try {
    const { min } = req.query;
    const minLiquidity = min ? parseFloat(min as string) : 100000;
    const markets = await getHighLiquidityMarkets(minLiquidity);
    res.json({
      success: true,
      count: markets.length,
      data: markets,
    });
  } catch (error) {
    console.error('Error in GET /markets/high-liquidity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch high liquidity markets',
    });
  }
});

// GET /api/markets/high-volume - High volume markets
router.get('/high-volume', async (req, res) => {
  try {
    const { min } = req.query;
    const minVolume = min ? parseFloat(min as string) : 50000;
    const markets = await getHighVolumeMarkets(minVolume);
    res.json({
      success: true,
      count: markets.length,
      data: markets,
    });
  } catch (error) {
    console.error('Error in GET /markets/high-volume:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch high volume markets',
    });
  }
});

// GET /api/markets/top-movers - Top price movers
router.get('/top-movers', async (req, res) => {
  try {
    const { limit, direction } = req.query;
    const markets = await getTopMovers(
      limit ? parseInt(limit as string) : 20,
      direction as 'up' | 'down' | 'both' || 'both'
    );
    res.json({
      success: true,
      count: markets.length,
      data: markets,
    });
  } catch (error) {
    console.error('Error in GET /markets/top-movers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top movers',
    });
  }
});

// GET /api/markets/price-changes - Get 24h price changes
router.get('/price-changes', async (req, res) => {
  try {
    const { ids } = req.query;
    const marketIds = ids ? (ids as string).split(',') : undefined;
    const changes = await getPriceChanges(marketIds);
    res.json({
      success: true,
      count: changes.length,
      data: changes,
    });
  } catch (error) {
    console.error('Error in GET /markets/price-changes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price changes',
    });
  }
});

// GET /api/markets/:id - Get single market
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const market = await getMarketById(id);
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Market not found',
      });
    }
    res.json({
      success: true,
      data: market,
    });
  } catch (error) {
    console.error(`Error in GET /markets/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market',
    });
  }
});

// GET /api/markets/:id/orderbook - Get order book
router.get('/:id/orderbook', async (req, res) => {
  try {
    const { id } = req.params;
    const { token_id } = req.query;

    if (!token_id) {
      return res.status(400).json({
        success: false,
        error: 'token_id query parameter is required',
      });
    }

    const orderBook = await getOrderBook(token_id as string, id);
    if (!orderBook) {
      return res.status(404).json({
        success: false,
        error: 'Order book not found',
      });
    }
    res.json({
      success: true,
      data: orderBook,
    });
  } catch (error) {
    console.error(`Error in GET /markets/${req.params.id}/orderbook:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order book',
    });
  }
});

// GET /api/markets/:id/spread-analysis - Analyze spread
router.get('/:id/spread-analysis', async (req, res) => {
  try {
    const { id } = req.params;
    const { token_id } = req.query;

    if (!token_id) {
      return res.status(400).json({
        success: false,
        error: 'token_id query parameter is required',
      });
    }

    const analysis = await analyzeSpread(id, token_id as string);
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Unable to analyze spread',
      });
    }
    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error(`Error in GET /markets/${req.params.id}/spread-analysis:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze spread',
    });
  }
});

export default router;
