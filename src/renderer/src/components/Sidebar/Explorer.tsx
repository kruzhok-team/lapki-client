import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/new transition.svg';
import { ComponentEditModal, ComponentAddModal, ComponentDeleteModal } from '@renderer/components';
import { ScrollableList } from '@renderer/components/ScrollableList';
import { useAddComponent, useEditDeleteComponent } from '@renderer/hooks';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';

interface ExplorerProps {
  editor: CanvasEditor | null;
  manager: EditorManager;
}

export const Explorer: React.FC<ExplorerProps> = ({ editor, manager }) => {
  const isInitialized = manager.useData('isInitialized');
  const components = manager.useData('elements.components');

  const { onRequestAddComponent, ...addComponent } = useAddComponent(editor, manager);
  const { onRequestEditComponent, onRequestDeleteComponent, editProps, deleteProps } =
    useEditDeleteComponent(editor, manager);

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
          renderItem={(key) => (
            <div
              key={key}
              className={twMerge('flex items-center p-1', key == cursor && 'bg-bg-active')}
              onClick={() => onClick(key)}
              onAuxClick={() => onAuxClick(key)}
              onDoubleClick={() => onCompDblClick(key)}
              onContextMenu={() => onCompRightClick(key)}
            >
              {editor?.container.machineController.platform?.getFullComponentIcon(key)}
              <p className="ml-2 line-clamp-1">{key}</p>
            </div>
          )}
        />
      </div>

      <ComponentAddModal {...addComponent} />
      <ComponentEditModal {...editProps} />
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
