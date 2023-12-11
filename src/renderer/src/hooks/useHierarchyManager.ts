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

  //Нахождение выделеного состояния(связи)
  const id: string = useMemo(() => {
    let isSelectedName: string = '';

    Object.entries(states)
      .filter((state) => editor?.container.machineController.states.get(state[0])?.isSelected)
      .map((value) => (isSelectedName = value[0]));
    Object.entries(transitions)
      .filter(
        (transition) =>
          editor?.container.machineController.transitions.get(transition[0])?.isSelected
      )
      .map((value) => (isSelectedName = value[0]));
    return isSelectedName;
  }, [editor, states, transitions]);

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
    Object.entries(states).map((state) => {
      data[state[0]] = {
        index: state[0],
        isFolder:
          Object.entries(states).some((value) => value[1].parent === state[0]) ||
          Object.entries(transitions).some((transition) => transition[1].source === state[0]),
        children: [
          ...Object.entries(states)
            .filter((value) => value[1].parent === state[0])
            .map((value) => value[0]),
          ...Object.entries(transitions)
            .filter((transition) => transition[1].source === state[0])
            .map((value) => value[0]),
        ],
        data: state[1].name,
        canRename: true,
        canMove: true,
      };
    });

    //Создаем элементы списка иерархий(связи)
    Object.entries(transitions).map((transition) => {
      data[transition[0]] = {
        index: transition[0],
        data:
          Object.entries(states)
            .filter((state) => transition[1].source === state[0])
            .map((value) => value[1].name) +
          ' -> ' +
          Object.entries(states)
            .filter((state) => transition[1].target === state[0])
            .map((value) => value[1].name),
        canRename: false,
        canMove: false,
      };
    });
    return data;
  }, [states, transitions]);

  return { hierarchy, id, editor };
};
