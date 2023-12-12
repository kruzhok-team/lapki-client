import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  Tree,
  TreeItem,
  DraggingPosition,
  ControlledTreeEnvironment,
  TreeRef,
  TreeEnvironmentRef,
  TreeItemIndex,
  DraggingPositionItem,
} from 'react-complex-tree';
import { twMerge } from 'tailwind-merge';
import './style-modern.css';

import { HierarchyItem } from '@renderer/hooks/useHierarchyManager';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { useThemeContext } from '@renderer/store/ThemeContext';
import { MyMouseEvent } from '@renderer/types/mouse';

import { WithHint } from '../WithHint';

export const Hierarchy: React.FC<{
  hierarchy: HierarchyItem;
  id: string;
  editor: CanvasEditor | null;
}> = ({ hierarchy, id, editor }) => {
  //Магия смены темы у данного компонента(На самом деле всё просто, он как ребёнок, получает все знания у своего родителя, которая связана со сменой темы)
  const { theme } = useThemeContext();
  const treeEnvironment = useRef<TreeEnvironmentRef>(null);
  const tree = useRef<TreeRef>(null);
  const [focusedItem, setFocusedItem] = useState<TreeItemIndex>();
  const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>([]);
  const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([]);

  useMemo(() => {
    setSelectedItems([id]);
  }, [id]);

  if (!editor) return;

  const onSubmit = (item: TreeItem<any>) => {
    setFocusedItem(item.index.toString());
    editor?.container.machineController.selectState(item.index.toString());
    editor?.container.machineController.selectTransition(item.index.toString());
  };
  const onRename = (item: TreeItem<any>, name: string) => {
    editor?.container.machineController.changeStateName(item.index.toString(), name);
  };
  const onSelected = (items: TreeItemIndex[]) => {
    setSelectedItems(items);
  };
  const onExpanded = (item: TreeItem<any>) => {
    setExpandedItems((items) => [...items, item.index]);
  };
  const onCollapse = (item: TreeItem<any>) => {
    setExpandedItems((items) =>
      items.filter((expandedItemIndex) => expandedItemIndex !== item.index)
    );
  };

  //Здесь мы напрямую работаем с родителями и дочерними элементами
  const onLinkUnlinkState = (items: TreeItem[], target: DraggingPosition) => {
    const parent = tree.current?.dragAndDropContext.draggingPosition as DraggingPositionItem;

    items.map((value) => {
      if (target.targetType.toString() === 'item') {
        editor.container.machineController.linkState(
          parent.targetItem.toString(),
          value.index.toString()
        );
      } else {
        if (target.targetType.toString() === 'between-items' && parent.parentItem !== 'root') {
          editor.container.machineController.linkState(
            parent.parentItem.toString(),
            value.index.toString()
          );
        } else {
          editor.container.machineController.unlinkState({ id: value.index.toString() });
        }
      }
    });
  };

  const buttonsHierarchy = [
    {
      text: 'Раскрыть всё',
      hint: 'Показывает все вложенные состояния и связи в иерархии',
      onItems: () => {
        setExpandedItems([]);
        tree.current?.expandAll();
      },
    },
    {
      text: 'Свернуть всё',
      hint: 'Скрывает все вложенные состояния и связи в иерархии',
      onItems: () => {
        setExpandedItems([]);
        tree.current?.collapseAll();
      },
    },
  ];

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
        onDrop={onLinkUnlinkState}
        onRenameItem={onRename}
        onFocusItem={onSubmit}
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
        defaultInteractionMode={{
          mode: 'custom',
          createInteractiveElementProps: (item, _treeId, actions, renderFlags) => ({
            onClick: () => {
              actions.focusItem();
              actions.selectItem();
              //Раскрытие списка по нажатию на текст
              if (item.isFolder && !renderFlags.isRenaming) {
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
                stopPropagation: e.stopPropagation,
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
          {buttonsHierarchy.map(({ text, hint, onItems }, i) => (
            <WithHint key={i} hint={hint} placement="right" offset={5} delay={100}>
              {(props) => (
                <button
                  className="btn-primary mb-2 flex w-full items-center justify-center gap-3"
                  type="button"
                  onClick={() => onItems()}
                  {...props}
                >
                  {text}
                </button>
              )}
            </WithHint>
          ))}
        </div>
        <Tree ref={tree} treeId="tree-1" rootItem="root" treeLabel="Tree Example" />
      </ControlledTreeEnvironment>
    </div>
  );
};
