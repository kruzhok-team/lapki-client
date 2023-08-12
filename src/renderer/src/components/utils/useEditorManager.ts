import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorData, EditorManager, emptyEditorData } from '@renderer/lib/data/EditorManager';
import { useState, useRef, useEffect } from 'react';

type ManagerMutator = (manager: EditorManager, forceTrigger?: boolean) => void;

export default function useEditorManager() {
  const [editor, setEditor] = useState<CanvasEditor | null>(null);
  const [editorData, setEditorData] = useState<EditorData>(emptyEditorData);

  const managerRef = useRef<EditorManager | null>(null);

  useEffect(() => {
    if (managerRef.current == null) {
      console.log('useEditorManager:init');
      managerRef.current = new EditorManager(editor, editorData, setEditorData);
    }
  }, []);

  useEffect(() => {
    console.log('useEditorManager:editorEffect');
    managerRef.current?.unwatchEditor();
    if (!editor) return;
    managerRef.current?.watchEditor(editor);
  }, [editor]);

  const mutateLapki = (fn: ManagerMutator, forceTrigger?: boolean) => {
    if (!managerRef.current) return;
    fn(managerRef.current);
    if (forceTrigger) managerRef.current.triggerDataUpdate();
  };

  return {
    editor,
    setEditor,
    editorData,
    mutateLapki,
    managerRef,
  };
}
