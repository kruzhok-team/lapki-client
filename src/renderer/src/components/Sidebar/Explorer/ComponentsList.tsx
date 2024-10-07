import React, { useState } from 'react';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/new transition.svg';
import { ComponentEditModal, ComponentAddModal, ComponentDeleteModal } from '@renderer/components';
import { useComponents } from '@renderer/hooks';
import { useModelContext } from '@renderer/store/ModelContext';

import { StateMachineComponentList } from './StateMachineComponentList';

export const ComponentsList: React.FC = () => {
  const modelController = useModelContext();
  const model = modelController.model;
  const headControllerId = modelController.model.useData('', 'headControllerId');
  // TODO: Передавать в модалки машину состояний
  const stateMachines = Object.keys(modelController.controllers[headControllerId].stateMachinesSub);
  const editor = modelController.getCurrentCanvas();
  const isInitialized = model.useData('', 'canvas.isInitialized', editor.id) as boolean;

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
        {stateMachines.map((smId: string) => (
          <StateMachineComponentList
            dragName={dragName}
            smId={smId}
            selectedComponent={selectedComponent}
            setDragName={setDragName}
            setSelectedComponent={setSelectedComponent}
            onDropComponent={onDropComponent}
            onRequestEditComponent={onRequestEditComponent}
            onRequestDeleteComponent={onRequestDeleteComponent}
          />
        ))}
      </div>

      <ComponentAddModal {...addProps} />
      <ComponentEditModal {...editProps} />
      <ComponentDeleteModal {...deleteProps} />
    </>
  );
};
