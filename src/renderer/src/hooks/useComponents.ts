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

  const [id, setId] = useState('');
  const [data, setData] = useState<Component>({
    type: '',
    name: '',
    parameters: {},
    order: 0,
    position: { x: 0, y: 0 },
  });
  const [proto, setProto] = useState(systemComponent);

  const [vacantComponents, setVacantComponents] = useState([] as ComponentEntry[]);

  const [isAddOpen, openAdd, closeAdd] = useModal(false);
  const [isEditOpen, openEdit, editClose] = useModal(false);
  const [isDeleteOpen, openDelete, deleteClose] = useModal(false);

  const validateComponentId = (newId: string, validateProto: ComponentProto, id: string) => {
    if (!requestedSmId) throw new Error('ssadasdas');
    const platformId = modelController.model.data.elements.stateMachines[requestedSmId].platform;
    const platform = getPlatform(platformId);
    const validationResult = modelController.validator.validateComponentId(
      requestedSmId,
      controller,
      validateProto,
      newId,
      id,
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
    id: string
  ) => {
    const controller = editor.controller;

    if (!controller.platform[smId]) return;

    const component = components[id];
    if (typeof component === 'undefined') return;
    const proto = controller?.platform[smId].data.components[component.type];
    if (typeof proto === 'undefined') {
      console.error('non-existing %s %s', id, component.type);
      return;
    }
    setRequestedSmId(smId);
    setRequestedComponents(components);
    setId(id);
    setData(component);
    setProto(proto);
    openEdit();
  };

  const onRequestDeleteComponent = (
    id: string,
    components?: { [id: string]: Component },
    smId?: string
  ) => {
    if ((!requestedSmId && !smId) || (!components && !requestedComponents)) return;
    const usedSm = smId ?? (requestedSmId as string);
    const usedComponents = components ?? requestedComponents;
    const controller = editor.controller;

    if (!controller.platform[usedSm]) return;

    const component = usedComponents[id];
    if (typeof component === 'undefined') return;
    // NOTE: systemComponent имеет флаг singletone, что и используется в форме
    const proto = controller?.platform[usedSm].data.components[component.type] ?? systemComponent;

    setId(id);
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

  const onAdd = (componentType: string, name: string | undefined) => {
    if (!requestedSmId) throw new Error('No requested smId in onAdd');

    const realId = name ?? componentType;
    modelController.createComponent({
      smId: requestedSmId,
      id: realId,
      type: componentType,
      parameters: {},
      position: { x: 30, y: 30 },
      order: 0,
    });

    onRequestEditComponent(requestedSmId, requestedComponents, realId);
  };

  const onEdit = (idx: string, data: Omit<Component, 'order' | 'position'>, newId?: string) => {
    if (!requestedSmId) throw new Error('No requested smId in onEdit');
    modelController.editComponent({
      smId: requestedSmId,
      id: idx,
      name: data.name,
      type: data.type,
      parameters: data.parameters,
      newId,
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
      id,
      data,
      proto,
      onEdit,
      onDelete: onRequestDeleteComponent,
      validateComponentId,
    },
    deleteProps: {
      isOpen: isDeleteOpen,
      onClose: deleteClose,
      id,
      data,
      proto,
      onEdit,
      onSubmit: onDelete,
    },
    validateComponentId,
    onSwapComponents,
    onRequestAddComponent,
    onRequestDeleteComponent,
    onRequestEditComponent,
  };
};
