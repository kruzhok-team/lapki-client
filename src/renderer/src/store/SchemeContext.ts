import { createContext, useContext } from 'react';

import { CanvasScheme } from '@renderer/lib/CanvasScheme';

export const SchemeContext = createContext<CanvasScheme | null>(null);

export const useSchemeContext = () => {
  const value = useContext(SchemeContext);

  if (!value) {
    throw new Error('There must be a value!');
  }

  return value;
};
