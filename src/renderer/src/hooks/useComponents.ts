import { useState } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { systemComponent, ComponentEntry } from '@renderer/lib/data/PlatformManager';
import { Component as ComponentData } from '@renderer/types/diagram';

import { useModal } from './useModal';

export const useComponents = (editor: CanvasEditor | null, manager: EditorManager) => {
  const components = manager.useData('elements.components');

  const [idx, setIdx] = useState('');
  const [data, setData] = useState<ComponentData>({ type: '', parameters: {} });
  const [proto, setProto] = useState(systemComponent);

  const [vacantComponents, setVacantComponents] = useState([] as ComponentEntry[]);

  const [isAddOpen, openAdd, closeAdd] = useModal(false);
  const [isEditOpen, openEdit, editClose] = useModal(false);
  const [isDeleteOpen, openDelete, deleteClose] = useModal(false);

  const onRequestAddComponent = () => {
    const machine = editor?.container.machineController;
    const vacantComponents = machine?.getVacantComponents() as ComponentEntry[];

    setVacantComponents(vacantComponents);

    openAdd();
  };

  const onRequestEditComponent = (idx: string) => {
    const machine = editor?.container.machineController;
    const component = components[idx];
    if (typeof component === 'undefined') return;
    const proto = machine?.platform.data.components[component.type];
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
    const machine = editor?.container.machineController;
    const component = components[idx];
    if (typeof component === 'undefined') return;
    // NOTE: systemComponent имеет флаг singletone, что и используется в форме
    const proto = machine?.platform.data.components[component.type] ?? systemComponent;

    setIdx(idx);
    setData(component);
    setProto(proto);
    openDelete();
  };

  const onAdd = (idx: string, name: string | undefined) => {
    const realName = name ?? idx;
    editor?.container.machineController.addComponent({ name: realName, type: idx });

    onRequestEditComponent(realName);
  };

  const onEdit = (idx: string, data: ComponentData, newName?: string) => {
    editor?.container.machineController.editComponent({
      name: idx,
      parameters: data.parameters,
      newName,
    });
  };

  const onDelete = (idx: string) => {
    editor?.container.machineController.removeComponent({ name: idx, purge: false });

    editClose();
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
    onRequestAddComponent,
    onRequestDeleteComponent,
    onRequestEditComponent,
  };
};
