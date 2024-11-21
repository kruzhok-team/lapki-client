import React from 'react';

import { ReactComponent as Grid } from '@renderer/assets/icons/grid.svg';
import { ReactComponent as Question } from '@renderer/assets/icons/question.svg';
import { ReactComponent as ZoomIn } from '@renderer/assets/icons/zoom-in.svg';
import { ReactComponent as ZoomOut } from '@renderer/assets/icons/zoom-out.svg';
import { useSettings } from '@renderer/hooks/useSettings';
import { useModelContext } from '@renderer/store/ModelContext';

export interface EditorSettingsProps {
  toggle: () => void;
}

export const EditorSettings: React.FC<EditorSettingsProps> = ({ toggle }) => {
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const controller = modelController.controllers[headControllerId];
  const scale = modelController.model.useData('', 'scale');
  const isMounted = modelController.model.useData('', 'canvas.isMounted', controller.id);
  const [canvasSettings, setCanvasSettings] = useSettings('canvas');

  const handleZoomOut = () => {
    modelController.changeScale(0.1);
  };

  const handleZoomIn = () => {
    modelController.changeScale(-0.1);
  };

  const handleReset = () => {
    debugger;
    modelController.changeScale(1, true);
  };

  const handleCanvasGrid = () => {
    setCanvasSettings({
      ...canvasSettings!,
      grid: !canvasSettings?.grid,
    });
  };

  if (!isMounted) return null;

  return (
    <div className="absolute -left-60 bottom-3 flex items-stretch overflow-hidden rounded bg-bg-secondary">
      <button
        className="px-2 outline-none hover:bg-bg-hover active:bg-bg-active"
        onClick={handleCanvasGrid}
      >
        <Grid width={20} height={20} />
      </button>

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

      <button
        className="px-2 text-primary outline-none hover:bg-bg-hover active:bg-bg-active"
        onClick={toggle}
      >
        <Question height={20} width={20} />
      </button>
    </div>
  );
};
