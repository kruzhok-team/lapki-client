import { useMemo } from 'react';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/new transition.svg';
import { ComponentAddModal } from '@renderer/components/ComponentAddModal';
import { ComponentDeleteModal } from '@renderer/components/ComponentDeleteModal';
import { ComponentEditModal } from '@renderer/components/ComponentEditModal';
import { useComponents } from '@renderer/hooks';
import { DEFAULT_STATE_DIMENSIONS } from '@renderer/lib/constants';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { MyMouseEvent } from '@renderer/lib/types';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component as ComponentData } from '@renderer/types/diagram';

import { Component } from './Component';

export interface StateMachineComponentListProps {
  isInitialized: boolean;
  controller: CanvasController;
  smId: string;
  dragName: string | null;
  selectedComponent: string | null;
  setSelectedComponent: React.Dispatch<React.SetStateAction<string | null>>;
  // onRequestEditComponent: (name: string) => void;
  // onRequestDeleteComponent: (name: string) => void;
  setDragName: (name: string) => void;
}

export const StateMachineComponentList: React.FC<StateMachineComponentListProps> = ({
  isInitialized,
  controller,
  smId,
  dragName,
  selectedComponent,
  setSelectedComponent,
  setDragName,
}) => {
  const {
    addProps,
    editProps,
    deleteProps,
    onSwapComponents,
    onRequestAddComponent,
    onRequestEditComponent,
    onRequestDeleteComponent,
  } = useComponents(controller);

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
  const onDragEndComponent = (name: string, e: React.DragEvent) => {
    const editorView = controller.app.view;
    const offset = controller.app.mouse.getOffset();
    if (e.clientX < offset.x || e.clientY < offset.y) return;
    const originalPoint = { x: e.clientX, y: e.clientY };
    const offsetPoint = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    const node = editorView.getCapturedNode({ position: offsetPoint });
    if (node) {
      // const event = {
      //   x,
      //   y,
      //   dx: x - this.px,
      //   dy: y - this.py,
      //   left: this.left,
      //   right: this.right,
      //   button: e.button,
      //   nativeEvent: e,
      // };
      node.handleMouseDoubleClick({
        x: offsetPoint.x,
        y: offsetPoint.y,
      } as MyMouseEvent);
    } else {
      modelController.createState({
        smId: smId,
        name: 'Состояние',
        events: [{ trigger: { component: name.split('::')[1], method: '' }, do: [] }],
        dimensions: DEFAULT_STATE_DIMENSIONS,
        position: editorView.windowToWorldCoords(offsetPoint),
        placeInCenter: true,
      });
      //controller.emit('createState', {});
    }
  };
  const isDisabled = !isInitialized;
  return (
    <>
      <div className="flex">
        <div className="flex w-full justify-start">{smName ?? smId}</div>
        <div className="ml-auto flex w-6 justify-end">
          <button
            type="button"
            className={'h-5 w-5 opacity-70 disabled:opacity-40'}
            disabled={isDisabled}
            onClick={() => onRequestAddComponent(smId, components)}
          >
            <AddIcon className="shrink-0" />
          </button>
        </div>
      </div>
      <div className="mb-2 mt-1 select-none">
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
                  platform[smId] !== undefined ? platform[smId].getFullComponentIcon(id) : undefined
                }
                isSelected={key === selectedComponent}
                isDragging={key === dragName}
                onCallContextMenu={() => onRequestEditComponent(smId, components, id)}
                onSelect={() => setSelectedComponent(key)}
                onEdit={() => onRequestEditComponent(smId, components, id)}
                onDelete={() => onRequestDeleteComponent(smId, components, id)}
                onDragStart={() => setDragName(key)}
                onDrop={() => onDropComponent(key)}
                onDragEnd={(e) => onDragEndComponent(key, e)}
              />
            );
          })
        )}
      </div>

      <ComponentAddModal {...addProps} />
      <ComponentEditModal {...editProps} />
      <ComponentDeleteModal {...deleteProps} />
    </>
  );
};
