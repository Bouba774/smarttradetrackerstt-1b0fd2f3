import { useEffect, useCallback } from 'react';

// Map of routes to their lazy import functions
const routeImports: Record<string, () => Promise<any>> = {
  '/dashboard': () => import('@/pages/Dashboard'),
  '/add-trade': () => import('@/pages/AddTrade'),
  '/history': () => import('@/pages/History'),
  '/reports': () => import('@/pages/Reports'),
  '/journal': () => import('@/pages/Journal'),
  '/psychology': () => import('@/pages/PsychologicalAnalysis'),
  '/challenges': () => import('@/pages/Challenges'),
  '/profile': () => import('@/pages/Profile'),
  '/settings': () => import('@/pages/Settings'),
  '/calculator': () => import('@/pages/Calculator'),
};

// Priority routes to prefetch immediately after auth
const priorityRoutes = ['/dashboard', '/add-trade', '/history'];

/**
 * Hook to prefetch route components for faster navigation
 * Uses requestIdleCallback for non-blocking prefetch
 */
export const useRoutePrefetch = () => {
  const prefetchRoute = useCallback((route: string) => {
    const importFn = routeImports[route];
    if (importFn) {
      // Use requestIdleCallback for non-blocking prefetch
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          importFn().catch(() => {
            // Silently fail - route will load normally when needed
          });
        });
      } else {
        // Fallback for Safari
        setTimeout(() => {
          importFn().catch(() => {});
        }, 100);
      }
    }
  }, []);

  const prefetchPriorityRoutes = useCallback(() => {
    priorityRoutes.forEach((route, index) => {
      // Stagger prefetch to avoid blocking
      setTimeout(() => prefetchRoute(route), index * 200);
    });
  }, [prefetchRoute]);

  const prefetchOnHover = useCallback((route: string) => {
    prefetchRoute(route);
  }, [prefetchRoute]);

  return {
    prefetchRoute,
    prefetchPriorityRoutes,
    prefetchOnHover,
  };
};

/**
 * Component-level prefetch on mount
 * Prefetches priority routes after initial render
 */
export const usePrefetchOnAuth = (isAuthenticated: boolean) => {
  const { prefetchPriorityRoutes } = useRoutePrefetch();

  useEffect(() => {
    if (isAuthenticated) {
      // Wait for initial render to complete
      const timer = setTimeout(() => {
        prefetchPriorityRoutes();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, prefetchPriorityRoutes]);
};

export default useRoutePrefetch;
