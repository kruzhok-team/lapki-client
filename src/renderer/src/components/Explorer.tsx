import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';

import UnknownIcon from '@renderer/assets/icons/unknown.svg';
import { ReactComponent as AddIcon } from '@renderer/assets/icons/new transition.svg';

import { EditorRef } from './utils/useEditorManager';
import ScrollableList, { ScrollableListItem } from './utils/ScrollableList';

import './component-list.css';

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

  const onCompClick = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    setCursor(key);
  };

  const onCompDblClick = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    onRequestEditComponent(key);
  };

  const onCompRightClick = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    console.log(['component-right-click', key]);
    // TODO: контекстное меню? клонировать, переименовать, удалить
    // onRequestDeleteComponent(key);
  };

  const onAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestAddComponent();
  };

  const content: ScrollableListItem[] = Object.entries(editorData?.data.components).map(
    ([key, _component]) => ({
      id: key,
      content: (
        <div
          className={twMerge(key == cursor && 'bg-primary', 'flex items-center pb-1 pt-1')}
          onClick={(e) => onCompClick(e, key)}
          onDoubleClick={(e) => onCompDblClick(e, key)}
          onContextMenu={(e) => onCompRightClick(e, key)}
        >
          <img
            style={{ height: '32px' }}
            src={editorRef.platform?.getComponentIconUrl(key, true) ?? UnknownIcon}
          />
          <p className={twMerge('line-clamp-1', key == cursor && 'text-white')}>{key}</p>
        </div>
      ),
    })
  );

  return (
    <section className="flex flex-col" onClick={onUnClick}>
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Компоненты
      </h3>

      <div className="px-4 py-2 text-center">
        <button
          className="btn flex w-full items-center gap-2"
          disabled={!editorRef.editorData.content}
          onClick={onAddClick}
        >
          <AddIcon />
          Добавить...
        </button>
        <ScrollableList
          listItems={content ?? []}
          heightOfItem={10}
          maxItemsToRender={50}
          className="component-list"
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
