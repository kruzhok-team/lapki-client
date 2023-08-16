import React, { useState } from 'react';
import UnknownIcon from '@renderer/assets/icons/unknown.svg';
import { EditorRef } from './utils/useEditorManager';
import ScrollableList, { ScrollableListItem } from './utils/ScrollableList';
import { twMerge } from 'tailwind-merge';
import AddIcon from '@renderer/assets/icons/new transition.svg';

import './component-list.css';

interface ExplorerProps {
  editorRef: EditorRef;
}

export const Explorer: React.FC<ExplorerProps> = ({ editorRef }) => {
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
    console.log(['component-double-click', key]);
  };

  const onCompRightClick = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    console.log(['component-right-click', key]);
  };

  const onAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(['add-component-click']);
  };

  const content: ScrollableListItem[] = Object.entries(editorData?.data.components).map(
    ([key, _component]) => ({
      id: key,
      content: (
        <div
          className={twMerge(key == cursor && 'bg-slate-600', 'flex items-center pb-1 pt-1')}
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
    <section
      className="flex h-full flex-col justify-start bg-[#a1c8df] font-Fira text-base"
      onClick={onUnClick}
    >
      <div
        className="w-full flex-auto px-4 pt-2 items-center text-center"
        style={{ height: `{dividerHeight}px` }}
      >
        <h1 className="mb-3 border-b border-white pb-2 text-lg">Компоненты</h1>
        <div className="py-2 component-add" onClick={onAddClick}>
          <img src={AddIcon} />
          <div>Добавить...</div>
        </div>
        <ScrollableList
          listItems={content ?? []}
          heightOfItem={10}
          maxItemsToRender={50}
          className="component-list"
        />
      </div>

      <div className="h-full flex-auto px-4 pt-3 text-center">
        <h1 className="mb-3 border-b border-white pb-2 text-lg">Иерархия состояний</h1>

        <div>
          Не забыть посмотреть варианты древа и возможности редактирования машины состояний
          отсюда!!!
        </div>
      </div>
    </section>
  );
};
