import { useEffect } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as ArrowIcon } from '@renderer/assets/icons/arrow-down.svg';
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

interface StateMachinesListProps {
  selectedSm: string | null;
  setSmSelected: (newSmId: string | null) => void;
  isCollapsed: () => boolean;
  togglePanel: () => void;
}

export const StateMachinesList: React.FC<StateMachinesListProps> = ({
  selectedSm,
  setSmSelected,
  isCollapsed,
  togglePanel,
}) => {
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

  useEffect(() => {
    if (isCollapsed()) togglePanel();
  }, [elements]);

  const header = () => {
    return (
      <div className="flex">
        <button className="my-3 flex items-center" onClick={() => togglePanel()}>
          <ArrowIcon
            className={twMerge('rotate-0 transition-transform', isCollapsed() && '-rotate-90')}
          />
          <h3 className="font-semibold">Машины состояний</h3>
        </button>
        <div className="ml-auto flex">
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
    );
  };

  return (
    <section>
      {header()}
      {isInitialized ? (
        <div>
          <div className="overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
            {[...Object.entries(elements)].map(
              ([id, sm]) =>
                id !== '' && (
                  <Component
                    key={id}
                    name={sm.name || id}
                    isSelected={id === selectedSm}
                    icon={<StateMachineIcon className="size-8 fill-border-contrast" />}
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
        <div className="px-4">Недоступно до открытия документа</div>
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
