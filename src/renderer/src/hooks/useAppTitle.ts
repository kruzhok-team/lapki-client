import { useEffect } from 'react';

import { useModelContext } from '@renderer/store/ModelContext';

export const useAppTitle = () => {
  const modelController = useModelContext();
  const name = modelController.model.useData('', 'name');
  // const headControllerId = modelController.model.useData('', 'headControllerId');
  // const stateMachines = Object.keys(modelController.controllers[headControllerId].stateMachinesSub);
  // if (stateMachines.length) {
  // const platform = modelController.model.useData(stateMachines[0], 'elements.platform') as string;
  // let platformName: string | null = null;
  // if (platform) {
  // platformName = platform;
  // }
  // }

  useEffect(() => {
    if (!name) return;

    document.title = `${name} – Lapki IDE`;
  }, [name]);
};
