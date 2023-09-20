import { useState } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Component as ComponentData } from '@renderer/types/diagram';
import { systemComponent } from '@renderer/lib/data/PlatformManager';
import { EditorManager } from '@renderer/lib/data/EditorManager';

export const useEditComponent = (editor: CanvasEditor | null, manager: EditorManager) => {
  const components = manager.useData('elements.components');

  const [idx, setIdx] = useState('');
  const [data, setData] = useState<ComponentData>({ type: '', parameters: {} });
  const [proto, setProto] = useState(systemComponent);

  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => setIsOpen(false);

  const onRequestEditComponent = (idx: string) => {
    const machine = editor!.container.machine;
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
    setData(data);
    setProto(proto);
    // setExistingComponents(existingComponents);
    setIsOpen(true);
  };

  const onEdit = (idx: string, data: ComponentData, newName?: string) => {
    editor!.container.machine.editComponent(idx, data.parameters, newName);
  };

  const onDelete = (idx: string) => {
    editor!.container.machine.removeComponent(idx, false);

    onClose();
  };

  return {
    isOpen,
    onClose,
    idx,
    data,
    proto,
    onEdit,
    onDelete,
    onRequestEditComponent,
  };
};
