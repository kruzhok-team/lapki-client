import { createContext, useContext } from 'react';

export const ContextMenuContext = createContext<{ onClose: () => void } | null>(null);

export const useContextMenuContext = () => {
  const value = useContext(ContextMenuContext);

  if (value === null) {
    throw new Error('There must be a value!');
  }

  return value;
};
