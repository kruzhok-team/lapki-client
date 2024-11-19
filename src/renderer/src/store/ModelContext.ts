import { createContext, useContext } from 'react';

import { ModelController } from '@renderer/lib/data/ModelController';

export const ModelContext = createContext<ModelController | null>(null);

export const useModelContext = () => {
  const value = useContext(ModelContext);

  if (value === null) {
    throw new Error('There must be a value!');
  }

  return value;
};
