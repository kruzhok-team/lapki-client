import { useEffect, useMemo, useState } from 'react';

import { ComponentAddModal } from '@renderer/components/ComponentAddModal';
import { ComponentDeleteModal } from '@renderer/components/ComponentDeleteModal';
import { ComponentEditModal } from '@renderer/components/ComponentEditModal';
import { PanelHeader } from '@renderer/components/UI/PanelHeader';
import { ScrollArea } from '@renderer/components/UI/ScrollArea';
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

  const isDisabled = !isInitialized || headControllerId === '';
  const collapsed = isCollapsed();

  useEffect(() => {
    if (isCollapsed()) togglePanel();
  }, [sortedComponents.length]);

  return (
    <div key={smId} className="flex h-full min-h-0 flex-col">
      <PanelHeader
        title="Компоненты"
        isCollapsed={isCollapsed}
        togglePanel={togglePanel}
        requestAddAction={() => onRequestAddComponent(smId, components)}
        isAddDisabled={isDisabled}
      />
      {!collapsed &&
        (isInitialized ? (
          <ScrollArea className="mb-2 flex-1" viewportClassName="select-none">
            {headControllerId === '' ? (
              <p className="pl-[19px] text-text-inactive">Нет активной диаграммы</p>
            ) : sortedComponents.length === 0 ? (
              <p className="pl-[19px] text-text-inactive">Нет компонентов</p>
            ) : (
              sortedComponents.map((id) => {
                const name = components[id].name;
                const key = controller.components.getComponentKey(smId, id);
                return (
                  <Component
                    key={key}
                    name={name ?? id}
                    variant="compact"
                    description={
                      platform[smId] !== undefined
                        ? platform[smId].getComponent(id)?.description
                        : undefined
                    }
                    icon={
                      platform[smId] !== undefined
                        ? platform[smId].getFullComponentIcon(
                            id,
                            'size-[26px] [&>p]:bottom-0 [&>p]:right-0 [&>p]:text-[8px] [&>p]:leading-[9px]'
                          )
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
          </ScrollArea>
        ) : (
          <div className="px-4">Недоступно до открытия документа</div>
        ))}

      <ComponentAddModal {...addProps} />
      <ComponentEditModal {...editProps} />
      <ComponentDeleteModal {...deleteProps} />
    </div>
  );
};
