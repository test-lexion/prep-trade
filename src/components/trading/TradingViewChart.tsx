import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Maximize2, 
  Minimize2, 
  Settings, 
  TrendingUp, 
  BarChart3, 
  Activity,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { hyperliquidAPI } from '@/lib/hyperliquid';

// TradingView widget configuration types
interface TradingViewConfig {
  symbol: string;
  interval: string;
  timezone: string;
  theme: 'light' | 'dark';
  style: string;
  locale: string;
  toolbar_bg: string;
  enable_publishing: boolean;
  allow_symbol_change: boolean;
  container_id: string;
  height: number;
  width: string;
  studies: string[];
  show_popup_button: boolean;
  popup_width: string;
  popup_height: string;
  no_referral_id: boolean;
  watchlist: string[];
  details: boolean;
  hotlist: boolean;
  calendar: boolean;
  studies_overrides: Record<string, unknown>;
  overrides: Record<string, unknown>;
  disabled_features: string[];
  enabled_features: string[];
  loading_screen: {
    backgroundColor?: string;
    foregroundColor?: string;
  };
  custom_css_url?: string;
  save_image: boolean;
}

interface TradingViewWidget {
  onChartReady?: (callback: () => void) => void;
  subscribe?: (event: string, callback: () => void) => void;
  symbolName?: () => string;
  chart: () => {
    setResolution: (resolution: string) => void;
    createStudy: (study: string) => void;
  };
}

interface TradingViewChartProps {
  symbol?: string;
  height?: number;
  autosize?: boolean;
  interval?: string;
  theme?: 'light' | 'dark';
  TradingView: {
    widget: new (config: TradingViewConfig) => TradingViewWidget;
    onChartReady?: () => void;
  };
  className?: string;
  onSymbolChange?: (symbol: string) => void;
}

declare global {
  interface Window {
    TradingView: {
      widget: new (config: TradingViewConfig) => TradingViewWidget;
      onChartReady?: () => void;
    };
  }
}

export const TradingViewChart = ({
  symbol = 'BTCUSD',
  height = 600,
  autosize = true,
  interval = '15',
  theme = 'dark',
  className,
  onSymbolChange
}: TradingViewChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<TradingViewWidget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSymbol, setCurrentSymbol] = useState(symbol);
  interface MarketData {
    price?: number;
    change24h?: number;
    volume24h?: number;
    // Add other fields as needed based on hyperliquidAPI.getMarketData response
  }
  const [marketData, setMarketData] = useState<MarketData | null>(null);

  // Hyperliquid symbol mapping
  const mapToTradingViewSymbol = (hlSymbol: string): string => {
    const mapping: Record<string, string> = {
      'BTC': 'BTCUSD',
      'ETH': 'ETHUSD',
      'SOL': 'SOLUSD',
      'AVAX': 'AVAXUSD',
      'MATIC': 'MATICUSD',
      'LINK': 'LINKUSD',
      'UNI': 'UNIUSD',
      'AAVE': 'AAVEUSD',
      'SUSHI': 'SUSHIUSD',
      'CRV': 'CRVUSD'
    };
    return mapping[hlSymbol] || `${hlSymbol}USD`;
  };

  // Load TradingView script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      initializeChart();
    };
    script.onerror = () => {
      setError('Failed to load TradingView library');
      setIsLoading(false);
    };
    
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize chart when symbol changes
  useEffect(() => {
    if (window.TradingView && containerRef.current) {
      initializeChart();
    }
  }, [currentSymbol, theme]);

  // Fetch market data from Hyperliquid
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const data = await hyperliquidAPI.getMarketData(currentSymbol.replace('USD', ''));
        setMarketData({
          ...data,
          volume24h: typeof data.volume24h === 'string' ? Number(data.volume24h.replace(/,/g, '')) : data.volume24h
        });
      } catch (err) {
        console.error('Failed to fetch market data:', err);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5000);
    return () => clearInterval(interval);
  }, [currentSymbol]);

  const initializeChart = () => {
    if (!window.TradingView || !containerRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Clear previous widget
      if (widgetRef.current) {
        containerRef.current.innerHTML = '';
      }

      const tvSymbol = mapToTradingViewSymbol(currentSymbol.replace('USD', ''));

      const config: TradingViewConfig = {
        symbol: tvSymbol,
        interval: interval,
        timezone: 'Etc/UTC',
        theme: theme,
        style: '1',
        locale: 'en',
        toolbar_bg: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: containerRef.current.id,
        height: height,
        width: autosize ? '100%' : '800',
        studies: [
          'Volume@tv-basicstudies',
          'MACD@tv-basicstudies',
          'RSI@tv-basicstudies'
        ],
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '650',
        no_referral_id: true,
        watchlist: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'AVAXUSD'],
        details: true,
        hotlist: true,
        calendar: false,
        studies_overrides: {
          'volume.volume.color.0': theme === 'dark' ? '#ef4444' : '#dc2626',
          'volume.volume.color.1': theme === 'dark' ? '#22c55e' : '#16a34a',
        },
        overrides: {
          'paneProperties.background': theme === 'dark' ? '#0a0a0a' : '#ffffff',
          'paneProperties.vertGridProperties.color': theme === 'dark' ? '#1f2937' : '#e5e7eb',
          'paneProperties.horzGridProperties.color': theme === 'dark' ? '#1f2937' : '#e5e7eb',
          'symbolWatermarkProperties.transparency': 90,
          'scalesProperties.textColor': theme === 'dark' ? '#9ca3af' : '#374151',
          'mainSeriesProperties.candleStyle.upColor': '#22c55e',
          'mainSeriesProperties.candleStyle.downColor': '#ef4444',
          'mainSeriesProperties.candleStyle.drawWick': true,
          'mainSeriesProperties.candleStyle.drawBorder': true,
          'mainSeriesProperties.candleStyle.borderUpColor': '#22c55e',
          'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
          'mainSeriesProperties.candleStyle.wickUpColor': '#22c55e',
          'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444',
        },
        disabled_features: [
          'header_symbol_search',
          'header_fullscreen_button',
          'header_screenshot',
          'header_chart_type',
          'header_settings',
          'header_indicators',
          'header_compare',
          'header_undo_redo',
          'control_bar',
          'timeframes_toolbar'
        ],
        enabled_features: [
          'study_templates',
          'side_toolbar_in_fullscreen_mode',
          'header_in_fullscreen_mode',
          'remove_library_container_border',
          'chart_property_page_style',
          'show_chart_property_page',
          'chart_crosshair_menu'
        ],
        loading_screen: {
          backgroundColor: theme === 'dark' ? '#0a0a0a' : '#ffffff',
          foregroundColor: theme === 'dark' ? '#ffffff' : '#000000'
        },
        save_image: true
      };

      // Generate unique container ID
      const containerId = `tradingview-${Date.now()}`;
      containerRef.current.id = containerId;
      config.container_id = containerId;


      widgetRef.current = new window.TradingView.widget(config);

      // Set onChartReady callback after widget instantiation
      if (widgetRef.current && typeof widgetRef.current.onChartReady === 'function') {
        widgetRef.current.onChartReady(() => {
          setIsLoading(false);
          // Subscribe to symbol changes
          if (widgetRef.current) {
            widgetRef.current.subscribe('onSymbolChanged', () => {
              const newSymbol = widgetRef.current.symbolName();
              if (newSymbol && newSymbol !== tvSymbol) {
                setCurrentSymbol(newSymbol);
                onSymbolChange?.(newSymbol);
              }
            });
          }
        });
      }

    } catch (err) {
      console.error('Failed to initialize TradingView chart:', err);
      setError('Failed to initialize chart');
      setIsLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const changeTimeframe = (timeframe: string) => {
    if (widgetRef.current) {
      widgetRef.current.chart().setResolution(timeframe);
    }
  };

  const addStudy = (study: string) => {
    if (widgetRef.current) {
      widgetRef.current.chart().createStudy(study);
    }
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Chart Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="font-semibold">{currentSymbol}</span>
          </div>
          
          {marketData && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-mono">${marketData.price?.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">24h:</span>
                <span className={cn(
                  "font-mono",
                  marketData.change24h >= 0 ? "text-success" : "text-destructive"
                )}>
                  {marketData.change24h >= 0 ? '+' : ''}{marketData.change24h?.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center gap-1">
            {['1', '5', '15', '1H', '4H', '1D'].map((tf) => (
              <Button
                key={tf}
                size="sm"
                variant={interval === tf ? "default" : "ghost"}
                onClick={() => changeTimeframe(tf)}
                className="h-7 px-2 text-xs"
              >
                {tf}
              </Button>
            ))}
          </div>

          {/* Chart controls */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => addStudy('Volume@tv-basicstudies')}
              className="h-7 px-2"
            >
              <Activity className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => addStudy('MACD@tv-basicstudies')}
              className="h-7 px-2"
            >
              <TrendingUp className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleFullscreen}
              className="h-7 px-2"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative" style={{ height: `${height}px` }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading TradingView Chart...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive">{error}</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={initializeChart}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        <div 
          ref={containerRef}
          className="w-full h-full"
          style={{ height: `${height}px` }}
        />
      </div>

      {/* Chart Footer */}
      <div className="flex items-center justify-between p-2 border-t border-border bg-muted/10 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span>Live TradingView Data</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Powered by TradingView</span>
          {marketData && (
            <span>Volume: ${marketData.volume24h?.toLocaleString()}</span>
          )}
        </div>
      </div>
    </Card>
  );
};