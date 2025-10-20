import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { mainnet, sepolia, arbitrum } from 'wagmi/chains';
import { hyperliquidAPI } from '@/lib/hyperliquid';

interface WalletContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
  
  // Wallet actions
  connect: () => void;
  disconnect: () => void;
  switchToMainnet: () => void;
  switchToTestnet: () => void;
  
  // Trading state
  isTestnetMode: boolean;
  setTestnetMode: (testnet: boolean) => void;
  
  // User data
  userPositions: any[];
  userOrders: any[];
  accountValue: number;
  availableMargin: number;
  
  // Data refresh
  refreshUserData: () => Promise<void>;
  isRefreshing: boolean;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  // Local state
  const [isTestnetMode, setIsTestnetMode] = useState(false);
  const [userPositions, setUserPositions] = useState<any[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [accountValue, setAccountValue] = useState(0);
  const [availableMargin, setAvailableMargin] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update API mode when testnet mode changes
  useEffect(() => {
    hyperliquidAPI.setTestnet(isTestnetMode);
  }, [isTestnetMode]);

  // Auto-connect to preferred wallet
  useEffect(() => {
    const lastConnector = localStorage.getItem('lastConnectedWallet');
    if (lastConnector && !isConnected && !isConnecting) {
      const connector = connectors.find(c => c.id === lastConnector);
      if (connector) {
        connect({ connector });
      }
    }
  }, [connect, connectors, isConnected, isConnecting]);

  // Refresh user data when address or testnet mode changes
  useEffect(() => {
    if (address) {
      refreshUserData();
    } else {
      // Clear user data when disconnected
      setUserPositions([]);
      setUserOrders([]);
      setAccountValue(0);
      setAvailableMargin(0);
    }
  }, [address, isTestnetMode]);

  // Set up periodic data refresh
  useEffect(() => {
    if (!address) return;

    const interval = setInterval(() => {
      refreshUserData();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [address]);

  const refreshUserData = useCallback(async () => {
    if (!address) return;

    setIsRefreshing(true);
    setError(null);

    try {
      // Fetch user data in parallel
      const [positions, orders, clearinghouse] = await Promise.all([
        hyperliquidAPI.getPositionsForUI(address).catch(() => []),
        hyperliquidAPI.getOpenOrders(address).catch(() => []),
        hyperliquidAPI.getClearinghouseState(address).catch(() => null)
      ]);

      setUserPositions(positions);
      setUserOrders(orders);
      
      if (clearinghouse) {
        setAccountValue(parseFloat(clearinghouse.marginSummary.accountValue));
        setAvailableMargin(parseFloat(clearinghouse.withdrawable));
      }

    } catch (err) {
      console.error('Failed to refresh user data:', err);
      setError('Failed to load account data');
    } finally {
      setIsRefreshing(false);
    }
  }, [address]);

  const handleConnect = useCallback(() => {
    if (connectors.length > 0) {
      const preferredConnector = connectors.find(c => c.id === 'metaMask') || connectors[0];
      connect({ connector: preferredConnector });
      localStorage.setItem('lastConnectedWallet', preferredConnector.id);
    }
  }, [connect, connectors]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    localStorage.removeItem('lastConnectedWallet');
    setError(null);
  }, [disconnect]);

  const switchToMainnet = useCallback(() => {
    setIsTestnetMode(false);
    if (chainId !== mainnet.id) {
      switchChain({ chainId: mainnet.id });
    }
  }, [chainId, switchChain]);

  const switchToTestnet = useCallback(() => {
    setIsTestnetMode(true);
    if (chainId !== sepolia.id) {
      switchChain({ chainId: sepolia.id });
    }
  }, [chainId, switchChain]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue: WalletContextType = {
    // Connection state
    isConnected,
    isConnecting,
    address: address || null,
    chainId,
    balance: balance?.formatted || null,
    
    // Wallet actions
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchToMainnet,
    switchToTestnet,
    
    // Trading state
    isTestnetMode,
    setTestnetMode: setIsTestnetMode,
    
    // User data
    userPositions,
    userOrders,
    accountValue,
    availableMargin,
    
    // Data refresh
    refreshUserData,
    isRefreshing,
    
    // Error handling
    error,
    clearError
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Helper hooks for specific wallet functions
export const useWalletConnection = () => {
  const { isConnected, isConnecting, address, connect, disconnect } = useWallet();
  return { isConnected, isConnecting, address, connect, disconnect };
};

export const useUserData = () => {
  const { 
    userPositions, 
    userOrders, 
    accountValue, 
    availableMargin, 
    refreshUserData, 
    isRefreshing 
  } = useWallet();
  
  return { 
    positions: userPositions, 
    orders: userOrders, 
    accountValue, 
    availableMargin, 
    refresh: refreshUserData, 
    isLoading: isRefreshing 
  };
};

export const useTestnetMode = () => {
  const { isTestnetMode, setTestnetMode, switchToMainnet, switchToTestnet } = useWallet();
  return { isTestnetMode, setTestnetMode, switchToMainnet, switchToTestnet };
};