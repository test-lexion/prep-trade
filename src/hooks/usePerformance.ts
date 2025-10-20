import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Advanced caching system with TTL, LRU eviction, and smart invalidation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  enableLRU: boolean;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 1000,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000, // 1 minute
  enableLRU: true
};

export class AdvancedCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private hitCount = 0;
  private missCount = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.startCleanup();
  }

  private startCleanup() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup() {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    // Remove expired entries
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        entriesToDelete.push(key);
      }
    }

    entriesToDelete.forEach(key => this.cache.delete(key));

    // LRU eviction if cache is too large
    if (this.config.enableLRU && this.cache.size > this.config.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const toRemove = entries.slice(0, this.cache.size - this.config.maxSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  set(key: string, data: T, ttl?: number, tags: string[] = []): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags
    };

    this.cache.set(key, entry);

    // Immediate eviction if over size limit
    if (this.cache.size > this.config.maxSize) {
      this.cleanup();
    }
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return null;
    }

    const now = Date.now();
    
    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.hitCount++;

    return entry.data;
  }

  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  getStats() {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      hitRate: total > 0 ? (this.hitCount / total) * 100 : 0,
      hitCount: this.hitCount,
      missCount: this.missCount,
      maxSize: this.config.maxSize
    };
  }

  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// Global cache instance
export const globalCache = new AdvancedCache();

// React hook for caching
export const useCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    tags?: string[];
    enabled?: boolean;
    refetchOnMount?: boolean;
  } = {}
) => {
  const { ttl, tags = [], enabled = true, refetchOnMount = false } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check cache first (unless forced)
    if (!force) {
      const cached = globalCache.get(key);
      if (cached) {
        setData(cached);
        return cached;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
        globalCache.set(key, result, ttl, tags);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [key, fetcher, ttl, tags, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (refetchOnMount || !globalCache.get(key)) {
      fetchData();
    } else {
      const cached = globalCache.get(key);
      if (cached) setData(cached);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [key, fetchData, refetchOnMount]);

  const invalidate = useCallback(() => {
    globalCache.invalidate(key);
    setData(null);
  }, [key]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  };
};

// Virtual scrolling hook for large datasets
interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  enableDynamicHeight?: boolean;
}

export const useVirtualScroll = <T>(
  items: T[],
  options: VirtualScrollOptions
) => {
  const { itemHeight, containerHeight, overscan = 5, enableDynamicHeight = false } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const itemCount = items.length;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(itemCount - 1, startIndex + visibleCount + 2 * overscan);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }));
  }, [items, startIndex, endIndex]);

  const totalHeight = itemCount * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  // Dynamic height support
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());

  const setItemHeight = useCallback((index: number, height: number) => {
    if (enableDynamicHeight) {
      setItemHeights(prev => new Map(prev).set(index, height));
    }
  }, [enableDynamicHeight]);

  const getDynamicHeight = useCallback((index: number) => {
    return itemHeights.get(index) || itemHeight;
  }, [itemHeights, itemHeight]);

  const getDynamicOffset = useCallback((index: number) => {
    if (!enableDynamicHeight) return index * itemHeight;
    
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getDynamicHeight(i);
    }
    return offset;
  }, [enableDynamicHeight, itemHeight, getDynamicHeight]);

  return {
    visibleItems,
    totalHeight: enableDynamicHeight ? 
      Array.from({ length: itemCount }, (_, i) => getDynamicHeight(i)).reduce((a, b) => a + b, 0) :
      totalHeight,
    offsetY: enableDynamicHeight ? getDynamicOffset(startIndex) : offsetY,
    scrollElementRef,
    handleScroll,
    setItemHeight,
    scrollTop,
    startIndex,
    endIndex
  };
};

// Component lazy loading with preloading
export const useLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  preload = false
) => {
  const [Component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadComponent = useCallback(async () => {
    if (Component) return Component;

    setLoading(true);
    setError(null);

    try {
      const module = await importFunc();
      setComponent(() => module.default);
      return module.default;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [importFunc, Component]);

  // Preload if requested
  useEffect(() => {
    if (preload) {
      loadComponent();
    }
  }, [preload, loadComponent]);

  return {
    Component,
    loading,
    error,
    load: loadComponent
  };
};

// Memory usage monitoring
export const useMemoryMonitor = (interval = 5000) => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    usage: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        });
      }
    };

    updateMemoryInfo();
    const timer = setInterval(updateMemoryInfo, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return memoryInfo;
};

// Bundle size analyzer (development only)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV !== 'development') return null;

  const getScriptSizes = () => {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    return scripts.map(script => ({
      src: (script as HTMLScriptElement).src,
      async: (script as HTMLScriptElement).async,
      defer: (script as HTMLScriptElement).defer
    }));
  };

  const getCSSSize = () => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    return links.map(link => ({
      href: (link as HTMLLinkElement).href
    }));
  };

  return {
    scripts: getScriptSizes(),
    styles: getCSSSize(),
    timestamp: Date.now()
  };
};

// Performance metrics tracking
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<{
    fcp?: number; // First Contentful Paint
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    ttfb?: number; // Time to First Byte
  }>({});

  useEffect(() => {
    // FCP and LCP
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          switch (entry.entryType) {
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
              }
              break;
            case 'largest-contentful-paint':
              setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
              break;
            case 'first-input':
              setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
              break;
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                setMetrics(prev => ({ ...prev, cls: (prev.cls || 0) + (entry as any).value }));
              }
              break;
          }
        }
      });

      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });

      return () => observer.disconnect();
    }

    // TTFB from Navigation Timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        setMetrics(prev => ({ 
          ...prev, 
          ttfb: navEntry.responseStart - navEntry.requestStart 
        }));
      }
    }
  }, []);

  return metrics;
};