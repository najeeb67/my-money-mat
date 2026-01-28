import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: PullToRefreshProps) {
  const isMobile = useIsMobile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pullDistance = useMotionValue(0);
  const { playRefresh, playPop } = useSoundEffects();

  const indicatorY = useTransform(pullDistance, [0, maxPull], ['-100%', '0%']);
  const rotation = useTransform(pullDistance, [0, threshold], [0, 180]);
  const scale = useTransform(pullDistance, [0, threshold / 2, threshold], [0.5, 0.8, 1]);
  const opacity = useTransform(pullDistance, [0, threshold / 2], [0, 1]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!containerRef.current || isRefreshing) return;
    
    const scrollTop = containerRef.current.scrollTop;
    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Apply resistance
      const resistance = 0.5;
      const adjustedDiff = Math.min(diff * resistance, maxPull);
      pullDistance.set(adjustedDiff);

      // Haptic feedback when crossing threshold
      if (adjustedDiff >= threshold && pullDistance.getPrevious() < threshold) {
        playPop();
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }
    }
  }, [isPulling, isRefreshing, threshold, maxPull, pullDistance, playPop]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);

    const currentPull = pullDistance.get();
    
    if (currentPull >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      playRefresh();
      
      // Keep at threshold during refresh
      animate(pullDistance, threshold / 2, { duration: 0.2 });
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        animate(pullDistance, 0, { 
          type: 'spring',
          stiffness: 300,
          damping: 30,
        });
      }
    } else {
      // Snap back
      animate(pullDistance, 0, { 
        type: 'spring',
        stiffness: 300,
        damping: 30,
      });
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh, playRefresh]);

  // Non-mobile: just render children
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
        style={{ y: indicatorY }}
      >
        <motion.div
          className="flex flex-col items-center justify-center py-4"
          style={{ opacity }}
        >
          <motion.div
            className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center backdrop-blur-sm border border-primary/20"
            style={{ scale }}
          >
            {isRefreshing ? (
              <RefreshCw className="h-6 w-6 text-primary animate-spin" />
            ) : (
              <motion.div style={{ rotate: rotation }}>
                <ArrowDown className="h-6 w-6 text-primary" />
              </motion.div>
            )}
          </motion.div>
          <motion.span
            className="text-xs text-muted-foreground mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: isRefreshing ? 1 : 0 }}
          >
            Refreshing...
          </motion.span>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        ref={containerRef}
        className="min-h-full"
        style={{ y: pullDistance }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Hook for manual refresh triggering
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh]);

  return { isRefreshing, refresh };
}
