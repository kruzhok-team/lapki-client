import { useRef } from 'react';

import { MainContainer } from '@renderer/components';

import { ModelController } from './lib/data/ModelController';
import { ModelContext } from './store/ModelContext';
import { useTabs } from './store/useTabs';

export const App: React.FC = () => {
  const { closeTab } = useTabs();
  // FIXME(L140-beep): Точка, чувствительная к неймингу вкладок
  const onStateMachineDelete = (controller: ModelController, nameOrsmId: string) => {
    closeTab(nameOrsmId, controller);
  };
  /* 
   Передаем функцию для удаления вкладок при удалении машины состояний
   В штатном случае закрытие вкладки находится на уровне модалки и useStateMachines.
   Но когда мы отменяем создание машины состояний через историю, и, так как история может взаимодействовать
   только с ModelController, а ModelController не имеет доступа к вкладкам и useStateMachines, то ему требуется рычаг для закрытия вкладки.
   Иначе вкладка с редактором МС останется, хотя его контроллер и сама МС уже удалены из данных.
  */
  const { current: modelController } = useRef(
    ModelController.instance ?? new ModelController(onStateMachineDelete)
  );
  return (
    <ModelContext.Provider value={modelController}>
      <MainContainer />
    </ModelContext.Provider>
  );
};
