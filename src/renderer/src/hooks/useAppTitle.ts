import { useEffect } from 'react';

import { useModelContext } from '@renderer/store/ModelContext';

export const useAppTitle = () => {
  const modelController = useModelContext();
  const name = modelController.model.useData('name');
  const sm = modelController.model.data.elements.stateMachines[modelController.currentSmId!];
  let platformName: string | null = null;
  if (sm) {
    platformName =
      modelController.model.data.elements.stateMachines[modelController.currentSmId!].platform;
  }

  useEffect(() => {
    if (!name || !platformName) return;

    document.title = `${name} [${platformName}] – Lapki IDE`;
  }, [name, platformName]);
};
