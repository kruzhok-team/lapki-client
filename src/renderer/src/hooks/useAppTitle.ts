import { useEffect } from 'react';

import { useModelContext } from '@renderer/store/ModelContext';

export const useAppTitle = () => {
  const modelController = useModelContext();
  const name = modelController.model.useData('', 'name');
  const currentSm = modelController.model.useData('', 'currentSm');
  const platform = modelController.model.useData(currentSm, 'elements.platform') as string;
  let platformName: string | null = null;
  if (platform) {
    platformName = platform;
  }

  useEffect(() => {
    if (!name || !platformName) return;

    document.title = `${name} [${platformName}] – Lapki IDE`;
  }, [name, platformName]);
};
