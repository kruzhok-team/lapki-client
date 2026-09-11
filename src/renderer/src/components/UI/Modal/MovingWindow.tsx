import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import './css/moving_window.css';
import { twMerge } from 'tailwind-merge';

import { useWindowManagerStore } from '../../../hooks/useWindowManagerStore';

// Windows must stay above the header, sidebars and their popovers. Regular
// modals use z-300 so dialogs opened from a moving window remain on top.
const INACTIVE_WINDOW_Z_INDEX = 200;
const ACTIVE_WINDOW_Z_INDEX = 201;

/**
 * Props for the Window component
 */
export type WindowProps = {
  /** Unique identifier for the window */
  id: string;
  /** Window title - can be string or React component */
  header?: React.ReactNode;
  /** Window content */
  children?: React.ReactNode;
  /** Initial window position */
  position?: { x: number; y: number };
  /** Content to display in the toolbar */
  toolbar?: React.ReactNode | string;
  /** Additional CSS classes for the window */
  className?: string;
  isOpen?: boolean;
};

export const Window = ({
  id,
  header,
  children,
  position = { x: 100, y: 100 },
  className = '',
  isOpen = false,
}: WindowProps) => {
  const { updateWindow, activeWindowId, setActiveWindow, bringToFront, endSplitOnDrag, windows } =
    useWindowManagerStore();

  // Get selected animation type - if provided in props, use it, otherwise use the store's value
  const windowRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [windowPosition, setWindowPosition] = useState(position);

  // Drag state refs
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragStartPos = useRef({ mouseX: 0, mouseY: 0, windowX: 0, windowY: 0 });

  // Touch event refs for mobile support
  const touchStartPos = useRef({
    touchX: 0,
    touchY: 0,
    windowX: 0,
    windowY: 0,
  });

  useLayoutEffect(() => {
    if (!windowRef.current || !isOpen) return;
    const newSize = windowRef.current.getBoundingClientRect();
    setSize(newSize);
  }, [isOpen, id, windowRef]);

  // Animation frame Id for cleanup
  const animationFrameId = useRef<number | null>(null);

  // Get the current window's zIndex
  const currentWindow = windows.find((w) => w.id === id);
  const zIndex =
    activeWindowId === id
      ? ACTIVE_WINDOW_Z_INDEX
      : Math.max(currentWindow?.zIndex ?? 1, INACTIVE_WINDOW_Z_INDEX);

  // Clamp the window position to the screen boundaries
  const clampPositionToScreen = (x: number, y: number) => {
    const el = windowRef.current;
    if (!el) return { x, y };

    const parent = (el.offsetParent as HTMLElement) ?? el.parentElement ?? document.documentElement;
    const parentRect = parent.getBoundingClientRect();

    const maxX = Math.max(0, parentRect.width - size.width);
    const maxY = Math.max(0, parentRect.height - size.height);

    const clampedX = Math.max(0, Math.min(x, maxX));
    const clampedY = Math.max(0, Math.min(y, maxY));

    return { x: clampedX, y: clampedY };
  };

  // Window activation and bring to front
  const handleWindowActivation = (e: React.MouseEvent) => {
    // Ensure the event is from the window, not child elements
    if (
      e.target === e.currentTarget ||
      (e.currentTarget as HTMLElement).contains(e.target as Node)
    ) {
      setActiveWindow(id);
      bringToFront(id);
    }
  };

  // Component mount/unmount event listeners for mouse and touch events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current && !isResizing.current) {
        return;
      }

      e.preventDefault(); // Prevent text selection

      if (isDragging.current) {
        // If there's an ongoing animation, cancel it
        if (animationFrameId.current !== null) {
          cancelAnimationFrame(animationFrameId.current);
        }

        // Request a new animation frame
        animationFrameId.current = requestAnimationFrame(() => {
          const deltaX = e.clientX - dragStartPos.current.mouseX;
          const deltaY = e.clientY - dragStartPos.current.mouseY;

          const newX = dragStartPos.current.windowX + deltaX;
          const newY = dragStartPos.current.windowY + deltaY;

          const { x: clampedX, y: clampedY } = clampPositionToScreen(newX, newY);
          setWindowPosition({ x: clampedX, y: clampedY });

          animationFrameId.current = null;
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) {
        return;
      }

      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartPos.current.touchX;
      const deltaY = touch.clientY - touchStartPos.current.touchY;

      const newX = touchStartPos.current.windowX + deltaX;
      const newY = touchStartPos.current.windowY + deltaY;
      const { x: clampedX, y: clampedY } = clampPositionToScreen(newX, newY);
      setWindowPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        updateWindow(id, { position: windowPosition });
        endSplitOnDrag(id);
      }

      // If there's an ongoing animation, cancel it
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };

    const handleTouchEnd = () => {
      if (isDragging.current) {
        isDragging.current = false;
        endSplitOnDrag(id);
      }
    };

    const handleResize = () => {
      // Check if the window position is within the screen boundaries when the screen size changes
      setWindowPosition((prevPos) => {
        const { x: clampedX, y: clampedY } = clampPositionToScreen(prevPos.x, prevPos.y);
        return { x: clampedX, y: clampedY };
      });
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);

      // Clean up animation
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [id, size]); // windowSize dependency'lerini ekle

  useEffect(() => {
    if (!windowRef.current) return;

    const style = windowRef.current.style;
    windowRef.current.style.left = windowPosition.x.toString() + 'px';
    windowRef.current.style.top = windowPosition.y.toString() + 'px';
    style.zIndex = zIndex.toString();
  }, [windowRef, zIndex, windowPosition]);

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event propagation
    isDragging.current = true;

    dragStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      windowX: windowPosition.x,
      windowY: windowPosition.y,
    };

    // Activate the window and bring it to front
    setActiveWindow(id);
    bringToFront(id);
  };

  const handleHeaderDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // if (allowFullscreen) {
    //   toggleFullscreen();
    // }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    if (!touch) return;

    isDragging.current = true;

    touchStartPos.current = {
      touchX: touch.clientX,
      touchY: touch.clientY,
      windowX: windowPosition.x,
      windowY: windowPosition.y,
    };

    // Activate the window and bring it to front
    setActiveWindow(id);
    bringToFront(id);
  };

  // Update the window state

  // Window opening animation
  // useEffect(() => {
  // if (windowRef.current) {
  // Determine the opening animation based on the selected animation type
  // let animation;

  //     switch (selectedAnimation) {
  //       case 'fade':
  //         animation = windowRef.current.animate([{ opacity: 0 }, { opacity: 1 }], {
  //           duration: 200,
  //           easing: 'ease-out',
  //           fill: 'forwards',
  //         });
  //         break;
  //       case 'scale':
  //         animation = windowRef.current.animate(
  //           [
  //             { opacity: 0, transform: 'scale(0.8)' },
  //             { opacity: 1, transform: 'scale(1)' },
  //           ],
  //           { duration: 200, easing: 'ease-out', fill: 'forwards' }
  //         );
  //         break;
  //       case 'slide':
  //         animation = windowRef.current.animate(
  //           [
  //             { opacity: 0, transform: 'translateY(20px)' },
  //             { opacity: 1, transform: 'translateY(0)' },
  //           ],
  //           { duration: 200, easing: 'ease-out', fill: 'forwards' }
  //         );
  //         break;
  //       case 'flip':
  //         animation = windowRef.current.animate(
  //           [
  //             { opacity: 0, transform: 'rotateX(15deg)' },
  //             { opacity: 1, transform: 'rotateX(0deg)' },
  //           ],
  //           { duration: 300, easing: 'ease-out', fill: 'forwards' }
  //         );
  //         break;
  //       case 'rotate':
  //         animation = windowRef.current.animate(
  //           [
  //             { opacity: 0, transform: 'rotate(-2deg)' },
  //             { opacity: 1, transform: 'rotate(0deg)' },
  //           ],
  //           { duration: 300, easing: 'ease-out', fill: 'forwards' }
  //         );
  //         break;
  //       case 'jellyfish':
  //         animation = windowRef.current.animate(
  //           [
  //             { opacity: 0, transform: 'scale(0.7)' },
  //             { opacity: 1, transform: 'scale(1)' },
  //           ],
  //           {
  //             duration: 400,
  //             easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring-like easing
  //             fill: 'forwards',
  //           }
  //         );
  //         break;
  //       default:
  //         // If there's no animation, do nothing
  //         break;
  //     }
  //   }
  // }, [id]); // Only run when the component is mounted and the ID changes

  // Add the window ID to the global window object - this will be used by the inside applications
  useEffect(() => {
    // Store the window ID in the global object
    (window as any).__WINDOW_ID__ = id;

    return () => {
      // Clean up, when the window is closed
      if ((window as any).__WINDOW_ID__ === id) {
        delete (window as any).__WINDOW_ID__;
      }
    };
  }, [id]);

  return (
    <div
      ref={windowRef}
      className={twMerge(
        `react-window-manager window ${activeWindowId === id ? 'active' : ''}`,
        className
      )}
      style={{
        display: isOpen ? 'flex' : 'none',
        boxShadow: '0 2px 12.8px rgba(0, 0, 0, 0.25)',
      }}
      onMouseDown={handleWindowActivation}
      data-window-id={id}
    >
      {/* Header */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleHeaderDoubleClick}
        className="cursor-grab"
      >
        {header}
      </div>

      {/* Content */}
      <div className="react-window-manager content">{children}</div>
    </div>
  );
};
