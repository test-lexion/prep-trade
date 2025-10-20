import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface NetworkStatus {
  isOnline: boolean;
  isRecovering: boolean;
  lastOfflineTime: number | null;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
}

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: any) => boolean;
}

interface NetworkRecoveryOptions {
  enableAutoRetry?: boolean;
  retryConfig?: Partial<RetryConfig>;
  onlineCheckUrl?: string;
  onConnectionRestored?: () => void;
  onConnectionLost?: () => void;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryCondition: (error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /connection/i,
      /fetch/i,
      /cors/i,
      /5\d{2}/
    ];
    return retryablePatterns.some(pattern => 
      pattern.test(error?.message || error?.status?.toString() || '')
    );
  }
};

export const useNetworkRecovery = (options: NetworkRecoveryOptions = {}) => {
  const {
    enableAutoRetry = true,
    retryConfig = {},
    onlineCheckUrl = 'https://httpbin.org/get',
    onConnectionRestored,
    onConnectionLost
  } = options;

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isRecovering: false,
    lastOfflineTime: null,
    connectionQuality: 'excellent'
  });

  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const qualityCheckRef = useRef<NodeJS.Timeout | null>(null);
  const retryAttemptsRef = useRef<Map<string, number>>(new Map());

  const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

  // Check connection quality
  const checkConnectionQuality = useCallback(async () => {
    if (!networkStatus.isOnline) {
      setNetworkStatus(prev => ({ ...prev, connectionQuality: 'offline' }));
      return;
    }

    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch(onlineCheckUrl, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      let quality: NetworkStatus['connectionQuality'];
      if (responseTime < 500) quality = 'excellent';
      else if (responseTime < 1500) quality = 'good';
      else quality = 'poor';

      setNetworkStatus(prev => ({ ...prev, connectionQuality: quality }));
    } catch (error) {
      setNetworkStatus(prev => ({ ...prev, connectionQuality: 'poor' }));
    }
  }, [onlineCheckUrl, networkStatus.isOnline]);

  // Handle network status changes
  const handleOnline = useCallback(() => {
    const wasOffline = !networkStatus.isOnline;
    
    setNetworkStatus(prev => ({
      ...prev,
      isOnline: true,
      isRecovering: false,
      lastOfflineTime: null
    }));

    if (wasOffline) {
      toast.success('Connection restored');
      onConnectionRestored?.();
      checkConnectionQuality();
    }
  }, [networkStatus.isOnline, onConnectionRestored, checkConnectionQuality]);

  const handleOffline = useCallback(() => {
    setNetworkStatus(prev => ({
      ...prev,
      isOnline: false,
      isRecovering: false,
      lastOfflineTime: Date.now(),
      connectionQuality: 'offline'
    }));

    toast.error('Connection lost - attempting to reconnect...', {
      duration: Infinity,
      id: 'network-offline'
    });
    
    onConnectionLost?.();

    // Start recovery process
    if (enableAutoRetry) {
      startRecoveryProcess();
    }
  }, [enableAutoRetry, onConnectionLost]);

  // Recovery process
  const startRecoveryProcess = useCallback(() => {
    setNetworkStatus(prev => ({ ...prev, isRecovering: true }));

    const attemptRecovery = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        await fetch(onlineCheckUrl, {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache'
        });

        clearTimeout(timeoutId);
        
        // If successful, the 'online' event will be triggered
        if (!navigator.onLine) {
          // Manually trigger online status if browser doesn't detect it
          setNetworkStatus(prev => ({
            ...prev,
            isOnline: true,
            isRecovering: false,
            lastOfflineTime: null
          }));
          onConnectionRestored?.();
          toast.dismiss('network-offline');
          toast.success('Connection restored');
        }
      } catch (error) {
        // Retry with exponential backoff
        const retryDelay = Math.min(
          config.initialDelay * Math.pow(config.backoffMultiplier, 0),
          config.maxDelay
        );

        recoveryTimeoutRef.current = setTimeout(attemptRecovery, retryDelay);
      }
    };

    attemptRecovery();
  }, [onlineCheckUrl, onConnectionRestored, config]);

  // Retry function with exponential backoff
  const retryWithBackoff = useCallback(async <T>(
    operation: () => Promise<T>,
    operationId: string = 'default'
  ): Promise<T> => {
    const attempts = retryAttemptsRef.current.get(operationId) || 0;

    try {
      const result = await operation();
      // Reset attempts on success
      retryAttemptsRef.current.delete(operationId);
      return result;
    } catch (error) {
      // Check if we should retry
      if (
        attempts < config.maxRetries &&
        config.retryCondition?.(error) &&
        networkStatus.isOnline
      ) {
        const delay = Math.min(
          config.initialDelay * Math.pow(config.backoffMultiplier, attempts),
          config.maxDelay
        );

        retryAttemptsRef.current.set(operationId, attempts + 1);

        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(operation, operationId);
      }

      // No more retries or not retryable
      retryAttemptsRef.current.delete(operationId);
      throw error;
    }
  }, [config, networkStatus.isOnline]);

  // Enhanced fetch with retry
  const enhancedFetch = useCallback(async (
    url: string,
    options?: RequestInit,
    operationId?: string
  ) => {
    return retryWithBackoff(async () => {
      if (!networkStatus.isOnline) {
        throw new Error('Network unavailable');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }, operationId || url);
  }, [networkStatus.isOnline, retryWithBackoff]);

  // Setup event listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection quality check
    if (networkStatus.isOnline) {
      checkConnectionQuality();
    }

    // Periodic quality checks
    qualityCheckRef.current = setInterval(checkConnectionQuality, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }
      if (qualityCheckRef.current) {
        clearInterval(qualityCheckRef.current);
      }
    };
  }, [handleOnline, handleOffline, checkConnectionQuality]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      toast.dismiss('network-offline');
    };
  }, []);

  return {
    networkStatus,
    retryWithBackoff,
    enhancedFetch,
    checkConnectionQuality,
    forceReconnect: startRecoveryProcess
  };
};

// Rate limiting hook
export const useRateLimit = (maxRequests: number = 100, windowMs: number = 60000) => {
  const requestsRef = useRef<number[]>([]);

  const isRateLimited = useCallback(() => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Remove old requests outside the window
    requestsRef.current = requestsRef.current.filter(time => time > windowStart);
    
    return requestsRef.current.length >= maxRequests;
  }, [maxRequests, windowMs]);

  const trackRequest = useCallback(() => {
    const now = Date.now();
    requestsRef.current.push(now);
  }, []);

  const getRemainingRequests = useCallback(() => {
    const now = Date.now();
    const windowStart = now - windowMs;
    const validRequests = requestsRef.current.filter(time => time > windowStart);
    return Math.max(0, maxRequests - validRequests.length);
  }, [maxRequests, windowMs]);

  const getResetTime = useCallback(() => {
    if (requestsRef.current.length === 0) return 0;
    const oldestRequest = Math.min(...requestsRef.current);
    return oldestRequest + windowMs;
  }, [windowMs]);

  return {
    isRateLimited,
    trackRequest,
    getRemainingRequests,
    getResetTime
  };
};

// API error handler
export const handleApiError = (error: any, operation: string = 'API call') => {
  console.error(`${operation} failed:`, error);

  let userMessage = 'An unexpected error occurred';
  let shouldRetry = false;

  if (error?.response) {
    const status = error.response.status;
    switch (status) {
      case 400:
        userMessage = 'Invalid request. Please check your input.';
        break;
      case 401:
        userMessage = 'Authentication required. Please log in again.';
        break;
      case 403:
        userMessage = 'Access denied. You may not have permission for this action.';
        break;
      case 404:
        userMessage = 'The requested resource was not found.';
        break;
      case 429:
        userMessage = 'Too many requests. Please wait before trying again.';
        shouldRetry = true;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        userMessage = 'Server error. Please try again in a moment.';
        shouldRetry = true;
        break;
      default:
        userMessage = `Server responded with error ${status}`;
        shouldRetry = status >= 500;
    }
  } else if (error?.message) {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      userMessage = 'Network error. Please check your connection.';
      shouldRetry = true;
    } else if (error.message.includes('timeout')) {
      userMessage = 'Request timed out. Please try again.';
      shouldRetry = true;
    } else {
      userMessage = error.message;
    }
  }

  toast.error(userMessage, {
    action: shouldRetry ? {
      label: 'Retry',
      onClick: () => window.location.reload()
    } : undefined
  });

  return { userMessage, shouldRetry };
};