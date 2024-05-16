import { useEffect } from 'react';

import { useEditorContext } from '@renderer/store/EditorContext';

export const useAppTitle = () => {
  const { model } = useEditorContext();

  const name = model.useData('name');
  const platformName = model.useData('elements.platform');

  useEffect(() => {
    if (!name || !platformName) return;

    document.title = `${name} [${platformName}] – Lapki IDE`;
  }, [name, platformName]);
};
