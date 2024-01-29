import { useEffect, useState } from 'react';

import * as monaco from 'monaco-editor';

import {
  CreateSchemeModal,
  SaveRemindModal,
  ErrorModal,
  Sidebar,
  MainContainer,
  UpdateModal,
} from '@renderer/components';
import { hideLoadingOverlay } from '@renderer/components/utils/OverlayControl';
import {
  useDiagramContextMenu,
  useEditorManager,
  useErrorModal,
  useFileOperations,
} from '@renderer/hooks';
import { getColor } from '@renderer/theme';

import { DiagramContextMenu } from './components/DiagramContextMenu';
import { useAppTitle } from './hooks/useAppTitle';
import { useModal } from './hooks/useModal';
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

  const [theme, setTheme] = useState<Theme>('dark');

  const { editor, manager, setEditor } = useEditorManager();
  const contextMenu = useDiagramContextMenu(editor, manager);

  const [isCreateSchemeModalOpen, openCreateSchemeModal, closeCreateSchemeModal] = useModal(false);

  const { errorModalProps, openLoadError, openPlatformError, openSaveError, openImportError } =
    useErrorModal();
  const { saveModalProps, operations, performNewFile, handleOpenFromTemplate } = useFileOperations({
    manager,
    openLoadError,
    openCreateSchemeModal,
    openSaveError,
    openImportError,
  });

  useAppTitle(manager);

  const handleChangeTheme = (theme: Theme) => {
    setTheme(theme);

    document.documentElement.dataset.theme = theme;

    monaco.editor.setTheme(getColor('codeEditorTheme').trim());

    if (editor) {
      editor.container.isDirty = true;
    }
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

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleChangeTheme }}>
      <div className="h-screen select-none">
        <div className="flex h-full w-full flex-row overflow-x-hidden">
          <Sidebar
            manager={manager}
            editor={editor}
            callbacks={operations}
            openImportError={openImportError}
          />

          <MainContainer
            manager={manager}
            editor={editor}
            setEditor={setEditor}
            onRequestOpenFile={operations.onRequestOpenFile}
          />
          <DiagramContextMenu {...contextMenu} />
        </div>

        <SaveRemindModal {...saveModalProps} />
        <ErrorModal {...errorModalProps} />
        <CreateSchemeModal
          isOpen={isCreateSchemeModalOpen}
          onCreate={performNewFile}
          onClose={closeCreateSchemeModal}
          onCreateFromTemplate={handleOpenFromTemplate}
          manager={manager}
        />
        <UpdateModal />
      </div>
    </ThemeContext.Provider>
  );
};
