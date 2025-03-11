import React, { useEffect, useMemo } from 'react';

import { twMerge } from 'tailwind-merge';

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
  disabled?: boolean;
}

const defaultItemClassName = 'px-2 outline-none hover:bg-bg-hover active:bg-bg-active';

export const EditorSettings: React.FC = () => {
  const [activeTabName, items] = useTabs((state) => [state.activeTab, state.items]);
  const activeTab = items.find((tab) => tab.name === activeTabName);
  const modelController = useModelContext();
  const { redoStack, undoStack } = modelController.history.use();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const controller = modelController.controllers[headControllerId];
  const scale = controller.useData('scale');
  const isMounted = controller.useData('isMounted');
  const [canvasSettings, setCanvasSettings] = useSettings('canvas');

  const handleZoomOut = () => {
    controller.view.changeScale(0.1);
    controller.view.app.focus();
  };

  const handleZoomIn = () => {
    controller.view.changeScale(-0.1);
    controller.view.app.focus();
  };

  const handleReset = () => {
    controller.view.changeScale(1, true);
    controller.view.app.focus();
  };

  const handleUndo = () => {
    modelController.history.undo();
    controller.view.app.focus();
  };

  const handleRedo = () => {
    modelController.history.redo();
    controller.view.app.focus();
  };

  const handleCanvasGrid = () => {
    setCanvasSettings({
      ...canvasSettings!,
      grid: !canvasSettings?.grid,
    });
    controller.view.app.focus();
  };

  const buttons: SettingsItem[] = [
    {
      className: defaultItemClassName + ' horizontal-flip',
      hint: 'Отменить действие',
      content: <Redo width={20} height={20} />,
      onClick: handleUndo,
      disabled: undoStack.length === 0,
    },
    {
      className: defaultItemClassName,
      hint: 'Вернуть отменённое действие',
      content: <Redo width={20} height={20} />,
      onClick: handleRedo,
      disabled: redoStack.length === 0,
    },
    {
      className: defaultItemClassName,
      hint: canvasSettings && canvasSettings.grid ? 'Выключить сетку' : 'Включить сетку',
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

  if (!isMounted || !canvasSettings) return null;

  return (
    activeTab?.type === 'editor' && (
      <div className="absolute -left-[280px] bottom-3 flex items-stretch overflow-hidden rounded bg-bg-secondary">
        {buttons.map(({ className, content, hint, onClick, disabled }, index) => (
          <WithHint key={index} hint={hint}>
            {(props) => (
              <button
                {...props}
                // Подсказка  не появляется, если кнопка залочена, поэтому делаем ее "залоченной" вручную
                className={twMerge(
                  className,
                  disabled && 'cursor-default opacity-50 hover:bg-transparent active:bg-transparent'
                )}
                onClick={!disabled ? onClick : () => undefined}
              >
                {content}
              </button>
            )}
          </WithHint>
        ))}
      </div>
    )
  );
};
