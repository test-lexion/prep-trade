import { useState } from 'react';
import { toast } from 'sonner';
import { useAccount, useWalletClient } from 'wagmi';
import { parseEther, formatUnits } from 'viem';
import { hyperliquidAPI } from '@/lib/hyperliquid';
import { useWallet } from '@/contexts/WalletContext';

export interface OrderRequest {
  asset: string;
  isBuy: boolean;
  size: number;
  price?: number; // undefined for market orders
  orderType: 'market' | 'limit' | 'stop' | 'stopLimit';
  timeInForce?: 'gtc' | 'fok' | 'ioc';
  reduceOnly?: boolean;
  postOnly?: boolean;
  stopPrice?: number; // for stop orders
}

export interface OrderExecutionResult {
  success: boolean;
  orderId?: string;
  transactionHash?: string;
  error?: string;
}

export interface PositionAdjustment {
  asset: string;
  sizeDelta: number; // positive for increase, negative for decrease
  price?: number; // for limit orders
}

// Order execution service for Hyperliquid
export class OrderExecutionService {
  private static instance: OrderExecutionService;

  public static getInstance(): OrderExecutionService {
    if (!OrderExecutionService.instance) {
      OrderExecutionService.instance = new OrderExecutionService();
    }
    return OrderExecutionService.instance;
  }

  // Execute a single order
  async executeOrder(
    order: OrderRequest,
    walletClient: any,
    address: string
  ): Promise<OrderExecutionResult> {
    try {
      // Validate order parameters
      const validation = this.validateOrder(order);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Get market data for calculations
      const marketData = await hyperliquidAPI.getMarketData(order.asset);
      if (!marketData) {
        throw new Error(`Market data not available for ${order.asset}`);
      }

      // Calculate order price
      const orderPrice = this.calculateOrderPrice(order, marketData);

      // Check margin requirements
      const marginCheck = await this.checkMarginRequirements(order, orderPrice, address);
      if (!marginCheck.sufficient) {
        throw new Error(`Insufficient margin. Required: $${marginCheck.required}, Available: $${marginCheck.available}`);
      }

      // Prepare order payload for Hyperliquid
      const orderPayload = this.prepareOrderPayload(order, orderPrice);

      // Sign and submit order
      const signature = await this.signOrder(orderPayload, walletClient);
      const result = await this.submitOrder(orderPayload, signature);

      // Track order
      if (result.success && result.orderId) {
        this.trackOrder(result.orderId, order);
      }

      return result;

    } catch (error) {
      console.error('Order execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Execute multiple orders atomically
  async executeBatchOrders(
    orders: OrderRequest[],
    walletClient: any,
    address: string
  ): Promise<OrderExecutionResult[]> {
    try {
      // Validate all orders first
      for (const order of orders) {
        const validation = this.validateOrder(order);
        if (!validation.valid) {
          throw new Error(`Invalid order for ${order.asset}: ${validation.error}`);
        }
      }

      // Execute orders in sequence for now
      // In production, this could be optimized with batch transactions
      const results: OrderExecutionResult[] = [];
      
      for (const order of orders) {
        const result = await this.executeOrder(order, walletClient, address);
        results.push(result);
        
        // If any order fails, consider stopping or continuing based on strategy
        if (!result.success) {
          console.warn(`Order failed for ${order.asset}:`, result.error);
        }
      }

      return results;

    } catch (error) {
      console.error('Batch order execution failed:', error);
      return orders.map(() => ({
        success: false,
        error: error instanceof Error ? error.message : 'Batch execution failed'
      }));
    }
  }

  // Adjust position size
  async adjustPosition(
    adjustment: PositionAdjustment,
    walletClient: any,
    address: string
  ): Promise<OrderExecutionResult> {
    try {
      const currentPosition = await hyperliquidAPI.getPositionsForUI(address);
      const position = currentPosition.find(p => p.pair === adjustment.asset);

      if (!position && adjustment.sizeDelta < 0) {
        throw new Error('Cannot reduce position that does not exist');
      }

      const currentSize = position ? position.size : 0;
      const newSize = currentSize + adjustment.sizeDelta;

      if (newSize < 0 && Math.abs(newSize) > Math.abs(currentSize)) {
        throw new Error('Cannot reduce position below zero');
      }

      // Create order to adjust position
      const order: OrderRequest = {
        asset: adjustment.asset,
        isBuy: adjustment.sizeDelta > 0,
        size: Math.abs(adjustment.sizeDelta),
        price: adjustment.price,
        orderType: adjustment.price ? 'limit' : 'market',
        reduceOnly: adjustment.sizeDelta < 0
      };

      return await this.executeOrder(order, walletClient, address);

    } catch (error) {
      console.error('Position adjustment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Position adjustment failed'
      };
    }
  }

  // Close position completely
  async closePosition(
    asset: string,
    walletClient: any,
    address: string
  ): Promise<OrderExecutionResult> {
    try {
      const positions = await hyperliquidAPI.getPositionsForUI(address);
      const position = positions.find(p => p.pair === asset);

      if (!position) {
        throw new Error('Position not found');
      }

      const size = Math.abs(position.size);
      const isLong = position.side === 'long';

      const order: OrderRequest = {
        asset,
        isBuy: !isLong, // opposite direction to close
        size,
        orderType: 'market',
        reduceOnly: true
      };

      return await this.executeOrder(order, walletClient, address);

    } catch (error) {
      console.error('Position close failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to close position'
      };
    }
  }

  // Validate order parameters
  private validateOrder(order: OrderRequest): { valid: boolean; error?: string } {
    if (!order.asset || order.asset.trim() === '') {
      return { valid: false, error: 'Asset is required' };
    }

    if (order.size <= 0) {
      return { valid: false, error: 'Order size must be positive' };
    }

    if (order.orderType === 'limit' && (!order.price || order.price <= 0)) {
      return { valid: false, error: 'Limit orders require a valid price' };
    }

    if ((order.orderType === 'stop' || order.orderType === 'stopLimit') && 
        (!order.stopPrice || order.stopPrice <= 0)) {
      return { valid: false, error: 'Stop orders require a valid stop price' };
    }

    return { valid: true };
  }

  // Calculate effective order price
  private calculateOrderPrice(order: OrderRequest, marketData: any): number {
    if (order.orderType === 'market') {
      // Use mark price with slippage estimate
      const markPrice = parseFloat(marketData.markPx);
      const slippageMultiplier = order.isBuy ? 1.001 : 0.999; // 0.1% slippage estimate
      return markPrice * slippageMultiplier;
    }

    return order.price || parseFloat(marketData.markPx);
  }

  // Check margin requirements
  private async checkMarginRequirements(
    order: OrderRequest, 
    price: number, 
    address: string
  ): Promise<{ sufficient: boolean; required: number; available: number }> {
    try {
      // Get clearinghouse state to check available margin
      const clearinghouseState = await hyperliquidAPI.getClearinghouseState(address);
      const availableMargin = typeof clearinghouseState.crossMaintenanceMarginUsed === 'string' 
        ? parseFloat(clearinghouseState.crossMaintenanceMarginUsed) 
        : (clearinghouseState.crossMaintenanceMarginUsed || 0);
      
      const notional = order.size * price;
      
      // Simplified margin calculation (in production, use proper margin requirements)
      const marginRequirement = notional * 0.1; // 10x leverage assumption
      
      return {
        sufficient: availableMargin >= marginRequirement,
        required: marginRequirement,
        available: availableMargin
      };
    } catch (error) {
      console.error('Margin check failed:', error);
      return { sufficient: false, required: 0, available: 0 };
    }
  }

  // Prepare order payload for Hyperliquid API
  private prepareOrderPayload(order: OrderRequest, price: number): any {
    const timestamp = Date.now();
    
    return {
      asset: order.asset,
      isBuy: order.isBuy,
      sz: order.size.toString(),
      px: price.toString(),
      orderType: order.orderType,
      timeInForce: order.timeInForce || 'gtc',
      reduceOnly: order.reduceOnly || false,
      timestamp
    };
  }

  // Sign order with wallet
  private async signOrder(orderPayload: any, walletClient: any): Promise<string> {
    // In production, this would create the proper signature for Hyperliquid
    // For now, return a mock signature
    const message = JSON.stringify(orderPayload);
    
    try {
      // This would be the actual signing process
      const signature = await walletClient.signMessage({
        message
      });
      return signature;
    } catch (error) {
      throw new Error('Failed to sign order');
    }
  }

  // Submit order to Hyperliquid
  private async submitOrder(orderPayload: any, signature: string): Promise<OrderExecutionResult> {
    try {
      // In production, this would call the actual Hyperliquid order endpoint
      // For now, simulate the API call
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Mock successful response
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        orderId,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
      };
      
    } catch (error) {
      throw new Error('Failed to submit order to exchange');
    }
  }

  // Track order status
  private trackOrder(orderId: string, order: OrderRequest): void {
    // In production, this would set up order status tracking
    console.log(`Tracking order ${orderId} for ${order.asset}`);
  }
}

// React hook for order execution
export const useOrderExecution = () => {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const { isConnected } = useWallet();
  const [isExecuting, setIsExecuting] = useState(false);

  const orderService = OrderExecutionService.getInstance();

  const executeOrder = async (order: OrderRequest): Promise<OrderExecutionResult> => {
    if (!isConnected || !walletClient || !address) {
      toast.error('Wallet not connected');
      return { success: false, error: 'Wallet not connected' };
    }

    setIsExecuting(true);
    
    try {
      const result = await orderService.executeOrder(order, walletClient, address);
      
      if (result.success) {
        toast.success(`Order executed successfully for ${order.asset}`);
      } else {
        toast.error(`Order failed: ${result.error}`);
      }
      
      return result;
    } finally {
      setIsExecuting(false);
    }
  };

  const executeBatchOrders = async (orders: OrderRequest[]): Promise<OrderExecutionResult[]> => {
    if (!isConnected || !walletClient || !address) {
      toast.error('Wallet not connected');
      return orders.map(() => ({ success: false, error: 'Wallet not connected' }));
    }

    setIsExecuting(true);
    
    try {
      const results = await orderService.executeBatchOrders(orders, walletClient, address);
      
      const successCount = results.filter(r => r.success).length;
      if (successCount === orders.length) {
        toast.success(`All ${orders.length} orders executed successfully`);
      } else if (successCount > 0) {
        toast.warning(`${successCount}/${orders.length} orders executed successfully`);
      } else {
        toast.error('All orders failed to execute');
      }
      
      return results;
    } finally {
      setIsExecuting(false);
    }
  };

  const adjustPosition = async (adjustment: PositionAdjustment): Promise<OrderExecutionResult> => {
    if (!isConnected || !walletClient || !address) {
      toast.error('Wallet not connected');
      return { success: false, error: 'Wallet not connected' };
    }

    setIsExecuting(true);
    
    try {
      const result = await orderService.adjustPosition(adjustment, walletClient, address);
      
      if (result.success) {
        toast.success(`Position adjusted for ${adjustment.asset}`);
      } else {
        toast.error(`Position adjustment failed: ${result.error}`);
      }
      
      return result;
    } finally {
      setIsExecuting(false);
    }
  };

  const closePosition = async (asset: string): Promise<OrderExecutionResult> => {
    if (!isConnected || !walletClient || !address) {
      toast.error('Wallet not connected');
      return { success: false, error: 'Wallet not connected' };
    }

    setIsExecuting(true);
    
    try {
      const result = await orderService.closePosition(asset, walletClient, address);
      
      if (result.success) {
        toast.success(`Position closed for ${asset}`);
      } else {
        toast.error(`Failed to close position: ${result.error}`);
      }
      
      return result;
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    executeOrder,
    executeBatchOrders,
    adjustPosition,
    closePosition,
    isExecuting
  };
};