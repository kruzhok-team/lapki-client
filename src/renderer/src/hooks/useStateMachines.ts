import { useState } from 'react';

import { StateMachineData } from '@renderer/components/StateMachineEditModal';
import { generateId } from '@renderer/lib/utils';
import { useModelContext } from '@renderer/store/ModelContext';
import { emptyStateMachine } from '@renderer/types/diagram';

import { useModal } from './useModal';

export const useStateMachines = () => {
  const modelController = useModelContext();
  const model = modelController.model;

  // const currentSm = model.useData('', 'currentSm');

  const [idx, setIdx] = useState('');
  const [data, setData] = useState<StateMachineData>({
    name: '',
    platform: '',
  });

  const [isAddOpen, openAdd, closeAdd] = useModal(false);
  const [isEditOpen, openEdit, editClose] = useModal(false);
  const [isDeleteOpen, openDelete, deleteClose] = useModal(false);

  const onRequestAddStateMachine = () => {
    // openAdd();
  };

  const onRequestEditStateMachine = (idx: string, smId: string) => {
    // const sm = modelController.model.data.elements.stateMachines[smId];
    // if (!sm) {
    //   console.log(`sm doesnot exist ${smId}`);
    //   return;
    // }
    // const smName = sm.name ?? '';
    // const platform = sm.platform;
    // setIdx(idx);
    // setData({
    //   name: smName,
    //   platform,
    // });
    // openEdit();
  };

  const onRequestDeleteStateMachine = (idx: string) => {
    // const stateMachine = model.data.elements.stateMachines[idx];
    // if (!stateMachine) return;
    // // NOTE: systemComponent имеет флаг singletone, что и используется в форме
    // setIdx(idx);
    // setData({
    //   ...stateMachine,
    //   name: stateMachine.name ?? '',
    // });
    // openDelete();
  };

  const onAdd = (idx: string) => {
    // const smId = generateId();
    // modelController.createStateMachine(smId, emptyStateMachine());
    // onRequestEditStateMachine(idx, smId);
  };

  const onEdit = (idx: string, data: StateMachineData) => {
    modelController.editStateMachine(idx, data);
  };

  const onDelete = (idx: string) => {
    modelController.deleteStateMachine(idx);

    editClose();
  };

  // TODO: swap state machines
  // const onSwapComponents = (name1: string, name2: string) => {
  //   modelController.swapComponents({ smId: currentSm, name1, name2 });
  // };

  return {
    addProps: {
      isOpen: isAddOpen,
      onClose: closeAdd,
      onSubmit: onAdd,
    },
    editProps: {
      isOpen: isEditOpen,
      onClose: editClose,
      idx,
      data,
      onEdit,
      onDelete: onRequestDeleteStateMachine,
    },
    deleteProps: {
      isOpen: isDeleteOpen,
      onClose: deleteClose,
      idx,
      data,
      onEdit,
      onSubmit: onDelete,
    },
    onRequestAddStateMachine,
    onRequestDeleteStateMachine,
    onRequestEditStateMachine,
  };
};
