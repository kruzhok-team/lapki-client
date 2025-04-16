import { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { Hierarchy } from '@renderer/components/Hierarchy';
import { Filter } from '@renderer/components/Hierarchy/Filter';
import { useSettings } from '@renderer/hooks';
import { useModelContext } from '@renderer/store/ModelContext';

export const StateMachinesHierarchy: React.FC = () => {
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

  return (
    <div className={twMerge(theme !== 'light' && 'rct-dark')}>
      <Filter
        onExpandAll={onExpandAll}
        onCollapseAll={onCollapseAll}
        search={search}
        onChangeSearch={handleChangeSearch}
      />
      {stateMachinesIds.map((smId) => (
        <Hierarchy
          key={smId}
          expand={expand}
          collapse={collapse}
          search={search}
          controller={controller}
          smId={smId}
        />
      ))}
    </div>
  );
};
