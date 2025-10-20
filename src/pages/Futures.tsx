import { MarketsSidebar } from "@/components/trading/MarketsSidebar";
import { TradingChart } from "@/components/trading/TradingChart";
import { OrderEntryPanel } from "@/components/trading/OrderEntryPanel";
import { PositionsTable } from "@/components/trading/PositionsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Futures = () => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Markets Sidebar (Desktop only) */}
        <div className="hidden shrink-0 md:flex">
          <MarketsSidebar />
        </div>

        {/* Main Trading Area */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Desktop Layout */}
          <div className="hidden h-full flex-col gap-4 p-4 md:flex">
            <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <TradingChart />
              </div>
              <div>
                <OrderEntryPanel />
              </div>
            </div>
            <PositionsTable />
          </div>

          {/* Mobile Layout */}
          <div className="flex h-full flex-col p-2 md:hidden">
            <Tabs defaultValue="chart" className="flex h-full flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chart">Chart</TabsTrigger>
                <TabsTrigger value="trade">Trade</TabsTrigger>
                <TabsTrigger value="positions">Positions</TabsTrigger>
              </TabsList>
              <TabsContent value="chart" className="flex-1 overflow-y-auto pt-2">
                <TradingChart />
              </TabsContent>
              <TabsContent value="trade" className="flex-1 overflow-y-auto pt-2">
                <OrderEntryPanel />
              </TabsContent>
              <TabsContent value="positions" className="flex-1 overflow-y-auto pt-2">
                <PositionsTable />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Futures;
