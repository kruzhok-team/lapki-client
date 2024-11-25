import React, { useState } from 'react';

import { useModelContext } from '@renderer/store/ModelContext';

import { StateMachineComponentList } from './StateMachineComponentList';

export const ComponentsList: React.FC = () => {
  const modelController = useModelContext();
  const model = modelController.model;
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const stateMachines = Object.keys(
    modelController.controllers[headControllerId].useData('stateMachinesSub')
  );
  const controller = modelController.controllers[headControllerId];
  const editor = controller.app;
  const isInitialized = model.useData('', 'canvas.isInitialized', editor.id) as boolean;

  const [dragName, setDragName] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  return (
    <>
      <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
        {stateMachines.map((smId: string) => (
          <StateMachineComponentList
            isInitialized={isInitialized}
            controller={controller}
            dragName={dragName}
            smId={smId}
            selectedComponent={selectedComponent}
            setDragName={setDragName}
            setSelectedComponent={setSelectedComponent}
          />
        ))}
      </div>
    </>
  );
};
