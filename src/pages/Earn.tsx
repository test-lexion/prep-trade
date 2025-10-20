import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Wallet, Zap } from "lucide-react";

const Earn = () => {
  const pools = [
    { asset: "USDC", apy: "12.5%", tvl: "$45.2M", risk: "Low" },
    { asset: "ETH", apy: "8.3%", tvl: "$32.1M", risk: "Low" },
    { asset: "BTC", apy: "6.7%", tvl: "$78.5M", risk: "Low" },
    { asset: "SOL", apy: "15.2%", tvl: "$12.8M", risk: "Medium" },
  ];

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Earn</h1>
        <p className="text-muted-foreground">
          Become a liquidity provider and earn a share of platform revenue
        </p>
      </div>

      {/* MODIFICATION: Changed grid to be 3 columns on small screens and up */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground">Total Value Locked</div>
          </div>
          <div className="text-2xl font-bold font-mono-numeric">$168.6M</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-success/10">
              <Zap className="h-5 w-5 text-success" />
            </div>
            <div className="text-sm text-muted-foreground">Your Deposits</div>
          </div>
          <div className="text-2xl font-bold font-mono-numeric">$0.00</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-warning/10">
              <Wallet className="h-5 w-5 text-warning" />
            </div>
            <div className="text-sm text-muted-foreground">Earnings (30d)</div>
          </div>
          <div className="text-2xl font-bold font-mono-numeric">$0.00</div>
        </Card>
      </div>

      {/* Liquidity Pools */}
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">Available Pools</h3>
        <div className="space-y-3">
          {pools.map((pool) => (
            <div
              key={pool.asset}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/20 transition-colors gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                  <span className="font-bold text-primary">{pool.asset.slice(0, 1)}</span>
                </div>
                <div>
                  <div className="font-semibold">{pool.asset} Pool</div>
                  <div className="text-sm text-muted-foreground">
                    TVL: {pool.tvl} • Risk: <Badge variant={pool.risk === "Low" ? "secondary" : "outline"} className="ml-1">{pool.risk}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="text-left sm:text-right flex-1">
                  <div className="text-sm text-muted-foreground">APY</div>
                  <div className="text-xl font-bold text-success">{pool.apy}</div>
                </div>
                <Button className="gap-2">
                  <Wallet className="h-4 w-4" />
                  Deposit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Earn;
