import React from 'react';

import { twMerge } from 'tailwind-merge';

import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { useModelContext } from '@renderer/store/ModelContext';
import { Action as ActionData } from '@renderer/types/diagram';
import { getMatrixDimensions } from '@renderer/utils';

import { MatrixWidget } from '../ActionsModal/MatrixWidget';

interface ActionProps {
  smId: string;
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
  const { smId, isSelected, onSelect, onChange, onDragStart, onDrop, data } = props;

  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const controller = modelController.controllers[headControllerId];
  const platforms = controller.useData('platform') as { [id: string]: PlatformManager };
  const platform = platforms[smId];

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
          {platform.getFullComponentIcon(data.component)}
        </div>

        <div className="bg-bg-primary px-4 py-2">
          <img
            className="size-8 object-contain"
            src={platform.getActionIconUrl(data.component, data.method, true)}
          />
        </div>
      </div>

      <div className="flex flex-row items-center">
        <div>{data.component}.</div>
        <div>{data.method}</div>
        <div>(</div>
        <div className="flex items-center gap-[2px]">
          {data.args === undefined ||
            Object.entries(data.args).map(([id, value], index) => {
              const protoComponent =
                platform.data.components[platform.resolveComponentType(data.component)];
              const protoMethod = protoComponent.methods[data.method];
              const protoParameters = protoMethod.parameters;

              if (!protoParameters)
                return (
                  <>
                    {value}
                    {index !== 0 && ', '}
                  </>
                );

              const parameter = protoParameters.find((param) => param.name === id);

              if (!parameter || !parameter.type)
                return (
                  <>
                    {index !== 0 && ', '} {value}
                  </>
                );

              if (typeof parameter.type === 'string' && parameter.type.startsWith('Matrix')) {
                const dimensions = getMatrixDimensions(parameter.type);

                if (Array.isArray(value) && typeof value[0][0] === 'number') {
                  return (
                    <>
                      {index !== 0 && ', '}
                      <MatrixWidget
                        key={`${smId}-${dimensions.width}-${dimensions.height}`}
                        width={dimensions.width}
                        height={dimensions.height}
                        values={value}
                        isClickable={false}
                        onChange={() => undefined}
                        style={{
                          ledWidth: 2,
                          ledHeight: 2,
                          margin: 0,
                          border: 1,
                          isRounded: false,
                        }}
                      />
                    </>
                  );
                }
              }

              return (
                <>
                  {index !== 0 && ', '}
                  {value}
                </>
              );
            })}
        </div>
        <div>)</div>
      </div>
    </div>
  );
};
