import React, { useLayoutEffect, useMemo, useState } from 'react';

import {
  Tree,
  TreeItem,
  DraggingPosition,
  ControlledTreeEnvironment,
  TreeItemActions,
  TreeItemRenderFlags,
  TreeItemIndex,
} from 'react-complex-tree';
import { twMerge } from 'tailwind-merge';

import './style-modern.css';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { useThemeContext } from '@renderer/store/ThemeContext';
import { MyMouseEvent } from '@renderer/types/mouse';
import { escapeRegExp } from '@renderer/utils';

import { Filter } from './Filter';
import { InputRender } from './InputRender';
import { TitleRender } from './TitleRender';

export interface HierarchyItemData {
  title: string;
  type: 'state' | 'transition';
}

export interface HierarchyProps {
  editor: CanvasEditor;
  manager: EditorManager;
}

export const Hierarchy: React.FC<HierarchyProps> = ({ editor, manager }) => {
  const { theme } = useThemeContext();

  const states = manager.useData('elements.states');
  const transitions = manager.useData('elements.transitions');
  const initialState = manager.useData('elements.initialState')?.target;

  const machine = editor.container.machineController;

  const [search, setSearch] = useState('');
  const [focusedItem, setFocusedItem] = useState<TreeItemIndex>();
  const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>([]);
  const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([]);

  const hierarchy = useMemo(() => {
    const data: Record<TreeItemIndex, TreeItem<HierarchyItemData>> = {
      root: {
        index: 'root',
        isFolder: true,
        data: { title: 'Root item', type: 'state' },
        children: [],
      },
    };

    for (const stateId in states) {
      const state = states[stateId];

      data[stateId] = {
        index: stateId,
        isFolder: false,
        data: { title: state.name, type: 'state' },
        children: [],
        canRename: true,
        canMove: true,
      };
    }

    for (const stateId in states) {
      const state = states[stateId];

      if (!state.parent) {
        data.root.children?.push(stateId);
      } else {
        data[state.parent].children?.push(stateId);
        data[state.parent].isFolder = true;
      }
    }

    for (const transitionId in transitions) {
      const transition = transitions[transitionId];
      const target = states[transition.target].name;

      data[transitionId] = {
        index: transitionId,
        isFolder: false,
        data: {
          title: target,
          type: 'transition',
        },
        canRename: false,
        canMove: false,
      };
      data[transition.source].children?.push(transitionId);
      data[transition.source].isFolder = true;
    }

    return data;
  }, [states, transitions]);

  // Синхронизация дерева и состояний
  const handleFocusItem = (item: TreeItem<HierarchyItemData>) => setFocusedItem(item.index);
  const handleExpandItem = (item: TreeItem<HierarchyItemData>) =>
    setExpandedItems((p) => [...p, item.index]);
  const handleCollapseItem = (item: TreeItem<HierarchyItemData>) =>
    setExpandedItems((p) => p.filter((index) => index !== item.index));
  const handleSelectItems = (items: TreeItemIndex[]) => setSelectedItems(items);

  const handleRename = (item: TreeItem, name: string) => {
    machine.changeStateName(item.index.toString(), name);
  };

  const handleDrop = (items: TreeItem[], target: DraggingPosition) => {
    items.map((value) => {
      const childId = value.index.toString();

      if (target.targetType === 'root') {
        return machine.unlinkState({ id: childId });
      }

      const parent = target.parentItem.toString();

      if (parent === 'root') {
        return machine.unlinkState({ id: childId });
      }

      if (parent === childId) return;

      return machine.linkState(parent, childId);
    });
  };

  const onFocus = (item: TreeItem) => () => {
    machine.selectState(item.index.toString());
    machine.selectTransition(item.index.toString());
  };

  const onClick =
    (item: TreeItem, actions: TreeItemActions, renderFlags: TreeItemRenderFlags) => () => {
      actions.focusItem();
      actions.selectItem();
      //Раскрытие списка по нажатию на текст
      if (!item.isFolder && renderFlags.isRenaming) return;
      actions.toggleExpandedState();
    };

  const onDoubleClick = (item: TreeItem, actions: TreeItemActions) => () => {
    if (!item.canRename) return;

    actions.startRenamingItem();
  };

  const onContextMenu = (item: TreeItem, actions: TreeItemActions) => (e) => {
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

    const state = machine.states.get(item.index.toString());
    if (state) {
      return editor.container.statesController.handleContextMenu(state, { event: mouse });
    }
    const transition = machine.transitions.get(item.index.toString());
    if (transition) {
      return editor.container.transitionsController.handleContextMenu(transition, {
        event: mouse,
      });
    }
  };

  const onDragStart = (item: TreeItem, actions: TreeItemActions) => (e) => {
    if (!item.canMove) return;

    e.dataTransfer.dropEffect = 'move';
    actions.startDragging();
  };

  const onExpandAll = () => {
    const items = Object.entries(hierarchy)
      .filter(([, item]) => item.isFolder)
      .map(([key]) => key);

    return setExpandedItems(items);
  };
  const onCollapseAll = () => setExpandedItems([]);

  const handleChangeSearch = (value: string) => {
    setSearch(value);

    if (!value) {
      setSelectedItems([]);
      return;
    }

    const getParents = (stateId: string): string[] => {
      const state = states[stateId];
      if (!state.parent) return [];

      return [state.parent, ...getParents(state.parent)];
    };

    const items = Object.values(hierarchy).filter((item) =>
      item.data.title.trim().toLowerCase().includes(value.trim().toLowerCase())
    );
    const itemsParents = items.reduce((acc, cur) => {
      if (cur.data.type === 'state') {
        return [...acc, ...getParents(cur.index.toString())];
      }
      return acc;
    }, [] as string[]);

    const itemsIds = [...itemsParents, ...items.map((item) => item.index.toString())];

    setExpandedItems((p) => {
      for (const item of itemsIds) {
        if (!p.includes(item)) {
          p.push(item);
        }
      }

      return [...p];
    });
    setSelectedItems([itemsIds[itemsIds.length - 1]]);
  };

  useLayoutEffect(() => {
    setSelectedItems([]);

    for (const [stateId, state] of Object.entries(states)) {
      if (state.selection) {
        return setSelectedItems([stateId]);
      }
    }

    for (const [transitionId, transition] of Object.entries(transitions)) {
      if (transition.selection) {
        return setSelectedItems([transitionId]);
      }
    }
  }, [states, transitions]);

  return (
    <div className={twMerge(theme !== 'light' && 'rct-dark')}>
      <ControlledTreeEnvironment
        items={hierarchy}
        getItemTitle={(item) => item.data.title}
        canDragAndDrop
        canReorderItems
        canDropOnFolder
        canDropOnNonFolder
        canSearch={false}
        onDrop={handleDrop}
        onRenameItem={handleRename}
        viewState={{
          tree: {
            focusedItem,
            expandedItems,
            selectedItems,
          },
        }}
        onFocusItem={handleFocusItem}
        onExpandItem={handleExpandItem}
        onCollapseItem={handleCollapseItem}
        onSelectItems={handleSelectItems}
        renderRenameInput={(props) => <InputRender props={props} />}
        renderItemTitle={(data) => (
          <TitleRender
            type={data.item.data.type}
            title={data.item.data.title}
            isInitial={initialState === data.item.index.toString()}
            search={escapeRegExp(search)}
          />
        )}
        defaultInteractionMode={{
          mode: 'custom',
          createInteractiveElementProps: (item, _treeId, actions, renderFlags) => ({
            onClick: onClick(item, actions, renderFlags),
            onDoubleClick: onDoubleClick(item, actions),
            onContextMenu: onContextMenu(item, actions),
            onBlur: actions.unselectItem,
            onFocus: onFocus(item),
            onDragStart: onDragStart(item, actions),
            draggable: renderFlags.canDrag && !renderFlags.isRenaming,
            onDragOver: (e) => e.preventDefault(),
          }),
        }}
      >
        <Filter
          onExpandAll={onExpandAll}
          onCollapseAll={onCollapseAll}
          search={search}
          onChangeSearch={handleChangeSearch}
        />
        <Tree treeId="tree" rootItem="root" />
      </ControlledTreeEnvironment>
    </div>
  );
};
