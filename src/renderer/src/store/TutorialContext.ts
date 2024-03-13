import { createContext, useContext } from 'react';

import { Tutorial } from '@renderer/store/Tutorial';

export const TutorialContext = createContext<Tutorial | null>(null);

export const useTutorialContext = () => {
  const value = useContext(TutorialContext);

  if (value === null) {
    throw new Error('There must be a value!');
  }

  return value;
};
