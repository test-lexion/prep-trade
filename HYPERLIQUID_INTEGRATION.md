# Hyperliquid API Integration

This document explains how the TradeFi platform integrates with the Hyperliquid API to provide real-time trading data and functionality.

## Overview

The Hyperliquid API integration provides:
- Real-time market data for all available trading pairs
- User account information including positions, orders, and trading history
- Order book data and candlestick charts
- Portfolio and PnL tracking
- Live price feeds and funding rates

## Architecture

### Core Files

1. **`src/types/hyperliquid.ts`** - TypeScript interfaces for all API responses
2. **`src/lib/hyperliquid.ts`** - Main API service class with caching and error handling
3. **`src/hooks/useHyperliquid.ts`** - React hooks for easy component integration
4. **Updated Components** - MarketsSidebar, TradingChart, PositionsTable, OrderEntryPanel

### API Service (`hyperliquidAPI`)

The main API service provides methods for:

#### Market Data
- `getAllMids()` - Get current prices for all assets
- `getMeta()` - Get perpetuals metadata (available assets, leverage limits)
- `getAssetContexts()` - Get detailed market data (funding, open interest, etc.)
- `getL2Book(coin)` - Get order book snapshots
- `getCandles(coin, interval)` - Get OHLCV candlestick data

#### User Data (requires wallet address)
- `getClearinghouseState(user)` - Get user positions and margin summary
- `getOpenOrders(user)` - Get user's active orders
- `getUserFills(user)` - Get user's trading history
- `getUserPortfolio(user)` - Get portfolio performance data

#### Transformed Data
- `getMarketsForUI()` - Returns market data formatted for UI components
- `getPositionsForUI(user)` - Returns user positions formatted for UI
- `getMarketData(coin)` - Returns comprehensive market data for a specific asset

### Configuration

```typescript
const api = new HyperliquidAPI({
  baseURL: 'https://api.hyperliquid.xyz',
  testnetURL: 'https://api.hyperliquid-testnet.xyz',
  isTestnet: false // Set to true for testnet
});
```

### Caching Strategy

The API service implements intelligent caching:
- Market prices: 2-second cache
- Asset metadata: 1-minute cache
- User data: No cache (always fresh)
- Market contexts: 5-second cache

## Component Integration

### MarketsSidebar
- Fetches real market data every 5 seconds
- Displays live prices, 24h changes, volume, and funding rates
- Shows connection status and market count
- Implements search functionality

### TradingChart
- Gets real-time price data for selected asset
- Shows mark price, oracle price, funding rate with countdown
- Displays volume, open interest, bid/ask spreads
- Ready for TradingView widget integration

### PositionsTable
- Loads user positions from clearinghouse state
- Shows open orders and trading history
- Calculates real-time PnL and margin usage
- Supports multiple tabs for different data views

### OrderEntryPanel
- Uses real market prices for position calculations
- Dynamic liquidation price estimation
- Real-time margin requirements
- Validates orders against available balance

## API Endpoints Used

### Public Endpoints
```typescript
POST https://api.hyperliquid.xyz/info
{
  "type": "allMids"              // Get all asset prices
}

{
  "type": "meta"                 // Get asset metadata
}

{
  "type": "metaAndAssetCtxs"     // Get metadata + market contexts
}

{
  "type": "l2Book",              // Get order book
  "coin": "BTC"
}

{
  "type": "candleSnapshot",      // Get OHLCV data
  "req": {
    "coin": "BTC",
    "interval": "15m"
  }
}
```

### User Data Endpoints
```typescript
{
  "type": "clearinghouseState",  // Get user positions
  "user": "0x..."
}

{
  "type": "openOrders",          // Get user orders
  "user": "0x..."
}

{
  "type": "userFills",           // Get user trading history
  "user": "0x..."
}
```

## Error Handling

The integration includes comprehensive error handling:
- Network timeouts and retries
- API rate limiting awareness
- Graceful fallbacks for missing data
- User-friendly error messages
- Loading states for all async operations

## Data Refresh Strategy

- **Market Data**: Auto-refresh every 3-5 seconds
- **User Data**: Refresh every 5-10 seconds when wallet is connected
- **Price Feeds**: Can be upgraded to WebSocket for real-time updates
- **Charts**: Refresh every 10 seconds for new candles

## WebSocket Integration (Ready)

The codebase includes WebSocket hooks for real-time data:
```typescript
const { data, isConnected } = useHyperliquidRealTime(
  ['BTC', 'ETH'],           // Assets to subscribe to
  ['allMids', 'l2Book']     // Data types to receive
);
```

## Usage Examples

### Get Market Data in Component
```typescript
const { data: markets, isLoading, error } = useHyperliquidMarkets();
```

### Get User Positions
```typescript
const { data: positions } = useHyperliquidPositions();
```

### Get Specific Asset Data
```typescript
const { data: btcData } = useHyperliquidMarketData('BTC');
```

## Testing

To test the integration:

1. **Public Data**: Should work immediately
2. **User Data**: Requires setting a valid Ethereum address in components
3. **Testnet**: Change `isTestnet: true` in API configuration

## Next Steps

1. **Wallet Integration**: Connect to actual user wallets for real addresses
2. **Order Execution**: Implement order placement via Hyperliquid API
3. **WebSocket**: Upgrade to real-time WebSocket feeds
4. **TradingView**: Integrate TradingView charts with live data
5. **Error Monitoring**: Add comprehensive error tracking

## Security Notes

- API keys are not required for public data
- User addresses should come from authenticated wallet connections
- All calculations are done client-side for transparency
- No private keys or sensitive data are transmitted

## Performance

The integration is optimized for performance:
- Intelligent caching reduces API calls
- Stale-while-revalidate pattern for smooth UX
- Minimal re-renders with proper React hooks
- Background updates without blocking UI

This integration transforms the TradeFi platform from using mock data to real, live trading data from Hyperliquid's decentralized exchange.