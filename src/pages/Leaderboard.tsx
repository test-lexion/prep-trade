import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Users, Copy, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const Leaderboard = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const topTraders = [
    { rank: 1, address: "0x7a3f...1a5e", pnl: 45678.90, winRate: 78.5, volume: 2450000, followers: 1234, avgRisk: "Medium" },
    { rank: 2, address: "0x9b2c...8f3d", pnl: 38234.12, winRate: 72.3, volume: 1890000, followers: 892, avgRisk: "Low" },
    { rank: 3, address: "0x4e8d...2c9a", pnl: 32109.45, winRate: 69.8, volume: 1650000, followers: 756, avgRisk: "Medium" },
    { rank: 4, address: "0x1f5a...7b4c", pnl: 28567.33, winRate: 68.2, volume: 1420000, followers: 543, avgRisk: "High" },
    { rank: 5, address: "0x6c9e...3d2f", pnl: 24890.67, winRate: 65.9, volume: 1280000, followers: 421, avgRisk: "Medium" },
  ];

  const yourCopyTrades = [
    { trader: "0x7a3f...1a5e", allocated: 5000, currentValue: 5234.56, pnl: 234.56, status: "active" },
    { trader: "0x9b2c...8f3d", allocated: 3000, currentValue: 3128.90, pnl: 128.90, status: "active" },
  ];

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Trophy className="h-8 w-8 text-warning" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground">Follow and copy the strategies of top performers</p>
      </div>

      {/* MODIFICATION: Changed grid to be 3 columns on small screens and up */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <div className="text-sm text-muted-foreground">Top Trader PnL</div>
          </div>
          <div className="text-2xl font-bold font-mono-numeric text-success">+$45,678.90</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-primary" />
            <div className="text-sm text-muted-foreground">Copy Traders</div>
          </div>
          <div className="text-2xl font-bold font-mono-numeric">3,847</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Copy className="h-5 w-5 text-accent" />
            <div className="text-sm text-muted-foreground">Your Copies</div>
          </div>
          <div className="text-2xl font-bold font-mono-numeric">{yourCopyTrades.length}</div>
        </Card>
      </div>

      {/* Leaderboard Table */}
      <Card className="p-2 md:p-6 mb-6">
        <div className="relative mb-4 px-2 md:px-0">
          <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search traders by address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="all">
          <TabsList className="px-2 md:px-0">
            <TabsTrigger value="all">All Time</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="p-3">Rank</th>
                    <th className="p-3">Trader</th>
                    <th className="p-3 text-right">PnL (30d)</th>
                    <th className="p-3 text-right hidden sm:table-cell">Win Rate</th>
                    <th className="p-3 text-center hidden md:table-cell">Avg. Risk</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {topTraders.map((trader) => (
                    <tr key={trader.rank} className="border-b border-border hover:bg-muted/20">
                      <td className="p-3">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full font-bold",
                          trader.rank === 1 && "bg-warning/20 text-warning",
                          trader.rank === 2 && "bg-muted text-foreground",
                          trader.rank === 3 && "bg-primary/20 text-primary",
                          trader.rank > 3 && "bg-muted/50 text-muted-foreground"
                        )}>
                          {trader.rank}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs">{trader.address}</td>
                      <td className="p-3 text-right font-mono-numeric text-success font-semibold">
                        +${trader.pnl.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono-numeric hidden sm:table-cell">{trader.winRate}%</td>
                      <td className="p-3 text-center hidden md:table-cell">
                        <Badge variant={trader.avgRisk === "Low" ? "secondary" : "destructive"}>
                          {trader.avgRisk}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button size="sm" className="gap-2">
                          <Copy className="h-4 w-4" />
                          <span className="hidden sm:inline">Copy</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Your Copy Trading Dashboard */}
      <Card className="p-2 md:p-6">
        <h3 className="text-lg font-semibold mb-4 px-2 md:px-0">Your Copy Trading Dashboard</h3>
        {yourCopyTrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="p-3">Trader</th>
                  <th className="p-3 text-right hidden sm:table-cell">Allocated</th>
                  <th className="p-3 text-right">PnL</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {yourCopyTrades.map((trade, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted/20">
                    <td className="p-3 font-mono text-xs">{trade.trader}</td>
                    <td className="p-3 text-right font-mono-numeric hidden sm:table-cell">${trade.allocated.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono-numeric text-success font-semibold">
                      +${trade.pnl.toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline">Adjust</Button>
                        <Button size="sm" variant="destructive">Stop</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            You are not copying any traders yet.
          </div>
        )}
      </Card>
    </div>
  );
};

export default Leaderboard;
