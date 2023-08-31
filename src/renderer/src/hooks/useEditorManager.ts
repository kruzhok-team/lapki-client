import { useState, useRef, useEffect, MutableRefObject, Dispatch, SetStateAction } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorData, EditorManager, emptyEditorData } from '@renderer/lib/data/EditorManager';
import { PlatformManager } from '@renderer/lib/data/PlatformManager';

export interface EditorRef {
  editor: CanvasEditor | null;
  setEditor: Dispatch<SetStateAction<CanvasEditor | null>>;
  platform: PlatformManager | null;
  editorData: EditorData;
  mutateLapki: (fn: ManagerMutator, forceTrigger?: boolean) => void;
  // FIXME: очень хотелось бы избавиться от этого поля,
  // потому что не все изменения через него запускают перерисовку
  managerRef: MutableRefObject<EditorManager | null>;
}

type ManagerMutator = (manager: EditorManager, forceTrigger?: boolean) => void;

export default function useEditorManager(): EditorRef {
  const [editor, setEditor] = useState<CanvasEditor | null>(null);
  const [platform, setPlatform] = useState<PlatformManager | null>(null);
  const [editorData, setEditorData] = useState<EditorData>(emptyEditorData);

  const managerRef = useRef<EditorManager | null>(null);
  const myPlatformIdx = useRef<string | null>(null);

  const platformUpdate = (name: string) => {
    myPlatformIdx.current = name;
    if (name) {
      setPlatform(editor?.container.machine.platform ?? null);
      console.log(['useEditorManager:platformUpdate', editor, platform]);
    } else {
      console.log(['useEditorManager:platformClear']);
      setPlatform(null);
    }
  };

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
    platformUpdate(editor.container.machine.platformIdx);
  }, [editor]);

  // FIXME: убрать проверку на каждом изменении?
  // подписки в Manager должно быть достаточно
  useEffect(() => {
    if (!editor) return;
    /* console.log([
      'useEditorManager:platformEffect',
      myPlatformIdx.current,
      editorData.data.platform,
    ]); */
    if (myPlatformIdx.current == editorData.data.platform) return;
    platformUpdate(editorData.data.platform);
  }, [editorData]);

  const mutateLapki = (fn: ManagerMutator, forceTrigger?: boolean) => {
    if (!managerRef.current) return;
    fn(managerRef.current);
    if (forceTrigger) managerRef.current.triggerDataUpdate();
  };

  return {
    editor,
    setEditor,
    platform,
    editorData,
    mutateLapki,
    managerRef,
  };
}
