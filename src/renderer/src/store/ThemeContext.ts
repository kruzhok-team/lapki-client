import { createContext, useContext } from 'react';

import { ThemeContextValue } from '@renderer/types/theme';

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useThemeContext = () => {
  const value = useContext(ThemeContext);

  if (value === null) {
    throw new Error('There must be a value!');
  }

  return value;
};
