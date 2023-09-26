import { useState } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { Component as ComponentData } from '@renderer/types/diagram';
import { systemComponent } from '@renderer/lib/data/PlatformManager';

export const useDeleteComponent = (editor: CanvasEditor | null, manager: EditorManager) => {
  const components = manager.useData('elements.components');

  const [idx, setIdx] = useState('');
  const [data, setData] = useState<ComponentData>({ type: '', parameters: {} });
  const [proto, setProto] = useState(systemComponent);

  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => setIsOpen(false);

  const onRequestDeleteComponent = (idx: string) => {
    const machine = editor!.container.machine;
    const component = components[idx];
    if (typeof component === 'undefined') return;
    // NOTE: systemComponent имеет флаг singletone, что и используется в форме
    const proto = machine.platform.data.components[component.type] ?? systemComponent;

    setIdx(idx);
    setData(component);
    setProto(proto);
    setIsOpen(true);
  };

  const onSubmit = (idx: string) => {
    editor!.container.machine.removeComponent(idx, false);
  };

  return {
    isOpen,
    onClose,
    idx,
    data,
    proto,
    onSubmit,
    onRequestDeleteComponent,
  };
};
