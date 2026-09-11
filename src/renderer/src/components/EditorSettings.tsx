import React from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as Grid } from '@renderer/assets/icons/grid.svg';
import { ReactComponent as Redo } from '@renderer/assets/icons/redo.svg';
import { ReactComponent as Undo } from '@renderer/assets/icons/undo.svg';
import { ReactComponent as ZoomIn } from '@renderer/assets/icons/zoom-in.svg';
import { ReactComponent as ZoomOut } from '@renderer/assets/icons/zoom-out.svg';
import { useSettings } from '@renderer/hooks/useSettings';
import { useModelContext } from '@renderer/store/ModelContext';

import { WithHint } from './UI';

interface SettingsItem {
  content: JSX.Element | string;
  onClick: () => void;
  hint: string;
  className: string;
  disabled?: boolean;
}

const defaultItemClassName = 'py-[6px] px-[7px] outline-none';

export const EditorSettings: React.FC = () => {
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

  if (!isMounted || !canvasSettings) return null;

  const handleCanvasGrid = () => {
    setCanvasSettings({
      ...canvasSettings,
      grid: !canvasSettings?.grid,
    });
    controller.view.app.focus();
  };

  const buttons: SettingsItem[] = [
    {
      className: defaultItemClassName + ' pl-2',
      hint: 'Отменить действие',
      content: <Undo />,
      onClick: handleUndo,
      disabled: undoStack.length === 0,
    },
    {
      className: defaultItemClassName,
      hint: 'Вернуть отменённое действие',
      content: <Redo />,
      onClick: handleRedo,
      disabled: redoStack.length === 0,
    },
    {
      className: defaultItemClassName,
      hint: canvasSettings && canvasSettings.grid ? 'Выключить сетку' : 'Включить сетку',
      content: <Grid />,
      onClick: handleCanvasGrid,
    },
    {
      className: defaultItemClassName,
      hint: 'Отдалить',
      content: <ZoomOut />,
      onClick: handleZoomOut,
    },
    {
      className: 'w-10 py-[6px] outline-none flex items-center justify-center text-center',
      hint: 'Текущий масштаб. Нажмите, чтобы вернуть масштаб на стандартное значение.',
      content: Math.floor((1 / scale) * 100).toString() + '%',
      onClick: handleReset,
    },
    {
      className: defaultItemClassName + ' pr-2',
      hint: 'Приблизить',
      content: <ZoomIn />,
      onClick: handleZoomIn,
    },
  ];

  return (
    <div className="absolute -left-[314px] bottom-3 flex items-center overflow-hidden rounded-lg bg-white">
      {buttons.map(({ className, content, hint, onClick, disabled }, index) => (
        <WithHint key={index} hint={hint}>
          {(props) => (
            <button
              {...props}
              // Подсказка  не появляется, если кнопка залочена, поэтому делаем ее "залоченной" вручную
              className={twMerge(
                className,
                disabled && 'cursor-default opacity-50 active:bg-transparent'
              )}
              onClick={!disabled ? onClick : () => undefined}
            >
              <span
                className={twMerge(
                  'inline-flex h-[34px] items-center justify-center rounded-[4px] p-1 hover:bg-util-button-hover',
                  disabled && 'hover:bg-transparent'
                )}
              >
                {content}
              </span>
            </button>
          )}
        </WithHint>
      ))}
    </div>
  );
};
