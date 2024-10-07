import { useState } from 'react';

import { useForm } from 'react-hook-form';

import { StateMachineData } from '@renderer/components/StateMachineEditModal';
import { generateId } from '@renderer/lib/utils';
import { useModelContext } from '@renderer/store/ModelContext';
import { emptyStateMachine } from '@renderer/types/diagram';

import { useModal } from './useModal';

export const useStateMachines = () => {
  const modelController = useModelContext();
  const model = modelController.model;

  // const currentSm = model.useData('', 'currentSm');

  const [idx, setIdx] = useState<string | undefined>(undefined); // индекс текущей машины состояний
  const [data, setData] = useState<StateMachineData>({
    name: '',
    platform: '',
  });

  const [isAddOpen, openAdd, closeAdd] = useModal(false);
  const [isEditOpen, openEdit, editClose] = useModal(false);
  const [isDeleteOpen, openDelete, deleteClose] = useModal(false);

  const editForm = useForm<StateMachineData>();
  const addForm = useForm<StateMachineData>();

  const onRequestAddStateMachine = () => {
    openAdd();
  };

  const onRequestEditStateMachine = (idx: string) => {
    const sm = modelController.model.data.elements.stateMachines[idx];

    if (!sm) {
      console.log(`sm doesnot exist ${idx}`);
      return;
    }
    const smData = { name: sm.name ?? '', platform: sm.platform };
    setIdx(idx);
    setData(smData);
    editForm.reset(smData);
    openEdit();
  };

  const onRequestDeleteStateMachine = (idx: string) => {
    const stateMachine = model.data.elements.stateMachines[idx];
    if (!stateMachine) return;
    const smData = { name: stateMachine.name ?? '', platform: stateMachine.platform };
    setIdx(idx);
    setData(smData);
    openDelete();
  };

  const onAdd = (data: StateMachineData) => {
    const smId = generateId();
    // TODO (Roundabout1): нужен метод, который создаст машину состояний из переданных данных
    modelController.createStateMachine(smId, emptyStateMachine());
    modelController.editStateMachine(smId, data);
  };

  const onEdit = (data: StateMachineData) => {
    if (!idx) return;
    modelController.editStateMachine(idx, data);
  };

  const onDelete = () => {
    if (!idx) return;
    // TODO: вызывает краш IDE
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
      addForm,
    },
    editProps: {
      isOpen: isEditOpen,
      onClose: editClose,
      onEdit,
      onDelete: openDelete,
      editForm,
    },
    deleteProps: {
      isOpen: isDeleteOpen,
      onClose: deleteClose,
      onSubmit: onDelete,
      data: data,
      idx: idx,
    },
    onRequestAddStateMachine,
    onRequestDeleteStateMachine,
    onRequestEditStateMachine,
  };
};
