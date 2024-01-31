import React, { useLayoutEffect, useRef, useState } from 'react';

import {
  Tree,
  TreeItem,
  DraggingPosition,
  ControlledTreeEnvironment,
  TreeRef,
  TreeEnvironmentRef,
  TreeItemIndex,
  DraggingPositionItem,
  TreeItemActions,
  TreeItemRenderFlags,
} from 'react-complex-tree';
import { twMerge } from 'tailwind-merge';

import './style-modern.css';
import { HierarchyItem, useHierarchyManager } from '@renderer/hooks/useHierarchyManager';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { useThemeContext } from '@renderer/store/ThemeContext';
import { MyMouseEvent } from '@renderer/types/mouse';

import { FilterNew } from './FilterNew';
import { InputRender } from './inputRender';
import { TitleRender } from './titleRender';

export interface HierarchyProps {
  editor: CanvasEditor | null;
  manager: EditorManager;
}

export const Hierarchy: React.FC<HierarchyProps> = ({ editor, manager }) => {
  const { theme } = useThemeContext();
  const tree = useRef<TreeRef>(null);
  const [focusedItem, setFocusedItem] = useState<TreeItemIndex>();
  const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>([]);
  const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([]);

  const { hierarchy, initialState, selectedItemId } = useHierarchyManager(editor, manager);

  useLayoutEffect(() => {
    if (selectedItemId) {
      return setSelectedItems([selectedItemId]);
    }
    setSelectedItems([]);
  }, [selectedItemId]);

  if (!editor) return;

  const onFocus = (item: TreeItem) => {
    setFocusedItem(item.index.toString());
    editor.container.machineController.selectState(item.index.toString());
    editor.container.machineController.selectTransition(item.index.toString());
  };
  const onClick = (item: TreeItem, actions: TreeItemActions, renderFlags: TreeItemRenderFlags) => {
    actions.focusItem();
    actions.selectItem();
    //Раскрытие списка по нажатию на текст
    if (!item.isFolder && renderFlags.isRenaming) return;
    actions.toggleExpandedState();
  };
  const onDoubleClick = (item: TreeItem, actions: TreeItemActions) => {
    if (!item.canRename) return;
    actions.startRenamingItem();
  };
  const onContextMenu = (e, item: TreeItem, actions: TreeItemActions) => {
    actions.selectItem();
    //Создаем необходимую переменную, чтобы совпадало с типом в контроллерах и пишем туда значения мыши во время клика правой кнопкой
    const mouse: MyMouseEvent = {
      x: e.clientX,
      y: e.clientY,
      dx: e.pageX,
      dy: e.pageY,
      left: false,
      right: false,
      button: e.button,
      stopPropagation: e.stopPropagation,
      nativeEvent: e.nativeEvent,
    };

    const state = editor.container.machineController.states.get(item.index.toString());
    if (state) {
      return editor.container.statesController.handleContextMenu(state, { event: mouse });
    }
    const transition = editor.container.machineController.transitions.get(item.index.toString());
    if (transition) {
      return editor.container.transitionsController.handleContextMenu(transition, { event: mouse });
    }
  };
  const onDragStart = (e, item: TreeItem, actions: TreeItemActions) => {
    //Проверка, можно ли двигать тот или иной объект, в данном случае, двигать можно лишь состояния, связи запрещено
    if (!item.canMove) return;
    e.dataTransfer.dropEffect = 'move';
    actions.startDragging();
  };
  const onRename = (item: TreeItem, name: string) => {
    //Используется для переименование состояния, это можно использовать
    editor?.container.machineController.changeStateName(item.index.toString(), name);
  };
  const onSelected = (items: TreeItemIndex[]) => {
    setSelectedItems(items);
  };
  const onExpanded = (item: TreeItem) => {
    setExpandedItems((items) => [...items, item.index]);
  };
  const onCollapse = (item: TreeItem) => {
    setExpandedItems((items) =>
      items.filter((expandedItemIndex) => expandedItemIndex !== item.index)
    );
  };

  //Здесь мы напрямую работаем с родителями и дочерними элементами
  const onLinkUnlinkState = (items: TreeItem[], target: DraggingPosition) => {
    const parent = tree.current?.dragAndDropContext.draggingPosition as DraggingPositionItem;

    items.map((value) => {
      if (target.targetType.toString() === 'item') {
        return editor.container.machineController.linkState(
          parent.targetItem.toString(),
          value.index.toString()
        );
      }
      if (target.targetType.toString() === 'between-items' && parent.parentItem !== 'root') {
        return editor.container.machineController.linkState(
          parent.parentItem.toString(),
          value.index.toString()
        );
      }
      editor.container.machineController.unlinkState({ id: value.index.toString() });
    });
  };

  return (
    <div className={twMerge(theme !== 'light' && 'rct-dark')}>
      <ControlledTreeEnvironment
        items={hierarchy}
        getItemTitle={(item) => item.data}
        canDragAndDrop
        canReorderItems
        canDropOnFolder
        canDropOnNonFolder
        canSearch={false}
        onDrop={onLinkUnlinkState}
        onRenameItem={onRename}
        onExpandItem={onExpanded}
        onCollapseItem={onCollapse}
        onSelectItems={onSelected}
        viewState={{
          ['tree-1']: {
            focusedItem,
            expandedItems,
            selectedItems,
          },
        }}
        //Реализовано свое переименование для добавления разных функций
        renderRenameInput={(props) => <InputRender props={props} />}
        renderItemTitle={(data) => (
          <TitleRender data={data} initialState={initialState} editor={editor} />
        )}
        defaultInteractionMode={{
          mode: 'custom',
          createInteractiveElementProps: (item, _treeId, actions, renderFlags) => ({
            onClick: () => onClick(item, actions, renderFlags),
            onDoubleClick: () => onDoubleClick(item, actions),
            onContextMenu: (e) => onContextMenu(e, item, actions),
            onBlur: actions.unselectItem,
            onFocus: () => onFocus(item),
            onDragStart: (e) => onDragStart(e, item, actions),
            //Разрешаем перемещение
            draggable: renderFlags.canDrag && !renderFlags.isRenaming,
            onDragOver: (e) => {
              e.preventDefault(); // Разрешить удаление
            },
          }),
        }}
      >
        <FilterNew
          hierarchy={hierarchy}
          expandedItems={expandedItems}
          setExpandedItems={setExpandedItems}
        />
        {/* <Filter hierarchy={hierarchy} tree={tree} setExpandedItems={setExpandedItems} /> */}
        <Tree ref={tree} treeId="tree-1" rootItem="root" treeLabel="Tree Example" />
      </ControlledTreeEnvironment>
    </div>
  );
};
