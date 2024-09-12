import { useState } from 'react';

import { systemComponent, ComponentEntry } from '@renderer/lib/data/PlatformManager';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component as ComponentData } from '@renderer/types/diagram';

import { useModal } from './useModal';

export const useComponents = () => {
  const modelController = useModelContext();
  const model = modelController.model;
  const editor = modelController.getCurrentCanvas();
  const components = model.data.elements.stateMachines[modelController.currentSmId!].components;

  const [idx, setIdx] = useState('');
  const [data, setData] = useState<ComponentData>({
    type: '',
    parameters: {},
    order: 0,
    position: { x: 0, y: 0 },
  });
  const [proto, setProto] = useState(systemComponent);

  const [vacantComponents, setVacantComponents] = useState([] as ComponentEntry[]);

  const [isAddOpen, openAdd, closeAdd] = useModal(false);
  const [isEditOpen, openEdit, editClose] = useModal(false);
  const [isDeleteOpen, openDelete, deleteClose] = useModal(false);

  const onRequestAddComponent = () => {
    const vacantComponents = modelController.getVacantComponents() as ComponentEntry[];

    setVacantComponents(vacantComponents);

    openAdd();
  };

  const onRequestEditComponent = (idx: string) => {
    const controller = editor.controller;

    if (!controller.platform) return;

    const component = components[idx];
    if (typeof component === 'undefined') return;
    const proto = controller?.platform.data.components[component.type];
    if (typeof proto === 'undefined') {
      console.error('non-existing %s %s', idx, component.type);
      return;
    }

    setIdx(idx);
    setData(component);
    setProto(proto);
    openEdit();
  };

  const onRequestDeleteComponent = (idx: string) => {
    const controller = editor.controller;

    if (!controller.platform) return;

    const component = components[idx];
    if (typeof component === 'undefined') return;
    // NOTE: systemComponent имеет флаг singletone, что и используется в форме
    const proto = controller?.platform.data.components[component.type] ?? systemComponent;

    setIdx(idx);
    setData(component);
    setProto(proto);
    openDelete();
  };

  const onAdd = (idx: string, name: string | undefined) => {
    const realName = name ?? idx;
    modelController.createComponent({
      smId: modelController.currentSmId!,
      name: realName,
      type: idx,
      parameters: {},
      position: { x: 0, y: 0 },
      order: 0,
    });

    onRequestEditComponent(realName);
  };

  const onEdit = (
    idx: string,
    data: Omit<ComponentData, 'order' | 'position'>,
    newName?: string
  ) => {
    modelController.editComponent({
      smId: modelController.currentSmId!,
      id: idx,
      type: data.type,
      parameters: data.parameters,
      newName,
    });
  };

  const onDelete = (idx: string) => {
    modelController.deleteComponent({ smId: modelController.currentSmId!, id: idx });

    editClose();
  };

  const onSwapComponents = (name1: string, name2: string) => {
    modelController.swapComponents({ smId: modelController.currentSmId!, name1, name2 });
  };

  return {
    addProps: {
      isOpen: isAddOpen,
      onClose: closeAdd,
      vacantComponents,
      onSubmit: onAdd,
    },
    editProps: {
      isOpen: isEditOpen,
      onClose: editClose,
      idx,
      data,
      proto,
      onEdit,
      onDelete: onRequestDeleteComponent,
    },
    deleteProps: {
      isOpen: isDeleteOpen,
      onClose: deleteClose,
      idx,
      data,
      proto,
      onEdit,
      onSubmit: onDelete,
    },
    onSwapComponents,
    onRequestAddComponent,
    onRequestDeleteComponent,
    onRequestEditComponent,
  };
};
