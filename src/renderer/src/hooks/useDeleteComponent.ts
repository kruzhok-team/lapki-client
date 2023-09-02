import { useState } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';

export const useDeleteComponent = (editor: CanvasEditor | null) => {
  const [idx, setIdx] = useState('');
  const [type, setType] = useState('');

  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => setIsOpen(false);

  const onRequestDeleteComponent = (idx: string) => {
    const machine = editor!.container.machine;
    const component = machine.components.get(idx);
    if (typeof component === 'undefined') return;
    const data = component.data;
    const proto = machine.platform.data.components[data.type];
    if (typeof proto === 'undefined') {
      console.error('non-existing %s %s', idx, data.type);
      return;
    }

    setIdx(idx);
    setType(data.type);
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
