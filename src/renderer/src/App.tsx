import { useRef } from 'react';

import { MainContainer } from '@renderer/components';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';

import { EditorContext } from './store/EditorContext';
import { Tutorial } from './store/Tutorial';
import { TutorialContext } from './store/TutorialContext';

// TODO: а если у нас будет несколько редакторов?
export const App: React.FC = () => {
  const { current: editor } = useRef(new CanvasEditor());
  const { current: tutorial } = useRef(new Tutorial());

  return (
    <EditorContext.Provider value={editor}>
      <TutorialContext.Provider value={tutorial}>
        <MainContainer />
      </TutorialContext.Provider>
    </EditorContext.Provider>
  );
};
