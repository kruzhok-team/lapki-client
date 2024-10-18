import { useState } from 'react';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/new transition.svg';
import { StateMachineEditModal } from '@renderer/components/StateMachineEditModal';
import { useStateMachines } from '@renderer/hooks';
import { getAvailablePlatforms } from '@renderer/lib/data/PlatformLoader';
import { useModelContext } from '@renderer/store/ModelContext';
import { useTabs } from '@renderer/store/useTabs';
import { StateMachine } from '@renderer/types/diagram';

import { StateMachineDeleteModal } from './StateMachineDeleteModal';

import { Component } from '../Explorer/Component';

export const StateMachinesList: React.FC = () => {
  const modelController = useModelContext();

  const openTab = useTabs((state) => state.openTab);

  const onCallContextMenu = (name: string, sM: StateMachine) => {
    for (const controllerId in modelController.controllers) {
      const controller = modelController.controllers[controllerId];
      if (!controller.stateMachinesSub[name] || !(controller.type === 'specific')) continue;

      openTab(modelController, {
        type: 'editor',
        name: sM.name ?? name,
        canvasId: controller.id,
      });
    }
  };

  const editor = modelController.getCurrentCanvas();
  const isInitialized = modelController.model.useData('', 'canvas.isInitialized', editor.id);
  const elements = modelController.model.useData('', 'elements.stateMachinesId') as {
    [ID: string]: StateMachine;
  };
  const [selectedSm, setSmSelected] = useState<string | null>(null);
  const {
    addProps,
    editProps,
    deleteProps,
    // onSwapStateMachines
    onRequestAddStateMachine,
    onRequestEditStateMachine,
    isDuplicateName,
  } = useStateMachines();

  const platformList = getAvailablePlatforms().map((platform) => {
    return { value: platform.idx, label: platform.name };
  });

  return (
    <section>
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Машины состояний
      </h3>
      <div className="px-4">
        <button
          type="button"
          className="btn-primary mb-2 flex w-full items-center justify-center gap-3"
          disabled={!isInitialized}
          onClick={onRequestAddStateMachine}
        >
          <AddIcon className="shrink-0" />
          Добавить...
        </button>
        <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
          {[...Object.entries(elements)].map(([id, sm]) => (
            <Component
              key={id}
              name={sm.name || id}
              isSelected={id === selectedSm}
              onSelect={() => setSmSelected(id)}
              onEdit={() => onRequestEditStateMachine(id)}
              onDelete={() => undefined}
              onCallContextMenu={() => onCallContextMenu(id, sm)}
              // TODO: Доделать свап машин состояний
              onDragStart={() => console.log('setDragState')}
              onDrop={() => console.log('onDrop')}
              isDragging={id === ''}
            />
          ))}
        </div>
      </div>
      <StateMachineEditModal
        form={editProps.editForm}
        isOpen={editProps.isOpen}
        onClose={editProps.onClose}
        onSubmit={editProps.onEdit}
        submitLabel="Применить"
        onSide={editProps.onDelete}
        sideLabel="Удалить"
        platformList={platformList}
        isDuplicateName={isDuplicateName}
        selectPlatformDisabled={true}
      />
      <StateMachineEditModal
        form={addProps.addForm}
        isOpen={addProps.isOpen}
        onClose={addProps.onClose}
        onSubmit={addProps.onSubmit}
        submitLabel="Добавить"
        onSide={undefined}
        sideLabel={undefined}
        platformList={platformList}
        isDuplicateName={isDuplicateName}
        selectPlatformDisabled={false}
      />
      <StateMachineDeleteModal {...{ ...deleteProps, idx: selectedSm ?? undefined }} />
    </section>
  );
};
