import { useState } from 'react';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/new transition.svg';
import { StateMachineEditModal } from '@renderer/components/StateMachineEditModal';
import { useStateMachines } from '@renderer/hooks';
import { getAvailablePlatforms } from '@renderer/lib/data/PlatformLoader';
import { useModelContext } from '@renderer/store/ModelContext';
import { StateMachine } from '@renderer/types/diagram';

import { StateMachineDeleteModal } from './StateMachineDeleteModal';

import { Component } from '../Explorer/Component';

export const StateMachinesList: React.FC = () => {
  const modelController = useModelContext();

  const editor = modelController.getCurrentCanvas();
  const isInitialized = modelController.model.useData('', 'canvas.isInitialized', editor.id);
  const elements = modelController.model.useData('', 'elements.stateMachinesId') as {
    [ID: string]: StateMachine;
  };
  console.log(elements);
  const [selectedSm, setSmSelected] = useState<string | null>(null);
  const {
    addProps,
    editProps,
    deleteProps,
    // onSwapStateMachines
    onRequestAddStateMachine,
    onRequestEditStateMachine,
    onRequestDeleteStateMachine,
  } = useStateMachines();
  // TODO (Roundabout1): этот массив используется для теста, нужно будет доставать его из другого места
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
              icon={undefined}
              description={undefined}
              isSelected={id === selectedSm}
              onSelect={() => setSmSelected(id)}
              onEdit={() => onRequestEditStateMachine(id)}
              onDelete={() => onRequestDeleteStateMachine(id)}
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
      />
      <StateMachineDeleteModal {...deleteProps} />
    </section>
  );
};
