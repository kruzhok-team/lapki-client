import { useState } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { ComponentEntry } from '@renderer/lib/data/PlatformManager';

export const useAddComponent = (editor: CanvasEditor | null, manager: EditorManager) => {
  const components = manager.useData('elements.components');

  const [vacantComponents, setVacantComponents] = useState([] as ComponentEntry[]);
  const [existingComponents, setExistingComponents] = useState(new Set<string>());

  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => setIsOpen(false);

  const onRequestAddComponent = () => {
    const machine = editor!.container.machineController;
    const vacantComponents = machine.getVacantComponents();
    const existingComponents = new Set<string>();
    for (const name in components) {
      existingComponents.add(name);
    }

    setVacantComponents(vacantComponents);
    setExistingComponents(existingComponents);
    setIsOpen(true);
  };

  const onSubmit = (idx: string, name?: string) => {
    const realName = name ?? idx;
    editor!.container.machineController.addComponent({ name: realName, type: idx });
  };

  return { isOpen, onClose, vacantComponents, existingComponents, onSubmit, onRequestAddComponent };
};
