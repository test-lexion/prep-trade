import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vote, MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Governance = () => {
  const votingPower = 12500;
  const totalSupply = 100000000;

  const proposals = [
    {
      id: 1,
      title: "Reduce Trading Fees by 25%",
      status: "voting",
      description: "Proposal to reduce maker and taker fees from 0.1% to 0.075% to increase competitiveness",
      votesFor: 3456789,
      votesAgainst: 1234567,
      timeLeft: "2 days",
      quorum: 5000000,
    },
    {
      id: 2,
      title: "Add New Leverage Tiers",
      status: "voting",
      description: "Introduce 75x and 100x leverage options for experienced traders",
      votesFor: 2987654,
      votesAgainst: 2456789,
      timeLeft: "5 days",
      quorum: 5000000,
    },
    {
      id: 3,
      title: "Implement Token Buyback Program",
      status: "passed",
      description: "Allocate 20% of protocol revenue to buy back and burn governance tokens",
      votesFor: 6543210,
      votesAgainst: 1876543,
      timeLeft: "Ended",
      quorum: 5000000,
    },
    {
      id: 4,
      title: "Launch Options Trading",
      status: "failed",
      description: "Introduce decentralized options trading with 30+ expiration dates",
      votesFor: 2345678,
      votesAgainst: 4567890,
      timeLeft: "Ended",
      quorum: 5000000,
    },
  ];

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Vote className="h-8 w-8 text-primary" />
          Governance
        </h1>
        <p className="text-muted-foreground">Shape the future of the protocol through decentralized governance</p>
      </div>

      {/* Voting Power */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-2">Your Voting Power</div>
          <div className="text-2xl font-bold font-mono-numeric">{votingPower.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {((votingPower / totalSupply) * 100).toFixed(3)}% of total supply
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-2">Active Proposals</div>
          <div className="text-2xl font-bold font-mono-numeric">
            {proposals.filter(p => p.status === "voting").length}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-2">Your Participation</div>
          <div className="text-2xl font-bold font-mono-numeric">12</div>
          <div className="text-xs text-muted-foreground mt-1">Total votes cast</div>
        </Card>
      </div>

      {/* Actions */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button className="gap-2">
              <Vote className="h-4 w-4" />
              Create New Proposal
            </Button>
            <Button variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Forum Discussion
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Minimum 10,000 tokens required to create proposals
          </div>
        </div>
      </Card>

      {/* Proposals List */}
      <div className="space-y-4">
        {proposals.map((proposal) => (
          <Card key={proposal.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{proposal.title}</h3>
                  <Badge variant={
                    proposal.status === "voting" ? "default" :
                    proposal.status === "passed" ? "secondary" : "destructive"
                  }>
                    {proposal.status === "voting" && <Clock className="h-3 w-3 mr-1" />}
                    {proposal.status === "passed" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {proposal.status === "failed" && <XCircle className="h-3 w-3 mr-1" />}
                    {proposal.status.toUpperCase()}
                  </Badge>
                  {proposal.status === "voting" && (
                    <span className="text-sm text-muted-foreground">
                      {proposal.timeLeft} left
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">{proposal.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Votes For */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-success font-medium">For</span>
                  <span className="font-mono-numeric">
                    {proposal.votesFor.toLocaleString()} ({((proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <Progress 
                  value={(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100} 
                  className="h-2 bg-muted"
                />
              </div>

              {/* Votes Against */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-danger font-medium">Against</span>
                  <span className="font-mono-numeric">
                    {proposal.votesAgainst.toLocaleString()} ({((proposal.votesAgainst / (proposal.votesFor + proposal.votesAgainst)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <Progress 
                  value={(proposal.votesAgainst / (proposal.votesFor + proposal.votesAgainst)) * 100}
                  className="h-2 bg-muted [&>div]:bg-danger"
                />
              </div>

              {/* Quorum */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                <span>Quorum: {proposal.quorum.toLocaleString()} votes required</span>
                <span>
                  {proposal.votesFor + proposal.votesAgainst >= proposal.quorum ? (
                    <span className="text-success">✓ Quorum reached</span>
                  ) : (
                    <span>
                      {((proposal.votesFor + proposal.votesAgainst) / proposal.quorum * 100).toFixed(1)}% of quorum
                    </span>
                  )}
                </span>
              </div>
            </div>

            {proposal.status === "voting" && (
              <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                <Button className="flex-1 bg-success hover:bg-success/90 text-success-foreground">
                  Vote For
                </Button>
                <Button className="flex-1 bg-danger hover:bg-danger/90 text-danger-foreground">
                  Vote Against
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Governance;
