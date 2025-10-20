import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

// WebSocket message types for Hyperliquid
export interface WSSubscription {
  method: 'subscribe';
  subscription: {
    type: 'allMids' | 'orderbook' | 'trades' | 'userEvents' | 'userFills' | 'userFundings';
    coin?: string;
    user?: string;
  };
}

export interface WSMessage {
  channel: string;
  data: any;
  timestamp?: number;
}

export interface WSOrderBookData {
  coin: string;
  levels: Array<[string, string]>; // [price, size]
  time: number;
}

export interface WSTradeData {
  coin: string;
  side: 'A' | 'B'; // A = sell, B = buy
  px: string;
  sz: string;
  time: number;
  tid: number;
}

export interface WSUserEvent {
  fills: any[];
  funding: any[];
  liquidation: any[];
  nonUserCancel: any[];
}

interface WebSocketConfig {
  url: string;
  reconnectAttempts: number;
  reconnectInterval: number;
  heartbeatInterval: number;
  subscriptions: WSSubscription[];
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: WSMessage | null;
  error: string | null;
  reconnectCount: number;
  latency: number;
}

const DEFAULT_CONFIG: WebSocketConfig = {
  url: 'wss://api.hyperliquid.xyz/ws',
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  heartbeatInterval: 30000,
  subscriptions: []
};

export const useHyperliquidWebSocket = (
  config: Partial<WebSocketConfig> = {},
  onMessage?: (message: WSMessage) => void,
  onError?: (error: string) => void
) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingTimeRef = useRef<number>(0);
  
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    lastMessage: null,
    error: null,
    reconnectCount: 0,
    latency: 0
  });

  const wsConfig = { ...DEFAULT_CONFIG, ...config };

  // Send message with error handling
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    }
    return false;
  }, []);

  // Subscribe to channels
  const subscribe = useCallback((subscription: WSSubscription) => {
    return sendMessage(subscription);
  }, [sendMessage]);

  // Unsubscribe from channels
  const unsubscribe = useCallback((subscription: Omit<WSSubscription, 'method'>) => {
    return sendMessage({
      method: 'unsubscribe',
      subscription
    });
  }, [sendMessage]);

  // Send ping for latency measurement
  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      pingTimeRef.current = Date.now();
      sendMessage({ method: 'ping' });
    }
  }, [sendMessage]);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      // Handle pong response for latency calculation
      if (data.method === 'pong') {
        const latency = Date.now() - pingTimeRef.current;
        setState(prev => ({ ...prev, latency }));
        return;
      }

      const message: WSMessage = {
        channel: data.channel,
        data: data.data,
        timestamp: Date.now()
      };

      setState(prev => ({ ...prev, lastMessage: message, error: null }));
      onMessage?.(message);

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      setState(prev => ({ ...prev, error: 'Failed to parse message' }));
    }
  }, [onMessage]);

  // Handle connection open
  const handleOpen = useCallback(() => {
    console.log('WebSocket connected to Hyperliquid');
    
    setState(prev => ({ 
      ...prev, 
      isConnected: true, 
      isConnecting: false, 
      error: null,
      reconnectCount: 0 
    }));

    // Send initial subscriptions
    wsConfig.subscriptions.forEach(subscription => {
      setTimeout(() => subscribe(subscription), 100);
    });

    // Start heartbeat
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
    }
    heartbeatTimeoutRef.current = setInterval(sendPing, wsConfig.heartbeatInterval);

    toast.success('Real-time data connected');
  }, [subscribe, sendPing, wsConfig.subscriptions, wsConfig.heartbeatInterval]);

  // Handle connection close
  const handleClose = useCallback((event: CloseEvent) => {
    console.log('WebSocket disconnected:', event.code, event.reason);
    
    setState(prev => ({ 
      ...prev, 
      isConnected: false, 
      isConnecting: false 
    }));

    // Clear heartbeat
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }

    // Attempt reconnection if not intentional close
    if (event.code !== 1000 && state.reconnectCount < wsConfig.reconnectAttempts) {
      const delay = wsConfig.reconnectInterval * Math.pow(2, state.reconnectCount);
      console.log(`Reconnecting in ${delay}ms (attempt ${state.reconnectCount + 1})`);
      
      setState(prev => ({ 
        ...prev, 
        reconnectCount: prev.reconnectCount + 1,
        error: `Connection lost. Reconnecting... (${prev.reconnectCount + 1}/${wsConfig.reconnectAttempts})`
      }));

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);

      toast.error(`Connection lost. Reconnecting... (${state.reconnectCount + 1}/${wsConfig.reconnectAttempts})`);
    } else if (state.reconnectCount >= wsConfig.reconnectAttempts) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to reconnect after maximum attempts' 
      }));
      toast.error('Failed to reconnect to real-time data');
      onError?.('Failed to reconnect after maximum attempts');
    }
  }, [state.reconnectCount, wsConfig.reconnectAttempts, wsConfig.reconnectInterval, onError]);

  // Handle connection error
  const handleError = useCallback((event: Event) => {
    console.error('WebSocket error:', event);
    const errorMessage = 'WebSocket connection error';
    
    setState(prev => ({ 
      ...prev, 
      error: errorMessage,
      isConnecting: false 
    }));
    
    onError?.(errorMessage);
  }, [onError]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      wsRef.current = new WebSocket(wsConfig.url);
      
      wsRef.current.onopen = handleOpen;
      wsRef.current.onmessage = handleMessage;
      wsRef.current.onclose = handleClose;
      wsRef.current.onerror = handleError;

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: 'Failed to create connection' 
      }));
    }
  }, [wsConfig.url, handleOpen, handleMessage, handleClose, handleError]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Intentional disconnect');
      wsRef.current = null;
    }

    setState(prev => ({ 
      ...prev, 
      isConnected: false, 
      isConnecting: false,
      reconnectCount: 0,
      error: null 
    }));
  }, []);

  // Force reconnection
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return disconnect;
  }, []);

  // Subscribe to all mids (ticker data)
  const subscribeToAllMids = useCallback(() => {
    subscribe({
      method: 'subscribe',
      subscription: { type: 'allMids' }
    });
  }, [subscribe]);

  // Subscribe to orderbook for specific coin
  const subscribeToOrderBook = useCallback((coin: string) => {
    subscribe({
      method: 'subscribe',
      subscription: { type: 'orderbook', coin }
    });
  }, [subscribe]);

  // Subscribe to trades for specific coin
  const subscribeToTrades = useCallback((coin: string) => {
    subscribe({
      method: 'subscribe',
      subscription: { type: 'trades', coin }
    });
  }, [subscribe]);

  // Subscribe to user events
  const subscribeToUserEvents = useCallback((user: string) => {
    subscribe({
      method: 'subscribe',
      subscription: { type: 'userEvents', user }
    });
  }, [subscribe]);

  return {
    // State
    ...state,
    
    // Actions
    connect,
    disconnect,
    reconnect,
    subscribe,
    unsubscribe,
    sendMessage,
    
    // Convenience methods
    subscribeToAllMids,
    subscribeToOrderBook,
    subscribeToTrades,
    subscribeToUserEvents
  };
};

// Hook for live market data
export const useMarketDataStream = (coins: string[] = []) => {
  const [marketData, setMarketData] = useState<Map<string, any>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const handleMessage = useCallback((message: WSMessage) => {
    if (message.channel === 'allMids') {
      setMarketData(prev => {
        const newData = new Map(prev);
        // Update all mid prices
        Object.entries(message.data).forEach(([coin, price]) => {
          newData.set(coin, { ...newData.get(coin), price, lastUpdate: Date.now() });
        });
        return newData;
      });
      setLastUpdate(Date.now());
    }
  }, []);

  const ws = useHyperliquidWebSocket(
    {
      subscriptions: [
        { method: 'subscribe', subscription: { type: 'allMids' } }
      ]
    },
    handleMessage
  );

  // Subscribe to specific coins
  useEffect(() => {
    if (ws.isConnected && coins.length > 0) {
      coins.forEach(coin => {
        ws.subscribeToOrderBook(coin);
        ws.subscribeToTrades(coin);
      });
    }
  }, [ws.isConnected, coins, ws]);

  return {
    marketData,
    lastUpdate,
    ...ws
  };
};

// Hook for user-specific real-time data
export const useUserDataStream = (userAddress?: string) => {
  const [userEvents, setUserEvents] = useState<WSUserEvent[]>([]);
  const [fills, setFills] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const handleMessage = useCallback((message: WSMessage) => {
    if (message.channel === 'userEvents') {
      setUserEvents(prev => [...prev, message.data]);
      if (message.data.fills?.length > 0) {
        setFills(prev => [...prev, ...message.data.fills]);
      }
      setLastUpdate(Date.now());
    }
  }, []);

  const ws = useHyperliquidWebSocket(
    {
      subscriptions: userAddress ? [
        { method: 'subscribe', subscription: { type: 'userEvents', user: userAddress } }
      ] : []
    },
    handleMessage
  );

  // Subscribe when user address is available
  useEffect(() => {
    if (ws.isConnected && userAddress) {
      ws.subscribeToUserEvents(userAddress);
    }
  }, [ws.isConnected, userAddress, ws]);

  return {
    userEvents,
    fills,
    lastUpdate,
    ...ws
  };
};