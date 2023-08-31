import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { ScrollableList } from './ScrollableList';

import { EditorRef } from '@renderer/hooks/useEditorManager';

import UnknownIcon from '@renderer/assets/icons/unknown.svg';
import { ReactComponent as AddIcon } from '@renderer/assets/icons/new transition.svg';

export interface ExplorerCallbacks {
  onRequestAddComponent: () => void;
  onRequestEditComponent: (idx: string) => void;
  onRequestDeleteComponent: (idx: string) => void;
}

interface ExplorerProps {
  editorRef: EditorRef;
  callbacks: ExplorerCallbacks;
}

export const Explorer: React.FC<ExplorerProps> = ({
  editorRef,
  callbacks: { onRequestAddComponent, onRequestEditComponent },
}) => {
  const editorData = editorRef.editorData;
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

  const onCompRightClick = (key: string) => {
    console.log(['component-right-click', key]);
    // TODO: контекстное меню? клонировать, переименовать, удалить
    // onRequestDeleteComponent(key);
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
          disabled={!editorRef.editorData.content}
          onClick={onAddClick}
        >
          <AddIcon className="shrink-0" />
          Добавить...
        </button>

        <ScrollableList
          className="max-h-[350px]"
          containerProps={{ onClick: (e) => e.stopPropagation() }}
          listItems={Object.keys(editorData?.data.components) ?? []}
          heightOfItem={10}
          maxItemsToRender={50}
          renderItem={(key) => (
            <div
              className={twMerge('flex items-center p-1', key == cursor && 'bg-bg-active')}
              onClick={() => onCompClick(key)}
              onDoubleClick={() => onCompDblClick(key)}
              onContextMenu={() => onCompRightClick(key)}
            >
              <img
                className="h-8"
                src={editorRef.platform?.getComponentIconUrl(key, true) ?? UnknownIcon}
              />
              <p className="ml-2 line-clamp-1">{key}</p>
            </div>
          )}
        />
      </div>

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
