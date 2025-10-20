import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { hyperliquidAPI } from "@/lib/hyperliquid";
import type { Position, OpenOrder, Fill } from "@/types/hyperliquid";

export const PositionsTable = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [fills, setFills] = useState<Fill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  // Mock user address for testing - in real app this would come from wallet connection
  useEffect(() => {
    // You can set a test address here for testing, or get from wallet context
    // setUserAddress("0x...");
  }, []);

  useEffect(() => {
    if (!userAddress) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval>;

    const fetchUserData = async () => {
      try {
        setError(null);
        
        const [positionsData, ordersData, fillsData] = await Promise.all([
          hyperliquidAPI.getPositionsForUI(userAddress),
          hyperliquidAPI.getOpenOrders(userAddress),
          hyperliquidAPI.getUserFills(userAddress)
        ]);
        
        if (isMounted) {
          setPositions(positionsData);
          setOpenOrders(ordersData);
          setFills(fillsData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        if (isMounted) {
          setError('Failed to load trading data');
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchUserData();

    // Set up polling every 5 seconds
    intervalId = setInterval(fetchUserData, 5000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [userAddress]);

  const formatOrderSide = (side: "A" | "B") => side === "A" ? "SELL" : "BUY";
  const formatOrderType = (order: OpenOrder) => {
    if (order.isTrigger) return "Stop";
    if (order.limitPx && parseFloat(order.limitPx) > 0) return "Limit";
    return "Market";
  };

  if (!userAddress) {
    return (
      <Card className="border-border bg-card">
        <div className="p-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Connect your wallet to view positions</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <div className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading trading data...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger value="positions" className="rounded-none">
            Open Positions ({positions.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="rounded-none">
            Open Orders ({openOrders.length})
          </TabsTrigger>
          <TabsTrigger value="trades" className="rounded-none">
            Trade History ({fills.length})
          </TabsTrigger>
          <TabsTrigger value="funding" className="rounded-none">
            Funding History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="m-0 p-0">
          {error ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : positions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/30">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="p-3 font-medium">Market</th>
                    <th className="p-3 font-medium">Side</th>
                    <th className="p-3 font-medium">Size</th>
                    <th className="p-3 font-medium">Entry Price</th>
                    <th className="p-3 font-medium">Mark Price</th>
                    <th className="p-3 font-medium">Liq. Price</th>
                    <th className="p-3 font-medium">PnL</th>
                    <th className="p-3 font-medium">Margin</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-muted/20">
                      <td className="p-3 font-medium">{position.pair}</td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "rounded px-2 py-1 text-xs font-medium",
                            position.side === "long"
                              ? "bg-success/20 text-success"
                              : "bg-danger/20 text-danger"
                          )}
                        >
                          {position.side.toUpperCase()} {position.leverage}x
                        </span>
                      </td>
                      <td className="p-3 font-mono-numeric">${position.size.toLocaleString()}</td>
                      <td className="p-3 font-mono-numeric">${position.entryPrice.toLocaleString()}</td>
                      <td className="p-3 font-mono-numeric">${position.markPrice.toLocaleString()}</td>
                      <td className="p-3 font-mono-numeric text-danger">
                        ${position.liquidationPrice.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div
                          className={cn(
                            "font-mono-numeric font-medium",
                            position.pnl >= 0 ? "text-success" : "text-danger"
                          )}
                        >
                          {position.pnl >= 0 ? "+" : ""}${position.pnl.toFixed(2)}
                        </div>
                        <div
                          className={cn(
                            "text-xs font-mono-numeric",
                            position.pnl >= 0 ? "text-success" : "text-danger"
                          )}
                        >
                          ({position.pnl >= 0 ? "+" : ""}
                          {position.pnlPercent.toFixed(2)}%)
                        </div>
                      </td>
                      <td className="p-3 font-mono-numeric">${position.marginUsed.toFixed(2)}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive">
                            Close
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No open positions
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="m-0 p-0">
          {openOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/30">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="p-3 font-medium">Market</th>
                    <th className="p-3 font-medium">Type</th>
                    <th className="p-3 font-medium">Side</th>
                    <th className="p-3 font-medium">Size</th>
                    <th className="p-3 font-medium">Price</th>
                    <th className="p-3 font-medium">Time</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {openOrders.map((order) => (
                    <tr key={order.oid} className="border-b border-border hover:bg-muted/20">
                      <td className="p-3 font-medium">{order.coin}/USD</td>
                      <td className="p-3">
                        <span className="rounded bg-muted px-2 py-1 text-xs">
                          {formatOrderType(order)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            order.side === "B" ? "text-success" : "text-danger"
                          )}
                        >
                          {formatOrderSide(order.side)}
                        </span>
                      </td>
                      <td className="p-3 font-mono-numeric">{order.sz}</td>
                      <td className="p-3 font-mono-numeric">
                        {order.limitPx ? `$${parseFloat(order.limitPx).toLocaleString()}` : "Market"}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(order.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <Button size="sm" variant="destructive">
                          Cancel
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No open orders
            </div>
          )}
        </TabsContent>

        <TabsContent value="trades" className="m-0 p-0">
          {fills.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/30">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="p-3 font-medium">Market</th>
                    <th className="p-3 font-medium">Side</th>
                    <th className="p-3 font-medium">Size</th>
                    <th className="p-3 font-medium">Price</th>
                    <th className="p-3 font-medium">Fee</th>
                    <th className="p-3 font-medium">PnL</th>
                    <th className="p-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {fills.slice(0, 50).map((fill, idx) => (
                    <tr key={fill.tid || idx} className="border-b border-border hover:bg-muted/20">
                      <td className="p-3 font-medium">{fill.coin}/USD</td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            fill.side === "B" ? "text-success" : "text-danger"
                          )}
                        >
                          {formatOrderSide(fill.side)}
                        </span>
                      </td>
                      <td className="p-3 font-mono-numeric">{fill.sz}</td>
                      <td className="p-3 font-mono-numeric">${parseFloat(fill.px).toLocaleString()}</td>
                      <td className="p-3 font-mono-numeric">${fill.fee}</td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "font-mono-numeric",
                            parseFloat(fill.closedPnl) >= 0 ? "text-success" : "text-danger"
                          )}
                        >
                          {parseFloat(fill.closedPnl) >= 0 ? "+" : ""}${fill.closedPnl}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(fill.time).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No trade history
            </div>
          )}
        </TabsContent>

        <TabsContent value="funding" className="m-0 p-4">
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            Funding history will be displayed here
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
