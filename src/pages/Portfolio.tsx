import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const Portfolio = () => {
  const totalValue = 45234.56;
  const unrealizedPnL = 1234.89;
  const usedMargin = 12000;
  const availableMargin = 33234.56;

  const assets = [
    { symbol: "USDC", balance: 25000, value: 25000, collateralWeight: 1.0, yield: 3.5, asCollateral: true },
    { symbol: "BTC", balance: 0.25, value: 16062.63, collateralWeight: 0.9, yield: 0, asCollateral: true },
    { symbol: "ETH", balance: 1.2, value: 4104.90, collateralWeight: 0.85, yield: 4.2, asCollateral: true },
    { symbol: "SOL", balance: 5.0, value: 711.50, collateralWeight: 0.75, yield: 5.8, asCollateral: false },
  ];

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
        <p className="text-muted-foreground">Manage your assets and collateral</p>
      </div>

      {/* MODIFICATION: Changed grid to be 2 columns */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 md:p-6">
          <div className="text-sm text-muted-foreground mb-2">Total Value</div>
          <div className="text-xl md:text-2xl font-bold font-mono-numeric">${totalValue.toLocaleString()}</div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="text-sm text-muted-foreground mb-2">Unrealized PnL</div>
          <div className={cn(
            "text-xl md:text-2xl font-bold font-mono-numeric flex items-center gap-2",
            unrealizedPnL >= 0 ? "text-success" : "text-danger"
          )}>
            {unrealizedPnL >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            {unrealizedPnL >= 0 ? "+" : ""}${Math.abs(unrealizedPnL).toLocaleString()}
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="text-sm text-muted-foreground mb-2">Used Margin</div>
          <div className="text-xl md:text-2xl font-bold font-mono-numeric">${usedMargin.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {((usedMargin / totalValue) * 100).toFixed(1)}% utilized
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="text-sm text-muted-foreground mb-2">Available Margin</div>
          <div className="text-xl md:text-2xl font-bold font-mono-numeric text-success">${availableMargin.toLocaleString()}</div>
        </Card>
      </div>

      {/* Assets & Collateral */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
          <h3 className="text-lg font-semibold">Asset Balances</h3>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowDownLeft className="h-4 w-4" /> Deposit
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpRight className="h-4 w-4" /> Withdraw
            </Button>
            <Button size="sm" className="gap-2">
              <Wallet className="h-4 w-4" /> Fiat On/Off-Ramp
            </Button>
          </div>
        </div>

        {/* Desktop Table View - Hidden on mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr className="text-left text-sm text-muted-foreground">
                <th className="p-3">Asset</th>
                <th className="p-3 text-right">Balance</th>
                <th className="p-3 text-right">Value (USD)</th>
                <th className="p-3 text-right">Yield (APR)</th>
                <th className="p-3 text-center">As Collateral?</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.symbol} className="border-b border-border hover:bg-muted/20">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <span className="font-bold text-primary">{asset.symbol.slice(0, 1)}</span>
                      </div>
                      <span className="font-semibold">{asset.symbol}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono-numeric">{asset.balance.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono-numeric">${asset.value.toLocaleString()}</td>
                  <td className="p-3 text-right">
                    {asset.yield > 0 ? (
                      <Badge variant="secondary" className="bg-success/20 text-success">{asset.yield}%</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-3 text-center"><Switch checked={asset.asCollateral} /></td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline">Manage</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Hidden on desktop */}
        <div className="block md:hidden space-y-3">
          {assets.map((asset) => (
            <div key={asset.symbol} className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="font-bold text-primary">{asset.symbol.slice(0, 1)}</span>
                  </div>
                  <div>
                    <div className="font-semibold">{asset.symbol}</div>
                    <div className="font-mono-numeric text-muted-foreground text-sm">${asset.value.toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono-numeric font-medium">{asset.balance.toLocaleString()}</div>
                  {asset.yield > 0 && (
                    <Badge variant="secondary" className="mt-1 bg-success/20 text-success">{asset.yield}% APR</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <label htmlFor={`collateral-${asset.symbol}`} className="text-sm font-medium">As Collateral</label>
                  <Switch id={`collateral-${asset.symbol}`} checked={asset.asCollateral} />
                </div>
                <Button size="sm" variant="outline">Manage</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Portfolio;
