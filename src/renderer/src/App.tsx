import { useEffect, useState } from 'react';
import DocumentTitle from 'react-document-title';
import * as monaco from 'monaco-editor';

import {
  PlatformSelectModal,
  SaveRemindModal,
  ErrorModal,
  Sidebar,
  SidebarCallbacks,
  MainContainer,
  ComponentAddModal,
  ComponentEditModal,
  ComponentDeleteModal,
} from '@renderer/components';
import { hideLoadingOverlay } from '@renderer/components/utils/OverlayControl';

import {
  useEditorManager,
  useAddComponent,
  useEditComponent,
  useDeleteComponent,
  useErrorModal,
  useFileOperations,
} from '@renderer/hooks';

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
  const platformName = manager.useData('elements.platform');

  // FIXME: много, очень много модальных флажков, возможно ли сократить это обилие...
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const openPlatformModal = () => setIsPlatformModalOpen(true);
  const closePlatformModal = () => setIsPlatformModalOpen(false);

  const { onRequestAddComponent, ...addComponent } = useAddComponent(editor, manager);
  const { onRequestEditComponent, ...editComponent } = useEditComponent(editor, manager);
  const { onRequestDeleteComponent, ...deleteComponent } = useDeleteComponent(editor, manager);

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
    if (!name || !platformName) return;

    setTitle(`${name} [${platformName}] – Lapki IDE`);
  }, [name, platformName]);

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
