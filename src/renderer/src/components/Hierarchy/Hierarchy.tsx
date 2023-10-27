import React, { useMemo } from 'react';

import {
  UncontrolledTreeEnvironment,
  Tree,
  TreeItem,
  DraggingPosition,
  StaticTreeDataProvider,
} from 'react-complex-tree';

import './style-modern.css';

import { HierarchyItem } from '@renderer/hooks/useHierarchyManager';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';

interface HierarchyProps {
  hierarchy: HierarchyItem;
  editor: CanvasEditor | null;
}

export const Hierarchy: React.FC<HierarchyProps> = ({ hierarchy, editor }) => {
  // const onSubmit = (id: string) => {
  //   editor?.container.machine.selectState(id);
  //   editor?.container.machine.selectTransition(id);
  // };

  const result = useMemo(() => {
    if (!editor) return;

    const dataProvider = new StaticTreeDataProvider(hierarchy, (item, data) => ({
      ...item,
      data,
    }));

    const onRename = (id: string, name: string) => {
      editor?.container.machine.changeStateName(id, name);
    };

    //Здесь мы напрямую работаем с родителями и дочерними элементами
    const onLinkUnlinkState = (items: TreeItem[], target: DraggingPosition) => {
      if (!editor) return;
      items.map((value) => {
        target.targetItem !== undefined
          ? editor.container.machine.linkState(target.targetItem.toString(), value.index.toString())
          : target.targetType === 'between-items' && target.parentItem !== 'root'
          ? editor.container.machine.linkState(target.parentItem.toString(), value.index.toString())
          : editor.container.machine.unlinkState(value.index.toString());
      });
    };

    return (
      <UncontrolledTreeEnvironment
        dataProvider={dataProvider}
        getItemTitle={(item) => item.data}
        viewState={{}}
        // //Данная ошибка вызвана по глупости ESlint, но данное свойство работает
        // defaultInteractionMode={'click-arrow-to-expand'}
        canDragAndDrop={true}
        canReorderItems={true}
        canDropOnFolder={true}
        canDropOnNonFolder={true}
        canSearch={false}
        onDrop={(items, target) => onLinkUnlinkState(items, target)}
        onRenameItem={(item, name) => onRename(item.index.toString(), name)}
        //onFocusItem={(item) => onSubmit(item.index.toString())}
      >
        <Tree treeId="tree-2" rootItem="root" treeLabel="Tree Example" />
      </UncontrolledTreeEnvironment>
    );
  }, [editor, hierarchy]);

  return <div className="rct-dark">{result}</div>;
};
