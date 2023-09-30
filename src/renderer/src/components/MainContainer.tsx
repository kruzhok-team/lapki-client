import React, { useCallback } from 'react';

import { useDropzone } from 'react-dropzone';
import { twMerge } from 'tailwind-merge';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';

import { Documentations } from './Documentation/Documentation';
import { Tabs } from './Tabs';

interface MainContainerProps {
  manager: EditorManager;
  editor: CanvasEditor | null;
  setEditor: (editor: CanvasEditor | null) => void;
  onRequestOpenFile: () => void;
}

export const MainContainer: React.FC<MainContainerProps> = ({
  manager,
  editor,
  setEditor,
  onRequestOpenFile,
}) => {
  const isInitialized = manager.useData('isInitialized');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/json': ['.json'],
    },
    multiple: false,
    onDrop,
  });

  return (
    <div
      className={twMerge(
        'relative w-full min-w-0 bg-bg-primary transition-colors',
        isDragActive && 'bg-bg-hover'
      )}
      {...getRootProps()}
    >
      <input {...getInputProps()} />

      {isInitialized ? (
        <Tabs manager={manager} editor={editor} setEditor={setEditor} />
      ) : (
        <p className="pt-24 text-center text-base">
          Откройте файл в формате json или перенесите его сюда...
        </p>
      )}

      <Documentations topOffset={!!isInitialized} baseUrl={'https://lapki-doc.polyus-nt.ru/'} />
    </div>
  );
};
