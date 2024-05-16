import { useRef } from 'react';

import { MainContainer } from '@renderer/components';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';

import { EditorContext } from './store/EditorContext';

// TODO: а если у нас будет несколько редакторов?
export const App: React.FC = () => {
  const { current: editor } = useRef(new CanvasEditor());

  return (
    <EditorContext.Provider value={editor}>
      <MainContainer />
    </EditorContext.Provider>
  );
};
