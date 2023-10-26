import { useState } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { systemComponent } from '@renderer/lib/data/PlatformManager';
import { Component as ComponentData } from '@renderer/types/diagram';

export const useEditDeleteComponent = (editor: CanvasEditor | null, manager: EditorManager) => {
  const components = manager.useData('elements.components');

  const [idx, setIdx] = useState('');
  const [data, setData] = useState<ComponentData>({ type: '', parameters: {} });
  const [proto, setProto] = useState(systemComponent);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const onEditClose = () => setIsEditOpen(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const onDeleteClose = () => setIsDeleteOpen(false);

  const onRequestEditComponent = (idx: string) => {
    const machine = editor!.container.machineController;
    const component = components[idx];
    if (typeof component === 'undefined') return;
    const proto = machine.platform.data.components[component.type];
    if (typeof proto === 'undefined') {
      console.error('non-existing %s %s', idx, component.type);
      return;
    }

    // const existingComponents = new Set<string>();
    // for (const name of machine.components.keys()) {
    //   if (name == idx) continue;
    //   existingComponents.add(name);
    // }

    setIdx(idx);
    setData(component);
    setProto(proto);
    // setExistingComponents(existingComponents);
    setIsEditOpen(true);
  };

  const onRequestDeleteComponent = (idx: string) => {
    const machine = editor!.container.machineController;
    const component = components[idx];
    if (typeof component === 'undefined') return;
    // NOTE: systemComponent имеет флаг singletone, что и используется в форме
    const proto = machine.platform.data.components[component.type] ?? systemComponent;

    setIdx(idx);
    setData(component);
    setProto(proto);
    setIsDeleteOpen(true);
  };

  const onEdit = (idx: string, data: ComponentData, newName?: string) => {
    editor!.container.machineController.editComponent({
      name: idx,
      parameters: data.parameters,
      newName,
    });
  };

  const onDelete = (idx: string) => {
    editor!.container.machineController.removeComponent({ name: idx, purge: false });

    onEditClose();
  };

  return {
    editProps: {
      isOpen: isEditOpen,
      onClose: onEditClose,
      idx,
      data,
      proto,
      onEdit,
      onDelete: onRequestDeleteComponent,
    },
    deleteProps: {
      isOpen: isDeleteOpen,
      onClose: onDeleteClose,
      idx,
      data,
      proto,
      onEdit,
      onSubmit: onDelete,
    },
    onRequestDeleteComponent,
    onRequestEditComponent,
  };
};
