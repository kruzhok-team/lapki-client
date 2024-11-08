import { useMemo } from 'react';

import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component as ComponentData } from '@renderer/types/diagram';

import { Component } from './Component';

export interface StateMachineComponentListProps {
  controller: CanvasController;
  smId: string;
  dragName: string | null;
  selectedComponent: string | null;
  setSelectedComponent: React.Dispatch<React.SetStateAction<string | null>>;
  onRequestEditComponent: (name: string) => void;
  onRequestDeleteComponent: (name: string) => void;
  setDragName: (name: string) => void;
  onDropComponent: (name: string) => void;
}

export const StateMachineComponentList: React.FC<StateMachineComponentListProps> = ({
  controller,
  smId,
  dragName,
  selectedComponent,
  setSelectedComponent,
  onRequestDeleteComponent,
  onRequestEditComponent,
  setDragName,
  onDropComponent,
}) => {
  const modelController = useModelContext();
  const model = modelController.model;
  const components = model.useData(smId, 'elements.components') as {
    [id: string]: ComponentData;
  };
  const platform = controller.useData('platform') as { [id: string]: PlatformManager };
  const smName = model.useData(smId, 'elements.name');

  const sortedComponents = useMemo(() => {
    return Object.entries(components)
      .sort((a, b) => a[1].order - b[1].order)
      .map((c) => c[0]);
  }, [components]);

  return (
    <div>
      <div>{smName ?? smId}</div>
      {/* <Panel
        id="panel2"
        ref={hierarchyPanelRef}
        collapsible
        collapsedSize={2.5}
        onCollapse={forceUpdate}
        onExpand={forceUpdate}
        className="px-4"
      >
        <button className="mb-3 flex items-center" onClick={() => togglePanel(hierarchyPanelRef)}>
          <ArrowIcon
            className={twMerge(
              'rotate-0 transition-transform',
              hierarchyPanelRef.current?.isCollapsed() && '-rotate-90'
            )}
          />
          <h3 className="font-semibold">Иерархия состояний</h3>
        </button>

        {isInitialized ? <Hierarchy /> : 'Недоступно до открытия схемы'}
      </Panel> */}
      {sortedComponents.map((name) => (
        <Component
          key={name}
          name={name}
          description={
            platform[smId] !== undefined
              ? platform[smId].getComponent(name)?.description
              : undefined
          }
          icon={
            platform[smId] !== undefined ? platform[smId].getFullComponentIcon(name) : undefined
          }
          isSelected={name === selectedComponent}
          isDragging={name === dragName}
          onCallContextMenu={() => onRequestEditComponent(name)}
          onSelect={() => setSelectedComponent(name)}
          onEdit={() => onRequestEditComponent(name)}
          onDelete={() => onRequestDeleteComponent(name)}
          onDragStart={() => setDragName(name)}
          onDrop={() => onDropComponent(name)}
        />
      ))}
    </div>
  );
};
