/**
 * Virtualization Utilities for Large Lists
 * 
 * This module provides virtualized list components for handling large datasets
 * efficiently without performance degradation.
 */

import React, { useMemo, forwardRef, useCallback } from 'react'
import { FixedSizeList, VariableSizeList, ListChildComponentProps } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import { performanceMonitor } from './web-vitals'

// Types for virtualized components
export interface VirtualizedListProps<T = any> {
  items: T[]
  height: number
  itemHeight: number | ((index: number) => number)
  width?: number | string
  className?: string
  hasNextPage?: boolean
  isNextPageLoading?: boolean
  loadNextPage?: () => Promise<void>
  renderItem: (props: VirtualizedItemProps<T>) => React.ReactNode
  overscan?: number
  threshold?: number
}

export interface VirtualizedItemProps<T = any> {
  index: number
  style: React.CSSProperties
  data: T
  isScrolling?: boolean
}

export interface VirtualizedTableProps<T = any> {
  items: T[]
  columns: VirtualizedColumn<T>[]
  height: number
  rowHeight: number
  width?: number | string
  className?: string
  hasNextPage?: boolean
  isNextPageLoading?: boolean
  loadNextPage?: () => Promise<void>
  overscan?: number
  onRowClick?: (item: T, index: number) => void
}

export interface VirtualizedColumn<T = any> {
  key: string
  header: string
  width: number
  render: (item: T, index: number) => React.ReactNode
  align?: 'left' | 'center' | 'right'
}

/**
 * High-performance virtualized list for large datasets
 */
export const VirtualizedList = <T,>({
  items,
  height,
  itemHeight,
  width = '100%',
  className = '',
  hasNextPage = false,
  isNextPageLoading = false,
  loadNextPage,
  renderItem,
  overscan = 5,
  threshold = 15
}: VirtualizedListProps<T>) => {
  // Performance monitoring
  const measurementId = useMemo(() => 
    performanceMonitor.startMeasurement('virtualized_list_render', {
      itemCount: items.length,
      hasInfiniteScroll: !!loadNextPage
    }), [items.length, loadNextPage]
  )

  React.useEffect(() => {
    return () => {
      performanceMonitor.endMeasurement(measurementId)
    }
  }, [measurementId])

  // Item count for infinite loading
  const itemCount = hasNextPage ? items.length + 1 : items.length
  const isItemLoaded = useCallback((index: number) => !!items[index], [items])

  // Row renderer
  const Row = useCallback(({ index, style }: ListChildComponentProps) => {
    const item = items[index]
    
    if (!item) {
      return (
        <div style={style} className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )
    }

    return renderItem({ index, style, data: item })
  }, [items, renderItem])

  if (loadNextPage) {
    return (
      <div className={className}>
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadNextPage}
          threshold={threshold}
        >
          {({ onItemsRendered, ref }) => (
            typeof itemHeight === 'function' ? (
              <VariableSizeList
                ref={ref}
                height={height}
                width={width}
                itemCount={itemCount}
                itemSize={itemHeight}
                onItemsRendered={onItemsRendered}
                overscanCount={overscan}
              >
                {Row}
              </VariableSizeList>
            ) : (
              <FixedSizeList
                ref={ref}
                height={height}
                width={width}
                itemCount={itemCount}
                itemSize={itemHeight as number}
                onItemsRendered={onItemsRendered}
                overscanCount={overscan}
              >
                {Row}
              </FixedSizeList>
            )
          )}
        </InfiniteLoader>
      </div>
    )
  }

  // Simple virtualized list without infinite loading
  return (
    <div className={className}>
      {typeof itemHeight === 'function' ? (
        <VariableSizeList
          height={height}
          width={width}
          itemCount={items.length}
          itemSize={itemHeight}
          overscanCount={overscan}
        >
          {Row}
        </VariableSizeList>
      ) : (
        <FixedSizeList
          height={height}
          width={width}
          itemCount={items.length}
          itemSize={itemHeight as number}
          overscanCount={overscan}
        >
          {Row}
        </FixedSizeList>
      )}
    </div>
  )
}

/**
 * Virtualized table for large datasets with columns
 */
export const VirtualizedTable = <T,>({
  items,
  columns,
  height,
  rowHeight,
  width = '100%',
  className = '',
  hasNextPage = false,
  isNextPageLoading = false,
  loadNextPage,
  overscan = 5,
  onRowClick
}: VirtualizedTableProps<T>) => {
  // Calculate total width
  const totalWidth = useMemo(() => 
    columns.reduce((sum, col) => sum + col.width, 0), [columns]
  )

  // Table header
  const TableHeader = useMemo(() => (
    <div 
      className="flex bg-muted/50 border-b font-medium text-sm"
      style={{ width: totalWidth, minWidth: width }}
    >
      {columns.map((column) => (
        <div
          key={column.key}
          className={`px-4 py-3 border-r last:border-r-0 text-${column.align || 'left'}`}
          style={{ width: column.width, flexShrink: 0 }}
        >
          {column.header}
        </div>
      ))}
    </div>
  ), [columns, totalWidth, width])

  // Row renderer
  const renderTableRow = useCallback(({ index, style, data }: VirtualizedItemProps<T>) => (
    <div 
      style={style} 
      className={`flex border-b hover:bg-muted/50 ${onRowClick ? 'cursor-pointer' : ''}`}
      onClick={onRowClick ? () => onRowClick(data, index) : undefined}
    >
      {columns.map((column) => (
        <div
          key={column.key}
          className={`px-4 py-3 border-r last:border-r-0 text-${column.align || 'left'} flex items-center`}
          style={{ width: column.width, flexShrink: 0 }}
        >
          {column.render(data, index)}
        </div>
      ))}
    </div>
  ), [columns, onRowClick])

  return (
    <div className={`border rounded-md ${className}`}>
      {TableHeader}
      <VirtualizedList
        items={items}
        height={height}
        itemHeight={rowHeight}
        width={totalWidth}
        hasNextPage={hasNextPage}
        isNextPageLoading={isNextPageLoading}
        loadNextPage={loadNextPage}
        renderItem={renderTableRow}
        overscan={overscan}
      />
    </div>
  )
}

/**
 * Virtualized profiles table specifically for the profiles page
 */
export const VirtualizedProfilesTable = ({
  profiles,
  height = 400,
  onProfileClick,
  hasNextPage,
  loadNextPage
}: {
  profiles: any[]
  height?: number
  onProfileClick?: (profile: any) => void
  hasNextPage?: boolean
  loadNextPage?: () => Promise<void>
}) => {
  const columns: VirtualizedColumn<any>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Name',
      width: 200,
      render: (profile) => (
        <div>
          <div className="font-medium">
            {profile.first_name} {profile.last_name}
          </div>
          <div className="text-sm text-muted-foreground">{profile.email}</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: 100,
      render: (profile) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          profile.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {profile.status}
        </span>
      )
    },
    {
      key: 'mobile',
      header: 'Mobile',
      width: 150,
      render: (profile) => profile.mobile || '-'
    },
    {
      key: 'created',
      header: 'Created',
      width: 120,
      render: (profile) => new Date(profile.created_at).toLocaleDateString()
    },
  ], [])

  return (
    <VirtualizedTable
      items={profiles}
      columns={columns}
      height={height}
      rowHeight={72}
      hasNextPage={hasNextPage}
      loadNextPage={loadNextPage}
      onRowClick={onProfileClick}
      className="w-full"
    />
  )
}

/**
 * Virtualized logs table for the logs page
 */
export const VirtualizedLogsTable = ({
  logs,
  height = 400,
  onLogClick,
  hasNextPage,
  loadNextPage
}: {
  logs: any[]
  height?: number
  onLogClick?: (log: any) => void
  hasNextPage?: boolean
  loadNextPage?: () => Promise<void>
}) => {
  const columns: VirtualizedColumn<any>[] = useMemo(() => [
    {
      key: 'time',
      header: 'Time',
      width: 180,
      render: (log) => (
        <div className="text-sm">
          {new Date(log.log_time).toLocaleString()}
        </div>
      )
    },
    {
      key: 'event_type',
      header: 'Event Type',
      width: 150,
      render: (log) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {log.event_type}
        </span>
      )
    },
    {
      key: 'profile_id',
      header: 'Profile',
      width: 120,
      render: (log) => (
        <span className="font-mono text-sm">
          {log.profile_id ? log.profile_id.substring(0, 8) + '...' : '-'}
        </span>
      )
    },
    {
      key: 'description',
      header: 'Description',
      width: 300,
      render: (log) => {
        const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details
        const description = details?.action_description || details?.description || 'No description'
        return (
          <div className="text-sm truncate" title={description}>
            {description}
          </div>
        )
      }
    },
  ], [])

  return (
    <VirtualizedTable
      items={logs}
      columns={columns}
      height={height}
      rowHeight={56}
      hasNextPage={hasNextPage}
      loadNextPage={loadNextPage}
      onRowClick={onLogClick}
      className="w-full"
    />
  )
}

/**
 * Hook for calculating optimal virtualization settings
 */
export const useVirtualizationSettings = (
  itemCount: number,
  containerHeight: number,
  itemHeight: number
) => {
  return useMemo(() => {
    const visibleItemCount = Math.ceil(containerHeight / itemHeight)
    const overscanCount = Math.min(10, Math.ceil(visibleItemCount * 0.5))
    const bufferSize = visibleItemCount + (overscanCount * 2)
    
    // Performance recommendations
    const shouldVirtualize = itemCount > 100
    const shouldUseInfiniteScroll = itemCount > 1000
    
    return {
      visibleItemCount,
      overscanCount,
      bufferSize,
      shouldVirtualize,
      shouldUseInfiniteScroll,
      estimatedTotalHeight: itemCount * itemHeight,
    }
  }, [itemCount, containerHeight, itemHeight])
}

/**
 * Performance-optimized memoized item renderer
 */
export const createMemoizedRenderer = <T,>(
  renderFunction: (props: VirtualizedItemProps<T>) => React.ReactNode
) => {
  return React.memo(({ index, style, data }: VirtualizedItemProps<T>) => {
    return renderFunction({ index, style, data })
  }, (prevProps, nextProps) => {
    // Custom comparison for better performance
    return (
      prevProps.index === nextProps.index &&
      prevProps.data === nextProps.data &&
      JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style)
    )
  })
}