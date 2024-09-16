import { useRef } from 'react';

import { MainContainer } from '@renderer/components';

import { ModelController } from './lib/data/ModelController';
import { ModelContext } from './store/ModelContext';

// TODO: а если у нас будет несколько редакторов?
export const App: React.FC = () => {
  // debugger;
  const { current: modelController } = useRef(ModelController.instance ?? new ModelController());
  return (
    <ModelContext.Provider value={modelController}>
      <MainContainer />
    </ModelContext.Provider>
  );
};
