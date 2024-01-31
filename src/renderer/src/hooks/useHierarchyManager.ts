import { useMemo } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';

export interface HierarchyItem {
  [index: string]: {
    index: string;
    isFolder?: boolean;
    children?: Array<string>;
    canRename?: boolean;
    canMove?: boolean;
    data: string;
  };
}

export const useHierarchyManager = (editor: CanvasEditor | null, manager: EditorManager) => {
  const states = manager.useData('elements.states');
  const transitions = manager.useData('elements.transitions');
  const initialState = manager.useData('elements.initialState')?.target;

  //Нахождение выделеного состояния(связи)
  const selectedItemId: string | undefined = useMemo(() => {
    let isSelectedName: string = '';

    for (const [stateId, state] of Object.entries(states)) {
      if (state.selection) {
        isSelectedName = stateId;
        break;
      }
    }
    for (const [transitionId, transition] of Object.entries(transitions)) {
      if (transition.selection) {
        isSelectedName = transitionId;
        break;
      }
    }
    return isSelectedName;
  }, [states, transitions]);

  const hierarchy: HierarchyItem = useMemo(() => {
    const data: HierarchyItem = {};

    data['root'] = {
      index: 'root',
      isFolder: true,
      children: [
        ...Object.entries(states)
          .filter((value) => value[1].parent === undefined)
          .map((value) => value[0]),
      ],
      data: 'Root item',
    };
    //Создаем элементы списка иерархий(состояния)
    for (const [stateId, state] of Object.entries(states)) {
      data[stateId] = {
        index: stateId,
        isFolder:
          Object.entries(states).some((value) => value[1].parent === stateId) ||
          Object.entries(transitions).some((transition) => transition[1].source === stateId),
        children: [
          ...Object.entries(states)
            .filter((value) => value[1].parent === stateId)
            .map((value) => value[0]),
          ...Object.entries(transitions)
            .filter((transition) => transition[1].source === stateId)
            .map((value) => value[0]),
        ],
        data: state.name,
        canRename: true,
        canMove: true,
      };
    }

    //Создаем элементы списка иерархий(связи)
    for (const [transitionId, transition] of Object.entries(transitions)) {
      data[transitionId] = {
        index: transitionId,
        data:
          Object.entries(states)
            .filter((state) => transition.source === state[0])
            .map((value) => value[1].name) +
          ' -> ' +
          Object.entries(states)
            .filter((state) => transition.target === state[0])
            .map((value) => value[1].name),
        canRename: false,
        canMove: false,
      };
    }
    return data;
  }, [states, transitions]);

  return { editor, hierarchy, selectedItemId, initialState };
};
