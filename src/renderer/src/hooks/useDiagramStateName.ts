import { useEffect, useState } from 'react';

import { State } from '@renderer/lib/drawable';
import { useEditorContext } from '@renderer/store/EditorContext';

export const useDiagramStateName = () => {
  const editor = useEditorContext();

  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState({} as State);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [sizes, setSizes] = useState({} as State['computedTitleSizes']);

  const onClose = () => setIsOpen(false);

  const onRename = (name: string) => {
    const stateId = state.id;
    if (!stateId) return;

    editor.controller.states.changeStateName(stateId, name);

    onClose();
  };

  useEffect(() => {
    if (!editor) return;

    editor.controller.states.on('changeStateName', (state) => {
      const globalOffset = editor.view.app.mouse.getOffset();
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
