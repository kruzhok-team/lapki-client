import { ThemeContextValue } from '@renderer/types/theme';
import { createContext, useContext } from 'react';

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useThemeContext = () => {
  const value = useContext(ThemeContext);

  if (value === null) {
    throw new Error('There must be a value!');
  }

  return value;
};
