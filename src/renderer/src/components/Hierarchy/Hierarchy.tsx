import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';

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
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { MyMouseEvent } from '@renderer/lib/types/mouse';
import { useModelContext } from '@renderer/store/ModelContext';
import {
  ChoiceState,
  Component,
  FinalState,
  InitialState,
  Note,
  State,
  Transition,
} from '@renderer/types/diagram';
import { escapeRegExp } from '@renderer/utils';

import { InputRender } from './InputRender';
import { TitleRender } from './TitleRender';

export interface HierarchyItemData {
  title: string;
  type:
    | 'state'
    | 'initialState'
    | 'finalState'
    | 'choiceState'
    | 'transition'
    | 'note'
    | 'stateMachine'
    | 'component';
}

interface HierarchyProps {
  controller: CanvasController;
  smId: string;
  search: string;
  collapse: boolean;
  expand: boolean;
}

export const Hierarchy: React.FC<HierarchyProps> = ({
  controller,
  collapse,
  expand,
  smId,
  search,
}) => {
  const modelController = useModelContext();
  const model = modelController.model;
  const [theme] = useSettings('theme');
  // TODO(L140-beep): реализовать отображение нескольких МС, когда появится общий канвас
  const states = model.useData(smId, 'elements.states') as { [id: string]: State };
  const smName = model.useData(smId, 'elements.name') as string | undefined;
  const initialStates = model.useData(smId, 'elements.initialStates') as {
    [id: string]: InitialState;
  };
  const finalStates = model.useData(smId, 'elements.finalStates') as {
    [id: string]: FinalState;
  };
  const choiceStates = model.useData(smId, 'elements.choiceStates') as {
    [id: string]: ChoiceState;
  };
  const transitions = model.useData(smId, 'elements.transitions') as {
    [id: string]: Transition;
  };
  const components = model.useData(smId, 'elements.components') as {
    [id: string]: Component;
  };
  const notes = model.useData(smId, 'elements.notes') as { [id: string]: Note };

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
    data[smId] = {
      index: smId,
      isFolder: true,
      data: { title: smName ?? smId, type: 'stateMachine' },
      children: [],
      canRename: false, // TODO (L140-beep): Переименование машин состояний в иерархии
      canMove: false,
    };
    data.root.children?.push(smId);
    const linkStates = (states: {
      [id: string]: State | ChoiceState | InitialState | FinalState;
    }) => {
      for (const [stateId, state] of Object.entries(states)) {
        if (!state.parentId) {
          data[smId].children?.push(stateId);
        } else {
          data[state.parentId].children?.push(stateId);
          data[state.parentId].isFolder = true;
        }
      }
    };
    for (const attribute of controller.hierarchyViews) {
      switch (attribute) {
        case 'transition':
          for (const transitionId in transitions) {
            const transition = transitions[transitionId];
            const targetName = data[transition.targetId]?.data?.title;

            data[transitionId] = {
              index: transitionId,
              isFolder: false,
              data: {
                title: targetName,
                type: 'transition',
              },
              canRename: false,
              canMove: false,
            };
            if (data[transition.sourceId]) {
              data[transition.sourceId].children?.push(transitionId);
              data[transition.sourceId].isFolder = true;
            }
          }
          break;
        case 'component':
          for (const componentId in components) {
            data[componentId] = {
              index: componentId,
              isFolder: false,
              data: { title: componentId, type: 'component' },
              children: [],
              canRename: true,
              canMove: false,
            };
          }
          for (const componentId in components) {
            data[smId].children?.push(componentId);
          }
          break;
        case 'state':
          for (const stateId in states) {
            const state = states[stateId];

            data[stateId] = {
              index: stateId,
              isFolder: false,
              data: { title: state.name ?? 'asd', type: 'state' },
              children: [],
              canRename: true,
              canMove: false,
            };
          }

          linkStates(states);
          break;
        case 'initialState':
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
          linkStates(initialStates);
          break;
        case 'final':
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
          linkStates(finalStates);
          break;
        case 'choice':
          for (const stateId in choiceStates) {
            data[stateId] = {
              index: stateId,
              isFolder: false,
              data: { title: 'Состояние выбора', type: 'choiceState' },
              children: [],
              canRename: false,
              canMove: false,
            };
          }
          linkStates(finalStates);
          break;
        case 'note':
          for (const noteId in notes) {
            const note = notes[noteId];

            data[noteId] = {
              index: noteId,
              isFolder: false,
              //TODO: (XidFanSan) надо добавить название заметки (title)
              data: { title: note.text ?? 'Комментарий', type: 'note' },
              children: [],
              canRename: false,
              canMove: false,
            };
          }
          for (const [noteId] of [...Object.entries(notes)]) {
            data[smId].children?.push(noteId);
          }
          break;
        default:
          break;
      }
    }

    return data;
  }, [
    smName,
    smId,
    components,
    controller.hierarchyViews,
    choiceStates,
    finalStates,
    initialStates,
    notes,
    states,
    transitions,
  ]);

  // Синхронизация дерева и состояний
  const handleFocusItem = (item: TreeItem<HierarchyItemData>) => setFocusedItem(item.index);
  const handleExpandItem = (item: TreeItem<HierarchyItemData>) =>
    setExpandedItems((p) => [...p, item.index]);
  const handleCollapseItem = (item: TreeItem<HierarchyItemData>) =>
    setExpandedItems((p) => p.filter((index) => index !== item.index));
  const handleSelectItems = (items: TreeItemIndex[]) => setSelectedItems(items);

  const handleRename = (item: TreeItem, name: string) => {
    modelController.changeStateName(smId, item.index.toString(), name);
  };

  const handleDrop = (items: TreeItem[], target: DraggingPosition) => {
    items.map((value) => {
      const childId = value.index.toString();

      if (target.targetType === 'root') {
        return modelController.unlinkState({ smId: smId, id: childId });
      }

      const parent = target.parentItem.toString();

      if (parent === 'root') {
        return modelController.unlinkState({ smId: smId, id: childId });
      }

      if (parent === childId) return;

      return modelController.linkState({ smId: smId, parentId: parent, childId });
    });
  };

  const onFocus = (item: TreeItem) => () => {
    modelController.selectState({ smId, id: item.index.toString() });
    modelController.selectNote({ smId, id: item.index.toString() });
    modelController.selectTransition({ smId, id: item.index.toString() });
    modelController.selectChoiceState({ smId, id: item.index.toString() });
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

    const sm = modelController.model.data.elements.stateMachines[smId];
    const itemId = item.index.toString();
    const state = sm.states[itemId];
    if (state !== undefined) {
      return controller.states.handleContextMenu(itemId, { event: mouse });
    }

    const finalState = sm.finalStates[itemId];
    if (finalState) {
      return controller.states.handleFinalStateContextMenu(itemId, {
        event: mouse,
      });
    }
    const transition = sm.transitions[itemId];
    if (transition) {
      return controller.transitions.handleContextMenu(itemId, {
        event: mouse,
      });
    }
    const note = sm.notes[itemId];
    if (note) {
      return controller.notes.handleContextMenu(itemId, {
        event: mouse,
      });
    }
    const choiceState = sm.choiceStates[itemId];
    if (choiceState) {
      return controller.states.handleChoiceStateContextMenu(itemId, {
        event: mouse,
      });
    }
  };

  const onDragStart = (item: TreeItem, actions: TreeItemActions) => (e) => {
    if (!item.canMove) return;

    e.dataTransfer.dropEffect = 'move';
    actions.startDragging();
  };

  useEffect(() => {
    const onExpandAll = () => {
      const items = Object.entries(hierarchy)
        .filter(([, item]) => item.isFolder)
        .map(([key]) => key);

      return setExpandedItems(items);
    };
    const onCollapseAll = () => setExpandedItems([]);

    if (collapse) {
      onCollapseAll();
    }
    if (expand) {
      onExpandAll();
    }
  }, [hierarchy, collapse, expand]);

  useEffect(() => {
    if (!search) {
      setSelectedItems([]);
      return;
    }

    const getParents = (stateId: string): string[] => {
      const state = states[stateId];
      if (!state.parentId) return [];

      return [state.parentId, ...getParents(state.parentId)];
    };

    const items = Object.values(hierarchy).filter((item) =>
      item.data.title.trim().toLowerCase().includes(search.trim().toLowerCase())
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
  }, [hierarchy, states, search]);

  useLayoutEffect(() => {
    setSelectedItems([]);

    for (const [stateId, state] of Object.entries(states)) {
      if (state.selection) {
        return setSelectedItems([stateId]);
      }
    }

    for (const [transitionId, transition] of Object.entries(transitions)) {
      if (transition?.selection) {
        return setSelectedItems([transitionId]);
      }
    }

    for (const [noteId, note] of Object.entries(notes)) {
      if (note?.selection) {
        return setSelectedItems([noteId]);
      }
    }
  }, [notes, states, transitions]);

  return (
    <div className={twMerge(theme !== 'light' && 'rct-dark')}>
      <ControlledTreeEnvironment
        key={smId}
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
        <Tree treeId="tree" rootItem="root" />
      </ControlledTreeEnvironment>
    </div>
  );
};
