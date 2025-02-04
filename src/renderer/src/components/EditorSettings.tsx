import React from 'react';

import { ReactComponent as Arrow } from '@renderer/assets/icons/arrow-right.svg';
import { ReactComponent as Grid } from '@renderer/assets/icons/grid.svg';
import { ReactComponent as Question } from '@renderer/assets/icons/question.svg';
import { ReactComponent as ZoomIn } from '@renderer/assets/icons/zoom-in.svg';
import { ReactComponent as ZoomOut } from '@renderer/assets/icons/zoom-out.svg';
import { useSettings } from '@renderer/hooks/useSettings';
import { useModelContext } from '@renderer/store/ModelContext';
import { useTabs } from '@renderer/store/useTabs';

export interface EditorSettingsProps {
  toggle: () => void;
}

export const EditorSettings: React.FC<EditorSettingsProps> = ({ toggle }) => {
  const [activeTabName, items] = useTabs((state) => [state.activeTab, state.items]);
  const activeTab = items.find((tab) => tab.name === activeTabName);
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const controller = modelController.controllers[headControllerId];
  const scale = controller.useData('scale');
  const isMounted = controller.useData('isMounted');
  const [canvasSettings, setCanvasSettings] = useSettings('canvas');

  const handleZoomOut = () => {
    controller.view.changeScale(0.1);
  };

  const handleZoomIn = () => {
    controller.view.changeScale(-0.1);
  };

  const handleReset = () => {
    controller.view.changeScale(1, true);
  };

  const handleUndo = () => {
    modelController.history.undo();
  };

  const handleRedo = () => {
    modelController.history.redo();
  };

  const handleCanvasGrid = () => {
    setCanvasSettings({
      ...canvasSettings!,
      grid: !canvasSettings?.grid,
    });
  };

  if (!isMounted) return null;

  return (
    activeTab?.type === 'editor' && (
      <div className="absolute -left-[300px] bottom-3 flex items-stretch overflow-hidden rounded bg-bg-secondary">
        <button
          className="rotate-180 px-2 outline-none hover:bg-bg-hover active:bg-bg-active"
          onClick={handleUndo}
        >
          <Arrow width={20} height={20} />
        </button>

        <button
          className="px-2 outline-none hover:bg-bg-hover active:bg-bg-active"
          onClick={handleRedo}
        >
          <Arrow width={20} height={20} />
        </button>

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
    )
  );
};
