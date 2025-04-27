import { useEffect, useMemo, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as ArrowIcon } from '@renderer/assets/icons/arrow-down.svg';
import { ReactComponent as AddIcon } from '@renderer/assets/icons/new transition.svg';
import { ComponentAddModal } from '@renderer/components/ComponentAddModal';
import { ComponentDeleteModal } from '@renderer/components/ComponentDeleteModal';
import { ComponentEditModal } from '@renderer/components/ComponentEditModal';
import { useComponents } from '@renderer/hooks';
import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component as ComponentData } from '@renderer/types/diagram';

import { Component } from './Component';

export interface StateMachineComponentListProps {
  smId: string;
  isCollapsed: () => boolean;
  togglePanel: () => void;
}

export const StateMachineComponentList: React.FC<StateMachineComponentListProps> = ({
  smId,
  isCollapsed,
  togglePanel,
}) => {
  const modelController = useModelContext();
  const model = modelController.model;
  const components = model.useData(smId, 'elements.components') as {
    [id: string]: ComponentData;
  };
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const controller = modelController.controllers[headControllerId];
  const platform = controller.useData('platform') as { [id: string]: PlatformManager };
  const isInitialized = modelController.model.useData('', 'isInitialized');
  const smName = model.useData(smId, 'elements.name');

  const {
    addProps,
    editProps,
    deleteProps,
    onSwapComponents,
    onRequestAddComponent,
    onRequestEditComponent,
    onRequestDeleteComponent,
  } = useComponents(controller);

  const sortedComponents = useMemo(() => {
    return Object.entries(components)
      .sort((a, b) => a[1].order - b[1].order)
      .map((c) => c[0]);
  }, [components]);

  const [dragName, setDragName] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const onDropComponent = (name: string) => {
    if (!dragName) return;

    /* 
      Сюда приходят названия вида smId::componentId
      Но в модели данных компоненты хранятся как componentId
      Поэтому сплитим
    */
    const splittedDragName = dragName.split('::')[1];
    const splittedName = name.split('::')[1];
    onSwapComponents(smId, splittedDragName, splittedName);
  };

  const isDisabled = !isInitialized;

  useEffect(() => {
    if (isCollapsed()) togglePanel();
  }, [sortedComponents.length]);

  const header = () => {
    return (
      <div className="flex">
        <button className="my-3 flex items-center" onClick={() => togglePanel()}>
          <ArrowIcon
            className={twMerge('rotate-0 transition-transform', isCollapsed() && '-rotate-90')}
          />
          <h3 className="font-semibold">Компоненты</h3>
        </button>
        <div className="ml-auto flex">
          <button
            type="button"
            className={'w-5 opacity-70 disabled:opacity-40'}
            disabled={isDisabled}
            onClick={() => onRequestAddComponent(smId, components)}
          >
            <AddIcon className="shrink-0" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div key={smId}>
      {header()}
      {smName ?? smId}
      {isInitialized ? (
        <div className="mb-2 mt-1 max-h-full select-none overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
          {sortedComponents.length === 0 ? (
            <p className="text-text-inactive">Нет компонентов</p>
          ) : (
            sortedComponents.map((id) => {
              const name = components[id].name;
              const key = controller.components.getComponentKey(smId, id);
              return (
                <Component
                  key={key}
                  name={name ?? id}
                  description={
                    platform[smId] !== undefined
                      ? platform[smId].getComponent(id)?.description
                      : undefined
                  }
                  icon={
                    platform[smId] !== undefined
                      ? platform[smId].getFullComponentIcon(id)
                      : undefined
                  }
                  isSelected={key === selectedComponent}
                  isDragging={key === dragName}
                  onCallContextMenu={() => onRequestEditComponent(smId, components, id)}
                  onSelect={() => setSelectedComponent(key)}
                  onEdit={() => onRequestEditComponent(smId, components, id)}
                  onDelete={() => onRequestDeleteComponent(smId, components, id)}
                  onDragStart={() => setDragName(key)}
                  onDrop={() => onDropComponent(key)}
                />
              );
            })
          )}
        </div>
      ) : (
        <div className="px-4">Недоступно до открытия документа</div>
      )}

      <ComponentAddModal {...addProps} />
      <ComponentEditModal {...editProps} />
      <ComponentDeleteModal {...deleteProps} />
    </div>
  );
};
