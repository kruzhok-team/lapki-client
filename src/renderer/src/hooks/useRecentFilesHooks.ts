import { useEffect, useState } from 'react';

import { useModelContext } from '@renderer/store/ModelContext';
import { StateMachine } from '@renderer/types/diagram';

import { useSettings } from './useSettings';

export const useRecentFilesHooks = () => {
  const [recentFiles, setRecentFiles] = useSettings('recentFiles');

  const modelController = useModelContext();
  const name = modelController.model.useData('', 'name') as string | null;
  const basename = modelController.model.useData('', 'basename');
  const isStale = modelController.model.useData('', 'isStale');
  const stateMachinesId = modelController.model.useData('', 'elements.stateMachinesId') as {
    [ID: string]: StateMachine;
  };

  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(recentFiles !== null);

  useEffect(() => {
    setSettingsLoaded(recentFiles !== null);
  }, [recentFiles]);

  useEffect(() => {
    if (recentFiles === null || name === null || basename === null || isStale) {
      return;
    }

    const stateMachines = [...Object.entries(stateMachinesId)].map(([smId, sm]) => {
      return { name: sm.name ?? smId, platformIdx: sm.platform };
    });

    const filtered = recentFiles.filter((v) => v.path !== basename);
    setRecentFiles([{ name: name, path: basename, stateMachines: stateMachines }, ...filtered]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basename, name, stateMachinesId, settingsLoaded, isStale]);
};
