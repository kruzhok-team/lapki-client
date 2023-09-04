import { useState } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { ComponentEntry } from '@renderer/lib/data/PlatformManager';

export const useAddComponent = (editor: CanvasEditor | null) => {
  const [vacantComponents, setVacantComponents] = useState([] as ComponentEntry[]);
  const [existingComponents, setExistingComponents] = useState(new Set<string>());

  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => setIsOpen(false);

  const onRequestAddComponent = () => {
    const machine = editor!.container.machine;
    const vacantComponents = machine.getVacantComponents();
    const existingComponents = new Set<string>();
    for (const name of machine.components.keys()) {
      existingComponents.add(name);
    }

    setVacantComponents(vacantComponents);
    setExistingComponents(existingComponents);
    setIsOpen(true);
  };

  const onSubmit = (idx: string, name?: string) => {
    const realName = name ?? idx;
    editor!.container.machine.addNewComponent(realName, idx);
  };

  return { isOpen, onClose, vacantComponents, existingComponents, onSubmit, onRequestAddComponent };
};
