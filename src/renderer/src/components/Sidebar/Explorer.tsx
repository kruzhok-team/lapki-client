import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/new transition.svg';
import { ComponentEditModal, ComponentAddModal, ComponentDeleteModal } from '@renderer/components';
import { ScrollableList } from '@renderer/components/ScrollableList';
import { WithHint } from '@renderer/components/UI';
import { useComponents } from '@renderer/hooks';
import { useHierarchyManager } from '@renderer/hooks/useHierarchyManager';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';

import { Hierarchy } from '../Hierarchy/Hierarchy';

interface ExplorerProps {
  editor: CanvasEditor | null;
  manager: EditorManager;
}

export const Explorer: React.FC<ExplorerProps> = ({ editor, manager }) => {
  const isInitialized = manager.useData('isInitialized');
  const components = manager.useData('elements.components');

  const {
    addProps,
    editProps,
    deleteProps,
    onRequestAddComponent,
    onRequestEditComponent,
    onRequestDeleteComponent,
  } = useComponents(editor, manager);

  const hierarchyData = useHierarchyManager(editor, manager);

  const [cursor, setCursor] = useState<string | null>(null);

  const onUnClick = () => {
    setCursor(null);
  };

  const onClick = (key: string) => {
    setCursor(key);
  };

  const onAuxClick = (key: string) => {
    setCursor(key);
    onRequestDeleteComponent(key);
  };

  const onCompDblClick = (key: string) => {
    setCursor(key);
    onRequestEditComponent(key);
  };

  // TODO: контекстное меню? клонировать, переименовать, удалить
  const onCompRightClick = (key: string) => {
    setCursor(key);
    onRequestEditComponent(key);
  };

  const onCompKeyDown = (e: React.KeyboardEvent, name: string) => {
    if (e.key !== 'Delete') return;

    onRequestDeleteComponent(name);
  };

  const onAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestAddComponent();
  };

  const renderComponent = (name: string) => {
    const proto = editor?.container.machineController.platform.getComponent(name);

    return (
      <WithHint key={name} hint={proto?.description ?? ''} placement="right">
        {(props) => (
          <button
            type="button"
            className={twMerge('flex w-full items-center p-1', name == cursor && 'bg-bg-active')}
            onClick={() => onClick(name)}
            onAuxClick={() => onAuxClick(name)}
            onDoubleClick={() => onCompDblClick(name)}
            onContextMenu={() => onCompRightClick(name)}
            onKeyDown={(e) => onCompKeyDown(e, name)}
            {...props}
          >
            {editor?.container.machineController.platform?.getFullComponentIcon(name)}
            <p className="ml-2 line-clamp-1">{name}</p>
          </button>
        )}
      </WithHint>
    );
  };

  return (
    <section className="flex h-full flex-col px-4" onClick={() => onUnClick()}>
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Проводник
      </h3>
      <div className="h-[50%]">
        <h3 className="mb-3 font-semibold">Компоненты</h3>
        <button
          className="btn-primary mb-2 flex w-full items-center justify-center gap-3"
          disabled={!isInitialized}
          onClick={onAddClick}
        >
          <AddIcon className="shrink-0" />
          Добавить...
        </button>

        <ScrollableList
          containerProps={{ onClick: (e) => e.stopPropagation() }}
          listItems={Object.keys(components)}
          heightOfItem={10}
          maxItemsToRender={50}
          renderItem={renderComponent}
        />
      </div>

      <div className="h-[50%] flex-auto pt-3">
        <h3 className="mb-3 font-semibold">Иерархия состояний</h3>
        <Hierarchy {...hierarchyData} />
      </div>

      <ComponentAddModal manager={manager} {...addProps} />
      <ComponentEditModal manager={manager} {...editProps} />
      <ComponentDeleteModal {...deleteProps} />
    </section>
  );
};
