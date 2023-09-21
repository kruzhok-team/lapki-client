import { useState } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';

export const useDeleteComponent = (editor: CanvasEditor | null, manager: EditorManager) => {
  const components = manager.useData('elements.components');

  const [idx, setIdx] = useState('');
  const [type, setType] = useState('');

  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => setIsOpen(false);

  const onRequestDeleteComponent = (idx: string) => {
    const machine = editor!.container.machine;
    const component = components[idx];
    if (typeof component === 'undefined') return;
    const proto = machine.platform.data.components[component.type];
    if (typeof proto === 'undefined') {
      console.error('non-existing %s %s', idx, component.type);
      return;
    }

    setIdx(idx);
    setType(component.type);
    setIsOpen(true);
  };

  const onSubmit = (idx: string) => {
    editor!.container.machine.removeComponent(idx, false);
  };

  return {
    isOpen,
    onClose,
    idx,
    type,
    onSubmit,
    onRequestDeleteComponent,
  };
};
