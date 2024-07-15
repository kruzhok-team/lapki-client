import React, { useMemo, useState } from 'react';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/new transition.svg';
import {
  ComponentDeleteModal,
  ComponentCreateModal,
  ComponentChangeModal,
} from '@renderer/components';
import { useComponents } from '@renderer/hooks';
import { useEditorContext } from '@renderer/store/EditorContext';

import { Component } from './Component';

export const ComponentsList: React.FC = () => {
  const editor = useEditorContext();
  const model = editor.controller.model;

  const isInitialized = model.useData('isInitialized');
  const components = model.useData('elements.components');

  const {
    createProps,
    changeProps,
    deleteProps,
    onSwapComponents,
    onRequestCreateComponent,
    onRequestChangeComponent,
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
        onClick={onRequestCreateComponent}
      >
        <AddIcon className="shrink-0" />
        Добавить...
      </button>

      <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
        {sortedComponents.map((name) => (
          <Component
            key={name}
            name={name}
            isSelected={name === selectedComponent}
            isDragging={name === dragName}
            onSelect={() => setSelectedComponent(name)}
            onChange={() => onRequestChangeComponent(name)}
            onDelete={() => onRequestDeleteComponent(name)}
            onDragStart={() => setDragName(name)}
            onDrop={() => onDropComponent(name)}
          />
        ))}
      </div>

      <ComponentCreateModal {...createProps} />
      <ComponentChangeModal {...changeProps} />
      <ComponentDeleteModal {...deleteProps} />
    </>
  );
};
