import React, { useMemo, useState } from 'react';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/new transition.svg';
import { ComponentEditModal, ComponentAddModal, ComponentDeleteModal } from '@renderer/components';
import { useComponents } from '@renderer/hooks';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component as ComponentData } from '@renderer/types/diagram';

import { Component } from './Component';

export const ComponentsList: React.FC = () => {
  const modelController = useModelContext();
  const model = modelController.model;
  const headControllerId = modelController.model.useData([], 'headControllerId');
  // TODO: Передавать в модалки машину состояний
  const stateMachines = Object.keys(modelController.controllers[headControllerId].stateMachinesSub);
  const editor = modelController.getCurrentCanvas();
  const isInitialized = model.useData([''], 'canvas.isInitialized', editor.id) as boolean;
  const components = model.useData(stateMachines, 'elements.components') as {
    [id: string]: ComponentData;
  };

  const {
    addProps,
    editProps,
    deleteProps,
    onSwapComponents,
    onRequestAddComponent,
    onRequestEditComponent,
    onRequestDeleteComponent,
  } = useComponents();

  const [dragName, setDragName] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const onDropComponent = (name: string) => {
    if (!dragName) return;

    onSwapComponents(dragName, name);
  };

  const sortedComponents = useMemo(() => {
    return Object.entries(components)
      .sort((a, b) => a[1].order - b[1].order)
      .map((c) => c[0]);
  }, [components]);

  return (
    <>
      <button
        type="button"
        className="btn-primary mb-2 flex w-full items-center justify-center gap-3"
        disabled={!isInitialized}
        onClick={onRequestAddComponent}
      >
        <AddIcon className="shrink-0" />
        Добавить...
      </button>

      <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
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

      <ComponentAddModal {...addProps} />
      <ComponentEditModal {...editProps} />
      <ComponentDeleteModal {...deleteProps} />
    </>
  );
};
