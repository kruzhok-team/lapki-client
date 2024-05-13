import React from 'react';

import { ReactComponent as Grid } from '@renderer/assets/icons/grid.svg';
import { ReactComponent as Question } from '@renderer/assets/icons/question.svg';
import { ReactComponent as ZoomIn } from '@renderer/assets/icons/zoom-in.svg';
import { ReactComponent as ZoomOut } from '@renderer/assets/icons/zoom-out.svg';
import { useSettings } from '@renderer/hooks/useSettings';
import { useEditorContext } from '@renderer/store/EditorContext';

export interface EditorSettingsProps {
  toggle: () => void;
}

export const EditorSettings: React.FC<EditorSettingsProps> = ({ toggle }) => {
  const editor = useEditorContext();
  const model = editor.model;

  const scale = model.useData('scale');
  const isMounted = editor.model.useData('isMounted');
  const [canvasSettings, setCanvasSettings] = useSettings('canvas');

  const handleZoomOut = () => {
    editor.view.changeScale(0.1);
  };

  const handleZoomIn = () => {
    editor.view.changeScale(-0.1);
  };

  const handleReset = () => {
    editor.view.changeScale(1, true);
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

      <button className="px-2 outline-none hover:bg-bg-hover active:bg-bg-active" onClick={toggle}>
        <Question height={20} width={20} />
      </button>
    </div>
  );
};
