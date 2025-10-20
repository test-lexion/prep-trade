import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  TrendingUp, 
  ChevronUp, 
  ChevronDown, 
  Menu, 
  Maximize2,
  MoreVertical,
  RefreshCw,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileDetection, useTouchGestures, useMobileViewport } from '@/hooks/useMobile';

interface MobileTradingInterfaceProps {
  selectedAsset: string;
  onAssetChange: (asset: string) => void;
}

export const MobileTradingInterface = ({ 
  selectedAsset, 
  onAssetChange 
}: MobileTradingInterfaceProps) => {
  const deviceInfo = useMobileDetection();
  const viewport = useMobileViewport();
  const [activeTab, setActiveTab] = useState('trade');
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [showOrderBook, setShowOrderBook] = useState(false);
  const swipeRef = useRef<HTMLDivElement>(null);

  // Touch gestures for tab navigation
  useTouchGestures(swipeRef, {
    onSwipe: (swipe) => {
      if (swipe.direction === 'left') {
        // Swipe left to next tab
        const tabs = ['trade', 'chart', 'positions', 'markets'];
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex < tabs.length - 1) {
          setActiveTab(tabs[currentIndex + 1]);
        }
      } else if (swipe.direction === 'right') {
        // Swipe right to previous tab
        const tabs = ['trade', 'chart', 'positions', 'markets'];
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex > 0) {
          setActiveTab(tabs[currentIndex - 1]);
        }
      }
    },
    minSwipeDistance: 80
  });

  const containerStyle = {
    height: deviceInfo.orientation === 'portrait' 
      ? `${viewport.height - viewport.safeArea.top - viewport.safeArea.bottom}px`
      : `${viewport.height - 60}px`, // Account for header
    paddingTop: viewport.safeArea.top,
    paddingBottom: viewport.safeArea.bottom,
    paddingLeft: viewport.safeArea.left,
    paddingRight: viewport.safeArea.right
  };

  if (!deviceInfo.isMobile) {
    return null; // Use desktop interface
  }

  return (
    <div className="flex flex-col bg-background" style={containerStyle}>
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <MobileMenu />
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center gap-1">
            <span className="font-semibold text-lg">{selectedAsset}</span>
            <Badge variant="outline" className="text-xs px-1">
              {deviceInfo.platform === 'ios' ? '📱' : '🤖'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCompactMode(!isCompactMode)}
          >
            {isCompactMode ? <Maximize2 className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Price Display */}
      {!isCompactMode && (
        <div className="px-3 py-2 bg-muted/20 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold font-mono">$43,250.00</div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-success">+2.34%</span>
                <span className="text-muted-foreground">24h</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Vol 24h</div>
              <div className="font-mono text-sm">$1.2B</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content with Touch Navigation */}
      <div ref={swipeRef} className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Mobile Tab Navigation */}
          <TabsList className="grid w-full grid-cols-4 rounded-none border-b bg-background">
            <TabsTrigger value="trade" className="text-xs">Trade</TabsTrigger>
            <TabsTrigger value="chart" className="text-xs">Chart</TabsTrigger>
            <TabsTrigger value="positions" className="text-xs">Portfolio</TabsTrigger>
            <TabsTrigger value="markets" className="text-xs">Markets</TabsTrigger>
          </TabsList>

          {/* Trade Tab */}
          <TabsContent value="trade" className="flex-1 overflow-auto p-0 m-0">
            <MobileTradePanel asset={selectedAsset} />
          </TabsContent>

          {/* Chart Tab */}
          <TabsContent value="chart" className="flex-1 overflow-auto p-0 m-0">
            <MobileChartPanel asset={selectedAsset} />
          </TabsContent>

          {/* Positions Tab */}
          <TabsContent value="positions" className="flex-1 overflow-auto p-0 m-0">
            <MobilePositionsPanel />
          </TabsContent>

          {/* Markets Tab */}
          <TabsContent value="markets" className="flex-1 overflow-auto p-0 m-0">
            <MobileMarketsPanel onAssetSelect={onAssetChange} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Order Book Toggle */}
      <Button
        className="fixed bottom-20 right-4 rounded-full w-12 h-12 shadow-lg z-40"
        onClick={() => setShowOrderBook(!showOrderBook)}
      >
        {showOrderBook ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
      </Button>

      {/* Sliding Order Book */}
      {showOrderBook && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 animate-slide-up">
          <div className="h-64 overflow-auto">
            <MobileOrderBook asset={selectedAsset} />
          </div>
        </div>
      )}
    </div>
  );
};

// Mobile Trade Panel Component
const MobileTradePanel = ({ asset }: { asset: string }) => {
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');

  return (
    <div className="p-4 space-y-4">
      {/* Order Type Selection */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={orderType === 'market' ? 'default' : 'outline'}
          onClick={() => setOrderType('market')}
          className="h-12"
        >
          Market
        </Button>
        <Button
          variant={orderType === 'limit' ? 'default' : 'outline'}
          onClick={() => setOrderType('limit')}
          className="h-12"
        >
          Limit
        </Button>
      </div>

      {/* Buy/Sell Toggle */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={side === 'buy' ? 'default' : 'outline'}
          onClick={() => setSide('buy')}
          className={cn('h-12', side === 'buy' && 'bg-success hover:bg-success/90')}
        >
          Buy {asset}
        </Button>
        <Button
          variant={side === 'sell' ? 'default' : 'outline'}
          onClick={() => setSide('sell')}
          className={cn('h-12', side === 'sell' && 'bg-destructive hover:bg-destructive/90')}
        >
          Sell {asset}
        </Button>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Amount</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full h-12 px-3 text-lg font-mono border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {asset}
          </div>
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {['25%', '50%', '75%', '100%'].map((percent) => (
          <Button key={percent} variant="outline" size="sm">
            {percent}
          </Button>
        ))}
      </div>

      {/* Price Input (for limit orders) */}
      {orderType === 'limit' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Price</label>
          <input
            type="number"
            placeholder="0.00"
            className="w-full h-12 px-3 text-lg font-mono border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      )}

      {/* Order Summary */}
      <Card className="p-3 bg-muted/20">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Total</span>
            <span className="font-mono">$1,250.00</span>
          </div>
          <div className="flex justify-between">
            <span>Fee</span>
            <span className="font-mono">$1.25</span>
          </div>
        </div>
      </Card>

      {/* Execute Button */}
      <Button 
        size="lg" 
        className={cn(
          'w-full h-14 text-lg font-semibold',
          side === 'buy' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'
        )}
      >
        {side === 'buy' ? 'Buy' : 'Sell'} {asset}
      </Button>
    </div>
  );
};

// Mobile Chart Panel Component
const MobileChartPanel = ({ asset }: { asset: string }) => {
  const [timeframe, setTimeframe] = useState('1H');
  
  return (
    <div className="flex flex-col h-full">
      {/* Timeframe Selection */}
      <div className="flex items-center gap-1 p-2 border-b border-border overflow-x-auto">
        {['1M', '5M', '15M', '1H', '4H', '1D', '1W'].map((tf) => (
          <Button
            key={tf}
            variant={timeframe === tf ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeframe(tf)}
            className="shrink-0 h-8 px-3 text-xs"
          >
            {tf}
          </Button>
        ))}
      </div>

      {/* Chart Area */}
      <div className="flex-1 p-4 flex items-center justify-center bg-muted/10">
        <div className="text-center">
          <div className="text-4xl mb-2">📈</div>
          <div className="text-sm text-muted-foreground">
            Mobile Chart for {asset}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Optimized for touch interaction
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile Positions Panel Component
const MobilePositionsPanel = () => {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-3">
          <div className="text-sm text-muted-foreground">Portfolio Value</div>
          <div className="text-xl font-bold">$12,450</div>
          <div className="text-xs text-success">+5.2%</div>
        </Card>
        <Card className="p-3">
          <div className="text-sm text-muted-foreground">P&L Today</div>
          <div className="text-xl font-bold text-success">+$234</div>
          <div className="text-xs text-muted-foreground">+1.9%</div>
        </Card>
      </div>

      {/* Positions List */}
      <div className="space-y-2">
        <h3 className="font-medium">Active Positions</h3>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">BTC/USD</div>
                <div className="text-sm text-muted-foreground">Long • 0.5 BTC</div>
              </div>
              <div className="text-right">
                <div className="text-success">+$125</div>
                <div className="text-xs text-muted-foreground">+2.1%</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Mobile Markets Panel Component
const MobileMarketsPanel = ({ onAssetSelect }: { onAssetSelect: (asset: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <input
          type="text"
          placeholder="Search markets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 px-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Markets List */}
      <div className="flex-1 overflow-auto">
        {['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC'].map((asset) => (
          <div
            key={asset}
            onClick={() => onAssetSelect(asset)}
            className="flex items-center justify-between p-4 border-b border-border active:bg-muted/50"
          >
            <div>
              <div className="font-medium">{asset}/USD</div>
              <div className="text-sm text-muted-foreground">Perpetual</div>
            </div>
            <div className="text-right">
              <div className="font-mono">$43,250</div>
              <div className="text-sm text-success">+2.34%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mobile Menu Component
const MobileMenu = () => {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">Menu</h2>
      
      <div className="space-y-2">
        {[
          { label: 'Trading', icon: '📈' },
          { label: 'Portfolio', icon: '💼' },
          { label: 'Orders', icon: '📋' },
          { label: 'History', icon: '📊' },
          { label: 'Settings', icon: '⚙️' },
          { label: 'Support', icon: '💬' }
        ].map((item) => (
          <Button key={item.label} variant="ghost" className="w-full justify-start h-12">
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

// Mobile Order Book Component
const MobileOrderBook = ({ asset }: { asset: string }) => {
  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Order Book</h3>
        <Badge variant="outline" className="text-xs">{asset}</Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground mb-2">
        <div>Price</div>
        <div className="text-center">Size</div>
        <div className="text-right">Total</div>
      </div>
      
      {/* Simplified order book for mobile */}
      <div className="space-y-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="grid grid-cols-3 gap-4 text-xs font-mono">
            <div className="text-destructive">43,251</div>
            <div className="text-center">0.5234</div>
            <div className="text-right">22.6</div>
          </div>
        ))}
      </div>
    </div>
  );
};