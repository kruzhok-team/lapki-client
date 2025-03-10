import React from 'react';

import { ReactComponent as FontSizeIcon } from '@renderer/assets/icons/font_size.svg';
import { ReactComponent as Grid } from '@renderer/assets/icons/grid.svg';
import { ReactComponent as Redo } from '@renderer/assets/icons/redo.svg';
import { ReactComponent as ZoomIn } from '@renderer/assets/icons/zoom-in.svg';
import { ReactComponent as ZoomOut } from '@renderer/assets/icons/zoom-out.svg';
import { useSettings } from '@renderer/hooks/useSettings';
import { useModelContext } from '@renderer/store/ModelContext';
import { useTabs } from '@renderer/store/useTabs';

import { WithHint } from './UI';

interface SettingsItem {
  content: JSX.Element | string;
  onClick: () => void;
  hint: string;
  className: string;
}

const defaultItemClassName = 'px-2 outline-none hover:bg-bg-hover active:bg-bg-active';

export const EditorSettings: React.FC = () => {
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

  const handleShowNames = () => {
    controller.setShowPseudoStatesNames(!controller.showPseudoStatesName);
  };

  if (!isMounted || !canvasSettings) return null;

  const buttons: SettingsItem[] = [
    {
      className: defaultItemClassName + ' horizontal-flip',
      hint: 'Отменить действие',
      content: <Redo width={20} height={20} />,
      onClick: handleUndo,
    },
    {
      className: defaultItemClassName,
      hint: 'Вернуть отменённое действие',
      content: <Redo width={20} height={20} />,
      onClick: handleRedo,
    },
    {
      className: defaultItemClassName,
      hint: 'Показывать имена псевдосостояний',
      content: <FontSizeIcon width={20} height={20} />,
      onClick: handleShowNames,
    },
    {
      className: defaultItemClassName,
      hint: canvasSettings.grid ? 'Выключить сетку' : 'Включить сетку',
      content: <Grid width={20} height={20} />,
      onClick: handleCanvasGrid,
    },
    {
      className: defaultItemClassName,
      hint: 'Отдалить',
      content: <ZoomOut width={20} height={20} />,
      onClick: handleZoomOut,
    },
    {
      className: 'flex w-16 justify-center py-2 outline-none hover:bg-bg-hover active:bg-bg-active',
      hint: 'Текущий масштаб. Нажмите, чтобы вернуть масштаб на стандартное значение.',
      content: Math.floor((1 / scale) * 100).toString() + '%',
      onClick: handleReset,
    },
    {
      className: defaultItemClassName,
      hint: 'Приблизить',
      content: <ZoomIn width={20} height={20} />,
      onClick: handleZoomIn,
    },
  ];

  return (
    activeTab?.type === 'editor' && (
      <div className="absolute -left-[280px] bottom-3 flex items-stretch overflow-hidden rounded bg-bg-secondary">
        {buttons.map(({ className, content, hint, onClick }, index) => (
          <WithHint key={index} hint={hint}>
            {(props) => (
              <button {...props} className={className} onClick={onClick}>
                {content}
              </button>
            )}
          </WithHint>
        ))}
      </div>
    )
  );
};
