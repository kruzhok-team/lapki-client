import React, { useCallback } from 'react';

import { useDropzone } from 'react-dropzone';
import { twMerge } from 'tailwind-merge';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';

import { Documentations } from './Documentation/Documentation';
import { Tabs } from './Tabs';

import { ReactComponent as Icon } from '@renderer/assets/icons/icon.svg';

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
      name: "Создать файл ",
      command: {
        button1: "Ctrl",
        button2: "N",
      }
    },
    {
      name: "Открыть файл ",
      command: {
        button1: "Ctrl",
        button2: "O",
      }
    },
    {
      name: "Обновить приложение ",
      command: {
        button1: "Ctrl",
        button2: "R",
      }
    },
    {
      name: "Во весь экран ",
      command: {
        button1: "F11",
        button2: undefined,
      }
    },
    {
      name: "DevTools ",
      command: {
        button1: "F12",
        button2: undefined,
      }
    }
  ]
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
          <p className="text-center text-base py-6">
            Перетащите файл в эту область, либо воспользуйтесь комбинацией клавиш:
          </p>
          <div> 
            {
              combination.map((value) => (
                <div className="flex justify-between my-3">
                  <div className="px-1">{value.name}</div>
                  <div className="flex items-start">
                    <div className="bg-gray-600 px-1 rounded border-b-2 text-gray-300">{value.command.button1}</div>
                    {
                      value.command.button2 ? <><p className="px-1">+</p><div className="bg-gray-600 border-b-2 px-1 rounded text-gray-300">{value.command.button2}</div></> : ''
                    }
                  </div>
                  </div>
              ))
            }
          </div>
        </div>
      )}

      <Documentations topOffset={!!isInitialized} baseUrl={'https://lapki-doc.polyus-nt.ru/'} />
    </div>
  );
};
