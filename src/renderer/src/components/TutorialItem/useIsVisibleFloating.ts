import { useCallback, useEffect, useMemo, useRef } from 'react';

import { FloatingContext, ElementProps } from '@floating-ui/react';

import { Tutorial } from '@renderer/store/Tutorial';

interface UseIsVisibleFloating {
  tutorial: Tutorial;
  id: string;

  closeDelay?: number;
  openDelay?: number;
}

export const useIsVisibleFloating = (
  context: FloatingContext,
  props: UseIsVisibleFloating
): ElementProps => {
  const {
    elements: { domReference },
    events,
    onOpenChange,
  } = context;

  const { tutorial, id, closeDelay = 3000, openDelay = 200 } = props;

  const openTimeoutRef = useRef<NodeJS.Timeout>();
  const closeTimeoutRef = useRef<NodeJS.Timeout>();

  const closeWithDelay = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      onOpenChange(false);
    }, closeDelay);
  }, [closeDelay, onOpenChange]);

  const observer = useMemo(() => {
    return new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return tutorial.cancelShow(id);

      tutorial.requestShow(id);
    });
  }, [id, tutorial]);

  useEffect(() => {
    const handleOpenChange = ({ open }: { open: boolean }) => {
      if (!open) {
        clearTimeout(openTimeoutRef.current);
        clearTimeout(closeTimeoutRef.current);
        tutorial.onClose(id);
      }
    };

    events.on('openchange', handleOpenChange);
    return () => {
      events.off('openchange', handleOpenChange);
    };
  }, [events, id, tutorial]);

  useEffect(() => {
    if (!domReference) return;

    observer.observe(domReference);
    return () => observer.disconnect();
  }, [domReference, observer]);

  useEffect(() => {
    const unsubscribe = tutorial.onAvailableToShow(id, () => {
      openTimeoutRef.current = setTimeout(() => {
        onOpenChange(true);

        closeWithDelay();
      }, openDelay);
    });

    return () => unsubscribe();
  }, [closeWithDelay, id, onOpenChange, openDelay, tutorial]);

  return {
    floating: {
      onMouseEnter() {
        clearTimeout(closeTimeoutRef.current);
      },
      onMouseLeave() {
        closeWithDelay();
      },
      onFocus() {
        clearTimeout(closeTimeoutRef.current);
      },
      onBlur() {
        closeWithDelay();
      },
    },
  };
};
