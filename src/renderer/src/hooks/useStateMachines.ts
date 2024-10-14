import { useState } from 'react';

import { useForm } from 'react-hook-form';

import { StateMachineData } from '@renderer/components/StateMachineEditModal';
import { generateId } from '@renderer/lib/utils';
import { useModelContext } from '@renderer/store/ModelContext';
import { useTabs } from '@renderer/store/useTabs';
import { emptyStateMachine } from '@renderer/types/diagram';

import { useModal } from './useModal';

export const useStateMachines = () => {
  const modelController = useModelContext();
  const model = modelController.model;

  // const currentSm = model.useData('', 'currentSm');
  const [items, openTab, closeTab, renameTab] = useTabs((state) => [
    state.items,
    state.openTab,
    state.closeTab,
    state.renameTab,
  ]);
  const [idx, setIdx] = useState<string | undefined>(undefined); // индекс текущей машины состояний
  const [data, setData] = useState<StateMachineData | undefined>(undefined);

  const [isAddOpen, openAdd, closeAdd] = useModal(false);
  const [isEditOpen, openEdit, editClose] = useModal(false);
  const [isDeleteOpen, openDelete, deleteClose] = useModal(false);

  const editForm = useForm<StateMachineData>();
  const addForm = useForm<StateMachineData>();

  const onRequestAddStateMachine = () => {
    setIdx(undefined);
    setData(undefined);
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

  const onAdd = (data: StateMachineData) => {
    const smId = generateId();
    const sm = { ...emptyStateMachine(), ...data };
    const canvasId = modelController.createStateMachine(smId, sm);
    modelController.model.changeHeadControllerId(canvasId);
    openTab({ type: 'editor', canvasId: canvasId, name: sm.name ? sm.name : smId });
  };

  const onEdit = (data: StateMachineData) => {
    if (!idx) return;
    const sm = modelController.model.data.elements.stateMachines[idx];
    const smName = sm.name ?? '';
    if (data.name != smName) {
      renameTab(smName ? smName : idx, data.name ? data.name : idx);
    }
    modelController.editStateMachine(idx, data);
  };

  const onDelete = () => {
    if (!idx) return;

    // TODO: вызывает краш IDE
    for (const tab of items) {
      if (!(tab.type === 'editor')) continue;

      const tabController = modelController.controllers[tab.canvasId];

      if (!tabController.stateMachinesSub[idx] || !(tabController.type === 'specific')) continue;

      closeTab(tab.name, modelController);
      break;
    }
    modelController.deleteStateMachine(idx);

    editClose();
  };

  /**
   * Использовать только после вызова {@link onRequestEditStateMachine} или {@link onRequestAddStateMachine}.
   * @param name имя машины состояний.
   * @returns true, если имя дублирует имя другой машины состояний или её ID;
   * false, если имя отсутствует, или оно не дублирует другие имена или ID.
   */
  const isDuplicateName = (name: string) => {
    if (!name) return false;
    const machines = [...Object.entries(modelController.model.data.elements.stateMachines)];
    for (const [id, value] of machines) {
      if (id == idx) continue;
      if ((value.name && value.name == name) || name == id) {
        return true;
      }
    }
    return false;
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
    onRequestEditStateMachine,
    isDuplicateName,
  };
};
