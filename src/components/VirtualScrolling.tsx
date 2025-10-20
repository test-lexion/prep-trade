import React, { useMemo, useCallback } from 'react';
import { useVirtualScroll } from '@/hooks/usePerformance';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  width?: string | number;
  className?: string;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

export const VirtualList = <T,>({
  items,
  itemHeight,
  height,
  width = '100%',
  className,
  overscan = 5,
  renderItem,
  onScroll,
  getItemKey = (_, index) => index
}: VirtualListProps<T>) => {
  const {
    visibleItems,
    totalHeight,
    offsetY,
    scrollElementRef,
    handleScroll
  } = useVirtualScroll(items, {
    itemHeight,
    containerHeight: height,
    overscan
  });

  const onScrollWithCallback = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    handleScroll(event);
    onScroll?.(event.currentTarget.scrollTop);
  }, [handleScroll, onScroll]);

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', className)}
      style={{ height, width }}
      onScroll={onScrollWithCallback}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div
              key={getItemKey(item, index)}
              style={{ height: itemHeight }}
              className="virtual-list-item"
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Virtual table for trading data
interface VirtualTableProps<T> {
  data: T[];
  columns: Array<{
    key: string;
    header: string;
    width?: number;
    render: (item: T, index: number) => React.ReactNode;
  }>;
  rowHeight?: number;
  height: number;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
  getRowKey?: (item: T, index: number) => string | number;
}

export const VirtualTable = <T,>({
  data,
  columns,
  rowHeight = 40,
  height,
  className,
  onRowClick,
  getRowKey = (_, index) => index
}: VirtualTableProps<T>) => {
  const {
    visibleItems,
    totalHeight,
    offsetY,
    scrollElementRef,
    handleScroll
  } = useVirtualScroll(data, {
    itemHeight: rowHeight,
    containerHeight: height - 40, // Account for header
    overscan: 10
  });

  const renderRow = useCallback((item: T, index: number) => (
    <div
      key={getRowKey(item, index)}
      className={cn(
        'flex items-center border-b border-border hover:bg-muted/50 cursor-pointer',
        'transition-colors duration-150'
      )}
      style={{ height: rowHeight }}
      onClick={() => onRowClick?.(item, index)}
    >
      {columns.map((column, colIndex) => (
        <div
          key={column.key}
          className="px-3 py-2 text-sm"
          style={{ 
            width: column.width || `${100 / columns.length}%`,
            minWidth: column.width || 'auto'
          }}
        >
          {column.render(item, index)}
        </div>
      ))}
    </div>
  ), [columns, rowHeight, onRowClick, getRowKey]);

  return (
    <div className={cn('flex flex-col border border-border rounded-lg', className)}>
      {/* Header */}
      <div className="flex items-center bg-muted/30 border-b border-border sticky top-0 z-10">
        {columns.map((column) => (
          <div
            key={column.key}
            className="px-3 py-3 font-medium text-sm text-muted-foreground"
            style={{ 
              width: column.width || `${100 / columns.length}%`,
              minWidth: column.width || 'auto'
            }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Virtual Scrolling Body */}
      <div
        ref={scrollElementRef}
        className="overflow-auto flex-1"
        style={{ height: height - 40 }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleItems.map(({ item, index }) => renderRow(item, index))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Optimized order book component
interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

interface VirtualOrderBookProps {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  height: number;
  onPriceClick?: (price: number) => void;
  precision?: number;
}

export const VirtualOrderBook: React.FC<VirtualOrderBookProps> = ({
  bids,
  asks,
  height,
  onPriceClick,
  precision = 2
}) => {
  const formatPrice = useCallback((price: number) => 
    price.toFixed(precision), [precision]);
  
  const formatSize = useCallback((size: number) => 
    size.toLocaleString(undefined, { maximumFractionDigits: 4 }), []);

  const bidColumns = useMemo(() => [
    {
      key: 'total',
      header: 'Total',
      width: 80,
      render: (item: OrderBookEntry) => (
        <span className="font-mono text-xs">{formatSize(item.total)}</span>
      )
    },
    {
      key: 'size',
      header: 'Size',
      width: 80,
      render: (item: OrderBookEntry) => (
        <span className="font-mono text-xs">{formatSize(item.size)}</span>
      )
    },
    {
      key: 'price',
      header: 'Bid',
      width: 80,
      render: (item: OrderBookEntry) => (
        <span 
          className="font-mono text-xs text-success cursor-pointer hover:bg-success/10 px-1 py-0.5 rounded"
          onClick={() => onPriceClick?.(item.price)}
        >
          {formatPrice(item.price)}
        </span>
      )
    }
  ], [formatPrice, formatSize, onPriceClick]);

  const askColumns = useMemo(() => [
    {
      key: 'price',
      header: 'Ask',
      width: 80,
      render: (item: OrderBookEntry) => (
        <span 
          className="font-mono text-xs text-destructive cursor-pointer hover:bg-destructive/10 px-1 py-0.5 rounded"
          onClick={() => onPriceClick?.(item.price)}
        >
          {formatPrice(item.price)}
        </span>
      )
    },
    {
      key: 'size',
      header: 'Size',
      width: 80,
      render: (item: OrderBookEntry) => (
        <span className="font-mono text-xs">{formatSize(item.size)}</span>
      )
    },
    {
      key: 'total',
      header: 'Total',
      width: 80,
      render: (item: OrderBookEntry) => (
        <span className="font-mono text-xs">{formatSize(item.total)}</span>
      )
    }
  ], [formatPrice, formatSize, onPriceClick]);

  const halfHeight = Math.floor(height / 2);

  return (
    <div className="flex flex-col h-full">
      {/* Asks (top half, reversed order) */}
      <VirtualTable
        data={[...asks].reverse()}
        columns={askColumns}
        height={halfHeight}
        rowHeight={24}
        className="border-b-0 rounded-b-none"
        getRowKey={(item) => `ask-${item.price}`}
      />
      
      {/* Spread indicator */}
      <div className="flex items-center justify-center py-1 bg-muted/50 border-y border-border text-xs text-muted-foreground">
        <span>Spread: {asks[0] && bids[0] ? formatPrice(asks[0].price - bids[0].price) : '—'}</span>
      </div>
      
      {/* Bids (bottom half) */}
      <VirtualTable
        data={bids}
        columns={bidColumns}
        height={halfHeight}
        rowHeight={24}
        className="border-t-0 rounded-t-none"
        getRowKey={(item) => `bid-${item.price}`}
      />
    </div>
  );
};