import React, { useCallback, useEffect, useState } from 'react';

import { useDropzone } from 'react-dropzone';
import { Toaster, toast } from 'sonner';
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
  DiagramEditor,
  Header,
  Simulator,
} from '@renderer/components';
import { hideLoadingOverlay } from '@renderer/components/utils/OverlayControl';
import { useErrorModal, useFileOperations, useSettings } from '@renderer/hooks';
import { useAppTitle } from '@renderer/hooks/useAppTitle';
import { useFileMenu } from '@renderer/hooks/useFileMenu';
import { useModal } from '@renderer/hooks/useModal';
import { useRecentFilesHooks } from '@renderer/hooks/useRecentFilesHooks';
import { useWindowManagerStore } from '@renderer/hooks/useWindowManagerStore';
import {
  getPlatformsErrors,
  preloadPlatforms,
  preparePreloadImages,
} from '@renderer/lib/data/PlatformLoader';
import { preloadPicto } from '@renderer/lib/drawable';
import { useModelContext } from '@renderer/store/ModelContext';
import { useManagerMS } from '@renderer/store/useManagerMS';
import { useTasks } from '@renderer/store/useTasks';
import { useWorkspace } from '@renderer/store/useWorkspace';

import { StartScreen } from './StartScreen';

import type { TaskCatalog } from '../../../../common/tasks';
import { CompilerConnection } from '../Modules/CompilerConnection';
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
  const workspace = useWorkspace((state) => state.activeWorkspace);
  const closeAllWindows = useWindowManagerStore((state) => state.closeAllWindows);
  const [setTaskCatalog, submissionActive] = useTasks((state) => [
    state.setCatalog,
    state.submissionActive,
  ]);
  const initialSimulationSmId = Object.keys(controller.stateMachinesSub).find(
    (smId) => smId !== ''
  );

  const { errorModalProps, openLoadError, openPlatformError, openSaveError, openImportError } =
    useErrorModal();
  const {
    saveModalProps,
    operations,
    performNewFile,
    handleOpenFromTemplate,
    initImportData,
    tempSaveOperations,
    loadGraphml,
  } = useFileOperations({
    openLoadError,
    openCreateSchemeModal,
    openSaveError,
    openImportError,
  });
  const isSaveModalOpen = saveModalProps.isOpen;
  const [openData, setOpenData] = useState<
    [boolean, string | null, string | null, string] | undefined
  >(undefined);
  const compilerStatus = useManagerMS((state) => state.compilerStatus);
  const { items: fileMenuItems, modals: fileMenuModals } = useFileMenu({
    onRequestNewFile: operations.onRequestNewFile,
    onRequestOpenFile: operations.onRequestOpenFile,
    onRequestSaveFile: operations.onRequestSaveFile,
    onRequestSaveAsFile: operations.onRequestSaveAsFile,
    onRequestImport: operations.onRequestImportFile,
    compilerStatus,
    setOpenData,
  });

  useRecentFilesHooks();

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke('tasks:getCatalog')
      .then((catalog) => setTaskCatalog(catalog as TaskCatalog))
      .catch((error) =>
        setTaskCatalog({
          tasks: [],
          diagnostics: [{ file: 'resources/tasks', message: String(error) }],
          assetRootUrl: '',
        })
      );
  }, [setTaskCatalog]);

  useAppTitle();
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (useTasks.getState().submissionActive) {
        toast.warning('Дождитесь завершения проверки решения');
        return;
      }
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

  useEffect(() => {
    if (workspace !== 'editor') closeAllWindows();
  }, [closeAllWindows, workspace]);

  useEffect(() => {
    if (!submissionActive) return;
    const blockEditingKeys = (event: KeyboardEvent) => {
      if (event.key === 'F1') return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    window.addEventListener('keydown', blockEditingKeys, true);
    return () => window.removeEventListener('keydown', blockEditingKeys, true);
  }, [submissionActive]);

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
    <div className="h-screen select-none overflow-hidden">
      <div className="relative flex h-full w-full flex-col">
        <Header fileMenuItems={fileMenuItems} initialSimulationSmId={initialSimulationSmId} />
        {!isInitialized && (
          <StartScreen
            fileMenuItems={fileMenuItems}
            getInputProps={getInputProps}
            getRootProps={getRootProps}
            isDragActive={isDragActive}
          />
        )}
        {fileMenuModals}
        <CompilerConnection openData={openData} onImportData={initImportData} />
        {isInitialized && (
          <div
            className={twMerge(
              'grid min-h-0 w-full flex-1 grid-cols-[auto_1fr_auto]',
              submissionActive && 'pointer-events-none opacity-70'
            )}
            aria-busy={submissionActive}
          >
            <Sidebar />

            <div
              className={twMerge(
                'relative min-w-80 bg-bg-primary',
                'after:pointer-events-none after:absolute after:inset-0 after:z-50 after:block after:bg-bg-hover after:opacity-0 after:transition-all after:content-[""]',
                isDragActive && 'opacity-30'
              )}
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              {workspace === 'editor' ? (
                <DiagramEditor
                  key={controller.id}
                  controller={controller}
                  editor={controller.app}
                />
              ) : (
                <Simulator initialSmId={initialSimulationSmId} />
              )}
            </div>
          </div>
        )}

        <div className="fixed right-0 top-[25px] z-[90] h-[calc(100vh-25px)]">
          <Documentation onWidthChange={setDocWidth} width={docWidth} />
        </div>
        {workspace === 'editor' && (
          <div
            className={twMerge(
              'absolute top-[25px] h-[calc(100%_-_25px)]',
              isMounted && 'top-[69.19px] h-[calc(100%_-_69.19px)]'
            )}
            style={{ right: `${docWidth}px` }}
          >
            <EditorSettings />
          </div>
        )}
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

      {isMounted && workspace === 'editor' && (
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
