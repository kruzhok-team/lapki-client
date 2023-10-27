import { useState, useRef, useEffect } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';

export const useEditorManager = () => {
  const [editor, setEditor] = useState<CanvasEditor | null>(null);
  const managerRef = useRef(new EditorManager());

  useEffect(() => {
    if (!editor) return;

    managerRef.current.resetEditor = () => {
      editor.container.machineController.loadData();
    };
  }, [editor]);

  return {
    editor,
    setEditor,
    manager: managerRef.current,
  };
};
