import { useState } from 'react';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/new transition.svg';
import { ReactComponent as StateMachineIcon } from '@renderer/assets/icons/state_machine.svg';
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

  const isInitialized = modelController.model.useData('', 'isInitialized');
  const elements = modelController.model.useData('', 'elements.stateMachinesId') as {
    [ID: string]: StateMachine;
  };
  const [selectedSm, setSmSelected] = useState<string | null>(null);
  const {
    addProps,
    editProps,
    deleteProps,
    // onSwapStateMachines
    // onRequestDeleteStateMachine,
    onRequestAddStateMachine,
    onRequestEditStateMachine,
    isDuplicateName,
    onDuplicateStateMachine,
  } = useStateMachines();

  const platformList = getAvailablePlatforms().map((platform) => {
    return { value: platform.idx, label: platform.name };
  });
  const isDisabled = !isInitialized;

  return (
    <section>
      <div className="mx-4 mb-3 flex justify-center border-b border-border-primary py-2 text-center text-lg">
        <div className="flex w-full justify-center">
          <h3>Машины состояний</h3>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className={'w-5 opacity-70 disabled:opacity-40'}
            disabled={isDisabled}
            onClick={onRequestAddStateMachine}
          >
            <AddIcon className="shrink-0" />
          </button>
        </div>
      </div>
      {isInitialized ? (
        <div className="px-4">
          <div className="overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
            {[...Object.entries(elements)].map(
              ([id, sm]) =>
                id !== '' && (
                  <Component
                    key={id}
                    name={sm.name || id}
                    isSelected={id === selectedSm}
                    icon={<StateMachineIcon className="fill-border-contrast" />}
                    onSelect={() => setSmSelected(id)}
                    onEdit={() => onCallContextMenu(id, sm)}
                    onDelete={() => undefined}
                    onCallContextMenu={() => onRequestEditStateMachine(id)}
                    // TODO (L140-beep): Доделать свап машин состояний
                    onDragStart={() => console.log('setDragState')}
                    onDrop={() => console.log('onDrop')}
                    isDragging={id === ''}
                  />
                )
            )}
          </div>
        </div>
      ) : (
        <div className="px-4">Недоступно до открытия схемы</div>
      )}

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
        duplicateStateMachine={onDuplicateStateMachine}
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
