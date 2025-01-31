import { useState } from 'react';

import { useModal } from '@renderer/hooks';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { State } from '@renderer/types/diagram';

import { Modal } from '../UI';

interface StateModalProps {
  smId: string;
  state: State;
  controller: CanvasController;
}

export const NewStateModal: React.FC<StateModalProps> = ({ state }) => {
  const [isOpen] = useModal(false);

  return (
    <Modal
      title={`Редактор состояния: ${state.name}`}
      // onSubmit={handleSubmit}
      isOpen={isOpen}
      // onRequestClose={close}
      // onAfterClose={handleAfterClose}
    >
      <div className="h-66 flex w-full flex-col overflow-y-auto break-words rounded border border-border-primary bg-bg-secondary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
        {/* <Trigger {...trigger} /> */}
        {/* {showCondition && <Condition {...condition} />} */}
        {/* <Actions {...actions} /> */}
        {/* <ColorField label="Цвет обводки:" value={color} onChange={setColor} /> */}
      </div>
    </Modal>
  );
};
