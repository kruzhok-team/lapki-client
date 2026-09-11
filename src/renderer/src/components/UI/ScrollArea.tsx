import {
  forwardRef,
  type ForwardedRef,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { twMerge } from 'tailwind-merge';

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  /** Classes applied to the scrollable viewport. Use these for content padding and typography. */
  viewportClassName?: string;
  /** Classes applied to the element that directly wraps `children`. Use these for content layout. */
  contentClassName?: string;
  /** Whether content may overflow and scroll horizontally. */
  horizontalScroll?: boolean;
}

/**
 * A scrollable container with the application scrollbar.
 *
 * Usage:
 * ```tsx
 * <ScrollArea
 *   className="h-56 rounded-lg border border-border-primary bg-bg-control"
 *   viewportClassName="px-2"
 *   contentClassName="space-y-2"
 * >
 *   {content}
 * </ScrollArea>
 * ```
 *
 * Put sizing, borders, backgrounds and external spacing on `className`; put
 * content padding and text styles on `viewportClassName`; put flex/grid/gap and
 * sibling-spacing styles on `contentClassName`. Do not add a wrapper solely to
 * decorate or size the scroll area. The forwarded ref and `onScroll` point to
 * the viewport so callers can read or update its scroll position.
 */

const setRef = <T,>(ref: ForwardedRef<T>, value: T | null) => {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
};

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      children,
      className,
      viewportClassName,
      contentClassName,
      horizontalScroll = true,
      onScroll,
      ...props
    },
    forwardedRef
  ) => {
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    const [hasVerticalOverflow, setHasVerticalOverflow] = useState(false);
    const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);
    const [verticalThumb, setVerticalThumb] = useState({ height: 0, top: 0 });
    const [horizontalThumb, setHorizontalThumb] = useState({ width: 0, left: 0 });

    const updateScrollbar = useCallback(() => {
      const viewport = viewportRef.current;

      if (!viewport) {
        return;
      }

      const { clientHeight, clientWidth, scrollHeight, scrollLeft, scrollTop, scrollWidth } =
        viewport;
      const nextHasVerticalOverflow = scrollHeight > clientHeight;
      const nextHasHorizontalOverflow = horizontalScroll && scrollWidth > clientWidth;

      setHasVerticalOverflow(nextHasVerticalOverflow);
      setHasHorizontalOverflow(nextHasHorizontalOverflow);

      if (!nextHasVerticalOverflow) {
        setVerticalThumb({ height: 0, top: 0 });
      } else {
        // 5px сверху + 5px снизу для дорожки.
        const trackHeight = Math.max(0, clientHeight - 10);

        const height = Math.min(
          trackHeight,
          Math.max(20, (clientHeight / scrollHeight) * trackHeight)
        );

        const maxScrollTop = scrollHeight - clientHeight;
        const maxThumbTop = trackHeight - height;

        setVerticalThumb({
          height,
          top: (scrollTop / maxScrollTop) * maxThumbTop,
        });
      }

      if (!nextHasHorizontalOverflow) {
        setHorizontalThumb({ width: 0, left: 0 });
      } else {
        // 5px слева + 5px справа для дорожки.
        const trackWidth = Math.max(0, clientWidth - 10);

        const width = Math.min(trackWidth, Math.max(20, (clientWidth / scrollWidth) * trackWidth));

        const maxScrollLeft = scrollWidth - clientWidth;
        const maxThumbLeft = trackWidth - width;

        setHorizontalThumb({
          width,
          left: (scrollLeft / maxScrollLeft) * maxThumbLeft,
        });
      }
    }, [horizontalScroll]);

    const handleViewportRef = useCallback(
      (node: HTMLDivElement | null) => {
        viewportRef.current = node;
        setRef(forwardedRef, node);
      },
      [forwardedRef]
    );

    useLayoutEffect(() => {
      const viewport = viewportRef.current;
      const content = contentRef.current;

      if (!viewport || !content) {
        return;
      }

      updateScrollbar();

      const resizeObserver = new ResizeObserver(updateScrollbar);
      resizeObserver.observe(viewport);
      resizeObserver.observe(content);

      // The content wrapper may have a fixed height while its descendants change
      // the viewport's scrollHeight, so ResizeObserver alone is not sufficient.
      const mutationObserver = new MutationObserver(updateScrollbar);
      mutationObserver.observe(content, {
        childList: true,
        characterData: true,
        subtree: true,
      });

      return () => {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }, [updateScrollbar]);

    const verticalDragRef = useRef<{
      startY: number;
      startScrollTop: number;
    } | null>(null);

    const horizontalDragRef = useRef<{
      startX: number;
      startScrollLeft: number;
    } | null>(null);

    const handleThumbPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
      const viewport = viewportRef.current;

      if (!viewport) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      event.currentTarget.setPointerCapture(event.pointerId);

      verticalDragRef.current = {
        startY: event.clientY,
        startScrollTop: viewport.scrollTop,
      };
    };

    const handleThumbPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
      const viewport = viewportRef.current;
      const drag = verticalDragRef.current;

      if (!viewport || !drag) {
        return;
      }

      const trackHeight = viewport.clientHeight - 10;
      const maxThumbTop = trackHeight - verticalThumb.height;
      const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;

      if (maxThumbTop <= 0) {
        return;
      }

      const pointerDelta = event.clientY - drag.startY;
      const scrollDelta = pointerDelta * (maxScrollTop / maxThumbTop);

      viewport.scrollTop = drag.startScrollTop + scrollDelta;
    };

    const handleThumbPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
      verticalDragRef.current = null;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    };

    const handleHorizontalThumbPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
      const viewport = viewportRef.current;

      if (!viewport) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      event.currentTarget.setPointerCapture(event.pointerId);

      horizontalDragRef.current = {
        startX: event.clientX,
        startScrollLeft: viewport.scrollLeft,
      };
    };

    const handleHorizontalThumbPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
      const viewport = viewportRef.current;
      const drag = horizontalDragRef.current;

      if (!viewport || !drag) {
        return;
      }

      const trackWidth = viewport.clientWidth - 10;
      const maxThumbLeft = trackWidth - horizontalThumb.width;
      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;

      if (maxThumbLeft <= 0) {
        return;
      }

      const pointerDelta = event.clientX - drag.startX;
      const scrollDelta = pointerDelta * (maxScrollLeft / maxThumbLeft);

      viewport.scrollLeft = drag.startScrollLeft + scrollDelta;
    };

    const handleHorizontalThumbPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
      horizontalDragRef.current = null;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    };

    return (
      <div
        {...props}
        className={twMerge(
          'flex h-full min-h-0 min-w-0 flex-col overflow-hidden py-[5px]',
          className
        )}
      >
        <div className="flex min-h-0 flex-1">
          <div
            ref={handleViewportRef}
            onScroll={(event) => {
              updateScrollbar();
              onScroll?.(event);
            }}
            className={twMerge(
              'min-h-0 min-w-0 flex-1',
              horizontalScroll ? 'overflow-auto' : 'overflow-y-auto overflow-x-hidden',
              '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              viewportClassName
            )}
          >
            <div ref={contentRef} className={contentClassName}>
              {children}
            </div>
          </div>

          {hasVerticalOverflow && (
            <div className="relative my-[5px] w-[18px] shrink-0">
              {/* Scrollbar track */}
              <div className="absolute inset-y-0 left-[10px] w-[2px] rounded-lg bg-scrollbar-track">
                {/* Scrollbar thumb */}
                <div
                  className="absolute left-0 w-full rounded-full bg-scrollbar-thumb"
                  style={{
                    height: `${verticalThumb.height}px`,
                    transform: `translateY(${verticalThumb.top}px)`,
                  }}
                  onPointerDown={handleThumbPointerDown}
                  onPointerMove={handleThumbPointerMove}
                  onPointerUp={handleThumbPointerUp}
                  onPointerCancel={handleThumbPointerUp}
                />
              </div>
            </div>
          )}
        </div>

        {hasHorizontalOverflow && (
          <div className="flex h-[18px] shrink-0">
            <div className="relative mx-[5px] min-w-0 flex-1">
              {/* Scrollbar track */}
              <div className="absolute inset-x-0 top-[10px] h-[2px] rounded-lg bg-scrollbar-track">
                {/* Scrollbar thumb */}
                <div
                  className="absolute top-0 h-full rounded-full bg-scrollbar-thumb"
                  style={{
                    width: `${horizontalThumb.width}px`,
                    transform: `translateX(${horizontalThumb.left}px)`,
                  }}
                  onPointerDown={handleHorizontalThumbPointerDown}
                  onPointerMove={handleHorizontalThumbPointerMove}
                  onPointerUp={handleHorizontalThumbPointerUp}
                  onPointerCancel={handleHorizontalThumbPointerUp}
                />
              </div>
            </div>

            {hasVerticalOverflow && <div className="w-[18px] shrink-0" />}
          </div>
        )}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';
