import {
  HyperliquidConfig,
  MetaResponse,
  AssetContext,
  AllMidsResponse,
  L2BookSnapshot,
  CandleSnapshot,
  ClearinghouseState,
  OpenOrder,
  Fill,
  APIRequest,
  APIResponse,
  RateLimitInfo,
  FeeStructure,
  UserPortfolio,
  Market,
  Position,
  HyperliquidError
} from '@/types/hyperliquid';
import { handleApiError } from '@/hooks/useNetworkRecovery';

class HyperliquidAPI {
  private config: HyperliquidConfig;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private rateLimitTracker: Map<string, number[]> = new Map();

  constructor(config?: Partial<HyperliquidConfig>) {
    this.config = {
      baseURL: 'https://api.hyperliquid.xyz',
      testnetURL: 'https://api.hyperliquid-testnet.xyz',
      isTestnet: false,
      ...config
    };
  }

  private getBaseURL(): string {
    return this.config.isTestnet ? this.config.testnetURL : this.config.baseURL;
  }

  private async makeRequest<T>(endpoint: string, body: APIRequest): Promise<T> {
    const url = `${this.getBaseURL()}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Hyperliquid API Error (${endpoint}):`, error);
      throw this.createError('API_REQUEST_FAILED', `Failed to fetch from ${endpoint}`, error);
    }
  }

  private createError(code: string, message: string, details?: any): HyperliquidError {
    return { code, message, details };
  }

  private getCacheKey(method: string, params: any): string {
    return `${method}_${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    return null;
  }

  private setCache<T>(key: string, data: T, ttlMs: number = 5000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  // ==================== PUBLIC MARKET DATA ====================

  /**
   * Get all mid prices for all assets
   */
  async getAllMids(): Promise<AllMidsResponse> {
    const cacheKey = this.getCacheKey('allMids', {});
    const cached = this.getFromCache<AllMidsResponse>(cacheKey);
    if (cached) return cached;

    const data = await this.makeRequest<AllMidsResponse>('/info', {
      type: 'allMids'
    });

    this.setCache(cacheKey, data, 2000); // 2 second cache
    return data;
  }

  /**
   * Get perpetuals metadata (universe and margin tables)
   */
  async getMeta(): Promise<MetaResponse> {
    const cacheKey = this.getCacheKey('meta', {});
    const cached = this.getFromCache<MetaResponse>(cacheKey);
    if (cached) return cached;

    const data = await this.makeRequest<MetaResponse>('/info', {
      type: 'meta'
    });

    this.setCache(cacheKey, data, 60000); // 1 minute cache
    return data;
  }

  /**
   * Get asset contexts (mark price, funding, open interest, etc.)
   */
  async getAssetContexts(): Promise<[MetaResponse, AssetContext[]]> {
    const cacheKey = this.getCacheKey('assetContexts', {});
    const cached = this.getFromCache<[MetaResponse, AssetContext[]]>(cacheKey);
    if (cached) return cached;

    const data = await this.makeRequest<[MetaResponse, AssetContext[]]>('/info', {
      type: 'metaAndAssetCtxs'
    });

    this.setCache(cacheKey, data, 5000); // 5 second cache
    return data;
  }

  /**
   * Get L2 order book snapshot
   */
  async getL2Book(coin: string): Promise<L2BookSnapshot> {
    const cacheKey = this.getCacheKey('l2Book', { coin });
    const cached = this.getFromCache<L2BookSnapshot>(cacheKey);
    if (cached) return cached;

    const data = await this.makeRequest<L2BookSnapshot>('/info', {
      type: 'l2Book',
      coin
    });

    this.setCache(cacheKey, data, 1000); // 1 second cache
    return data;
  }

  /**
   * Get candle data
   */
  async getCandles(
    coin: string, 
    interval: string, 
    startTime?: number, 
    endTime?: number
  ): Promise<CandleSnapshot[]> {
    const cacheKey = this.getCacheKey('candles', { coin, interval, startTime, endTime });
    const cached = this.getFromCache<CandleSnapshot[]>(cacheKey);
    if (cached) return cached;

    const data = await this.makeRequest<CandleSnapshot[]>('/info', {
      type: 'candleSnapshot',
      req: {
        coin,
        interval,
        startTime,
        endTime
      }
    });

    this.setCache(cacheKey, data, 10000); // 10 second cache
    return data;
  }

  // ==================== USER DATA ====================

  /**
   * Get user's clearinghouse state (positions and margin)
   */
  async getClearinghouseState(user: string): Promise<ClearinghouseState> {
    const data = await this.makeRequest<ClearinghouseState>('/info', {
      type: 'clearinghouseState',
      user
    });
    return data;
  }

  /**
   * Get user's open orders
   */
  async getOpenOrders(user: string): Promise<OpenOrder[]> {
    const data = await this.makeRequest<OpenOrder[]>('/info', {
      type: 'openOrders',
      user
    });
    return data;
  }

  /**
   * Get user's recent fills
   */
  async getUserFills(user: string): Promise<Fill[]> {
    const data = await this.makeRequest<Fill[]>('/info', {
      type: 'userFills',
      user
    });
    return data;
  }

  /**
   * Get user's fills by time range
   */
  async getUserFillsByTime(
    user: string, 
    startTime: number, 
    endTime?: number
  ): Promise<Fill[]> {
    const data = await this.makeRequest<Fill[]>('/info', {
      type: 'userFillsByTime',
      user,
      startTime,
      endTime
    });
    return data;
  }

  /**
   * Get user's rate limit info
   */
  async getUserRateLimit(user: string): Promise<RateLimitInfo> {
    const data = await this.makeRequest<RateLimitInfo>('/info', {
      type: 'userRateLimit',
      user
    });
    return data;
  }

  /**
   * Get user's fee structure
   */
  async getUserFees(user: string): Promise<FeeStructure> {
    const data = await this.makeRequest<FeeStructure>('/info', {
      type: 'userFees',
      user
    });
    return data;
  }

  /**
   * Get user's portfolio history
   */
  async getUserPortfolio(user: string): Promise<UserPortfolio[]> {
    const data = await this.makeRequest<UserPortfolio[]>('/info', {
      type: 'userStats',
      user
    });
    return data;
  }

  // ==================== DATA TRANSFORMATION ====================

  /**
   * Transform Hyperliquid data to Market interface for UI components
   */
  async getMarketsForUI(): Promise<Market[]> {
    try {
      const [metaAndContexts, allMids] = await Promise.all([
        this.getAssetContexts(),
        this.getAllMids()
      ]);

      const [meta, contexts] = metaAndContexts;
      
      return meta.universe.map((asset, index) => {
        const context = contexts[index];
        const currentPrice = parseFloat(allMids[asset.name] || context?.markPx || '0');
        const prevPrice = parseFloat(context?.prevDayPx || '0');
        const change24h = prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;

        return {
          pair: `${asset.name}/USD`,
          price: currentPrice,
          change24h,
          volume: context?.dayNtlVlm || '0',
          markPrice: parseFloat(context?.markPx || '0'),
          fundingRate: parseFloat(context?.funding || '0'),
          openInterest: context?.openInterest || '0'
        };
      });
    } catch (error) {
      console.error('Failed to get markets for UI:', error);
      return [];
    }
  }

  /**
   * Transform user positions to Position interface for UI components
   */
  async getPositionsForUI(user: string): Promise<Position[]> {
    try {
      const [clearinghouse, allMids] = await Promise.all([
        this.getClearinghouseState(user),
        this.getAllMids()
      ]);

      return clearinghouse.assetPositions.map((assetPos) => {
        const pos = assetPos.position;
        const currentPrice = parseFloat(allMids[pos.coin] || '0');
        const entryPrice = parseFloat(pos.entryPx);
        const size = Math.abs(parseFloat(pos.szi));
        const isLong = parseFloat(pos.szi) > 0;
        const pnl = parseFloat(pos.unrealizedPnl);
        const positionValue = parseFloat(pos.positionValue);
        const pnlPercent = positionValue > 0 ? (pnl / positionValue) * 100 : 0;

        return {
          pair: `${pos.coin}/USD`,
          side: isLong ? 'long' : 'short',
          size: positionValue,
          entryPrice,
          markPrice: currentPrice,
          liquidationPrice: parseFloat(pos.liquidationPx),
          pnl,
          pnlPercent,
          marginUsed: parseFloat(pos.marginUsed),
          leverage: pos.leverage.value
        };
      });
    } catch (error) {
      console.error('Failed to get positions for UI:', error);
      return [];
    }
  }

  /**
   * Get specific market data for trading chart
   */
  async getMarketData(coin: string) {
    try {
      const [assetContexts, l2Book, allMids] = await Promise.all([
        this.getAssetContexts(),
        this.getL2Book(coin),
        this.getAllMids()
      ]);

      const [meta, contexts] = assetContexts;
      const assetIndex = meta.universe.findIndex(asset => asset.name === coin);
      const context = contexts[assetIndex];

      if (!context) {
        throw new Error(`No context found for asset: ${coin}`);
      }

      const currentPrice = parseFloat(allMids[coin] || context.markPx);
      const prevPrice = parseFloat(context.prevDayPx);
      const change24h = prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;

      return {
        symbol: `${coin}/USD`,
        price: currentPrice,
        markPrice: parseFloat(context.markPx),
        change24h,
        change24hPercent: change24h,
        volume24h: context.dayNtlVlm,
        fundingRate: parseFloat(context.funding),
        openInterest: context.openInterest,
        oraclePrice: parseFloat(context.oraclePx),
        premium: parseFloat(context.premium),
        bid: l2Book.levels[0]?.[0]?.px || context.markPx,
        ask: l2Book.levels[1]?.[0]?.px || context.markPx,
        spread: l2Book.levels[1]?.[0] && l2Book.levels[0]?.[0] 
          ? parseFloat(l2Book.levels[1][0].px) - parseFloat(l2Book.levels[0][0].px)
          : 0
      };
    } catch (error) {
      console.error(`Failed to get market data for ${coin}:`, error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if the API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getAllMids();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Set testnet mode
   */
  setTestnet(isTestnet: boolean): void {
    this.config.isTestnet = isTestnet;
    this.clearCache(); // Clear cache when switching networks
  }
}

// Create and export singleton instance
export const hyperliquidAPI = new HyperliquidAPI();

// Export the class for custom instances
export { HyperliquidAPI };

// Export utility functions
export const formatHyperliquidNumber = (value: string | number, decimals: number = 2): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toFixed(decimals);
};

export const formatHyperliquidVolume = (volume: string): string => {
  const num = parseFloat(volume);
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

export const getHyperliquidSideFromString = (side: string): "A" | "B" => {
  return side.toLowerCase() === 'sell' || side.toLowerCase() === 'short' ? 'A' : 'B';
};

export const getStringFromHyperliquidSide = (side: "A" | "B"): string => {
  return side === 'A' ? 'sell' : 'buy';
};