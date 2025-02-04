import { useEffect } from 'react';

import { useModelContext } from '@renderer/store/ModelContext';
import { appName } from '@renderer/version';

export const useAppTitle = () => {
  const modelController = useModelContext();
  const name = modelController.model.useData('', 'name');
  const isStale = modelController.model.useData('', 'isStale');
  useEffect(() => {
    if (!name) {
      document.title = appName;
      return;
    }

    document.title = `${isStale ? '*' : ''}${name} – ${appName}`;
  }, [name, isStale]);
};
