import { useLayoutEffect } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';

export interface HierarchyItem {
  [index: string]: {
    index: string;
    isFolder?: boolean;
    children?: Array<string>;
    data: string;
  };
}

export const useHierarchyManager = (editor: CanvasEditor | null, manager: EditorManager) => {
  const states = manager.useData('elements.states');
  const transitions = manager.useData('elements.transitions');

  const hierarchy: HierarchyItem = {};

  useLayoutEffect(() => {
    if (!editor) return;

    hierarchy['root'] = {
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
      hierarchy[state[0]] = {
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
      };
    });

    //Создаем элементы списка иерархий(связи)
    Object.entries(transitions).map((transition) => {
      hierarchy[transition[0]] = {
        index: transition[0],
        data:
          Object.entries(states)
            .filter((state) => transition[1].source === state[0])
            .map((value) => value[1].name) +
          ' -> ' +
          Object.entries(states)
            .filter((state) => transition[1].target === state[0])
            .map((value) => value[1].name),
      };
    });

    console.log(hierarchy);
  }, [editor, states, transitions]);

  return { hierarchy, editor };
};