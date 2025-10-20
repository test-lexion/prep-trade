import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";

const Options = () => {
  const expirations = ["1 Day", "7 Days", "30 Days", "90 Days"];
  const strikes = [60000, 62000, 64000, 66000, 68000, 70000];

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Options Trading</h1>
          <p className="text-muted-foreground">Trade BTC/USD options with decentralized settlement</p>
        </div>
        <Button className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Strategy Builder
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Expiration Selection */}
        <Card className="p-4">
          <div className="flex gap-2 flex-wrap">
            {expirations.map((exp) => (
              <Button key={exp} variant="outline" size="sm">
                {exp}
              </Button>
            ))}
          </div>
        </Card>

        {/* Options Chain */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Options Chain - 7 Days Expiry</h3>
          
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="calls">Calls Only</TabsTrigger>
              <TabsTrigger value="puts">Puts Only</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr className="text-sm text-muted-foreground">
                      <th className="p-3 text-left">Strike</th>
                      <th className="p-3 text-right">Call Premium</th>
                      <th className="p-3 text-right">Call Volume</th>
                      <th className="p-3 text-center">Type</th>
                      <th className="p-3 text-right">Put Volume</th>
                      <th className="p-3 text-right">Put Premium</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strikes.map((strike) => {
                      const isITM = strike < 64250;
                      return (
                        <tr key={strike} className="border-b border-border hover:bg-muted/20">
                          <td className="p-3 font-mono-numeric font-semibold">
                            ${strike.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono-numeric text-success">
                            ${(Math.random() * 1000 + 200).toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-mono-numeric text-sm text-muted-foreground">
                            {Math.floor(Math.random() * 100)}
                          </td>
                          <td className="p-3 text-center">
                            {isITM ? (
                              <Badge variant="secondary">ITM</Badge>
                            ) : (
                              <Badge variant="outline">OTM</Badge>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono-numeric text-sm text-muted-foreground">
                            {Math.floor(Math.random() * 100)}
                          </td>
                          <td className="p-3 text-right font-mono-numeric text-danger">
                            ${(Math.random() * 800 + 150).toFixed(2)}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" className="text-success border-success/50">
                                Buy Call
                              </Button>
                              <Button size="sm" variant="outline" className="text-danger border-danger/50">
                                Buy Put
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Your Options Positions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Your Options Positions</h3>
          <div className="text-center py-8 text-muted-foreground">
            No open options positions
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Options;
