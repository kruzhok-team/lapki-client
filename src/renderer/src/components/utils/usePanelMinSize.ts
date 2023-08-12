import { useLayoutEffect, useState } from 'react';

// вольная адаптация
// https://github.com/bvaughn/react-resizable-panels/issues/48#issuecomment-1368106118

// FIXME: задаёт минимальный размер, но не фиксирует, когда он ниже требуемого.

export default function usePanelMinSize(groupName: string, minPixelSize: number) {
  const [minSize, setMinSize] = useState(20);

  useLayoutEffect(() => {
    const panelGroup = document.querySelector(`[data-panel-group-id="${groupName}"]`);
    const resizeHandles = document.querySelectorAll('[data-panel-resize-handle-id]');
    const observer = new ResizeObserver(() => {
      let width = panelGroup.offsetWidth;

      resizeHandles.forEach((resizeHandle) => {
        width -= resizeHandle.offsetWidth;
      });

      if (width >= minPixelSize) {
        console.log(['setMinSize', panelGroup.offsetWidth, width, (minPixelSize / width) * 100]);
        setMinSize((minPixelSize / width) * 100);
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

  return { minSize };
}
