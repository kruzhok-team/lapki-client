import { useState } from 'react';

import { systemComponent, ComponentEntry } from '@renderer/lib/data/PlatformManager';
import { useEditorContext } from '@renderer/store/EditorContext';
import { Component as ComponentData } from '@renderer/types/diagram';

import { useModal } from './useModal';

export const useComponents = () => {
  const editor = useEditorContext();
  const model = editor.controller.model;

  const components = model.useData('elements.components');

  const [idx, setIdx] = useState('');
  const [data, setData] = useState<ComponentData>({
    type: '',
    position: {
      x: 0,
      y: 0,
    },
    parameters: {},
    order: 0,
  });
  const [proto, setProto] = useState(systemComponent);

  const [vacantComponents, setVacantComponents] = useState([] as ComponentEntry[]);

  const [isCreateOpen, openCreate, closeCreate] = useModal(false);
  const [isChangeOpen, openChange, changeClose] = useModal(false);
  const [isDeleteOpen, openDelete, deleteClose] = useModal(false);

  const onRequestCreateComponent = () => {
    const controller = editor.controller;
    const vacantComponents = controller?.getVacantComponents() as ComponentEntry[];

    setVacantComponents(vacantComponents);

    openCreate();
  };

  const onRequestChangeComponent = (idx: string) => {
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
    openChange();
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

  const onCreate = (idx: string, name: string | undefined) => {
    const realName = name ?? idx;
    editor.controller.createComponent({
      name: realName,
      type: idx,
      position: {
        x: 0,
        y: 0,
      },
      parameters: {},
      order: 0,
    });

    onRequestChangeComponent(realName);
  };

  const onChange = (idx: string, data: Omit<ComponentData, 'order'>, newName?: string) => {
    editor.controller.changeComponent({
      name: idx,
      parameters: data.parameters,
      newName,
    });
  };

  const onDelete = (idx: string) => {
    editor.controller.deleteComponent({ name: idx, purge: false });

    changeClose();
  };

  const onSwapComponents = (name1: string, name2: string) => {
    editor.controller.swapComponents({ name1, name2 });
  };

  return {
    createProps: {
      isOpen: isCreateOpen,
      onClose: closeCreate,
      vacantComponents,
      onSubmit: onCreate,
    },
    changeProps: {
      isOpen: isChangeOpen,
      onClose: changeClose,
      idx,
      data,
      proto,
      onChange,
      onDelete: onRequestDeleteComponent,
    },
    deleteProps: {
      isOpen: isDeleteOpen,
      onClose: deleteClose,
      idx,
      data,
      proto,
      onChange,
      onSubmit: onDelete,
    },
    onSwapComponents,
    onRequestCreateComponent,
    onRequestDeleteComponent,
    onRequestChangeComponent,
  };
};
