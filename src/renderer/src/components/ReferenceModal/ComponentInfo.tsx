import React, { useCallback } from 'react';

import { twMerge } from 'tailwind-merge';

import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { ArgType, ComponentProto } from '@renderer/types/platform';

import { convert } from '../utils/html-element-to-react';
import { stringToHTML } from '../utils/stringToHTML';

type ComponentEntry = ComponentProto & {
  idx: string;
};

export type ComponentInfoProps = {
  component: ComponentEntry | null;
  manager: PlatformManager;
  className?: string;
  noTitle?: boolean;
  noTypeIcons?: boolean;
};

export const ComponentInfo: React.FC<ComponentInfoProps> = ({
  component,
  manager,
  className,
  ...props
}) => {
  const prettyName = (name: string | undefined, defaultName: string) => {
    if (name) {
      return (
        <span className="font-semibold">
          {name} <span className="opacity-60">[{defaultName}]</span>
        </span>
      );
    }
    return <span className="font-semibold">{defaultName}</span>;
  };

  const prettyType = (valueAlias: ArgType | undefined, type: ArgType | undefined) => {
    if (valueAlias) {
      if (Array.isArray(valueAlias)) {
        return `[${valueAlias.join(', ')}]`;
      }
      return `(${valueAlias})`;
    }
    if (!type) {
      return '';
    }
    if (Array.isArray(type)) {
      return `[${type.join(', ')}]`;
    }
    return `${type}`;
  };

  const prettyDescription = (description: string | undefined) => {
    if (!description) return '';
    return <p className="text-sm/5">{description}</p>;
  };

  const scrollToTopRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        node.scrollTop = 0;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [component]
  );

  if (!component) {
    return (
      <div className={twMerge(className, 'p-4 opacity-70')}>
        <p>Выберите компонент для отображения информации.</p>
      </div>
    );
  }

  const componentName = component.name ?? component.idx;

  return (
    <div
      className={twMerge(
        className,
        'overflow-auto pr-4 scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb'
      )}
      ref={scrollToTopRef}
    >
      {!props.noTitle && (
        <div className="mb-2 flex items-center">
          {manager.getRawComponentIcon(
            component.idx,
            twMerge('mr-2 size-10', component.img ? '' : 'rounded-full bg-gray-200 p-1')
          )}
          <span className="text-lg font-semibold">{componentName}</span>
        </div>
      )}
      <div className="text-sm">
        {convert(stringToHTML(component.description || 'Нет описания для этого компонента.'))}
      </div>
      {/* Параметры */}
      {component.constructorParameters &&
        Object.keys(component.constructorParameters).length > 0 && (
          <div className="mt-2">
            <h4 className="text-md mb-1 font-semibold">Параметры:</h4>
            <ul className="list-disc pl-5">
              {Object.entries(component.constructorParameters).map(([paramName, paramValue]) => (
                <li key={paramName} className="mb-1 text-sm">
                  {prettyName(paramValue.name, paramName)}: {paramValue.description || ''} <br />
                  <span className="italic opacity-70">
                    {prettyType(paramValue.valueAlias, paramValue.type)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      {/* Атрибуты */}
      {component.variables && Object.keys(component.variables).length > 0 && (
        <>
          <hr className="mt-4" />
          {props.noTypeIcons && <p className="mt-4 italic">Атрибуты:</p>}
          <div>
            {Object.entries(component.variables).map(([variableName, variableData]) => (
              <div className="mt-4">
                <div className="mb-2 flex items-center">
                  <img
                    className="mr-2 size-8 object-contain"
                    src={manager.getVariableIconUrl(component.idx, variableName)}
                  />
                  {!props.noTypeIcons && (
                    <span className="mr-1 cursor-help" title="атрибут">
                      🔢
                    </span>
                  )}
                  {prettyName(variableData.alias, variableName)}
                </div>
                {prettyDescription(variableData.description)}
              </div>
            ))}
          </div>
        </>
      )}
      {/* События */}
      {component.signals && Object.keys(component.signals).length > 0 && (
        <>
          <hr className="mt-4" />
          {props.noTypeIcons && <p className="mt-4 italic">События:</p>}
          <div>
            {Object.entries(component.signals).map(([eventName, eventData]) => (
              <div className="mt-4">
                <div className="mb-2 flex items-center">
                  <img
                    className="mr-2 size-8 object-contain"
                    src={manager.getEventIconUrl(component.idx, eventName)}
                  />
                  {!props.noTypeIcons && (
                    <span className="mr-1 cursor-help" title="событие">
                      🚩
                    </span>
                  )}
                  {prettyName(eventData.alias, eventName)}
                </div>
                {prettyDescription(eventData.description)}
              </div>
            ))}
          </div>
        </>
      )}
      {/* Методы */}
      {component.methods && Object.keys(component.methods).length > 0 && (
        <>
          <hr className="mt-4" />
          {props.noTypeIcons && <p className="mt-4 italic">Действия:</p>}
          <div>
            {Object.entries(component.methods).map(([methodName, methodData]) => (
              <div className="mt-4">
                <div className="mb-2 flex items-center">
                  <img
                    className="mr-2 size-8 object-contain"
                    src={manager.getActionIconUrl(component.idx, methodName)}
                  />
                  {!props.noTypeIcons && (
                    <span className="mr-1 cursor-help" title="действие">
                      ⚙️
                    </span>
                  )}
                  {prettyName(methodData.alias, methodName)}
                </div>
                {prettyDescription(methodData.description)}
                {methodData.parameters &&
                  methodData.parameters.length > 0 &&
                  methodData.parameters.map((param) => (
                    <ul className="mt-1 list-disc pl-5">
                      <li key={param.name} className="mb-1 text-sm">
                        {prettyName(undefined, param.name)}
                        {param.description ? <>: {param.description} </> : ''} <br />
                        <span className="italic opacity-70">
                          {prettyType(param.valueAlias, param.type)}
                        </span>
                      </li>
                    </ul>
                  ))}
              </div>
            ))}
          </div>
        </>
      )}
      {/* События */}
    </div>
  );
};

export default ComponentInfo;
