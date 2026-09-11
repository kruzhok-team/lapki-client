import { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { Hierarchy } from '@renderer/components/Hierarchy';
import { Filter } from '@renderer/components/Hierarchy/Filter';
import { PanelHeader, ScrollArea } from '@renderer/components/UI';
import { useSettings } from '@renderer/hooks';
import { useModelContext } from '@renderer/store/ModelContext';

interface StateMachinesHierarchyProps {
  isCollapsed: () => boolean;
  togglePanel: () => void;
}

export const StateMachinesHierarchy: React.FC<StateMachinesHierarchyProps> = ({
  isCollapsed,
  togglePanel,
}) => {
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const controller = modelController.controllers[headControllerId];
  const stateMachinesIds = Object.keys(controller.useData('stateMachinesSub')).filter(
    (value) => value != ''
  );
  const [theme] = useSettings('theme');
  const [search, setSearch] = useState('');
  const expand = true;
  const collapse = true;
  const collapsed = isCollapsed();
  const handleChangeSearch = (value: string) => {
    if (!value) value = '';
    setSearch(value);
  };

  return (
    <div className={twMerge(theme !== 'light' && 'rct-dark', 'flex h-full min-h-0 flex-col')}>
      <PanelHeader title="Иерархия" isCollapsed={isCollapsed} togglePanel={togglePanel} />
      {!collapsed && (
        <>
          <Filter
            search={search}
            onChangeSearch={handleChangeSearch}
            disabled={headControllerId === ''}
          />
          <ScrollArea className="flex-1">
            {headControllerId === '' ? (
              <p className="pl-[19px] text-text-inactive">Нет активной диаграммы</p>
            ) : (
              stateMachinesIds.map((smId) => (
                <Hierarchy
                  key={smId}
                  expand={expand}
                  collapse={collapse}
                  search={search}
                  controller={controller}
                  smId={smId}
                />
              ))
            )}
          </ScrollArea>
        </>
      )}
    </div>
  );
};
