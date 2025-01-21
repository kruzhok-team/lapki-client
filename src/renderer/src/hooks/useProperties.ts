import { useState } from 'react';

import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { useModelContext } from '@renderer/store/ModelContext';
import { StateMachine } from '@renderer/types/diagram';

import { useModal } from './useModal';

export const useProperties = (controller: CanvasController) => {
  const modelController = useModelContext();
  const stateMachines = modelController.model.useData('', 'elements.stateMachinesId') as {
    [id: string]: StateMachine;
  };
  const stateMachinesId = Object.keys(stateMachines).filter((smId) => smId !== '');
  const defaultSm = Object.keys(stateMachines)[0];
  const [selectedSmId, setSelectedSmId] = useState<string>(defaultSm);

  const [isPropertiesModalOpen, openPropertiesModal, closePropertiesModal] = useModal(false);

  return {
    propertiesModalProps: {
      controller,
      stateMachines,
      stateMachinesId,
      onClose: closePropertiesModal,
      selectedSm: selectedSmId,
      setSelectedSm: setSelectedSmId,
      isOpen: isPropertiesModalOpen,
    },
    isPropertiesModalOpen,
    openPropertiesModal,
    closePropertiesModal,
    selectedSmId,
    setSelectedSmId,
  };
};
