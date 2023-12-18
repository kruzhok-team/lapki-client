import { useEffect } from 'react';

import { EditorManager } from '@renderer/lib/data/EditorManager';

export const useAppTitle = (manager: EditorManager) => {
  const name = manager.useData('name');
  const platformName = manager.useData('elements.platform');

  useEffect(() => {
    if (!name || !platformName) return;

    document.title = `${name} [${platformName}] – Lapki IDE`;
  }, [name, platformName]);
};
