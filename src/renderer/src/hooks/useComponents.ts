import { useState } from 'react';

import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { getPlatform } from '@renderer/lib/data/PlatformLoader';
import { systemComponent, ComponentEntry } from '@renderer/lib/data/PlatformManager';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component } from '@renderer/types/diagram';
import { ComponentProto } from '@renderer/types/platform';

import { useModal } from './useModal';

export const useComponents = (controller: CanvasController) => {
  const modelController = useModelContext();
  // const model = modelController.model;
  const editor = controller.app;
  const [requestedSmId, setRequestedSmId] = useState<string | null>(null);
  const [requestedComponents, setRequestedComponents] = useState<{
    [id: string]: Component;
  }>({});
  // const components = model.useData(smId, 'elements.components') as {
  //   [id: string]: ComponentData;
  // };

  const [idx, setIdx] = useState('');
  const [data, setData] = useState<Component>({
    type: '',
    techName: '',
    parameters: {},
    order: 0,
    position: { x: 0, y: 0 },
  });
  const [proto, setProto] = useState(systemComponent);

  const [vacantComponents, setVacantComponents] = useState([] as ComponentEntry[]);

  const [isAddOpen, openAdd, closeAdd] = useModal(false);
  const [isEditOpen, openEdit, editClose] = useModal(false);
  const [isDeleteOpen, openDelete, deleteClose] = useModal(false);

  const validateComponentName = (name: string, validateProto: ComponentProto, idx: string) => {
    if (!requestedSmId) throw new Error('ssadasdas');
    const platformId = modelController.model.data.elements.stateMachines[requestedSmId].platform;
    const platform = getPlatform(platformId);
    const validationResult = modelController.validator.validateComponentName(
      requestedSmId,
      controller,
      validateProto,
      name,
      idx,
      platform
    );
    return validationResult;
  };

  const onRequestAddComponent = (smId: string, components: { [id: string]: Component }) => {
    const vacantComponents = controller.getVacantComponents(smId, components) as ComponentEntry[];

    setVacantComponents(vacantComponents);
    setRequestedSmId(smId);
    setRequestedComponents(components);
    openAdd();
  };

  const onRequestEditComponent = (
    smId: string,
    components: { [id: string]: Component },
    idx: string
  ) => {
    const controller = editor.controller;

    if (!controller.platform[smId]) return;

    const component = components[idx];
    if (typeof component === 'undefined') return;
    const proto = controller?.platform[smId].data.components[component.type];
    if (typeof proto === 'undefined') {
      console.error('non-existing %s %s', idx, component.type);
      return;
    }
    setRequestedSmId(smId);
    setRequestedComponents(components);
    setIdx(idx);
    setData(component);
    setProto(proto);
    openEdit();
  };

  const onRequestDeleteComponent = (
    idx: string,
    components?: { [id: string]: Component },
    smId?: string
  ) => {
    if ((!requestedSmId && !smId) || (!components && !requestedComponents)) return;
    const usedSm = smId ?? (requestedSmId as string);
    const usedComponents = components ?? requestedComponents;
    const controller = editor.controller;

    if (!controller.platform[usedSm]) return;

    const component = usedComponents[idx];
    if (typeof component === 'undefined') return;
    // NOTE: systemComponent имеет флаг singletone, что и используется в форме
    const proto = controller?.platform[usedSm].data.components[component.type] ?? systemComponent;

    setIdx(idx);
    if (components) {
      setRequestedComponents(components);
    }
    if (smId) {
      setRequestedSmId(smId);
    }
    setData(component);
    setProto(proto);
    openDelete();
  };

  const onAdd = (idx: string, name: string | undefined) => {
    if (!requestedSmId) throw new Error('No requested smId in onAdd');

    const realName = name ?? idx;
    modelController.createComponent({
      smId: requestedSmId,
      name: realName,
      techName: '',
      type: idx,
      parameters: {},
      position: { x: 0, y: 0 },
      order: 0,
    });

    onRequestEditComponent(requestedSmId, requestedComponents, realName);
  };

  const onEdit = (idx: string, data: Omit<Component, 'order' | 'position'>, newName?: string) => {
    if (!requestedSmId) throw new Error('No requested smId in onEdit');
    modelController.editComponent({
      smId: requestedSmId,
      id: idx,
      type: data.type,
      techName: data.techName,
      parameters: data.parameters,
      newName,
    });
  };

  const onDelete = (idx: string) => {
    if (!requestedSmId) throw new Error('No requested smId in onDelete');
    modelController.deleteComponent({ smId: requestedSmId, id: idx });

    editClose();
  };

  const onSwapComponents = (smId: string, name1: string, name2: string) => {
    modelController.swapComponents({ smId: smId, name1, name2 });
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
      validateComponentName,
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
    validateComponentName,
    onSwapComponents,
    onRequestAddComponent,
    onRequestDeleteComponent,
    onRequestEditComponent,
  };
};
