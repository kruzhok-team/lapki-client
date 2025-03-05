import React, { useMemo } from 'react';

import { twMerge } from 'tailwind-merge';

import { getActionDelimeter } from '@renderer/lib/data/GraphmlBuilder';
import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { useModelContext } from '@renderer/store/ModelContext';
import { Action as ActionData, Component, Variable } from '@renderer/types/diagram';
import { getMatrixDimensions } from '@renderer/utils';

import { Picto } from './Picto';

import { MatrixWidget } from '../ActionsModal/MatrixWidget';

interface ActionProps {
  smId: string;
  isSelected: boolean;
  onSelect: () => void;
  onChange: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  data: ActionData & { componentName: string };
}

/**
 * Отображает одно действие в блоке действий
 */
export const Action: React.FC<ActionProps> = (props) => {
  const { smId, isSelected, onSelect, onChange, onDragStart, onDrop, data } = props;

  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const components = modelController.model.useData(smId, 'elements.components') as {
    [id: string]: Component;
  };
  const controller = modelController.controllers[headControllerId];
  const platforms = controller.useData('platform') as { [id: string]: PlatformManager };
  const platform = platforms[smId];

  const serializeParameter = (index: number, param: undefined | string | Variable | number[][]) => {
    if (param === undefined) return '';
    if (Array.isArray(param)) return '[...]';
    if (typeof param === 'string') return `${index !== 0 ? ', ' : ''}${param}`;
    return `${index !== 0 ? ', ' : ''}${
      components[param.component].name ?? param.component
    }${getActionDelimeter(platform.data, components[param.component].type)}${param.method}`;
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange();
  };

  const sortedComponent = useMemo(() => {
    if (!data.args) return [];

    return Object.entries(data.args).sort(([, param], [, param2]) => param.order - param2.order);
  }, [data.args]);

  return (
    <div
      className={twMerge('flex gap-2 p-2 hover:bg-bg-hover', isSelected && 'bg-bg-active')}
      onClick={onSelect}
      draggable
      onDragOver={(event) => event.preventDefault()}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDoubleClick={handleDoubleClick}
    >
      <Picto
        leftIcon={platform ? platform.getFullComponentIcon(data.component) : 'unknown'}
        rightIcon={
          platform ? platform.getActionIconUrl(data.component, data.method, true) : 'unknown'
        }
      />

      <div className="flex flex-row items-center">
        <div>{data.componentName}.</div>
        <div>{data.method}</div>
        <div>(</div>
        <div className="flex items-center gap-[2px]">
          {sortedComponent.map(([id, value], index) => {
            const protoComponent =
              platform.data.components[platform.resolveComponentType(data.component)];
            if (!protoComponent) {
              return <>{serializeParameter(index, value.value)}</>;
            }
            const protoMethod = protoComponent.methods[data.method];
            const protoParameters = protoMethod.parameters;

            if (!protoParameters) return <>{serializeParameter(index, value.value)}</>;

            const parameter = protoParameters.find((param) => param.name === id);

            if (!parameter || !parameter.type) return <>{serializeParameter(index, value.value)}</>;

            if (typeof parameter.type === 'string' && parameter.type.startsWith('Matrix')) {
              const dimensions = getMatrixDimensions(parameter.type);

              if (Array.isArray(value.value) && typeof value.value[0][0] === 'number') {
                return (
                  <>
                    {index !== 0 && ', '}
                    <MatrixWidget
                      key={`${smId}-${dimensions.width}-${dimensions.height}`}
                      width={dimensions.width}
                      height={dimensions.height}
                      values={value.value}
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

            return <>{serializeParameter(index, value.value)}</>;
          })}
        </div>
        <div>)</div>
      </div>
    </div>
  );
};
