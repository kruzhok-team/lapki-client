import React, { useRef, useState } from 'react';

import {
  Tree,
  TreeItem,
  DraggingPosition,
  ControlledTreeEnvironment,
  TreeRef,
  TreeEnvironmentRef,
  TreeItemIndex,
} from 'react-complex-tree';
import { twMerge } from 'tailwind-merge';
import './style-modern.css';

import { HierarchyItem } from '@renderer/hooks/useHierarchyManager';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { useThemeContext } from '@renderer/store/ThemeContext';
import { MyMouseEvent } from '@renderer/types/mouse';

export const Hierarchy: React.FC<{ hierarchy: HierarchyItem; editor: CanvasEditor | null }> = ({
  hierarchy,
  editor,
}) => {
  //Магия смены темы у данного компонента(На самом деле всё просто, он как ребёнок, получает все знания у своего родителя, которая связана со сменой темы)
  const { theme } = useThemeContext();

  const treeEnvironment = useRef<TreeEnvironmentRef>(null);
  const tree = useRef<TreeRef>(null);

  const [focusedItem, setFocusedItem] = useState<TreeItemIndex>();
  const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>([]);
  const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([]);

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
    const parent = tree.current?.dragAndDropContext.draggingPosition?.targetItem;

    items.map((value) => {
      if (parent) {
        target.targetType.toString() === 'item'
          ? editor.container.machineController.linkState(parent.toString(), value.index.toString())
          : target.targetType.toString() === 'between-items' &&
            editor.container.machineController.linkState(parent.toString(), value.index.toString());
      } else {
        editor.container.machineController.unlinkState({ id: value.index.toString() });
      }
    });
    console.log();
  };

  return (
    <div className={twMerge(theme !== 'light' && 'rct-dark')}>
      <ControlledTreeEnvironment
        ref={treeEnvironment}
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

            onBlur: () => {
              actions.unselectItem();
            },
            onFocus: () => {
              actions.focusItem();
            },

            onDragStart: (e) => {
              //Проверка, можно ли двигать тот или иной объект, в данном случае, двигать можно лишь состояния, связи запрещено
              if (item.canMove) {
                e.dataTransfer.dropEffect = 'move';
                actions.startDragging();
              }
            },
            //Разрешаем перемещение
            draggable: renderFlags.canDrag && !renderFlags.isRenaming,
            onDragOver: (e) => {
              e.preventDefault(); // Разрешить удаление
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
    </div>
  );
};
