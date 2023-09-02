import React from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { useDoc } from '@renderer/store/useDoc';

import { ReactComponent as ZoomIn } from '@renderer/assets/icons/zoom-in.svg';
import { ReactComponent as ZoomOut } from '@renderer/assets/icons/zoom-out.svg';
import { twMerge } from 'tailwind-merge';

interface ScaleProps {
  editor: CanvasEditor;
}

export const Scale: React.FC<ScaleProps> = ({ editor }) => {
  const isDocOpen = useDoc((state) => state.isOpen);

  const scale = editor.container.useScale();

  const handleZoomOut = () => {
    editor.container.changeScale(0.1);
  };

  const handleZoomIn = () => {
    editor.container.changeScale(-0.1);
  };

  const handleReset = () => {
    editor.container.changeScale(1, true);
  };

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
        {scale.toFixed(2)}
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
