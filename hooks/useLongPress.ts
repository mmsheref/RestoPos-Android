
import React, { useRef, useCallback, useEffect } from 'react';

// A module-level variable to track the last touch event time.
// This is a reliable way to differentiate between genuine mouse events and touch-emulated mouse events.
let lastTouchEndTime = 0;

/**
 * A hook that detects long presses and handles clicks, while robustly preventing
 * the "double-fire" or "ghost click" issue on touch devices where both touch
 * and mouse events are dispatched for a single tap.
 */
export const useLongPress = (
  onLongPress: (event: React.TouchEvent | React.MouseEvent) => void,
  onClick: () => void,
  { delay = 300 } = {}
) => {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  // Ensure any active timeout is cleared when the component unmounts.
  useEffect(() => {
    return () => {
      timeout.current && clearTimeout(timeout.current);
    };
  }, []);

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      // Ignore emulated mouse events that follow a touch event.
      // Reduced threshold from 500ms to 60ms to prevent blocking rapid taps.
      if (Date.now() - lastTouchEndTime < 60 && 'buttons' in event) {
        return;
      }
      
      longPressTriggered.current = false;
      
      // Persist the event object for use in the async timeout.
      if ('persist' in event && typeof event.persist === 'function') {
        event.persist();
      }
      
      timeout.current = setTimeout(() => {
        onLongPress(event);
        longPressTriggered.current = true;
      }, delay);
    },
    [onLongPress, delay]
  );

  const clear = useCallback(
    (event: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
      // Ignore emulated mouse events.
      // Reduced threshold from 500ms to 60ms.
      if (Date.now() - lastTouchEndTime < 60 && 'buttons' in event) {
        // We also prevent default to stop any other unwanted behaviors like link navigation.
        event.preventDefault();
        return;
      }
      
      // If this was a touch event, update the timestamp.
      if (event.type === 'touchend') {
        lastTouchEndTime = Date.now();
      }

      timeout.current && clearTimeout(timeout.current);
      
      // Trigger the onClick handler only if it was a short press (not a long press).
      if (shouldTriggerClick && longPressTriggered.current === false) {
        onClick();
      }
    },
    [onClick]
  );

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (event: React.MouseEvent) => {
        // Also prevent clearing the timeout on a ghost mouseleave event.
        if (Date.now() - lastTouchEndTime < 60) {
            return;
        }
        timeout.current && clearTimeout(timeout.current);
    },
    onTouchEnd: (e: React.TouchEvent) => clear(e),
  };
};
