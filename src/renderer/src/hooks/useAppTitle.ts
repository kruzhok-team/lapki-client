import { useEffect } from 'react';

import { useEditorContext } from '@renderer/store/EditorContext';

export const useAppTitle = () => {
  const { controller } = useEditorContext();

  const name = controller.model.useData('name');
  const platformName = controller.model.useData('elements.platform');

  useEffect(() => {
    if (!name || !platformName) return;

    document.title = `${name} [${platformName}] – Lapki IDE`;
  }, [name, platformName]);
};
