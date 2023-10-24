import { useEffect, useState } from 'react';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';

export type HierarchyItem = {
  [index: string]: {
    index: string;
    isFolder?: boolean;
    children: string[];
    data: string;
    canRename?: boolean;
  };
};

export const useHierarchyManager = (editor: CanvasEditor | null, manager: EditorManager) => {
  const [hierarchy] = useState<HierarchyItem>({});

  useEffect(() => {
    if (!editor) return;

    hierarchy['root'] = {
      index: 'root',
      isFolder: true,
      children: [
        ...Array.from(editor.container.machine.states)
          .filter((value) => value[1].data.parent === undefined)
          .map((value) => value[0]),
      ],
      data: 'Root item',
    };

    //Создаем элементы списка иерархий(состояния)
    Array.from(editor.container.machine.states).map((state) => {
      hierarchy[state[0]] = {
        index: state[0],
        isFolder:
          Array.from(editor.container.machine.states).some(
            (value) => value[1].data.parent === state[0]
          ) ||
          Array.from(editor.container.machine.transitions).some(
            (transition) => transition[1].data.source === state[0]
          ),
        children: [
          ...Array.from(editor.container.machine.states)
            .filter((value) => value[1].data.parent === state[0])
            .map((value) => value[0]),
          ...Array.from(editor.container.machine.transitions)
            .filter((transition) => transition[1].data.source === state[0])
            .map((value) => value[0]),
        ],
        data: state[1].data.name,
      };
    });
    //Создаем элементы списка иерархий(связи)
    Array.from(editor.container.machine.transitions).map((transition) => {
      hierarchy[transition[0]] = {
        index: transition[0],
        children: [],
        data:
          Array.from(editor.container.machine.states)
            .filter((state) => transition[1].data.source === state[0])
            .map((value) => value[1].data.name) +
          ' -> ' +
          Array.from(editor.container.machine.states)
            .filter((state) => transition[1].data.target === state[0])
            .map((value) => value[1].data.name),
        canRename: false,
      };
    });
  }, [editor, manager]);

  return { hierarchy, editor };
};
