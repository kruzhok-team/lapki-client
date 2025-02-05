import React, { useCallback, useEffect, useState } from 'react';

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
  EditorSettings,
} from '@renderer/components';
import { hideLoadingOverlay } from '@renderer/components/utils/OverlayControl';
import { useErrorModal, useFileOperations, useSettings } from '@renderer/hooks';
import { useAppTitle } from '@renderer/hooks/useAppTitle';
import { useModal } from '@renderer/hooks/useModal';
import {
  getPlatformsErrors,
  preloadPlatforms,
  preparePreloadImages,
} from '@renderer/lib/data/PlatformLoader';
import { preloadPicto } from '@renderer/lib/drawable';
import { useModelContext } from '@renderer/store/ModelContext';

import { Tabs } from './Tabs';

import { RestoreDataModal } from '../RestoreDataModal';

export const MainContainer: React.FC = () => {
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const controller = modelController.controllers[headControllerId];
  const isMounted = controller.useData('isMounted') as boolean;
  const [isCreateSchemeModalOpen, openCreateSchemeModal, closeCreateSchemeModal] = useModal(false);
  const [autoSaveSettings] = useSettings('autoSave');
  const [restoreSession, setRestoreSession] = useSettings('restoreSession');
  const [isReservedDataPresent, setIsReservedPresent] = useState<boolean>(false); // Схема без названия сохранена, либо загружена
  const [isRestoreDataModalOpen, openRestoreDataModal, closeRestoreDataModal] = useModal(false);
  const isStale = modelController.model.useData('', 'isStale');
  const isInitialized = modelController.model.useData('', 'isInitialized');
  const basename = modelController.model.useData('', 'basename');

  const { errorModalProps, openLoadError, openPlatformError, openSaveError, openImportError } =
    useErrorModal();
  const {
    saveModalProps,
    operations,
    performNewFile,
    handleOpenFromTemplate,
    tempSave,
    loadTempSave,
  } = useFileOperations({
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

  const restoreData = () => {
    setIsReservedPresent(true);
    loadTempSave();
  };

  const cancelRestoreData = async () => {
    await setRestoreSession(false).then(() => {
      setIsReservedPresent(true);
    });
  };

  // автосохранение
  useEffect(() => {
    if (autoSaveSettings === null || restoreSession === null) return;

    if (isInitialized && !isReservedDataPresent) {
      setIsReservedPresent(true);
      return;
    }

    if (!basename && restoreSession && !isReservedDataPresent) {
      if (!isRestoreDataModalOpen) {
        openRestoreDataModal();
      }
      return;
    }

    if (basename && restoreSession && isInitialized) {
      setRestoreSession(false);
    }

    if (!isStale || !isInitialized) return;

    const ms = autoSaveSettings.interval * 1000;
    let interval: NodeJS.Timeout;
    if (basename) {
      interval = setInterval(async () => {
        await operations.onRequestSaveFile();
      }, ms);
    } else {
      interval = setInterval(async () => {
        console.log('temp save...');
        tempSave();
        if (!isReservedDataPresent) setIsReservedPresent(true);
        if (!restoreSession) await setRestoreSession(true);
      }, ms);
    }

    //Clearing the intervals
    return () => clearInterval(interval);
  }, [autoSaveSettings, isStale, isInitialized, basename, restoreSession, isReservedDataPresent]);

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
          <div
            className={twMerge(
              'absolute right-0 top-0 flex h-full',
              !!isMounted && 'top-[44.19px] h-[calc(100vh-44.19px)]'
            )}
          >
            <Documentation />
            <EditorSettings />
          </div>
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

      <RestoreDataModal
        isOpen={isRestoreDataModalOpen}
        onClose={closeRestoreDataModal}
        onRestore={restoreData}
        onCancelRestore={cancelRestoreData}
      ></RestoreDataModal>
    </div>
  );
};
