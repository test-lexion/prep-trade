import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { hyperliquidAPI } from '@/lib/hyperliquid';
import type { Market, Position } from '@/types/hyperliquid';
import { useAccount } from 'wagmi';

// ==================== MARKET DATA HOOKS ====================

export const useHyperliquidMarkets = (refetchInterval: number = 5000) => {
  return useQuery({
    queryKey: ['hyperliquid', 'markets'],
    queryFn: () => hyperliquidAPI.getMarketsForUI(),
    refetchInterval,
    staleTime: 2000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useHyperliquidMarketData = (coin: string, refetchInterval: number = 3000) => {
  return useQuery({
    queryKey: ['hyperliquid', 'market-data', coin],
    queryFn: () => hyperliquidAPI.getMarketData(coin),
    refetchInterval,
    staleTime: 1000,
    enabled: !!coin,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useHyperliquidCandles = (
  coin: string, 
  interval: string = '15m', 
  refetchInterval: number = 10000
) => {
  return useQuery({
    queryKey: ['hyperliquid', 'candles', coin, interval],
    queryFn: () => hyperliquidAPI.getCandles(coin, interval),
    refetchInterval,
    staleTime: 5000,
    enabled: !!coin,
    retry: 3,
  });
};

export const useHyperliquidOrderBook = (coin: string, refetchInterval: number = 1000) => {
  return useQuery({
    queryKey: ['hyperliquid', 'orderbook', coin],
    queryFn: () => hyperliquidAPI.getL2Book(coin),
    refetchInterval,
    staleTime: 500,
    enabled: !!coin,
    retry: 3,
  });
};

// ==================== USER DATA HOOKS ====================

export const useHyperliquidPositions = (refetchInterval: number = 5000) => {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: ['hyperliquid', 'positions', address],
    queryFn: () => hyperliquidAPI.getPositionsForUI(address!),
    refetchInterval,
    staleTime: 2000,
    enabled: !!address,
    retry: 3,
  });
};

export const useHyperliquidClearinghouse = (refetchInterval: number = 5000) => {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: ['hyperliquid', 'clearinghouse', address],
    queryFn: () => hyperliquidAPI.getClearinghouseState(address!),
    refetchInterval,
    staleTime: 2000,
    enabled: !!address,
    retry: 3,
  });
};

export const useHyperliquidOpenOrders = (refetchInterval: number = 3000) => {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: ['hyperliquid', 'open-orders', address],
    queryFn: () => hyperliquidAPI.getOpenOrders(address!),
    refetchInterval,
    staleTime: 1000,
    enabled: !!address,
    retry: 3,
  });
};

export const useHyperliquidUserFills = (refetchInterval: number = 10000) => {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: ['hyperliquid', 'user-fills', address],
    queryFn: () => hyperliquidAPI.getUserFills(address!),
    refetchInterval,
    staleTime: 5000,
    enabled: !!address,
    retry: 3,
  });
};

export const useHyperliquidPortfolio = (refetchInterval: number = 30000) => {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: ['hyperliquid', 'portfolio', address],
    queryFn: () => hyperliquidAPI.getUserPortfolio(address!),
    refetchInterval,
    staleTime: 10000,
    enabled: !!address,
    retry: 3,
  });
};

// ==================== REAL-TIME DATA HOOK ====================

export const useHyperliquidRealTime = (
  coins: string[] = [], 
  subscriptions: string[] = ['allMids']
) => {
  const [wsData, setWsData] = useState<Record<string, any>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket('wss://api.hyperliquid.xyz/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        
        // Subscribe to requested data
        subscriptions.forEach(sub => {
          if (sub === 'allMids') {
            ws.send(JSON.stringify({
              method: 'subscribe',
              subscription: { type: 'allMids' }
            }));
          }
          
          // Subscribe to specific coins if provided
          coins.forEach(coin => {
            if (sub === 'l2Book') {
              ws.send(JSON.stringify({
                method: 'subscribe',
                subscription: { type: 'l2Book', coin }
              }));
            }
            if (sub === 'trades') {
              ws.send(JSON.stringify({
                method: 'subscribe',
                subscription: { type: 'trades', coin }
              }));
            }
          });
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.channel && message.data) {
            setWsData(prev => ({
              ...prev,
              [message.channel]: message.data
            }));

            // Invalidate related queries when receiving real-time updates
            if (message.channel === 'allMids') {
              queryClient.invalidateQueries({ queryKey: ['hyperliquid', 'markets'] });
            }
            if (message.channel.startsWith('l2Book')) {
              const coin = message.channel.split('@')[1];
              queryClient.invalidateQueries({ queryKey: ['hyperliquid', 'orderbook', coin] });
            }
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CLOSED) {
            connect();
          }
        }, 5000);
      };

      ws.onerror = (err) => {
        setError('WebSocket connection error');
        console.error('WebSocket error:', err);
      };

    } catch (err) {
      setError('Failed to create WebSocket connection');
      console.error('WebSocket creation error:', err);
    }
  }, [coins, subscriptions, queryClient]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    data: wsData,
    isConnected,
    error,
    reconnect: connect
  };
};

// ==================== UTILITY HOOKS ====================

export const useHyperliquidHealth = () => {
  return useQuery({
    queryKey: ['hyperliquid', 'health'],
    queryFn: () => hyperliquidAPI.healthCheck(),
    refetchInterval: 30000,
    staleTime: 20000,
    retry: 1,
  });
};

export const useSelectedMarket = () => {
  const [selectedMarket, setSelectedMarket] = useState<string>('BTC');
  
  const marketData = useHyperliquidMarketData(selectedMarket);
  const orderBook = useHyperliquidOrderBook(selectedMarket);
  
  return {
    selectedMarket,
    setSelectedMarket,
    marketData: marketData.data,
    orderBook: orderBook.data,
    isLoading: marketData.isLoading || orderBook.isLoading,
    error: marketData.error || orderBook.error
  };
};

// ==================== DERIVED DATA HOOKS ====================

export const useMarketStats = () => {
  const { data: markets } = useHyperliquidMarkets();
  
  return {
    totalVolume: markets?.reduce((sum, market) => sum + parseFloat(market.volume), 0) || 0,
    topGainers: markets?.filter(m => m.change24h > 0).sort((a, b) => b.change24h - a.change24h).slice(0, 5) || [],
    topLosers: markets?.filter(m => m.change24h < 0).sort((a, b) => a.change24h - b.change24h).slice(0, 5) || [],
    marketCount: markets?.length || 0
  };
};

export const usePortfolioSummary = () => {
  const { data: positions } = useHyperliquidPositions();
  const { data: clearinghouse } = useHyperliquidClearinghouse();
  
  const totalPnL = positions?.reduce((sum, pos) => sum + pos.pnl, 0) || 0;
  const totalPositionValue = positions?.reduce((sum, pos) => sum + pos.size, 0) || 0;
  const totalMarginUsed = positions?.reduce((sum, pos) => sum + pos.marginUsed, 0) || 0;
  
  return {
    accountValue: clearinghouse ? parseFloat(clearinghouse.marginSummary.accountValue) : 0,
    totalPnL,
    totalPositionValue,
    totalMarginUsed,
    withdrawable: clearinghouse ? parseFloat(clearinghouse.withdrawable) : 0,
    positionCount: positions?.length || 0,
    openOrders: 0 // Will be populated when we add open orders hook
  };
};

// ==================== MUTATION HOOKS ====================

export const useHyperliquidMutations = () => {
  const queryClient = useQueryClient();
  
  const invalidateUserData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['hyperliquid'] });
  }, [queryClient]);
  
  const invalidateMarketData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['hyperliquid', 'markets'] });
    queryClient.invalidateQueries({ queryKey: ['hyperliquid', 'market-data'] });
  }, [queryClient]);
  
  return {
    invalidateUserData,
    invalidateMarketData,
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: ['hyperliquid'] })
  };
};