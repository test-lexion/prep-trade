import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gift, Trophy, Star, Zap, CheckCircle } from "lucide-react";

const Rewards = () => {
  const currentXP = 2350;
  const nextLevelXP = 3000;
  const currentRank = "Gold Trader";
  const rankBenefits = ["5% fee discount", "Priority support", "Exclusive badges"];

  const dailyQuests = [
    { id: 1, title: "Trade $10,000 volume", reward: 50, progress: 7500, target: 10000, completed: false },
    { id: 2, title: "Execute 5 trades", reward: 30, progress: 5, target: 5, completed: true },
    { id: 3, title: "Hold a position for 24h", reward: 40, progress: 18, target: 24, completed: false },
  ];

  const rewards = [
    { id: 1, name: "Platform Token Airdrop", cost: 500, icon: "🪙" },
    { id: 2, name: "Diamond Badge", cost: 300, icon: "💎" },
    { id: 3, name: "Gold Frame", cost: 200, icon: "🖼️" },
    { id: 4, name: "Exclusive NFT", cost: 1000, icon: "🎨" },
  ];

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Gift className="h-8 w-8 text-warning" />
          My Rewards & Loyalty
        </h1>
        <p className="text-muted-foreground">Level up and earn exclusive rewards</p>
      </div>

      {/* Rank Status */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-warning/10 to-primary/10 border-warning/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/20 border-2 border-warning">
              <Trophy className="h-8 w-8 text-warning" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Current Rank</div>
              <div className="text-2xl font-bold">{currentRank}</div>
              <div className="flex gap-2 mt-1">
                {rankBenefits.map((benefit, idx) => (
                  <Badge key={idx} variant="secondary">{benefit}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">Experience Points</div>
            <div className="text-3xl font-bold font-mono-numeric text-primary">
              {currentXP.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress to next level</span>
            <span className="font-medium">
              {currentXP} / {nextLevelXP} XP
            </span>
          </div>
          <Progress value={(currentXP / nextLevelXP) * 100} className="h-3" />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Quests */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-warning" />
            Daily Quests
          </h3>
          <div className="space-y-4">
            {dailyQuests.map((quest) => (
              <div
                key={quest.id}
                className={`p-4 rounded-lg border ${
                  quest.completed ? "border-success bg-success/5" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium">{quest.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Reward: <span className="text-primary font-semibold">+{quest.reward} XP</span>
                    </div>
                  </div>
                  {quest.completed && (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )}
                </div>
                {!quest.completed && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-mono-numeric">
                        {quest.progress.toLocaleString()} / {quest.target.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={(quest.progress / quest.target) * 100} className="h-2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Rewards Store */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Rewards Store
          </h3>
          <div className="space-y-3">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{reward.icon}</div>
                  <div>
                    <div className="font-medium">{reward.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Cost: <span className="text-primary font-semibold">{reward.cost} XP</span>
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm"
                  disabled={currentXP < reward.cost}
                >
                  Redeem
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Rank Ladder */}
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Rank Ladder</h3>
        <div className="grid gap-4 md:grid-cols-5">
          {[
            { rank: "Bronze", xp: 0, color: "text-orange-600" },
            { rank: "Silver", xp: 1000, color: "text-gray-400" },
            { rank: "Gold", xp: 3000, color: "text-warning", current: true },
            { rank: "Platinum", xp: 7000, color: "text-cyan-400" },
            { rank: "Diamond", xp: 15000, color: "text-purple-400" },
          ].map((tier) => (
            <div
              key={tier.rank}
              className={`p-4 rounded-lg text-center ${
                tier.current
                  ? "border-2 border-warning bg-warning/10"
                  : "border border-border bg-muted/20"
              }`}
            >
              <Trophy className={`h-8 w-8 mx-auto mb-2 ${tier.color}`} />
              <div className="font-semibold">{tier.rank}</div>
              <div className="text-sm text-muted-foreground">{tier.xp.toLocaleString()} XP</div>
              {tier.current && (
                <Badge variant="secondary" className="mt-2">Current</Badge>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Rewards;
