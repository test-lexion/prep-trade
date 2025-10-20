import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";

const Stats = () => {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Platform Statistics</h1>
        <p className="text-muted-foreground">Real-time analytics and platform metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div className="text-sm text-muted-foreground">24h Volume</div>
          </div>
          <div className="text-2xl font-bold font-mono-numeric">$2.4B</div>
          <div className="text-xs text-success mt-1">+12.5% from yesterday</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-success" />
            <div className="text-sm text-muted-foreground">Total Value Locked</div>
          </div>
          <div className="text-2xl font-bold font-mono-numeric">$168.6M</div>
          <div className="text-xs text-success mt-1">+3.2% this week</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-warning" />
            <div className="text-sm text-muted-foreground">Open Interest</div>
          </div>
          <div className="text-2xl font-bold font-mono-numeric">$892M</div>
          <div className="text-xs text-danger mt-1">-1.8% from peak</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-accent" />
            <div className="text-sm text-muted-foreground">Active Users</div>
          </div>
          <div className="text-2xl font-bold font-mono-numeric">48,392</div>
          <div className="text-xs text-success mt-1">+8.9% this month</div>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card className="p-6">
        <Tabs defaultValue="volume">
          <TabsList>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
          </TabsList>

          <TabsContent value="volume" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Volume by Market</h3>
              <div className="space-y-3">
                {[
                  { market: "BTC/USD", volume: 980500000, percentage: 40.8 },
                  { market: "ETH/USD", volume: 562300000, percentage: 23.4 },
                  { market: "SOL/USD", volume: 324800000, percentage: 13.5 },
                  { market: "ARB/USD", volume: 198600000, percentage: 8.3 },
                  { market: "Others", volume: 334800000, percentage: 14.0 },
                ].map((item) => (
                  <div key={item.market} className="flex items-center gap-4">
                    <div className="w-32 font-medium">{item.market}</div>
                    <div className="flex-1">
                      <div className="h-8 rounded-lg bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-32 text-right font-mono-numeric">
                      ${(item.volume / 1000000).toFixed(1)}M
                    </div>
                    <div className="w-16 text-right text-muted-foreground">
                      {item.percentage}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="markets" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Top Markets</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="p-3">Market</th>
                      <th className="p-3 text-right">24h Volume</th>
                      <th className="p-3 text-right">Open Interest</th>
                      <th className="p-3 text-right">24h Change</th>
                      <th className="p-3 text-right">Funding Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { market: "BTC/USD", volume: "$980M", oi: "$420M", change: 2.34, funding: 0.0125 },
                      { market: "ETH/USD", volume: "$562M", oi: "$245M", change: -1.23, funding: 0.0098 },
                      { market: "SOL/USD", volume: "$325M", oi: "$118M", change: 5.67, funding: 0.0215 },
                    ].map((item) => (
                      <tr key={item.market} className="border-b border-border">
                        <td className="p-3 font-semibold">{item.market}</td>
                        <td className="p-3 text-right font-mono-numeric">{item.volume}</td>
                        <td className="p-3 text-right font-mono-numeric">{item.oi}</td>
                        <td className={`p-3 text-right font-mono-numeric ${item.change >= 0 ? "text-success" : "text-danger"}`}>
                          {item.change >= 0 ? "+" : ""}{item.change}%
                        </td>
                        <td className="p-3 text-right font-mono-numeric text-success">
                          +{item.funding}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <div className="text-center py-8 text-muted-foreground">
              User analytics coming soon
            </div>
          </TabsContent>

          <TabsContent value="fees" className="mt-6">
            <div className="text-center py-8 text-muted-foreground">
              Fee analytics coming soon
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Stats;
