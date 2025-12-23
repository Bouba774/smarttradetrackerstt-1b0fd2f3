import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Chart skeleton placeholder
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 256 }) => (
  <div className="w-full animate-pulse" style={{ height }}>
    <Skeleton className="w-full h-full rounded-lg" />
  </div>
);

// Wrapper for lazy loading chart containers
interface LazyChartContainerProps {
  children: React.ReactNode;
  height?: number;
  fallback?: React.ReactNode;
}

export const LazyChartContainer: React.FC<LazyChartContainerProps> = ({ 
  children, 
  height = 256,
  fallback 
}) => (
  <Suspense fallback={fallback || <ChartSkeleton height={height} />}>
    {children}
  </Suspense>
);
