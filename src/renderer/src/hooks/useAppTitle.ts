import { useEffect } from 'react';

import { useModelContext } from '@renderer/store/ModelContext';

export const useAppTitle = () => {
  const modelController = useModelContext();
  const name = modelController.model.useData('', 'name');

  useEffect(() => {
    if (!name) return;

    document.title = `${name} – Lapki IDE`;
  }, [name]);
};
