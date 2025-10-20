import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  Settings, 
  LogOut, 
  TestTube,
  Globe,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';

interface WalletConnectorProps {
  id: string;
  name: string;
  icon: string;
  ready: boolean;
  onClick: () => void;
}

const WalletConnector = ({ id, name, icon, ready, onClick }: WalletConnectorProps) => (
  <button
    onClick={onClick}
    disabled={!ready}
    className={cn(
      "flex items-center gap-3 w-full p-4 rounded-lg border transition-colors",
      ready 
        ? "hover:bg-muted/50 border-border" 
        : "opacity-50 cursor-not-allowed border-muted",
      "focus:outline-none focus:ring-2 focus:ring-primary"
    )}
  >
    <div className="text-2xl">{icon}</div>
    <div className="flex-1 text-left">
      <div className="font-medium">{name}</div>
      <div className="text-sm text-muted-foreground">
        {ready ? "Available" : "Not installed"}
      </div>
    </div>
    {!ready && <AlertCircle className="h-4 w-4 text-muted-foreground" />}
  </button>
);

export const EnhancedWalletConnect = () => {
  const {
    isConnected,
    isConnecting,
    address,
    balance,
    chainId,
    connect,
    disconnect,
    isTestnetMode,
    switchToMainnet,
    switchToTestnet,
    accountValue,
    availableMargin,
    error,
    clearError,
    isRefreshing
  } = useWallet();

  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Mock connector data - in real app this would come from wagmi
  const connectors = [
    { id: 'metaMask', name: 'MetaMask', icon: '🦊', ready: true },
    { id: 'walletConnect', name: 'WalletConnect', icon: '🔗', ready: true },
    { id: 'coinbaseWallet', name: 'Coinbase Wallet', icon: '🔵', ready: false },
    { id: 'injected', name: 'Browser Wallet', icon: '🌐', ready: true }
  ];

  const handleConnect = (connectorId: string) => {
    connect();
    setIsOpen(false);
    clearError();
  };

  const handleDisconnect = () => {
    disconnect();
    setShowSettings(false);
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getChainName = (id: number | null) => {
    switch (id) {
      case 1: return 'Ethereum';
      case 11155111: return 'Sepolia';
      case 42161: return 'Arbitrum';
      default: return 'Unknown';
    }
  };

  if (isConnected && address) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-2 bg-card hover:bg-muted/50 border-success/20"
          >
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">{formatAddress(address)}</span>
            {isRefreshing && <Loader2 className="h-3 w-3 animate-spin" />}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Connected
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="text-sm font-medium">Connected</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {getChainName(chainId)}
              </Badge>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <code className="flex-1 text-sm font-mono">{address}</code>
                <Button size="sm" variant="ghost" onClick={copyAddress}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <a 
                    href={`https://etherscan.io/address/${address}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Balance Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">ETH Balance</label>
                <div className="font-mono text-sm">
                  {balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0.0000 ETH'}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Account Value</label>
                <div className="font-mono text-sm">
                  ${accountValue.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Available Margin</label>
                <div className="font-mono text-sm">
                  ${availableMargin.toLocaleString()}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Trading Mode</label>
                <Badge variant={isTestnetMode ? "destructive" : "default"} className="text-xs">
                  {isTestnetMode ? 'Testnet' : 'Mainnet'}
                </Badge>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              </div>
            )}

            <Separator />

            {/* Network Toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Trading Network</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant={!isTestnetMode ? "default" : "outline"}
                  onClick={switchToMainnet}
                  className="gap-2"
                >
                  <Globe className="h-3 w-3" />
                  Mainnet
                </Button>
                <Button
                  size="sm"
                  variant={isTestnetMode ? "default" : "outline"}
                  onClick={switchToTestnet}
                  className="gap-2"
                >
                  <TestTube className="h-3 w-3" />
                  Testnet
                </Button>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 gap-2"
                onClick={handleDisconnect}
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={isConnecting}>
          {isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="h-4 w-4" />
          )}
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your wallet to start trading on Hyperliquid
          </p>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}

          {/* Wallet Options */}
          <div className="space-y-2">
            {connectors.map((connector) => (
              <WalletConnector
                key={connector.id}
                {...connector}
                onClick={() => handleConnect(connector.id)}
              />
            ))}
          </div>

          {/* Network Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Network</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={!isTestnetMode ? "default" : "outline"}
                onClick={() => switchToMainnet()}
                className="gap-2"
              >
                <Globe className="h-3 w-3" />
                Mainnet
              </Button>
              <Button
                size="sm"
                variant={isTestnetMode ? "default" : "outline"}
                onClick={() => switchToTestnet()}
                className="gap-2"
              >
                <TestTube className="h-3 w-3" />
                Testnet
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            By connecting a wallet, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};