import { useState, useEffect, useRef } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { PlatformManager } from '@renderer/lib/data/PlatformManager';

export default function useEditorManager() {
  const [editor, setEditor] = useState<CanvasEditor | null>(null);
  const [platform, setPlatform] = useState<PlatformManager | null>(null);

  const { current: manager } = useRef(new EditorManager(editor));

  // const [manager, setManager] = useState(() => new EditorManager(editor));

  // const myPlatformIdx = useRef<string | null>(null);

  // const platformUpdate = (name: string) => {
  //   myPlatformIdx.current = name;
  //   if (name) {
  //     setPlatform(editor?.container.machine.platform ?? null);
  //   } else {
  //     setPlatform(null);
  //   }
  // };

  useEffect(() => {
    setPlatform(editor?.container.machine.platform ?? null);
  }, [editor?.container.machine.platform]);

  // useEffect(() => {
  //   manager?.unwatchEditor();

  //   if (!editor) return;

  //   manager?.watchEditor(editor);
  //   platformUpdate(editor.container.machine.platformIdx);
  // }, [editor]);

  // FIXME: убрать проверку на каждом изменении?
  // подписки в Manager должно быть достаточно
  // useEffect(() => {
  //   if (!editor) return;
  //   if (myPlatformIdx.current == editorData.data.platform) return;

  //   platformUpdate(editorData.data.platform);
  // }, [editorData]);

  return {
    editor,
    setEditor,
    platform,
    manager,
  };
}
