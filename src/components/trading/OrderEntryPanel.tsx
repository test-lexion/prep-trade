import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { hyperliquidAPI } from "@/lib/hyperliquid";
import { useOrderExecution, OrderRequest } from "@/hooks/useOrderExecution";
import { toast } from "sonner";

export const OrderEntryPanel = () => {
  const [side, setSide] = useState<"long" | "short">("long");
  const [leverage, setLeverage] = useState([10]);
  const [collateral, setCollateral] = useState("");
  const [orderType, setOrderType] = useState("market");
  const [selectedAsset, setSelectedAsset] = useState("BTC");
  const [limitPrice, setLimitPrice] = useState("");
  
  // Market data state
  const [marketPrice, setMarketPrice] = useState<number>(0);
  const [markPrice, setMarkPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // User account state
  const [availableMargin, setAvailableMargin] = useState<number>(0);
  const [maxLeverage, setMaxLeverage] = useState<number>(50);

  // Order execution hook
  const { executeOrder, isExecuting } = useOrderExecution();

  // Fetch market data
  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval>;

    const fetchMarketData = async () => {
      try {
        setError(null);
        const marketData = await hyperliquidAPI.getMarketData(selectedAsset);
        
        if (isMounted) {
          setMarketPrice(marketData.price);
          setMarkPrice(marketData.markPrice);
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

    fetchMarketData();
    intervalId = setInterval(fetchMarketData, 3000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedAsset]);

  // Fetch user account data (mock for now)
  useEffect(() => {
    // In a real app, this would fetch from the user's connected wallet
    // For now, using mock data
    setAvailableMargin(10000);
  }, []);

  // Calculate order details
  const orderCalculations = useMemo(() => {
    if (!collateral || isNaN(parseFloat(collateral)) || marketPrice === 0) {
      return {
        positionSize: 0,
        entryPrice: 0,
        liquidationPrice: 0,
        estimatedFees: 0,
        marginUsed: 0,
        requiredMargin: 0
      };
    }

    const collateralAmount = parseFloat(collateral);
    const leverageValue = leverage[0];
    const positionSize = collateralAmount * leverageValue;
    
    // Use limit price if set and order type is limit, otherwise use market price
    const entryPrice = orderType === "limit" && limitPrice 
      ? parseFloat(limitPrice) 
      : marketPrice;
    
    // Calculate liquidation price (simplified calculation)
    // In reality, this would account for maintenance margin requirements
    const maintenanceMarginRate = 0.005; // 0.5% maintenance margin
    const liquidationDistance = entryPrice * (1 / leverageValue - maintenanceMarginRate);
    const liquidationPrice = side === "long" 
      ? entryPrice - liquidationDistance
      : entryPrice + liquidationDistance;
    
    // Calculate fees (0.03% maker, 0.07% taker for most assets on Hyperliquid)
    const feeRate = orderType === "market" ? 0.0007 : 0.0003;
    const estimatedFees = positionSize * feeRate;
    
    // Required margin is collateral plus fees
    const requiredMargin = collateralAmount + estimatedFees;

    return {
      positionSize,
      entryPrice,
      liquidationPrice: Math.max(0, liquidationPrice),
      estimatedFees,
      marginUsed: collateralAmount,
      requiredMargin
    };
  }, [collateral, leverage, marketPrice, orderType, limitPrice, side]);

  // Order submission handler
  const handleSubmitOrder = async () => {
    if (!isValidOrder) {
      toast.error("Please check order parameters");
      return;
    }

    const price = orderType === "limit" ? parseFloat(limitPrice) : marketPrice;
    const size = (parseFloat(collateral) * leverage[0]) / price;
    
    const order: OrderRequest = {
      asset: selectedAsset,
      isBuy: side === "long",
      size,
      price: orderType === "limit" ? parseFloat(limitPrice) : undefined,
      orderType: orderType as "market" | "limit",
      timeInForce: "gtc"
    };

    try {
      await executeOrder(order);
      // Reset form on successful order
      setCollateral("");
      setLimitPrice("");
    } catch (error) {
      console.error("Order submission failed:", error);
    }
  };

  const isValidOrder = useMemo(() => {
    if (!collateral || parseFloat(collateral) <= 0) return false;
    if (orderCalculations.requiredMargin > availableMargin) return false;
    if (leverage[0] > maxLeverage) return false;
    if (orderType === "limit" && (!limitPrice || parseFloat(limitPrice) <= 0)) return false;
    return true;
  }, [collateral, orderCalculations.requiredMargin, availableMargin, leverage, maxLeverage, orderType, limitPrice]);

  if (loading) {
    return (
      <Card className="border-border bg-card p-4">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Loading market data...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border bg-card p-4">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card p-4">
      {/* Asset Selection */}
      <div className="mb-4">
        <Label>Asset</Label>
        <div className="mt-1 text-lg font-semibold">{selectedAsset}/USD</div>
        <div className="text-sm text-muted-foreground">
          Mark: ${markPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Long/Short Toggle */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Button
          variant={side === "long" ? "default" : "outline"}
          className={cn(
            side === "long" && "bg-success hover:bg-success/90 text-success-foreground"
          )}
          onClick={() => setSide("long")}
        >
          Long
        </Button>
        <Button
          variant={side === "short" ? "default" : "outline"}
          className={cn(
            side === "short" && "bg-danger hover:bg-danger/90 text-danger-foreground"
          )}
          onClick={() => setSide("short")}
        >
          Short
        </Button>
      </div>

      {/* Order Type Tabs */}
      <Tabs value={orderType} onValueChange={setOrderType} className="mb-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="limit">Limit</TabsTrigger>
          <TabsTrigger value="stop">Stop</TabsTrigger>
          <TabsTrigger value="tp-sl">TP/SL</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Limit Price Input (for limit orders) */}
      {orderType === "limit" && (
        <div className="mb-4 space-y-2">
          <Label>Limit Price (USD)</Label>
          <Input
            type="number"
            placeholder={marketPrice.toFixed(2)}
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            className="font-mono-numeric"
          />
        </div>
      )}

      {/* Leverage Slider */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <Label>Leverage</Label>
          <span className="font-mono-numeric text-lg font-bold text-primary">
            {leverage[0]}x
          </span>
        </div>
        <Slider
          value={leverage}
          onValueChange={setLeverage}
          min={1}
          max={maxLeverage}
          step={1}
          className="py-4"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1x</span>
          <span>{Math.floor(maxLeverage / 2)}x</span>
          <span>{maxLeverage}x</span>
        </div>
      </div>

      {/* Collateral Input */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <Label>Collateral (USDC)</Label>
          <span className="text-sm text-muted-foreground">
            Available: ${availableMargin.toLocaleString()}
          </span>
        </div>
        <div className="relative">
          <Input
            type="number"
            placeholder="0.00"
            value={collateral}
            onChange={(e) => setCollateral(e.target.value)}
            className="pr-16 font-mono-numeric"
          />
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-1 top-1/2 h-7 -translate-y-1/2"
            onClick={() => setCollateral((availableMargin * 0.9).toString())}
          >
            MAX
          </Button>
        </div>
        {orderCalculations.requiredMargin > availableMargin && (
          <p className="text-xs text-destructive">
            Insufficient margin. Required: ${orderCalculations.requiredMargin.toFixed(2)}
          </p>
        )}
      </div>

      {/* Order Summary */}
      {collateral && parseFloat(collateral) > 0 && (
        <div className="mb-4 space-y-2 rounded-lg bg-muted/50 p-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Position Size</span>
            <span className="font-mono-numeric font-medium">
              ${orderCalculations.positionSize.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Entry Price</span>
            <span className="font-mono-numeric font-medium">
              ${orderCalculations.entryPrice.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Liquidation Price</span>
            <span className="font-mono-numeric font-medium text-danger">
              ${orderCalculations.liquidationPrice.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Est. Fees</span>
            <span className="font-mono-numeric font-medium">
              ${orderCalculations.estimatedFees.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Required Margin</span>
            <span className="font-mono-numeric font-medium">
              ${orderCalculations.requiredMargin.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Execute Button */}
      <Button
        size="lg"
        disabled={!isValidOrder || isExecuting}
        onClick={handleSubmitOrder}
        className={cn(
          "w-full font-semibold",
          side === "long"
            ? "bg-success hover:bg-success/90 text-success-foreground disabled:bg-success/50"
            : "bg-danger hover:bg-danger/90 text-danger-foreground disabled:bg-danger/50"
        )}
      >
        {isExecuting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Executing...
          </>
        ) : (
          `${side === "long" ? "Open Long" : "Open Short"} ${selectedAsset}`
        )}
      </Button>

      {/* Real-time data indicator */}
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-success"></div>
        <span>Live Hyperliquid Data</span>
      </div>
    </Card>
  );
};
