import React, { useCallback, useEffect } from 'react';

import { useDropzone } from 'react-dropzone';
import { Toaster } from 'sonner';
import { twMerge } from 'tailwind-merge';

import {
  Documentation,
  CreateSchemeModal,
  SaveRemindModal,
  ErrorModal,
  Sidebar,
  UpdateModal,
  DiagramContextMenu,
} from '@renderer/components';
import { hideLoadingOverlay } from '@renderer/components/utils/OverlayControl';
import { useErrorModal, useFileOperations } from '@renderer/hooks';
import { useAppTitle } from '@renderer/hooks/useAppTitle';
import { useModal } from '@renderer/hooks/useModal';
import {
  getPlatformsErrors,
  preloadPlatforms,
  preparePreloadImages,
} from '@renderer/lib/data/PlatformLoader';
import { preloadPicto } from '@renderer/lib/drawable';

import { Tabs } from './Tabs';

export const MainContainer: React.FC = () => {
  const editor = useEditorContext();
  const isMounted = editor.controller.model.useData('isMounted');
  const [isCreateSchemeModalOpen, openCreateSchemeModal, closeCreateSchemeModal] = useModal(false);

  const { errorModalProps, openLoadError, openPlatformError, openSaveError, openImportError } =
    useErrorModal();
  const { saveModalProps, operations, performNewFile, handleOpenFromTemplate } = useFileOperations({
    openLoadError,
    openCreateSchemeModal,
    openSaveError,
    openImportError,
  });

  useAppTitle();
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      operations.onRequestOpenFile(acceptedFiles[0].path);
    },
    [operations]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noKeyboard: true,
    noClick: true,
    accept: {
      'application/xml': ['.graphml'],
    },
    multiple: false,
    onDrop,
  });

  useEffect(() => {
    preloadPlatforms(() => {
      preparePreloadImages();
      preloadPicto(() => void {});
      hideLoadingOverlay();

      const errs = getPlatformsErrors();
      if (Object.keys(errs).length > 0) {
        openPlatformError(errs);
      }
    });
  }, [openPlatformError]);

  return (
    <div className="h-screen select-none">
      <div className="flex h-full w-full flex-row overflow-x-hidden">
        <Sidebar callbacks={operations} openImportError={openImportError} />

        <div
          className={twMerge(
            ' relative w-full min-w-80 bg-bg-primary',
            'after:pointer-events-none after:absolute after:inset-0 after:z-50 after:block after:bg-bg-hover after:opacity-0 after:transition-all after:content-[""]',
            isDragActive && 'opacity-30'
          )}
          {...getRootProps()}
        >
          <input {...getInputProps()} />

          <Tabs />

          <Documentation topOffset={!!isMounted} />
        </div>

        {isMounted && <DiagramContextMenu />}
      </div>

      <SaveRemindModal {...saveModalProps} />
      <ErrorModal {...errorModalProps} />
      <CreateSchemeModal
        isOpen={isCreateSchemeModalOpen}
        onCreate={performNewFile}
        onClose={closeCreateSchemeModal}
        onCreateFromTemplate={handleOpenFromTemplate}
      />
      <UpdateModal />

      <Toaster
        offset="3rem"
        toastOptions={{
          classNames: {
            error: 'bg-error text-text-primary border-none text-[0.875rem]',
            success: 'bg-success',
          },
        }}
      />
    </div>
  );
};
