import React, { useCallback, useRef, useState } from 'react';

import {
  Tree,
  TreeItem,
  DraggingPosition,
  ControlledTreeEnvironment,
  TreeRef,
  TreeEnvironmentRef,
  TreeItemIndex,
  DraggingPositionItem,
  TreeItemActions,
  TreeItemRenderFlags,
} from 'react-complex-tree';
import { twMerge } from 'tailwind-merge';
import './style-modern.css';

import { ReactComponent as SearchIcon } from '@renderer/assets/icons/search.svg';
import { HierarchyItem } from '@renderer/hooks/useHierarchyManager';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { useThemeContext } from '@renderer/store/ThemeContext';
import { MyMouseEvent } from '@renderer/types/mouse';

import { InputRender } from './inputRender';

import { WithHint } from '../WithHint';

export const Hierarchy: React.FC<{
  hierarchy: HierarchyItem;
  id: string;
  editor: CanvasEditor | null;
}> = ({ hierarchy, editor }) => {
  //Магия смены темы у данного компонента(На самом деле всё просто, он как ребёнок, получает все знания у своего родителя, которая связана со сменой темы)
  const { theme } = useThemeContext();
  const treeEnvironment = useRef<TreeEnvironmentRef>(null);
  const tree = useRef<TreeRef>(null);
  const [focusedItem, setFocusedItem] = useState<TreeItemIndex>();
  const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>([]);
  const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([]);
  const [search, setSearch] = useState<string>('');

  const findItemPath = useCallback(
    async (e, searchRoot = 'root') => {
      const item = await hierarchy[searchRoot];
      if (item.data.toLowerCase().includes(e.toLowerCase())) {
        return [item.index];
      }
      const searchedItems = await Promise.all(
        (item.children && item.children.map((child) => findItemPath(e, child))) || []
      );
      const result = searchedItems.find((item) => item !== null);
      if (!result) {
        return null;
      }
      return [item.index, ...result];
    },
    [hierarchy]
  );

  //Функции для поиска в иерархии состояний
  const find = useCallback(
    (e) => {
      e.preventDefault();
      if (!search) return;
      findItemPath(search).then((path) => {
        if (!path) return;
        tree.current?.expandSubsequently(path.slice(0, path.length - 1)).then(() => {
          tree.current?.selectItems([path[path.length - 1]]);
        });
      });
    },
    [findItemPath, search]
  );

  if (!editor) return;

  const onSubmit = (item: TreeItem) => {
    setFocusedItem(item.index.toString());
    editor.container.machineController.selectState(item.index.toString());
    editor.container.machineController.selectTransition(item.index.toString());
  };
  const onClick = (item: TreeItem, actions: TreeItemActions, renderFlags: TreeItemRenderFlags) => {
    actions.focusItem();
    actions.selectItem();
    //Раскрытие списка по нажатию на текст
    if (!item.isFolder && renderFlags.isRenaming) return;
    actions.toggleExpandedState();
  };
  const onDoubleClick = (item: TreeItem, actions: TreeItemActions) => {
    if (!item.canRename) return;
    actions.startRenamingItem();
  };
  const onContextMenu = (e, item: TreeItem, actions: TreeItemActions) => {
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
    const state = editor.container.machineController.states.get(item.index.toString());
    if (state) {
      return editor.container.statesController.handleContextMenu(state, { event: mouse });
    }

    const transition = editor.container.machineController.transitions.get(item.index.toString());
    if (transition) {
      return editor.container.transitionsController.handleContextMenu(transition, { event: mouse });
    }

    // editor.container.machineController.transitions[item.index.toString()].find((transition) => {
    //   editor.container.transitionsController.handleContextMenu(transition[1], {
    //     event: mouse,
    //   });
    // });
  };
  const onDragStart = (e, item: TreeItem, actions: TreeItemActions) => {
    //Проверка, можно ли двигать тот или иной объект, в данном случае, двигать можно лишь состояния, связи запрещено
    if (!item.canMove) return;
    e.dataTransfer.dropEffect = 'move';
    actions.startDragging();
  };

  const onRename = (item: TreeItem, name: string) => {
    editor?.container.machineController.changeStateName(item.index.toString(), name);
  };
  const onSelected = (items: TreeItemIndex[]) => {
    setSelectedItems(items);
  };
  const onExpanded = (item: TreeItem) => {
    setExpandedItems((items) => [...items, item.index]);
  };
  const onCollapse = (item: TreeItem) => {
    setExpandedItems((items) =>
      items.filter((expandedItemIndex) => expandedItemIndex !== item.index)
    );
  };

  //Здесь мы напрямую работаем с родителями и дочерними элементами
  const onLinkUnlinkState = (items: TreeItem[], target: DraggingPosition) => {
    const parent = tree.current?.dragAndDropContext.draggingPosition as DraggingPositionItem;

    items.map((value) => {
      if (target.targetType.toString() === 'item') {
        return editor.container.machineController.linkState(
          parent.targetItem.toString(),
          value.index.toString()
        );
      }
      if (target.targetType.toString() === 'between-items' && parent.parentItem !== 'root') {
        return editor.container.machineController.linkState(
          parent.parentItem.toString(),
          value.index.toString()
        );
      }
      editor.container.machineController.unlinkState({ id: value.index.toString() });
    });
  };

  const handleExpanded = () => {
    setExpandedItems([]);
    tree.current?.expandAll();
  };

  const handleCollapse = () => {
    setExpandedItems([]);
    tree.current?.collapseAll();
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
        //Реализовано свое переименование для добавления разных функций
        renderRenameInput={(props) => <InputRender props={props} />}
        defaultInteractionMode={{
          mode: 'custom',
          createInteractiveElementProps: (item, _treeId, actions, renderFlags) => ({
            onClick: () => onClick(item, actions, renderFlags),
            onDoubleClick: () => onDoubleClick(item, actions),
            onContextMenu: (e) => onContextMenu(e, item, actions),
            onBlur: actions.unselectItem,
            onFocus: actions.focusItem,
            onDragStart: (e) => onDragStart(e, item, actions),
            //Разрешаем перемещение
            draggable: renderFlags.canDrag && !renderFlags.isRenaming,
            onDragOver: (e) => {
              e.preventDefault(); // Разрешить удаление
            },
          }),
        }}
      >
        <div>
          <WithHint
            key="input"
            hint="Позволяет найти необходимое состояние(связь) за считанные секунды"
            placement="right"
            offset={5}
            delay={100}
          >
            {(props) => (
              <div className="mb-2 flex items-center">
                <span className="absolute pl-2">
                  <SearchIcon />
                </span>
                <input
                  className="flex h-10 w-full gap-3 rounded border-white bg-transparent pl-10 pr-2 text-current ring-2 focus:border-[#0c4bee] focus:outline-none focus:ring-2 focus:ring-[#0c4bee]"
                  onChange={(e) => {
                    setSearch(e.target.value);
                    find(e);
                  }}
                  {...props}
                  type="search"
                  onBlur={(e) => (e.target.value = '')}
                  placeholder="Поиск..."
                />
              </div>
            )}
          </WithHint>
          <WithHint
            key="button1"
            hint="Показывает все вложенные состояния и связи в иерархии"
            placement="right"
            offset={5}
            delay={100}
          >
            {(props) => (
              <button
                className="btn-primary mb-2 flex w-full items-center justify-center gap-3"
                type="button"
                onClick={handleExpanded}
                {...props}
              >
                Раскрыть всё
              </button>
            )}
          </WithHint>
          <WithHint
            key="button2"
            hint="Скрывает все вложенные состояния и связи в иерархии"
            placement="right"
            offset={5}
            delay={100}
          >
            {(props) => (
              <button
                className="btn-primary mb-2 flex w-full items-center justify-center gap-3"
                type="button"
                onClick={handleCollapse}
                {...props}
              >
                Свернуть всё
              </button>
            )}
          </WithHint>
        </div>
        <Tree ref={tree} treeId="tree-1" rootItem="root" treeLabel="Tree Example" />
      </ControlledTreeEnvironment>
    </div>
  );
};
