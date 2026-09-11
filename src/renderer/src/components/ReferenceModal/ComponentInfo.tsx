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
        <span className="font-medium">
          {name} <span className="text-[#9D9D9D]">[{defaultName}]</span>
        </span>
      );
    }
    return <span className="font-medium text-[#9D9D9D]">{defaultName}</span>;
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
    return <p className="text-xs font-light leading-4">{description}</p>;
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
        'overflow-auto pr-1 text-xs font-light scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb'
      )}
      ref={scrollToTopRef}
    >
      {!props.noTitle && (
        <div className="mb-3 flex items-center gap-2">
          {manager.getRawComponentIcon(
            component.idx,
            twMerge('size-5', component.img ? '' : 'rounded-full bg-gray-200 p-0.5')
          )}
          <span className={twMerge('text-xs font-medium', !component.name && 'text-[#9D9D9D]')}>
            {componentName}
          </span>
        </div>
      )}
      <div className="text-xs font-light [&_*]:text-xs [&_*]:font-light">
        {convert(stringToHTML(component.description || 'Нет описания для этого компонента.'))}
      </div>
      {/* Параметры */}
      {component.constructorParameters &&
        Object.keys(component.constructorParameters).length > 0 && (
          <section className="mt-6">
            <h4 className="mb-3 font-medium">Параметры:</h4>
            <ul className="list-disc space-y-3 pl-5">
              {Object.entries(component.constructorParameters).map(([paramName, paramValue]) => (
                <li key={paramName}>
                  {prettyName(paramValue.name, paramName)}: {paramValue.description || ''} <br />
                  <span className="italic opacity-70">
                    {prettyType(paramValue.valueAlias, paramValue.type)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      {/* Атрибуты */}
      {component.variables && Object.keys(component.variables).length > 0 && (
        <section className="mt-6">
          <h4 className="mb-3 font-medium">Атрибуты:</h4>
          <div className="space-y-3">
            {Object.entries(component.variables).map(([variableName, variableData]) => (
              <div key={variableName}>
                <div className="mb-2 flex items-center">
                  <img
                    className="mr-2 size-5 object-contain"
                    src={manager.getVariableIconUrl(component.idx, variableName)}
                  />
                  {!props.noTypeIcons && (
                    <span
                      className="mr-1 inline-flex size-5 cursor-help items-center justify-center text-[20px] leading-5"
                      title="атрибут"
                    >
                      🔢
                    </span>
                  )}
                  {prettyName(variableData.alias, variableName)}
                </div>
                {prettyDescription(variableData.description)}
              </div>
            ))}
          </div>
        </section>
      )}
      {/* События */}
      {component.signals && Object.keys(component.signals).length > 0 && (
        <section className="mt-6">
          <h4 className="mb-3 font-medium">События:</h4>
          <div className="space-y-3">
            {Object.entries(component.signals).map(([eventName, eventData]) => (
              <div key={eventName}>
                <div className="mb-2 flex items-center">
                  <img
                    className="mr-2 size-5 object-contain"
                    src={manager.getEventIconUrl(component.idx, eventName)}
                  />
                  {!props.noTypeIcons && (
                    <span
                      className="mr-1 inline-flex size-5 cursor-help items-center justify-center text-[20px] leading-5"
                      title="событие"
                    >
                      🚩
                    </span>
                  )}
                  {prettyName(eventData.alias, eventName)}
                </div>
                {prettyDescription(eventData.description)}
              </div>
            ))}
          </div>
        </section>
      )}
      {/* Методы */}
      {component.methods && Object.keys(component.methods).length > 0 && (
        <section className="mt-6">
          <h4 className="mb-3 font-medium">Действия:</h4>
          <div className="space-y-3">
            {Object.entries(component.methods).map(([methodName, methodData]) => (
              <div key={methodName}>
                <div className="mb-2 flex items-center">
                  <img
                    className="mr-2 size-5 object-contain"
                    src={manager.getActionIconUrl(component.idx, methodName)}
                  />
                  {!props.noTypeIcons && (
                    <span
                      className="mr-1 inline-flex size-5 cursor-help items-center justify-center text-[20px] leading-5"
                      title="действие"
                    >
                      ⚙️
                    </span>
                  )}
                  {prettyName(methodData.alias, methodName)}
                </div>
                {prettyDescription(methodData.description)}
                {methodData.parameters && methodData.parameters.length > 0 && (
                  <ul className="mt-3 list-disc space-y-3 pl-5">
                    {methodData.parameters.map((param) => (
                      <li key={param.name}>
                        {prettyName(undefined, param.name)}
                        {param.description ? <>: {param.description} </> : ''} <br />
                        <span className="italic opacity-70">
                          {prettyType(param.valueAlias, param.type)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      {/* События */}
    </div>
  );
};

export default ComponentInfo;
