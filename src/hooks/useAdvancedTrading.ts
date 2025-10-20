import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useOrderExecution, OrderRequest } from './useOrderExecution';

// Advanced order types
export interface StopLossOrder {
  id: string;
  asset: string;
  triggerPrice: number;
  size: number;
  orderType: 'market' | 'limit';
  limitPrice?: number;
  isActive: boolean;
  createdAt: number;
}

export interface TakeProfitOrder {
  id: string;
  asset: string;
  triggerPrice: number;
  size: number;
  orderType: 'market' | 'limit';
  limitPrice?: number;
  isActive: boolean;
  createdAt: number;
}

export interface OCOOrder {
  id: string;
  asset: string;
  orders: [OrderRequest, OrderRequest]; // Two orders that cancel each other
  isActive: boolean;
  createdAt: number;
}

export interface TrailingStopOrder {
  id: string;
  asset: string;
  trailAmount: number; // Trail distance in price or percentage
  trailType: 'price' | 'percentage';
  currentStopPrice: number;
  highWaterMark: number; // For long positions
  lowWaterMark: number;  // For short positions
  size: number;
  side: 'long' | 'short';
  isActive: boolean;
  createdAt: number;
}

export interface OrderTemplate {
  id: string;
  name: string;
  asset: string;
  orderType: 'market' | 'limit' | 'stop' | 'stopLimit';
  side: 'long' | 'short';
  size?: number;
  price?: number;
  stopPrice?: number;
  leverage?: number;
  stopLoss?: {
    triggerPrice: number;
    orderType: 'market' | 'limit';
    limitPrice?: number;
  };
  takeProfit?: {
    triggerPrice: number;
    orderType: 'market' | 'limit';
    limitPrice?: number;
  };
  riskManagement: {
    maxLoss: number;
    maxLossType: 'percentage' | 'absolute';
    positionSizeType: 'fixed' | 'risk-based';
  };
  createdAt: number;
}

// Risk management calculations
export interface RiskMetrics {
  positionSize: number;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  riskAmount: number;
  rewardAmount: number;
  riskRewardRatio: number;
  maxLossPercentage: number;
  leverageUsed: number;
  marginRequired: number;
}

export const useAdvancedTrading = () => {
  const { executeOrder, isExecuting } = useOrderExecution();
  
  // Order management state
  const [stopLossOrders, setStopLossOrders] = useState<StopLossOrder[]>([]);
  const [takeProfitOrders, setTakeProfitOrders] = useState<TakeProfitOrder[]>([]);
  const [ocoOrders, setOcoOrders] = useState<OCOOrder[]>([]);
  const [trailingStopOrders, setTrailingStopOrders] = useState<TrailingStopOrder[]>([]);
  const [orderTemplates, setOrderTemplates] = useState<OrderTemplate[]>([]);

  // Create stop loss order
  const createStopLoss = useCallback((params: Omit<StopLossOrder, 'id' | 'isActive' | 'createdAt'>) => {
    const order: StopLossOrder = {
      ...params,
      id: `sl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isActive: true,
      createdAt: Date.now()
    };

    setStopLossOrders(prev => [...prev, order]);
    toast.success(`Stop loss order created for ${params.asset} at $${params.triggerPrice}`);
    
    return order.id;
  }, []);

  // Create take profit order
  const createTakeProfit = useCallback((params: Omit<TakeProfitOrder, 'id' | 'isActive' | 'createdAt'>) => {
    const order: TakeProfitOrder = {
      ...params,
      id: `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isActive: true,
      createdAt: Date.now()
    };

    setTakeProfitOrders(prev => [...prev, order]);
    toast.success(`Take profit order created for ${params.asset} at $${params.triggerPrice}`);
    
    return order.id;
  }, []);

  // Create OCO order
  const createOCO = useCallback((params: Omit<OCOOrder, 'id' | 'isActive' | 'createdAt'>) => {
    const order: OCOOrder = {
      ...params,
      id: `oco_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isActive: true,
      createdAt: Date.now()
    };

    setOcoOrders(prev => [...prev, order]);
    toast.success(`OCO order created for ${params.asset}`);
    
    return order.id;
  }, []);

  // Create trailing stop order
  const createTrailingStop = useCallback((params: Omit<TrailingStopOrder, 'id' | 'isActive' | 'createdAt'>) => {
    const order: TrailingStopOrder = {
      ...params,
      id: `ts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isActive: true,
      createdAt: Date.now()
    };

    setTrailingStopOrders(prev => [...prev, order]);
    toast.success(`Trailing stop order created for ${params.asset}`);
    
    return order.id;
  }, []);

  // Update trailing stop based on price movement
  const updateTrailingStop = useCallback((orderId: string, currentPrice: number) => {
    setTrailingStopOrders(prev => prev.map(order => {
      if (order.id !== orderId || !order.isActive) return order;

      let newStopPrice = order.currentStopPrice;
      let newHighWaterMark = order.highWaterMark;
      let newLowWaterMark = order.lowWaterMark;

      if (order.side === 'long') {
        // For long positions, trail the stop loss up as price increases
        if (currentPrice > order.highWaterMark) {
          newHighWaterMark = currentPrice;
          const trailDistance = order.trailType === 'percentage' 
            ? currentPrice * (order.trailAmount / 100)
            : order.trailAmount;
          newStopPrice = currentPrice - trailDistance;
        }
      } else {
        // For short positions, trail the stop loss down as price decreases
        if (currentPrice < order.lowWaterMark) {
          newLowWaterMark = currentPrice;
          const trailDistance = order.trailType === 'percentage' 
            ? currentPrice * (order.trailAmount / 100)
            : order.trailAmount;
          newStopPrice = currentPrice + trailDistance;
        }
      }

      return {
        ...order,
        currentStopPrice: newStopPrice,
        highWaterMark: newHighWaterMark,
        lowWaterMark: newLowWaterMark
      };
    }));
  }, []);

  // Cancel advanced order
  const cancelAdvancedOrder = useCallback((type: 'stopLoss' | 'takeProfit' | 'oco' | 'trailingStop', orderId: string) => {
    switch (type) {
      case 'stopLoss':
        setStopLossOrders(prev => prev.filter(order => order.id !== orderId));
        break;
      case 'takeProfit':
        setTakeProfitOrders(prev => prev.filter(order => order.id !== orderId));
        break;
      case 'oco':
        setOcoOrders(prev => prev.filter(order => order.id !== orderId));
        break;
      case 'trailingStop':
        setTrailingStopOrders(prev => prev.filter(order => order.id !== orderId));
        break;
    }
    toast.success('Advanced order cancelled');
  }, []);

  // Save order template
  const saveOrderTemplate = useCallback((template: Omit<OrderTemplate, 'id' | 'createdAt'>) => {
    const newTemplate: OrderTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    };

    setOrderTemplates(prev => [...prev, newTemplate]);
    toast.success(`Order template "${template.name}" saved`);
    
    return newTemplate.id;
  }, []);

  // Delete order template
  const deleteOrderTemplate = useCallback((templateId: string) => {
    setOrderTemplates(prev => prev.filter(template => template.id !== templateId));
    toast.success('Order template deleted');
  }, []);

  // Execute order from template
  const executeFromTemplate = useCallback(async (templateId: string, overrides: Partial<OrderRequest> = {}) => {
    const template = orderTemplates.find(t => t.id === templateId);
    if (!template) {
      toast.error('Order template not found');
      return;
    }

    const baseOrder: OrderRequest = {
      asset: template.asset,
      isBuy: template.side === 'long',
      size: template.size || 0,
      price: template.price,
      orderType: template.orderType as any,
      ...overrides
    };

    try {
      const result = await executeOrder(baseOrder);
      
      if (result.success && template.stopLoss) {
        createStopLoss({
          asset: template.asset,
          triggerPrice: template.stopLoss.triggerPrice,
          size: baseOrder.size,
          orderType: template.stopLoss.orderType,
          limitPrice: template.stopLoss.limitPrice
        });
      }

      if (result.success && template.takeProfit) {
        createTakeProfit({
          asset: template.asset,
          triggerPrice: template.takeProfit.triggerPrice,
          size: baseOrder.size,
          orderType: template.takeProfit.orderType,
          limitPrice: template.takeProfit.limitPrice
        });
      }

      return result;
    } catch (error) {
      toast.error('Failed to execute template order');
      throw error;
    }
  }, [orderTemplates, executeOrder, createStopLoss, createTakeProfit]);

  return {
    // State
    stopLossOrders,
    takeProfitOrders,
    ocoOrders,
    trailingStopOrders,
    orderTemplates,
    isExecuting,

    // Actions
    createStopLoss,
    createTakeProfit,
    createOCO,
    createTrailingStop,
    updateTrailingStop,
    cancelAdvancedOrder,
    saveOrderTemplate,
    deleteOrderTemplate,
    executeFromTemplate
  };
};

// Position sizing calculator
export const calculatePositionSize = (
  accountBalance: number,
  riskPercentage: number,
  entryPrice: number,
  stopLossPrice: number,
  leverage: number = 1
): number => {
  const riskAmount = accountBalance * (riskPercentage / 100);
  const priceRisk = Math.abs(entryPrice - stopLossPrice);
  const positionSize = (riskAmount / priceRisk) * leverage;
  
  return positionSize;
};

// Risk/reward calculator
export const calculateRiskReward = (
  entryPrice: number,
  stopLossPrice: number,
  takeProfitPrice: number,
  positionSize: number,
  leverage: number = 1
): RiskMetrics => {
  const riskAmount = Math.abs(entryPrice - stopLossPrice) * positionSize;
  const rewardAmount = Math.abs(takeProfitPrice - entryPrice) * positionSize;
  const riskRewardRatio = rewardAmount / riskAmount;
  const marginRequired = (entryPrice * positionSize) / leverage;
  
  return {
    positionSize,
    entryPrice,
    stopLoss: stopLossPrice,
    takeProfit: takeProfitPrice,
    riskAmount,
    rewardAmount,
    riskRewardRatio,
    maxLossPercentage: (riskAmount / marginRequired) * 100,
    leverageUsed: leverage,
    marginRequired
  };
};

// Portfolio risk management
export const useRiskManagement = () => {
  const [riskSettings, setRiskSettings] = useState({
    maxRiskPerTrade: 2, // 2% per trade
    maxPortfolioRisk: 10, // 10% total portfolio risk
    maxLeverage: 10,
    minRiskRewardRatio: 1.5,
    maxPositionsPerAsset: 3,
    maxCorrelatedPositions: 5
  });

  const validateTrade = useCallback((trade: {
    asset: string;
    size: number;
    entryPrice: number;
    stopLoss?: number;
    leverage: number;
  }, currentPortfolio: { balance: number; positions: any[] }) => {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check risk per trade
    if (trade.stopLoss) {
      const riskAmount = Math.abs(trade.entryPrice - trade.stopLoss) * trade.size;
      const riskPercentage = (riskAmount / currentPortfolio.balance) * 100;
      
      if (riskPercentage > riskSettings.maxRiskPerTrade) {
        errors.push(`Risk per trade (${riskPercentage.toFixed(2)}%) exceeds maximum (${riskSettings.maxRiskPerTrade}%)`);
      }
    }

    // Check leverage
    if (trade.leverage > riskSettings.maxLeverage) {
      errors.push(`Leverage (${trade.leverage}x) exceeds maximum (${riskSettings.maxLeverage}x)`);
    }

    // Check position count per asset
    const assetPositions = currentPortfolio.positions.filter(p => p.asset === trade.asset);
    if (assetPositions.length >= riskSettings.maxPositionsPerAsset) {
      warnings.push(`Maximum positions for ${trade.asset} reached (${riskSettings.maxPositionsPerAsset})`);
    }

    return { warnings, errors, isValid: errors.length === 0 };
  }, [riskSettings]);

  const updateRiskSettings = useCallback((newSettings: Partial<typeof riskSettings>) => {
    setRiskSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    riskSettings,
    updateRiskSettings,
    validateTrade
  };
};