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
import { useSettings } from '@renderer/hooks';
import { State } from '@renderer/lib/drawable';
import { MyMouseEvent } from '@renderer/lib/types/mouse';
import { useEditorContext } from '@renderer/store/EditorContext';
import { escapeRegExp } from '@renderer/utils';

import { Filter } from './Filter';
import { InputRender } from './InputRender';
import { TitleRender } from './TitleRender';

export interface HierarchyItemData {
  title: string;
  type: 'state' | 'initialState' | 'finalState' | 'transition';
}

export const Hierarchy: React.FC = () => {
  const editor = useEditorContext();
  const model = editor.model;
  const controller = editor.controller;

  const [theme] = useSettings('theme');

  const states = model.useData('elements.states');
  const initialStates = model.useData('elements.initialStates');
  const finalStates = model.useData('elements.finalStates');
  const transitions = model.useData('elements.transitions');

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
        data: { title: state.name ?? 'asd', type: 'state' },
        children: [],
        canRename: true,
        canMove: true,
      };
    }

    for (const stateId in initialStates) {
      data[stateId] = {
        index: stateId,
        isFolder: false,
        data: { title: 'Начальное состояние', type: 'initialState' },
        children: [],
        canRename: false,
        canMove: false,
      };
    }

    for (const stateId in finalStates) {
      data[stateId] = {
        index: stateId,
        isFolder: false,
        data: { title: 'Конечное состояние', type: 'finalState' },
        children: [],
        canRename: false,
        canMove: false,
      };
    }

    for (const [stateId, state] of [
      ...Object.entries(states),
      ...Object.entries(initialStates),
      ...Object.entries(finalStates),
    ]) {
      if (!state.parentId) {
        data.root.children?.push(stateId);
      } else {
        data[state.parentId].children?.push(stateId);
        data[state.parentId].isFolder = true;
      }
    }

    for (const transitionId in transitions) {
      const transition = transitions[transitionId];
      const target = states[transition.target] ?? finalStates[transition.target];

      if (!target) continue;

      data[transitionId] = {
        index: transitionId,
        isFolder: false,
        data: {
          title: target?.name || 'Конечное состояние',
          type: 'transition',
        },
        canRename: false,
        canMove: false,
      };
      data[transition.source].children?.push(transitionId);
      data[transition.source].isFolder = true;
    }

    return data;
  }, [finalStates, initialStates, states, transitions]);

  // Синхронизация дерева и состояний
  const handleFocusItem = (item: TreeItem<HierarchyItemData>) => setFocusedItem(item.index);
  const handleExpandItem = (item: TreeItem<HierarchyItemData>) =>
    setExpandedItems((p) => [...p, item.index]);
  const handleCollapseItem = (item: TreeItem<HierarchyItemData>) =>
    setExpandedItems((p) => p.filter((index) => index !== item.index));
  const handleSelectItems = (items: TreeItemIndex[]) => setSelectedItems(items);

  const handleRename = (item: TreeItem, name: string) => {
    controller.states.changeStateName(item.index.toString(), name);
  };

  const handleDrop = (items: TreeItem[], target: DraggingPosition) => {
    items.map((value) => {
      const childId = value.index.toString();

      if (target.targetType === 'root') {
        return controller.states.unlinkState({ id: childId });
      }

      const parent = target.parentItem.toString();

      if (parent === 'root') {
        return controller.states.unlinkState({ id: childId });
      }

      if (parent === childId) return;

      return controller.states.linkState({ parentId: parent, childId });
    });
  };

  const onFocus = (item: TreeItem) => () => {
    controller.selectState(item.index.toString());
    controller.selectTransition(item.index.toString());
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

    const state = controller.states.get(item.index.toString());
    if (state && state instanceof State) {
      return controller.states.handleContextMenu(state, { event: mouse });
    }
    const transition = controller.transitions.get(item.index.toString());
    if (transition) {
      return controller.transitions.handleContextMenu(transition, {
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
      if (!state.parentId) return [];

      return [state.parentId, ...getParents(state.parentId)];
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
      if (transition.label?.selection) {
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
