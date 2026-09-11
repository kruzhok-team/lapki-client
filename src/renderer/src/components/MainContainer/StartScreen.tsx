import React from 'react';

import type { DropzoneState } from 'react-dropzone';
import { twMerge } from 'tailwind-merge';

import { FileMenu } from '@renderer/components/FileMenu';
import type { FileMenuItem } from '@renderer/hooks/useFileMenu';

import { NotInitialized } from './NotInitialized';

interface StartScreenProps
  extends Pick<DropzoneState, 'getInputProps' | 'getRootProps' | 'isDragActive'> {
  fileMenuItems: FileMenuItem[];
}

export const StartScreen: React.FC<StartScreenProps> = ({
  fileMenuItems,
  getInputProps,
  getRootProps,
  isDragActive,
}) => (
  <main
    className={twMerge(
      'relative flex min-h-0 flex-1 items-center justify-center overflow-auto bg-bg-primary px-6 py-8',
      isDragActive && 'bg-bg-hover'
    )}
    {...getRootProps()}
  >
    <input {...getInputProps()} />
    <div className="flex items-center">
      <aside className="mr-[24px]">
        <FileMenu items={fileMenuItems} variant="inline" />
      </aside>
      <div className="h-[400px] w-px bg-border-primary" aria-hidden="true" />
      <div className="ml-[24px]">
        <NotInitialized />
      </div>
    </div>
  </main>
);
