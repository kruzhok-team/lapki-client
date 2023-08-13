import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { PanelOnResize } from 'react-resizable-panels';

// вольная адаптация
// https://github.com/bvaughn/react-resizable-panels/issues/48#issuecomment-1368106118

// FIXME: onPanelMinSize не учитывает текущий setMinSize, поэтому используется реф.

export default function usePanelMinSize(
  groupName: string,
  minPixelSize: number,
  resizeCallback?: PanelOnResize
) {
  const minSizeRef = useRef(20);

  useLayoutEffect(() => {
    const panelGroup = document.querySelector(`[data-panel-group-id="${groupName}"]`);
    const resizeHandles = document.querySelectorAll('[data-panel-resize-handle-id]');
    const observer = new ResizeObserver(() => {
      let width = panelGroup.offsetWidth;

      resizeHandles.forEach((resizeHandle) => {
        width -= resizeHandle.offsetWidth;
      });

      if (width >= minPixelSize) {
        const oldSize = minSizeRef.current;
        const newSize = (minPixelSize / width) * 100;
        minSizeRef.current = newSize;
        resizeCallback?.(newSize, oldSize);
      }
    });
    observer.observe(panelGroup);
    resizeHandles.forEach((resizeHandle) => {
      observer.observe(resizeHandle);
    });

    return () => {
      observer.unobserve(panelGroup);
      resizeHandles.forEach((resizeHandle) => {
        observer.unobserve(resizeHandle);
      });
      observer.disconnect();
    };
  }, [groupName, minPixelSize]);

  return { minSizeRef };
}
