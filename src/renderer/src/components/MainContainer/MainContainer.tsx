import React, { useCallback } from 'react';

import { useDropzone } from 'react-dropzone';
import { twMerge } from 'tailwind-merge';

import { Documentation, Scale } from '@renderer/components';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';

import { NotInitialized } from './NotInitialized';
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
      '.graphml': [],
    },
    multiple: false,
    onDrop,
  });

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
        <NotInitialized />
      )}

      {editor && <Scale editor={editor} manager={manager} />}

      <Documentation topOffset={!!isInitialized} />
    </div>
  );
};
