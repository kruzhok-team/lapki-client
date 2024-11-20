import { useRef } from 'react';

import { MainContainer } from '@renderer/components';

import { ModelController } from './lib/data/ModelController';
import { ModelContext } from './store/ModelContext';
import { useTabs } from './store/useTabs';

// TODO: а если у нас будет несколько редакторов?
// А они уже есть!
export const App: React.FC = () => {
  const { closeTab } = useTabs();
  // (L140-beep) Точка, чувствительная к неймингу вкладок
  const onStateMachineDelete = (controller: ModelController, nameOrsmId: string) => {
    closeTab(nameOrsmId, controller);
  };
  const { current: modelController } = useRef(
    ModelController.instance ?? new ModelController(onStateMachineDelete)
  );
  return (
    <ModelContext.Provider value={modelController}>
      <MainContainer />
    </ModelContext.Provider>
  );
};
