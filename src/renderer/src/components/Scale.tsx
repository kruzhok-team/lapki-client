import React, { useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { useDoc } from '@renderer/store/useDoc';

import { ReactComponent as ZoomIn } from '@renderer/assets/icons/zoom-in.svg';
import { ReactComponent as ZoomOut } from '@renderer/assets/icons/zoom-out.svg';
import { EditorManager } from '@renderer/lib/data/EditorManager';

interface ScaleProps {
  editor: CanvasEditor;
  manager: EditorManager;
}

export const Scale: React.FC<ScaleProps> = ({ editor, manager }) => {
  const isDocOpen = useDoc((state) => state.isOpen);

  const scale = manager.useData('scale');

  const handleZoomOut = () => {
    editor.container.changeScale(0.1);
  };

  const handleZoomIn = () => {
    editor.container.changeScale(-0.1);
  };

  const handleReset = () => {
    editor.container.changeScale(1, true);
  };

  // useEffect(() => {
  //   const id = setInterval(() => {
  //     console.log(Object.entries(manager.data));
  //   }, 2000);

  //   return () => {
  //     clearInterval(id);
  //   };
  // }, []);

  return (
    <div
      className={twMerge(
        'absolute bottom-3 right-10 flex items-stretch overflow-hidden rounded bg-bg-secondary transition-transform',
        isDocOpen && '-translate-x-[400px]'
      )}
    >
      <button
        className="px-2 outline-none hover:bg-bg-hover active:bg-bg-active"
        onClick={handleZoomOut}
      >
        <ZoomOut width={20} height={20} />
      </button>

      <button
        className="flex w-16 justify-center py-2 outline-none hover:bg-bg-hover active:bg-bg-active"
        onClick={handleReset}
      >
        {Math.floor((1 / scale) * 100)}%
      </button>

      <button
        className="px-2 outline-none hover:bg-bg-hover active:bg-bg-active"
        onClick={handleZoomIn}
      >
        <ZoomIn width={20} height={20} />
      </button>
    </div>
  );
};
