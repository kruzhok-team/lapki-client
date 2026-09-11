import { useCallback, useState } from 'react';

import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { Action } from '@renderer/types/diagram';

import { useActionsModal } from './useActionModal';

import type { ActionsModalData } from '../ActionsModal';

interface OpenActionEditorParams {
  index: number | null;
  action?: Action;
  isEditingEvent?: boolean;
  persistOnSave?: boolean;
}

type ActionEditorSubmitHandler = (
  data: Action,
  index: number | null | undefined,
  initialData: ActionsModalData | undefined
) => void;

export const useActionEditor = (
  smId: string,
  controller: CanvasController,
  onSubmit: ActionEditorSubmitHandler
) => {
  const [actionIndex, setActionIndex] = useState<number | null>(null);
  const [initialData, setInitialData] = useState<ActionsModalData | undefined>();

  const handleSubmit = useCallback(
    (data: Action, index?: number | null) => onSubmit(data, index, initialData),
    [initialData, onSubmit]
  );

  const modalProps = useActionsModal(smId, controller, actionIndex, handleSubmit, initialData);
  const resetModal = modalProps.reset;

  const reset = useCallback(() => {
    resetModal();
    setActionIndex(null);
    setInitialData(undefined);
  }, [resetModal]);

  const open = useCallback(
    ({ index, action, isEditingEvent = false, persistOnSave }: OpenActionEditorParams) => {
      resetModal();
      setActionIndex(index);
      setInitialData(action ? { smId, action, isEditingEvent, persistOnSave } : undefined);
    },
    [resetModal, smId]
  );

  return {
    open,
    reset,
    handleSubmit: modalProps.handleSubmit,
    modalProps,
  };
};
