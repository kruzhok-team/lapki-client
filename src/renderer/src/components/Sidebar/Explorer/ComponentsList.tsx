import React, { useState } from 'react';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/new transition.svg';
import { ComponentEditModal, ComponentAddModal, ComponentDeleteModal } from '@renderer/components';
import { useComponents } from '@renderer/hooks';
import { useEditorContext } from '@renderer/store/EditorContext';

import { Component } from './Component';

export const ComponentsList: React.FC = () => {
  const editor = useEditorContext();
  const model = editor.model;

  const isInitialized = model.useData('isInitialized');
  const components = model.useData('elements.components');

  const {
    addProps,
    editProps,
    deleteProps,
    osSwapComponents,
    onRequestAddComponent,
    onRequestEditComponent,
    onRequestDeleteComponent,
  } = useComponents();

  const [dragName, setDragName] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const onDropComponent = (name: string) => {
    if (!dragName) return;

    osSwapComponents(dragName, name);
  };

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
        {Object.entries(components)
          .sort((a, b) => a[1].order - b[1].order)
          .map((c) => c[0])
          .map((name) => (
            <Component
              key={name}
              name={name}
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
