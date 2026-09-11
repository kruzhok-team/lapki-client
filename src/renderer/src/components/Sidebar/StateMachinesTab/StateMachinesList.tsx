import { useEffect } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as StateMachineIcon } from '@renderer/assets/icons/state_machine.svg';
import { StateMachineEditModal } from '@renderer/components/StateMachineEditModal';
import { PanelHeader, ScrollArea } from '@renderer/components/UI';
import { useStateMachines } from '@renderer/hooks';
import { getAvailablePlatforms } from '@renderer/lib/data/PlatformLoader';
import { useModelContext } from '@renderer/store/ModelContext';
import { StateMachine } from '@renderer/types/diagram';

import { StateMachineDeleteModal } from './StateMachineDeleteModal';

import { Component } from '../Explorer/Component';

interface StateMachinesListProps {
  activeSm: string | null;
  selectedSm: string | null;
  setSmSelected: (newSmId: string | null) => void;
  isCollapsed: () => boolean;
  togglePanel: () => void;
}

export const StateMachinesList: React.FC<StateMachinesListProps> = ({
  activeSm,
  selectedSm,
  setSmSelected,
  isCollapsed,
  togglePanel,
}) => {
  const modelController = useModelContext();

  const openStateMachine = (stateMachineId: string) => {
    const controllerEntry = Object.entries(modelController.controllers).find(
      ([, controller]) =>
        controller.type === 'specific' && controller.stateMachinesSub[stateMachineId] !== undefined
    );

    if (!controllerEntry) return;

    const [controllerId] = controllerEntry;
    modelController.changeHeadControllerId(controllerId);
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
  const collapsed = isCollapsed();

  useEffect(() => {
    if (isCollapsed()) togglePanel();
  }, [elements]);

  // TODO (L140-beep): Необходимо доделать
  return (
    <section className="flex h-full min-h-0 flex-col">
      <PanelHeader
        title="Машины состояний"
        isCollapsed={isCollapsed}
        togglePanel={togglePanel}
        requestAddAction={onRequestAddStateMachine}
        isAddDisabled={isDisabled}
      />
      {!collapsed &&
        (isInitialized ? (
          <ScrollArea className="mb-2 flex-1" viewportClassName="select-none">
            {Object.keys(elements).length === 1 ? (
              <p className="pl-[19px] text-text-inactive">Нет машин состояний</p>
            ) : (
              [...Object.entries(elements)].map(
                ([id, sm]) =>
                  id !== '' && (
                    <Component
                      key={id}
                      name={sm.name || id}
                      isSelected={id === activeSm || id === selectedSm}
                      icon={
                        <StateMachineIcon
                          className={twMerge(
                            'size-6 [&_*]:stroke-[#6b6b6b]',
                            (id === activeSm || id === selectedSm) && '[&_*]:stroke-icon-hover'
                          )}
                        />
                      }
                      onSelect={() => setSmSelected(id)}
                      onEdit={() => openStateMachine(id)}
                      onDelete={() => undefined}
                      onCallContextMenu={() => onRequestEditStateMachine(id)}
                      // TODO (L140-beep): Доделать свап машин состояний
                      onDragStart={() => console.log('setDragState')}
                      onDrop={() => console.log('onDrop')}
                      isDragging={id === ''}
                    />
                  )
              )
            )}
          </ScrollArea>
        ) : (
          <div className="px-4">Недоступно до открытия документа</div>
        ))}

      <StateMachineEditModal
        variant="edit"
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
        variant="create"
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
      <StateMachineDeleteModal {...deleteProps} />
    </section>
  );
};
