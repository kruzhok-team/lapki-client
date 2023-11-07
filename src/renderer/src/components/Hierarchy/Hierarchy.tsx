import React, { useRef, useState } from 'react';

import {
  Tree,
  TreeItem,
  DraggingPosition,
  ControlledTreeEnvironment,
  TreeItemIndex,
  TreeRef,
} from 'react-complex-tree';
import { twMerge } from 'tailwind-merge';
import './style-modern.css';

import { HierarchyItem } from '@renderer/hooks/useHierarchyManager';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { MyMouseEvent } from '@renderer/types/mouse';

interface HierarchyProps {
  hierarchy: HierarchyItem;
  editor: CanvasEditor | null;
  manager: EditorManager;
}

export const Hierarchy: React.FC<HierarchyProps> = ({ hierarchy, editor }) => {
  const tree = useRef<TreeRef>(null);

  const [focusedItem, setFocusedItem] = useState<TreeItemIndex>();
  const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>([]);
  const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([]);

  const result = () => {
    if (!editor) return;

    const onSubmit = (id: string) => {
      editor?.container.machineController.selectState(id);
      editor?.container.machineController.selectTransition(id);
    };

    const onRename = (id: string, name: string) => {
      editor?.container.machineController.changeStateName(id, name);
    };

    //Здесь мы напрямую работаем с родителями и дочерними элементами
    const onLinkUnlinkState = (items: TreeItem[], target: DraggingPosition) => {
      if (!editor) return;
      items.map((value) => {
        target.targetItem !== undefined
          ? editor.container.machineController.linkState(
              target.targetItem.toString(),
              value.index.toString()
            )
          : target.targetType === 'between-items' && target.parentItem !== 'root'
          ? editor.container.machineController.linkState(
              target.parentItem.toString(),
              value.index.toString()
            )
          : editor.container.machineController.unlinkState({ id: value.index.toString() });
      });
    };

    return (
      <ControlledTreeEnvironment
        items={hierarchy}
        getItemTitle={(item) => item.data}
        canDragAndDrop
        canReorderItems
        canDropOnFolder
        canDropOnNonFolder
        canSearch={false}
        onDrop={(items, target) => {
          onLinkUnlinkState(items, target);
        }}
        onRenameItem={(item, name) => onRename(item.index.toString(), name)}
        onFocusItem={(item) => {
          setFocusedItem(item?.index);
          onSubmit(item?.index.toString());
        }}
        onExpandItem={(item) => {
          setExpandedItems((items) => [...items, item.index]);
        }}
        onCollapseItem={(item) =>
          setExpandedItems((items) =>
            items.filter((expandedItemIndex) => expandedItemIndex !== item.index)
          )
        }
        onSelectItems={(items) => setSelectedItems(items)}
        viewState={{
          ['tree-1']: {
            focusedItem,
            expandedItems,
            selectedItems,
          },
        }}
        defaultInteractionMode={{
          mode: 'custom',
          createInteractiveElementProps: (item, _treeId, actions, renderFlags) => ({
            onClick: () => {
              actions.focusItem();
              actions.selectItem();
              //Раскрытие списка по нажатию на текст
              if (item.isFolder) {
                actions.toggleExpandedState();
              }
            },
            onDragStart: (e) => {
              //Проверка, можно ли двигать тот или иной объект, в данном случае, двигать можно лишь состояния, связи запрещено
              if (item.canMove) {
                e.dataTransfer.dropEffect = 'move';
                actions.startDragging();
              }
            },
            onDragOver: (e) => {
              e.preventDefault(); // Разрешить удаление
            },
            onBlur: () => {
              actions.unselectItem();
            },
            //Разрешаем перемещение
            draggable: renderFlags.canDrag && !renderFlags.isRenaming,
            onDoubleClick: () => {
              if (item.canRename) {
                actions.startRenamingItem();
              }
            },
            onContextMenu: (e) => {
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
                stopPropagation: () => e.stopPropagation(),
                nativeEvent: e.nativeEvent,
              };
              Array.from(editor.container.machineController.states).map((state) => {
                if (state[0] === item.index.toString()) {
                  editor.container.statesController.handleContextMenu(state[1], { event: mouse });
                }
              });
              Array.from(editor.container.machineController.transitions).map((transition) => {
                if (transition[0] === item.index.toString()) {
                  editor.container.transitionsController.handleContextMenu(transition[1], {
                    event: mouse,
                  });
                }
              });
            },
            onFocus: () => {
              actions.focusItem();
            },
          }),
        }}
      >
        <div>
          <button
            className="btn-primary mb-2 flex w-full items-center justify-center gap-3"
            type="button"
            onClick={() => {
              setExpandedItems([]);
              tree.current?.expandAll();
            }}
          >
            Раскрыть все
          </button>
          <button
            className="btn-primary mb-2 flex w-full items-center justify-center gap-3"
            type="button"
            onClick={() => {
              setExpandedItems([]);
              tree.current?.collapseAll();
            }}
          >
            Свернуть все
          </button>
        </div>
        <Tree ref={tree} treeId="tree-1" rootItem="root" treeLabel="Tree Example" />
      </ControlledTreeEnvironment>
    );
  };

  return (
    <div className={twMerge(document.documentElement.dataset.theme !== 'light' && 'rct-dark')}>
      {result()}
    </div>
  );
};
