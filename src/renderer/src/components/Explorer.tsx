import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { ScrollableList } from './ScrollableList';

import UnknownIcon from '@renderer/assets/icons/unknown.svg';
import { ReactComponent as AddIcon } from '@renderer/assets/icons/new transition.svg';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { useAddComponent, useDeleteComponent, useEditComponent } from '@renderer/hooks';
import { ComponentEditModal, ComponentAddModal, ComponentDeleteModal } from '@renderer/components';

interface ExplorerProps {
  editor: CanvasEditor | null;
  manager: EditorManager;
}

export const Explorer: React.FC<ExplorerProps> = ({ editor, manager }) => {
  const isInitialized = manager.useData('isInitialized');
  const components = manager.useData('elements.components');

  const { onRequestAddComponent, ...addComponent } = useAddComponent(editor, manager);
  const { onRequestEditComponent, ...editComponent } = useEditComponent(editor, manager);
  const { onRequestDeleteComponent, ...deleteComponent } = useDeleteComponent(editor, manager);

  const [cursor, setCursor] = useState<string | null>(null);

  const onUnClick = (_e: React.MouseEvent) => {
    setCursor(null);
  };

  const onCompClick = (key: string) => {
    setCursor(key);
  };

  const onCompDblClick = (key: string) => {
    onRequestEditComponent(key);
  };

  // TODO: контекстное меню? клонировать, переименовать, удалить
  const onCompRightClick = (key: string) => {
    onRequestDeleteComponent(key);
  };

  const onAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestAddComponent();
  };

  return (
    <section className="flex flex-col" onClick={onUnClick}>
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
              onClick={() => onCompClick(key)}
              onDoubleClick={() => onCompDblClick(key)}
              onContextMenu={() => onCompRightClick(key)}
            >
              <img
                className="w-8 object-cover"
                src={
                  editor?.container.machine.platform?.getComponentIconUrl(key, true) ?? UnknownIcon
                }
              />
              <p className="ml-2 line-clamp-1">{key}</p>
            </div>
          )}
        />
      </div>

      <ComponentAddModal {...addComponent} />
      <ComponentEditModal {...editComponent} />
      <ComponentDeleteModal {...deleteComponent} />

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
