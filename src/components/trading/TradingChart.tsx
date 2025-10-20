import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Loader2, AlertCircle, BarChart3, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { hyperliquidAPI } from "@/lib/hyperliquid";
import { TradingViewChart } from "./TradingViewChart";

interface MarketData {
  symbol: string;
  price: number;
  markPrice: number;
  change24h: number;
  change24hPercent: number;
  volume24h: string;
  fundingRate: number;
  openInterest: string;
  oraclePrice: number;
  premium: number;
  bid: string;
  ask: string;
  spread: number;
}

export const TradingChart = () => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [selectedAsset, setSelectedAsset] = useState("BTC");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"advanced" | "simple">("advanced");

  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval>;

    const fetchMarketData = async () => {
      try {
        setError(null);
        const data = await hyperliquidAPI.getMarketData(selectedAsset);
        
        if (isMounted) {
          setMarketData(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch market data:', err);
        if (isMounted) {
          setError('Failed to load market data');
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchMarketData();

    // Set up polling every 3 seconds
    intervalId = setInterval(fetchMarketData, 3000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedAsset]);

  // Calculate next funding time (every 8 hours)
  const getNextFundingTime = () => {
    const now = new Date();
    const hours = now.getUTCHours();
    const nextFundingHour = Math.ceil((hours + 1) / 8) * 8;
    const nextFunding = new Date(now);
    nextFunding.setUTCHours(nextFundingHour % 24, 0, 0, 0);
    
    if (nextFundingHour >= 24) {
      nextFunding.setUTCDate(nextFunding.getUTCDate() + 1);
    }
    
    const timeDiff = nextFunding.getTime() - now.getTime();
    const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hoursLeft}h ${minutesLeft}m`;
  };

  if (loading) {
    return (
      <Card className="flex h-[500px] flex-col border-border bg-card">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Loading market data...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !marketData) {
    return (
      <Card className="flex h-[500px] flex-col border-border bg-card">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <p className="text-sm text-destructive mb-1">Failed to load market data</p>
            <p className="text-xs text-muted-foreground">Please check your connection</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Market Data Summary Card */}
      <Card className="border-border bg-card">
        {/* Chart Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-sm text-muted-foreground">{marketData.symbol}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono-numeric">
                  ${marketData.price.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: marketData.price < 1 ? 6 : 2 
                  })}
                </span>
                <span className={`flex items-center gap-1 text-sm ${
                  marketData.change24h >= 0 ? 'text-success' : 'text-danger'
                }`}>
                  <TrendingUp className={`h-4 w-4 ${
                    marketData.change24h < 0 ? 'rotate-180' : ''
                  }`} />
                  {marketData.change24h >= 0 ? '+' : ''}{marketData.change24hPercent.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-sm text-muted-foreground">Mark Price</div>
              <div className="font-mono-numeric text-lg">
                ${marketData.markPrice.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: marketData.markPrice < 1 ? 6 : 2 
                })}
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-sm text-muted-foreground">Oracle Price</div>
              <div className="font-mono-numeric text-lg">
                ${marketData.oraclePrice.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: marketData.oraclePrice < 1 ? 6 : 2 
                })}
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-sm text-muted-foreground">Funding Rate</div>
              <div className="flex items-center gap-2">
                <span className={`font-mono-numeric text-lg ${
                  marketData.fundingRate >= 0 ? 'text-success' : 'text-danger'
                }`}>
                  {marketData.fundingRate >= 0 ? '+' : ''}{(marketData.fundingRate * 100).toFixed(4)}%
                </span>
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">in {getNextFundingTime()}</span>
              </div>
            </div>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={chartType === "advanced" ? "default" : "outline"}
              onClick={() => setChartType("advanced")}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Advanced
            </Button>
            <Button
              size="sm"
              variant={chartType === "simple" ? "default" : "outline"}
              onClick={() => setChartType("simple")}
              className="gap-2"
            >
              <Activity className="h-4 w-4" />
              Simple
            </Button>
          </div>
        </div>

        {/* Market Stats Row */}
        <div className="flex items-center justify-between border-b border-border p-3 text-sm">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-muted-foreground">24h Volume: </span>
              <span className="font-mono-numeric">
                ${parseFloat(marketData.volume24h).toLocaleString(undefined, { 
                  minimumFractionDigits: 0, 
                  maximumFractionDigits: 0 
                })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Open Interest: </span>
              <span className="font-mono-numeric">
                ${parseFloat(marketData.openInterest).toLocaleString(undefined, { 
                  minimumFractionDigits: 0, 
                  maximumFractionDigits: 0 
                })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Bid: </span>
              <span className="font-mono-numeric text-success">
                ${parseFloat(marketData.bid).toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 6 
                })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Ask: </span>
              <span className="font-mono-numeric text-danger">
                ${parseFloat(marketData.ask).toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 6 
                })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Spread: </span>
              <span className="font-mono-numeric">
                ${marketData.spread.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success"></div>
            <span className="text-xs text-muted-foreground">Live Data</span>
          </div>
        </div>
      </Card>

      {/* Chart Component */}
      {chartType === "advanced" ? (
        <TradingViewChart
          symbol={selectedAsset}
          height={600}
          onSymbolChange={(symbol) => setSelectedAsset(symbol.replace('USD', ''))}
          className="border-border"
        />
      ) : (
        <Card className="border-border bg-card p-6">
          <div className="flex items-center justify-center h-[600px]">
            <div className="text-center">
              <div className="mb-4 text-6xl font-bold font-mono-numeric text-primary/20">
                📈
              </div>
              <div className="text-muted-foreground text-lg mb-2">
                Simple Chart View
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                Basic price visualization for {marketData.symbol}
              </div>
              <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 max-w-md">
                � Simple chart implementation can be added here for lightweight visualization
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
