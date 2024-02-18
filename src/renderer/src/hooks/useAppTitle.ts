import { useEffect } from 'react';

import { useEditorContext } from '@renderer/store/EditorContext';

export const useAppTitle = () => {
  const { manager } = useEditorContext();

  const name = manager.useData('name');
  const platformName = manager.useData('elements.platform');

  useEffect(() => {
    if (!name || !platformName) return;

    document.title = `${name} [${platformName}] – Lapki IDE`;
  }, [name, platformName]);
};
