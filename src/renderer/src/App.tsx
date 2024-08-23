import { useRef } from 'react';

import { MainContainer } from '@renderer/components';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';

import { ModelController } from './lib/data/ModelController';
import { EditorContext } from './store/EditorContext';
import { SchemeContext } from './store/SchemeContext';

// TODO: а если у нас будет несколько редакторов?
export const App: React.FC = () => {
  const { current: editor } = useRef(new CanvasEditor());
  const { current: scheme } = useRef(new CanvasScheme());

  const { current: modelController } = useRef(new ModelController(editor, scheme));

  editor.setController(modelController);
  scheme.setController(modelController);
  return (
    <EditorContext.Provider value={editor}>
      <SchemeContext.Provider value={scheme}>
        <MainContainer />
      </SchemeContext.Provider>
    </EditorContext.Provider>
  );
};
