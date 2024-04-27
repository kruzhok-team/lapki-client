import { createContext, useContext } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';

export const EditorContext = createContext<CanvasEditor | null>(null);

export const useEditorContext = () => {
  const value = useContext(EditorContext);

  if (value === null) {
    throw new Error('There must be a value!');
  }

  return value;
};
