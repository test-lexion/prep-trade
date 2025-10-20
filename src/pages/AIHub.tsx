import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Bot, Sparkles, Play, Pause } from "lucide-react";

const AIHub = () => {
  const aiInsights = [
    {
      market: "BTC/USD",
      sentiment: "Bullish",
      signal: "Strong Buy",
      confidence: 85,
      entry: 64250,
      target: 68000,
      stopLoss: 62000,
    },
    {
      market: "ETH/USD",
      sentiment: "Neutral",
      signal: "Hold",
      confidence: 62,
      entry: 3420,
      target: 3600,
      stopLoss: 3200,
    },
  ];

  const strategies = [
    { name: "Momentum Scalper", status: "active", trades: 45, pnl: 1234.56, winRate: 68 },
    { name: "Trend Follower", status: "active", trades: 23, pnl: 892.34, winRate: 72 },
    { name: "Mean Reversion", status: "paused", trades: 12, pnl: -145.89, winRate: 58 },
  ];

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          AI Hub
        </h1>
        <p className="text-muted-foreground">
          AI-powered market analysis, signals, and automated trading strategies
        </p>
      </div>

      {/* AI Insights */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Market Insights
          </h3>
          <Button size="sm" variant="outline">Refresh Analysis</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {aiInsights.map((insight) => (
            <Card key={insight.market} className="p-4 border-primary/20 bg-primary/5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-lg">{insight.market}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={insight.sentiment === "Bullish" ? "secondary" : "outline"}>
                      {insight.sentiment}
                    </Badge>
                    <Badge className="bg-success text-success-foreground">
                      {insight.signal}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Confidence</div>
                  <div className="text-xl font-bold text-primary">{insight.confidence}%</div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entry:</span>
                  <span className="font-mono-numeric font-medium">${insight.entry.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-mono-numeric font-medium text-success">${insight.target.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stop Loss:</span>
                  <span className="font-mono-numeric font-medium text-danger">${insight.stopLoss.toLocaleString()}</span>
                </div>
              </div>

              <Button className="w-full mt-4" size="sm">
                Execute Trade
              </Button>
            </Card>
          ))}
        </div>
      </Card>

      {/* Strategy Builder */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5 text-accent" />
            Strategy Builder & Automation
          </h3>
          <Button className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Create New Strategy
          </Button>
        </div>

        <div className="space-y-3">
          {strategies.map((strategy) => (
            <div
              key={strategy.name}
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/20"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <Bot className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <div className="font-semibold">{strategy.name}</div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>Trades: {strategy.trades}</span>
                    <span>•</span>
                    <span>Win Rate: {strategy.winRate}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <Badge variant={strategy.status === "active" ? "secondary" : "outline"}>
                    {strategy.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">PnL</div>
                  <div className={`font-mono-numeric font-semibold ${strategy.pnl >= 0 ? "text-success" : "text-danger"}`}>
                    {strategy.pnl >= 0 ? "+" : ""}${Math.abs(strategy.pnl).toFixed(2)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    {strategy.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline">Edit</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* How It Works */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <h3 className="text-lg font-semibold mb-4">How AI Hub Works</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              1
            </div>
            <h4 className="font-semibold">AI Analysis</h4>
            <p className="text-sm text-muted-foreground">
              Advanced algorithms analyze social sentiment, on-chain data, and technical patterns
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              2
            </div>
            <h4 className="font-semibold">Build Strategies</h4>
            <p className="text-sm text-muted-foreground">
              Create automated trading bots with no-code interface and backtest before deployment
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              3
            </div>
            <h4 className="font-semibold">Automate & Monitor</h4>
            <p className="text-sm text-muted-foreground">
              Let your strategies run automatically while you monitor performance in real-time
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIHub;
