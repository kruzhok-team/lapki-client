import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/new transition.svg';
import { ComponentEditModal, ComponentAddModal, ComponentDeleteModal } from '@renderer/components';
import { ScrollableList } from '@renderer/components/ScrollableList';
import { useComponents } from '@renderer/hooks';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';

import { WithHint } from '../WithHint';

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

  const onAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestAddComponent();
  };

  const renderComponent = (name: string) => {
    const proto = editor?.container.machineController.platform.getComponent(name);

    return (
      <WithHint key={name} hint={proto?.description ?? ''} placement="right">
        {(props) => (
          <div
            className={twMerge('flex items-center p-1', name == cursor && 'bg-bg-active')}
            onClick={() => onClick(name)}
            onAuxClick={() => onAuxClick(name)}
            onDoubleClick={() => onCompDblClick(name)}
            onContextMenu={() => onCompRightClick(name)}
            {...props}
          >
            {editor?.container.machineController.platform?.getFullComponentIcon(name)}
            <p className="ml-2 line-clamp-1">{name}</p>
          </div>
        )}
      </WithHint>
    );
  };

  return (
    <section className="flex flex-col" onClick={() => onUnClick()}>
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Компоненты
      </h3>

      <div className="px-4 text-center">
        <button
          className="btn-primary mb-2 flex w-full items-center justify-center gap-3"
          disabled={!isInitialized}
          onClick={onAddClick}
        >
          <AddIcon className="shrink-0" />
          Добавить...
        </button>

        <ScrollableList
          className="max-h-[350px]"
          containerProps={{ onClick: (e) => e.stopPropagation() }}
          listItems={Object.keys(components)}
          heightOfItem={10}
          maxItemsToRender={50}
          renderItem={renderComponent}
        />
      </div>

      <ComponentAddModal manager={manager} {...addProps} />
      <ComponentEditModal manager={manager} {...editProps} />
      <ComponentDeleteModal {...deleteProps} />

      {/* TODO: 
      <div className="h-full flex-auto px-4 pt-3 text-center">
        <h1 className="mb-3 border-b border-white pb-2 text-lg">Иерархия состояний</h1>

        <div>
          Не забыть посмотреть варианты древа и возможности редактирования машины состояний
          отсюда!!!
        </div>
      </div>
       */}
    </section>
  );
};
