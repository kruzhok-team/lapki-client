import React from 'react';

import { twMerge } from 'tailwind-merge';

import { useModelContext } from '@renderer/store/ModelContext';
import { Action as ActionData } from '@renderer/types/diagram';

interface ActionProps {
  isSelected: boolean;
  onSelect: () => void;
  onChange: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  data: ActionData;
}

/**
 * Отображает одно действие в блоке действий
 */
export const Action: React.FC<ActionProps> = (props) => {
  const { isSelected, onSelect, onChange, onDragStart, onDrop, data } = props;

  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const controller = modelController.controllers[headControllerId];
  const smId = Object.keys(controller.stateMachinesSub)[0];

  return (
    <div
      className={twMerge('flex gap-2 p-2 hover:bg-bg-hover', isSelected && 'bg-bg-active')}
      onClick={onSelect}
      draggable
      onDragOver={(event) => event.preventDefault()}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDoubleClick={onChange}
    >
      <div className="flex items-center gap-[2px] overflow-hidden rounded-md bg-border-primary">
        <div className="bg-bg-primary px-4 py-2">
          {controller.platform[smId].getFullComponentIcon(data.component)}
        </div>

        <div className="bg-bg-primary px-4 py-2">
          <img
            className="size-8 object-contain"
            src={controller.platform[smId].getActionIconUrl(data.component, data.method, true)}
          />
        </div>
      </div>

      <div className="flex items-center">
        <div>{data.component}.</div>
        <div>{data.method}</div>
      </div>

      {data.args !== undefined || <div>{data.args}</div>}
    </div>
  );
};
