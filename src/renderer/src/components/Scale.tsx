import React from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as ZoomIn } from '@renderer/assets/icons/zoom-in.svg';
import { ReactComponent as ZoomOut } from '@renderer/assets/icons/zoom-out.svg';
import { useEditorContext } from '@renderer/store/EditorContext';
import { useDoc } from '@renderer/store/useDoc';

export const Scale: React.FC = () => {
  const editor = useEditorContext();
  const model = editor.model;

  const isDocOpen = useDoc((state) => state.isOpen);

  const scale = model.useData('scale');

  const handleZoomOut = () => {
    editor.view.changeScale(0.1);
  };

  const handleZoomIn = () => {
    editor.view.changeScale(-0.1);
  };

  const handleReset = () => {
    editor.view.changeScale(1, true);
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
