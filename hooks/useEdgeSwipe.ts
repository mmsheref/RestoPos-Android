
import React, { useRef, useCallback } from 'react';

interface SwipeConfig {
  onSwipe: () => void;
  threshold?: number;
  maxVerticalShift?: number;
  edgeWidth?: number;
}

export const useEdgeSwipe = ({ 
  onSwipe, 
  threshold = 50, 
  maxVerticalShift = 40,
  edgeWidth = 32 // Increased touch area for better UX
}: SwipeConfig) => {
  const touchStart = useRef<{ x: number, y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Only register if touch starts within the edge zone
    if (e.touches[0].clientX <= edgeWidth) {
      touchStart.current = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      };
    }
  }, [edgeWidth]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;

    const y = e.touches[0].clientY;
    const deltaY = Math.abs(y - touchStart.current.y);

    // Cancel swipe if user scrolls vertically too much
    if (deltaY > maxVerticalShift) {
      touchStart.current = null;
    }
  }, [maxVerticalShift]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;

    const x = e.changedTouches[0].clientX;
    const deltaX = x - touchStart.current.x;

    if (deltaX > threshold) {
      onSwipe();
    }
    
    // Reset
    touchStart.current = null;
  }, [onSwipe, threshold]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};