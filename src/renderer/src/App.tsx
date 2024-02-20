import { useRef, useState } from 'react';

import { MainContainer } from '@renderer/components';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { ThemeContext } from '@renderer/store/ThemeContext';
import { Theme } from '@renderer/types/theme';

import { EditorContext } from './store/EditorContext';

export const App: React.FC = () => {
  // TODO: а если у нас будет несколько редакторов?

  const [theme, setTheme] = useState<Theme>('dark');

  const { current: editor } = useRef(new CanvasEditor());

  const handleChangeTheme = (theme: Theme) => {
    setTheme(theme);

    document.documentElement.dataset.theme = theme;

    if (editor) {
      editor.container.isDirty = true;
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleChangeTheme }}>
      <EditorContext.Provider value={editor}>
        <MainContainer />
      </EditorContext.Provider>
    </ThemeContext.Provider>
  );
};
