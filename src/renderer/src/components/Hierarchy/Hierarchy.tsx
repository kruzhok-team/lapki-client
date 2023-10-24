import React, { useEffect, useState } from 'react';

import { UncontrolledTreeEnvironment, Tree, StaticTreeDataProvider } from 'react-complex-tree';

import './style-modern.css';

import { HierarchyItem } from '@renderer/hooks/useHierarchyManager';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';

interface HierarchyProps {
  hierarchy: HierarchyItem;
  editor: CanvasEditor | null;
}

export const Hierarchy: React.FC<HierarchyProps> = ({ hierarchy, editor }) => {
  const [hierarchyData, setHierarchyData] = useState(hierarchy);

  const dataProvider = new StaticTreeDataProvider(hierarchyData, (item, newName) => ({
    ...item,
    data: newName,
  }));

  const onSubmit = (name: string) => {
    const state = editor?.container.machine.states.get(name);
    if (!state) return;
    console.log(state);
    //editor?.container.states.handleStateClick(state);
  };

  useEffect(() => {
    console.log('Обновили данные');
  }, [hierarchy]);

  return (
    <div className="rct-dark">
      <UncontrolledTreeEnvironment
        dataProvider={dataProvider}
        getItemTitle={(item) => item.data}
        viewState={{}}
        canDragAndDrop={true}
        canDropOnFolder={true}
        canReorderItems={true}
        canSearch={false}
        onFocusItem={(item) => onSubmit(item.index.toString())}
      >
        <Tree treeId="tree-2" rootItem="root" treeLabel="Tree Example" />
      </UncontrolledTreeEnvironment>
    </div>
  );
};
