// Hyperliquidity API Types and Interfaces

export interface HyperliquidConfig {
  baseURL: string;
  testnetURL: string;
  isTestnet?: boolean;
}

// Market Data Types
export interface AssetInfo {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
  isDelisted?: boolean;
}

export interface MetaResponse {
  universe: AssetInfo[];
  marginTables: Array<[number, MarginTable]>;
}

export interface MarginTable {
  description: string;
  marginTiers: Array<{
    lowerBound: string;
    maxLeverage: number;
  }>;
}

export interface AssetContext {
  dayNtlVlm: string;      // 24h volume in USDC
  funding: string;         // Current funding rate
  impactPxs: [string, string];  // [bid impact price, ask impact price]
  markPx: string;         // Mark price
  midPx: string;          // Mid price
  openInterest: string;   // Open interest
  oraclePx: string;      // Oracle price
  premium: string;       // Premium rate
  prevDayPx: string;     // Previous day price
}

export interface AllMidsResponse {
  [coin: string]: string;  // coin -> mid price
}

// Order Book Types
export interface L2BookLevel {
  px: string;  // Price
  sz: string;  // Size
  n: number;   // Number of orders
}

export interface L2BookSnapshot {
  coin: string;
  time: number;
  levels: [L2BookLevel[], L2BookLevel[]];  // [bids, asks]
}

// Candle Types
export interface CandleSnapshot {
  T: number;    // Close time
  c: string;    // Close price
  h: string;    // High price
  i: string;    // Interval
  l: string;    // Low price
  n: number;    // Number of trades
  o: string;    // Open price
  s: string;    // Symbol
  t: number;    // Open time
  v: string;    // Volume
}

// User Account Types
export interface AssetPosition {
  position: {
    coin: string;
    cumFunding: {
      allTime: string;
      sinceChange: string;
      sinceOpen: string;
    };
    entryPx: string;
    leverage: {
      rawUsd: string;
      type: "isolated" | "cross";
      value: number;
    };
    liquidationPx: string;
    marginUsed: string;
    maxLeverage: number;
    positionValue: string;
    returnOnEquity: string;
    szi: string;              // Signed size (positive for long, negative for short)
    unrealizedPnl: string;
  };
  type: "oneWay";
}

export interface MarginSummary {
  accountValue: string;
  totalMarginUsed: string;
  totalNtlPos: string;
  totalRawUsd: string;
}

export interface ClearinghouseState {
  assetPositions: AssetPosition[];
  crossMaintenanceMarginUsed: string;
  crossMarginSummary: MarginSummary;
  marginSummary: MarginSummary;
  time: number;
  withdrawable: string;
}

// Order Types
export interface OpenOrder {
  coin: string;
  limitPx: string;
  oid: number;
  side: "A" | "B";  // A = Ask (sell), B = Bid (buy)
  sz: string;
  timestamp: number;
  isPositionTpsl?: boolean;
  isTrigger?: boolean;
  orderType?: string;
  origSz?: string;
  reduceOnly?: boolean;
  triggerCondition?: string;
  triggerPx?: string;
}

export interface Fill {
  closedPnl: string;
  coin: string;
  crossed: boolean;
  dir: string;            // e.g., "Open Long", "Close Short"
  hash: string;
  oid: number;
  px: string;             // Fill price
  side: "A" | "B";
  startPosition: string;
  sz: string;             // Fill size
  time: number;
  fee: string;
  feeToken: string;
  builderFee?: string;
  tid: number;
}

// API Request/Response Types
export interface APIRequest<T = any> {
  type: string;
  user?: string;
  coin?: string;
  startTime?: number;
  endTime?: number;
  [key: string]: any;
}

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

// Trading Interface Types (for UI components)
export interface Market {
  pair: string;
  price: number;
  change24h: number;
  volume: string;
  markPrice?: number;
  fundingRate?: number;
  openInterest?: string;
}

export interface Position {
  pair: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  pnl: number;
  pnlPercent: number;
  marginUsed: number;
  leverage: number;
}

export interface OrderRequest {
  coin: string;
  side: "A" | "B";
  sz: string;
  limitPx?: string;
  orderType: "market" | "limit" | "stop" | "tp-sl";
  leverage?: number;
  reduceOnly?: boolean;
}

// WebSocket Types
export interface WSSubscription {
  method: "subscribe";
  subscription: {
    type: "allMids" | "l2Book" | "trades" | "candle" | "userEvents";
    coin?: string;
    interval?: string;
  };
}

export interface WSMessage<T = any> {
  channel: string;
  data: T;
}

// Error Types
export interface HyperliquidError {
  code: string;
  message: string;
  details?: any;
}

// Rate Limit Types
export interface RateLimitInfo {
  cumVlm: string;
  nRequestsUsed: number;
  nRequestsCap: number;
}

export interface FeeStructure {
  cross: string;
  add: string;
  spotCross: string;
  spotAdd: string;
  tiers: {
    vip: Array<{
      ntlCutoff: string;
      cross: string;
      add: string;
      spotCross: string;
      spotAdd: string;
    }>;
    mm: Array<{
      makerFractionCutoff: string;
      add: string;
    }>;
  };
  referralDiscount: string;
}

// Portfolio Types
export interface PortfolioValue {
  accountValueHistory: Array<[number, string]>;
  pnlHistory: Array<[number, string]>;
  vlm: string;
}

export interface UserPortfolio {
  day: PortfolioValue;
  week: PortfolioValue;
  month: PortfolioValue;
  allTime: PortfolioValue;
  perpDay: PortfolioValue;
  perpWeek: PortfolioValue;
  perpMonth: PortfolioValue;
  perpAllTime: PortfolioValue;
}