import { useEffect } from 'react';

import { useModelContext } from '@renderer/store/ModelContext';

export const useAppTitle = () => {
  const modelController = useModelContext();
  const name = modelController.model.useData([''], 'name');
  const headControllerId = modelController.model.useData([''], 'headControllerId');
  const stateMachines = Object.keys(modelController.controllers[headControllerId].stateMachinesSub);
  const platform = modelController.model.useData(stateMachines, 'elements.platform') as string;
  let platformName: string | null = null;
  if (platform) {
    platformName = platform;
  }

  useEffect(() => {
    if (!name || !platformName) return;

    document.title = `${name} [${platformName}] – Lapki IDE`;
  }, [name, platformName]);
};
