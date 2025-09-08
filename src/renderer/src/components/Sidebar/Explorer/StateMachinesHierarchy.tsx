import { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as ArrowIcon } from '@renderer/assets/icons/arrow-down.svg';
import { Hierarchy } from '@renderer/components/Hierarchy';
import { Filter } from '@renderer/components/Hierarchy/Filter';
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
  const [expand, setExpand] = useState(true);
  const [collapse, setCollapse] = useState(true);
  const handleChangeSearch = (value: string) => {
    if (!value) value = '';
    setSearch(value);
  };

  const onExpandAll = () => {
    setExpand(true);
    setCollapse(false);
  };

  const onCollapseAll = () => {
    setCollapse(true);
    setExpand(false);
  };

  const header = () => {
    return (
      <button className="my-3 flex items-center" onClick={() => togglePanel()}>
        <ArrowIcon
          className={twMerge('rotate-0 transition-transform', isCollapsed() && '-rotate-90')}
        />
        <h3 className="font-semibold">Иерархия</h3>
      </button>
    );
  };

  return (
    <div className={twMerge(theme !== 'light' && 'rct-dark', 'flex h-full flex-col')}>
      {header()}
      <Filter
        onExpandAll={onExpandAll}
        onCollapseAll={onCollapseAll}
        search={search}
        onChangeSearch={handleChangeSearch}
        disabled={headControllerId === ''}
      />
      <div
        className={
          'overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb'
        }
      >
        {headControllerId === '' ? (
          <p className="text-text-inactive">
            <i>Нет активной диаграммы</i>
          </p>
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
      </div>
    </div>
  );
};
