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
  Tooltip,
} from '@renderer/components';
import { hideLoadingOverlay } from '@renderer/components/utils/OverlayControl';
import { useErrorModal, useFileOperations, useSettings } from '@renderer/hooks';
import { useAppTitle } from '@renderer/hooks/useAppTitle';
import { useModal } from '@renderer/hooks/useModal';
import { useRecentFilesHooks } from '@renderer/hooks/useRecentFilesHooks';
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
  const [isTempSaveStored, setIsTempSaveStored] = useState<boolean>(false);
  const [isRestoreDataModalOpen, openRestoreDataModal, closeRestoreDataModal] = useModal(false);
  const isStale = modelController.model.useData('', 'isStale');
  const isInitialized = modelController.model.useData('', 'isInitialized');
  const basename = modelController.model.useData('', 'basename');
  const [docWidth, setDocWidth] = useState<number>(0);

  const { errorModalProps, openLoadError, openPlatformError, openSaveError, openImportError } =
    useErrorModal();
  const {
    saveModalProps,
    operations,
    performNewFile,
    handleOpenFromTemplate,
    tempSaveOperations,
    loadGraphml,
  } = useFileOperations({
    openLoadError,
    openCreateSchemeModal,
    openSaveError,
    openImportError,
  });
  const isSaveModalOpen = saveModalProps.isOpen;

  useRecentFilesHooks();

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

  useEffect(() => {
    const tempData = tempSaveOperations.loadTempSave();
    if (tempData) {
      openRestoreDataModal();
    }
  }, []);

  const restoreData = async () => {
    setIsTempSaveStored(true);
    // (Roundabout) TODO: обработка ошибок загрузки
    const data = tempSaveOperations.loadTempSave();
    if (data) {
      loadGraphml(data);
      setIsTempSaveStored(true);
    } else {
      throw Error('Не удалось загрузить временное сохранеение');
    }
  };

  const cancelRestoreData = async () => {
    tempSaveOperations.deleteTempSave();
    setIsTempSaveStored(false);
  };

  // автосохранение
  useEffect(() => {
    if (autoSaveSettings === null || isSaveModalOpen || !isInitialized) return;

    if (basename && isInitialized && isTempSaveStored) {
      setIsTempSaveStored(false);
      tempSaveOperations.deleteTempSave();
    }

    if (!isStale) return;

    const ms = autoSaveSettings.interval * 1000;
    let interval: NodeJS.Timeout;
    if (basename) {
      interval = setInterval(async () => {
        await operations.onRequestSaveFile();
      }, ms);
    } else {
      interval = setInterval(() => {
        console.log('temp save...');
        tempSaveOperations.tempSave();
        if (!isTempSaveStored) setIsTempSaveStored(true);
      }, ms);
    }

    //Clearing the intervals
    return () => clearInterval(interval);
  }, [autoSaveSettings, isStale, isInitialized, basename, isTempSaveStored, isSaveModalOpen]);

  return (
    <div className="h-screen select-none">
      <div className="relative h-full w-full">
        <div className="grid h-full w-full grid-cols-[auto_1fr_auto]">
          <Sidebar callbacks={operations} openImportError={openImportError} />

          <div
            className={twMerge(
              'relative min-w-80 bg-bg-primary',
              'after:pointer-events-none after:absolute after:inset-0 after:z-50 after:block after:bg-bg-hover after:opacity-0 after:transition-all after:content-[""]',
              isDragActive && 'opacity-30'
            )}
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            <Tabs />
          </div>
        </div>

        <div className="fixed right-0 top-0 z-[90] h-screen">
          <Documentation onWidthChange={setDocWidth} width={docWidth} />
        </div>
        <div
          className={twMerge(
            'absolute h-full',
            !!isMounted && 'top-[44.19px] h-[calc(100vh-44.19px)]'
          )}
          style={{ right: `${docWidth}px` }}
        >
          <EditorSettings />
        </div>
      </div>

      <div className="z-[100]">
        <SaveRemindModal {...saveModalProps} />
        <ErrorModal {...errorModalProps} />
        <CreateSchemeModal
          isOpen={isCreateSchemeModalOpen}
          onCreate={performNewFile}
          onClose={closeCreateSchemeModal}
          onCreateFromTemplate={handleOpenFromTemplate}
        />
        <UpdateModal />
        <RestoreDataModal
          isOpen={isRestoreDataModalOpen}
          onClose={closeRestoreDataModal}
          onRestore={restoreData}
          onCancelRestore={cancelRestoreData}
        />
      </div>

      {isMounted && (
        <>
          <DiagramContextMenu /> <Tooltip controller={controller} />
        </>
      )}

      <Toaster
        offset="3rem"
        toastOptions={{
          classNames: {
            error: 'bg-error text-text-primary border-none text-[0.875rem]',
            success: 'bg-[#9bcb64]',
          },
        }}
      />
    </div>
  );
};
