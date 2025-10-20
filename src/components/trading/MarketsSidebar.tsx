import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { hyperliquidAPI, formatHyperliquidVolume } from "@/lib/hyperliquid";
import type { Market } from "@/types/hyperliquid";

export const MarketsSidebar = () => {
  const [selectedMarket, setSelectedMarket] = useState("BTC/USD");
  const [searchQuery, setSearchQuery] = useState("");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval>;

    const fetchMarkets = async () => {
      try {
        setError(null);
        const marketData = await hyperliquidAPI.getMarketsForUI();
        
        if (isMounted) {
          setMarkets(marketData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch markets:', err);
        if (isMounted) {
          setError('Failed to load markets');
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchMarkets();

    // Set up polling every 5 seconds
    intervalId = setInterval(fetchMarkets, 5000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const filteredMarkets = markets.filter((market) =>
    market.pair.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && markets.length === 0) {
    return (
      <div className="flex h-full w-64 flex-col border-r border-border bg-card">
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Loading markets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && markets.length === 0) {
    return (
      <div className="flex h-full w-64 flex-col border-r border-border bg-card">
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="text-center">
            <p className="text-sm text-destructive mb-2">Failed to load markets</p>
            <p className="text-xs text-muted-foreground">
              Please check your connection
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      {/* Search */}
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Markets List */}
      <div className="flex-1 overflow-y-auto">
        {filteredMarkets.length === 0 ? (
          <div className="flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground">No markets found</p>
          </div>
        ) : (
          filteredMarkets.map((market) => (
            <button
              key={market.pair}
              onClick={() => setSelectedMarket(market.pair)}
              className={cn(
                "w-full border-b border-border p-3 text-left transition-colors hover:bg-muted/50",
                selectedMarket === market.pair && "bg-muted"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{market.pair}</span>
                {market.change24h >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-danger" />
                )}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-mono-numeric text-lg">
                  ${market.price.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: market.price < 1 ? 6 : 2 
                  })}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    market.change24h >= 0 ? "text-success" : "text-danger"
                  )}
                >
                  {market.change24h >= 0 ? "+" : ""}
                  {market.change24h.toFixed(2)}%
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Vol: {formatHyperliquidVolume(market.volume)}</span>
                {market.fundingRate !== undefined && (
                  <span className={cn(
                    "font-mono-numeric",
                    market.fundingRate >= 0 ? "text-success" : "text-danger"
                  )}>
                    {(market.fundingRate * 100).toFixed(4)}%
                  </span>
                )}
              </div>
              {market.openInterest && (
                <div className="mt-1 text-xs text-muted-foreground">
                  OI: {formatHyperliquidVolume(market.openInterest)}
                </div>
              )}
            </button>
          ))
        )}
      </div>

      {/* Connection Status */}
      {error && markets.length > 0 && (
        <div className="border-t border-border p-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-destructive"></div>
            <span>Connection issues detected</span>
          </div>
        </div>
      )}
      
      {!error && !loading && markets.length > 0 && (
        <div className="border-t border-border p-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-success"></div>
            <span>Live data • {markets.length} markets</span>
          </div>
        </div>
      )}
    </div>
  );
};
