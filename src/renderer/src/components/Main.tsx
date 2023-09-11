import React, { useEffect, useState } from 'react';
import DocumentTitle from 'react-document-title';

import {
  PlatformSelectModal,
  SaveRemindModal,
  ErrorModal,
  Sidebar,
  SidebarCallbacks,
} from '../components';
import { MainContainer } from '../components/MainContainer';
import { ComponentAddModal } from '../components/ComponentAddModal';
import { ComponentEditModal } from '../components/ComponentEditModal';
import { ComponentDeleteModal } from '../components/ComponentDeleteModal';
import { hideLoadingOverlay } from '../components/utils/OverlayControl';

import { useAddComponent } from '../hooks/useAddComponent';
import { useEditComponent } from '../hooks/useEditComponent';
import { useDeleteComponent } from '../hooks/useDeleteComponent';
import { useErrorModal } from '../hooks/useErrorModal';
import { useFileOperations } from '../hooks/useFileOperations';

import {
  getPlatformsErrors,
  preloadPlatforms,
  preparePreloadImages,
} from '../lib/data/PlatformLoader';
import { preloadPicto } from '../lib/drawable/Picto';

import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { PlatformManager } from '@renderer/lib/data/PlatformManager';

interface MainProps {
  editor: CanvasEditor | null;
  manager: EditorManager;
  platform: PlatformManager | null;
  setEditor: (editor: CanvasEditor | null) => void;
}

export const Main: React.FC<MainProps> = ({ editor, manager, platform, setEditor }) => {
  // Заголовок с названием файла,платформой и - Lapki IDE в конце
  const [title, setTitle] = useState<string>('Lapki IDE');

  const name = manager.useData('name');
  const platformIdx = editor?.container.machine.platformIdx;

  // FIXME: много, очень много модальных флажков, возможно ли сократить это обилие...
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const openPlatformModal = () => setIsPlatformModalOpen(true);
  const closePlatformModal = () => setIsPlatformModalOpen(false);

  const { onRequestAddComponent, ...addComponent } = useAddComponent(editor);
  const { onRequestEditComponent, ...editComponent } = useEditComponent(editor);
  const { onRequestDeleteComponent, ...deleteComponent } = useDeleteComponent(editor);

  const { errorModalProps, openLoadError, openPlatformError, openSaveError } = useErrorModal();
  const { saveModalProps, operations, performNewFile } = useFileOperations({
    manager,
    openLoadError,
    openPlatformModal,
    openSaveError,
  });

  const sidebarCallbacks: SidebarCallbacks = {
    ...operations,
    onRequestAddComponent,
    onRequestEditComponent,
    onRequestDeleteComponent,
  };

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
  }, []);

  // Переименование вынес сюда из EditorManager.
  useEffect(() => {
    if (!name || !platformIdx) return;

    setTitle(`${name} [${platformIdx}] – Lapki IDE`);
  }, [name, platformIdx]);

  return (
    <DocumentTitle title={title}>
      <div className="h-screen select-none">
        <div className="flex h-full w-full flex-row overflow-hidden">
          <Sidebar
            manager={manager}
            editor={editor}
            platform={platform}
            callbacks={sidebarCallbacks}
          />

          <MainContainer manager={manager} editor={editor} setEditor={setEditor} />
        </div>

        <SaveRemindModal {...saveModalProps} />
        <ErrorModal {...errorModalProps} />
        <PlatformSelectModal
          isOpen={isPlatformModalOpen}
          onCreate={performNewFile}
          onClose={closePlatformModal}
        />

        <ComponentAddModal {...addComponent} />
        <ComponentEditModal {...editComponent} />
        <ComponentDeleteModal {...deleteComponent} />
      </div>
    </DocumentTitle>
  );
};
