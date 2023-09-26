import { useEffect, useState } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { State } from '@renderer/lib/drawable/State';

export const useDiagramStateName = (editor: CanvasEditor | null) => {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState({} as State);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [sizes, setSizes] = useState({} as State['computedTitleSizes']);

  const onClose = () => setIsOpen(false);

  const onRename = (name: string) => {
    const stateId = state.id;
    if (!stateId) return;

    editor?.container.machine.changeStateName(stateId, name);

    onClose();
  };

  useEffect(() => {
    if (!editor) return;

    editor.container.states.onStateNameCreate((state) => {
      const globalOffset = state.container.app.mouse.getOffset();
      const statePos = state.computedPosition;
      const position = {
        x: statePos.x + globalOffset.x,
        y: statePos.y + globalOffset.y,
      };

      setPosition(position);
      setState(state);
      setSizes(state.computedTitleSizes);
      setIsOpen(true);
    });
  }, [editor]);

  return { isOpen, onClose, state, position, sizes, onRename };
};
