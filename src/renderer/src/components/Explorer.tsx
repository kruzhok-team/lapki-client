import React from 'react';
import UnknownIcon from '@renderer/assets/icons/unknown.svg';
import { EditorRef } from './utils/useEditorManager';

interface ExplorerProps {
  editorRef: EditorRef;
}

export const Explorer: React.FC<ExplorerProps> = ({ editorRef }) => {
  const editorData = editorRef.editorData;
  return (
    <section className="flex h-full flex-col justify-between bg-[#a1c8df] font-Fira text-base">
      <div className="w-full px-4 pt-2 text-center">
        <h1 className="mb-3 border-b border-white pb-2 text-lg">Компоненты</h1>
        {editorData?.content && (
          <div className="flex flex-col items-center">
            {Object.entries(editorData?.data.components).map(([key, _component]) => (
              <div className="mb-4 h-20 w-20 cursor-pointer" draggable key={'explorer' + key}>
                <img src={editorRef.platform?.getComponentIconUrl(key, true) ?? UnknownIcon} />
                {key}
              </div>
            ))}
          </div>
        )}
        <div className=" rounded bg-neutral-700 px-4 py-3 text-neutral-50">Добавить компонент</div>
      </div>

      <div className="h-[500px] px-4 text-center">
        <h1 className="mb-3 border-b border-white  pb-2 text-lg">Иерархия состояний</h1>

        <div>
          Не забыть посмотреть варианты древа и возможности редактирования машины состояний
          отсюда!!!
        </div>
      </div>
    </section>
  );
};
