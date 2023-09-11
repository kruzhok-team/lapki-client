import { useEffect, useState } from 'react';
import DocumentTitle from 'react-document-title';
import * as monaco from 'monaco-editor';

import {
  PlatformSelectModal,
  SaveRemindModal,
  ErrorModal,
  Sidebar,
  SidebarCallbacks,
} from './components';
import { MainContainer } from './components/MainContainer';
import { ComponentAddModal } from './components/ComponentAddModal';
import { ComponentEditModal } from './components/ComponentEditModal';
import { ComponentDeleteModal } from './components/ComponentDeleteModal';
import { hideLoadingOverlay } from './components/utils/OverlayControl';

import useEditorManager from '@renderer/hooks/useEditorManager';
import { useAddComponent } from '@renderer/hooks/useAddComponent';
import { useEditComponent } from '@renderer/hooks/useEditComponent';
import { useDeleteComponent } from '@renderer/hooks/useDeleteComponent';
import { useErrorModal } from '@renderer/hooks/useErrorModal';
import { useFileOperations } from '@renderer/hooks/useFileOperations';

import { getColor } from '@renderer/theme';

import {
  getPlatformsErrors,
  preloadPlatforms,
  preparePreloadImages,
} from './lib/data/PlatformLoader';
import { preloadPicto } from './lib/drawable/Picto';

import { ThemeContext } from './store/ThemeContext';
import { Theme } from './types/theme';

/**
 * React-компонент приложения
 */
export const App: React.FC = () => {
  // TODO: а если у нас будет несколько редакторов?

  // Заголовок с названием файла,платформой и - Lapki IDE в конце
  const [title, setTitle] = useState<string>('Lapki IDE');

  const [theme, setTheme] = useState<Theme>('dark');

  const { editor, manager, platform, setEditor } = useEditorManager();

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

  const handleChangeTheme = (theme: Theme) => {
    setTheme(theme);

    document.documentElement.dataset.theme = theme;

    monaco.editor.setTheme(getColor('codeEditorTheme').trim());

    if (editor) {
      editor.container.isDirty = true;
    }
  };

  return (
    <DocumentTitle title={title}>
      <ThemeContext.Provider value={{ theme, setTheme: handleChangeTheme }}>
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
      </ThemeContext.Provider>
    </DocumentTitle>
  );
};
