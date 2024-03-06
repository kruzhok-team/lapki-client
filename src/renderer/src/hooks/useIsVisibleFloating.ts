import { useCallback, useEffect, useMemo, useRef } from 'react';

import { FloatingContext, ElementProps } from '@floating-ui/react';

interface UseIsVisibleFloating {
  closeDelay?: number;
  openDelay?: number;
}

export const useIsVisibleFloating = (
  context: FloatingContext,
  props?: UseIsVisibleFloating
): ElementProps => {
  const {
    elements: { domReference },
    events,
    onOpenChange,
  } = context;

  const { closeDelay = 3000, openDelay = 200 } = props ?? {};

  const openTimeoutRef = useRef<NodeJS.Timeout>();
  const closeTimeoutRef = useRef<NodeJS.Timeout>();

  const closeWithDelay = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      onOpenChange(false);
    }, closeDelay);
  }, [closeDelay, onOpenChange]);

  const observer = useMemo(
    () =>
      new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;

        openTimeoutRef.current = setTimeout(() => {
          onOpenChange(true);

          closeWithDelay();
        }, openDelay);
      }),
    [closeWithDelay, onOpenChange, openDelay]
  );

  useEffect(() => {
    function onOpenChange({ open }: { open: boolean }) {
      if (!open) {
        clearTimeout(openTimeoutRef.current);
        clearTimeout(closeTimeoutRef.current);
      }
    }

    events.on('openchange', onOpenChange);
    return () => {
      events.off('openchange', onOpenChange);
    };
  }, [events]);

  useEffect(() => {
    if (!domReference) return;

    observer.observe(domReference);
    return () => observer.disconnect();
  }, [domReference, observer]);

  return {
    floating: {
      onMouseEnter() {
        clearTimeout(closeTimeoutRef.current);
      },
      onMouseLeave() {
        closeWithDelay();
      },
    },
  };
};
