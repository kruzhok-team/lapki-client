import React, { useCallback } from 'react';

import { useDropzone } from 'react-dropzone';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as Icon } from '@renderer/assets/icons/icon.svg';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';

import { Documentation } from './Documentation/Documentation';
import { Scale } from './Scale';
import { Tabs } from './Tabs';

interface MainContainerProps {
  manager: EditorManager;
  editor: CanvasEditor | null;
  setEditor: (editor: CanvasEditor | null) => void;
  onRequestOpenFile: (path?: string) => void;
}

export const MainContainer: React.FC<MainContainerProps> = ({
  manager,
  editor,
  setEditor,
  onRequestOpenFile,
}) => {
  const isInitialized = manager.useData('isInitialized');

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onRequestOpenFile(acceptedFiles[0].path);
    },
    [onRequestOpenFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noKeyboard: true,
    noClick: true,
    accept: {
      'application/json': ['.json'],
    },
    multiple: false,
    onDrop,
  });

  const combination = [
    {
      name: 'Создать файл',
      command: {
        button1: 'Ctrl',
        button2: 'N',
      },
    },
    {
      name: 'Открыть файл',
      command: {
        button1: 'Ctrl',
        button2: 'O',
      },
    },
    {
      name: 'Импорт схемы(Graphml)',
      command: {
        button1: 'Ctrl',
        button2: 'I',
      },
    },
    {
      name: 'Во весь экран',
      command: {
        button1: 'F11',
        button2: undefined,
      },
    },
  ];
  return (
    <div
      className={twMerge(
        'relative w-full min-w-0 bg-bg-primary',
        'after:pointer-events-none after:absolute after:inset-0 after:z-50 after:block after:bg-bg-hover after:opacity-0 after:transition-all after:content-[""]',
        isDragActive && 'opacity-30'
      )}
      {...getRootProps()}
    >
      <input {...getInputProps()} />

      {isInitialized ? (
        <Tabs manager={manager} editor={editor} setEditor={setEditor} />
      ) : (
        <div className="flex flex-col items-center pt-24">
          <Icon />
          <p className="py-6 text-center text-base">
            Перетащите файл в эту область или воспользуйтесь комбинацией клавиш:
          </p>
          <div>
            {combination.map((value, key) => (
              <div key={key} className="my-3 flex justify-between">
                <div className="px-1">{value.name}</div>
                <div className="flex items-start">
                  <div className="rounded border-b-2 bg-gray-600 px-1 text-gray-300">
                    {value.command.button1}
                  </div>
                  {value.command.button2 ? (
                    <>
                      <p className="px-1">+</p>
                      <div className="rounded border-b-2 bg-gray-600 px-1 text-gray-300">
                        {value.command.button2}
                      </div>
                    </>
                  ) : (
                    ''
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editor && <Scale editor={editor} manager={manager} />}

      <Documentation topOffset={!!isInitialized} />
    </div>
  );
};
