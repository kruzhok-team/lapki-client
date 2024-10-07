import { useMemo } from 'react';

import { useModelContext } from '@renderer/store/ModelContext';
import { Component as ComponentData } from '@renderer/types/diagram';

import { Component } from './Component';

export interface StateMachineComponentListProps {
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

  const name = model.useData(smId, 'elements.name');
  const editor = modelController.getCurrentCanvas();

  const sortedComponents = useMemo(() => {
    return Object.entries(components)
      .sort((a, b) => a[1].order - b[1].order)
      .map((c) => c[0]);
  }, [components]); // не ререндерится

  return (
    <div>
      <div>{name ?? smId}</div>
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
          description={editor.controller.platform?.getComponent(name)?.description}
          icon={editor.controller.platform?.getFullComponentIcon(name)}
          isSelected={name === selectedComponent}
          isDragging={name === dragName}
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
