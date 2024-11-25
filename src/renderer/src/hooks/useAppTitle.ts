import { useEffect } from 'react';

import { useModelContext } from '@renderer/store/ModelContext';

export const useAppTitle = () => {
  const modelController = useModelContext();
  const name = modelController.model.useData('', 'name');
  const isStale = modelController.model.useData('', 'isStale');
  useEffect(() => {
    if (!name) return;

    document.title = `${isStale ? '*' : ''}${name} – Lapki IDE`;
  }, [name, isStale]);
};
