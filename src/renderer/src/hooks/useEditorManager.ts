import { useState, useRef } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';

export const useEditorManager = () => {
  const [editor, setEditor] = useState<CanvasEditor | null>(null);

  const managerRef = useRef(new EditorManager());

  return {
    editor,
    setEditor,
    manager: managerRef.current,
  };
};
