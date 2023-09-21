import React from 'react';

import { EditorManager } from '@renderer/lib/data/EditorManager';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';

import { Documentations } from './Documentation/Documentation';
import { Tabs } from './Tabs';

interface MainContainerProps {
  manager: EditorManager;
  editor: CanvasEditor | null;
  setEditor: (editor: CanvasEditor | null) => void;
}

export const MainContainer: React.FC<MainContainerProps> = ({ manager, editor, setEditor }) => {
  const isInitialized = manager.useData('isInitialized');

  return (
    <div className="relative w-full min-w-0 bg-bg-primary">
      {isInitialized ? (
        <Tabs manager={manager} editor={editor} setEditor={setEditor} />
      ) : (
        <p className="pt-24 text-center text-base">Откройте файл или перенесите его сюда...</p>
      )}

      <Documentations topOffset={!!isInitialized} baseUrl={'https://lapki-doc.polyus-nt.ru/'} />
    </div>
  );
};
