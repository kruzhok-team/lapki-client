import { useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import DocumentTitle from 'react-document-title';

import {
  PlatformSelectModal,
  SaveRemindModal,
  ErrorModal,
  Sidebar,
  SidebarCallbacks,
  Tabs,
  Documentations,
} from './components';

import {
  getPlatformsErrors,
  preloadPlatforms,
  preparePreloadImages,
} from './lib/data/PlatformLoader';
import { preloadPicto } from './lib/drawable/Picto';
import useEditorManager from '@renderer/hooks/useEditorManager';
import { hideLoadingOverlay } from './components/utils/OverlayControl';
import { ComponentAddModal } from './components/ComponentAddModal';
import { ComponentEditModal } from './components/ComponentEditModal';
import { ComponentDeleteModal } from './components/ComponentDeleteModal';

import { getColor } from '@renderer/theme';

import { ThemeContext } from './store/ThemeContext';
import { Theme } from './types/theme';
import { useAddComponent } from './hooks/useAddComponent';
import { useEditComponent } from './hooks/useEditComponent';
import { useDeleteComponent } from './hooks/useDeleteComponent';
import { useErrorModal } from './hooks/useErrorModal';
import { useFileOperations } from './hooks/useFileOperations';

/**
 * React-компонент приложения
 */
export const App: React.FC = () => {
  // Заголовок с названием файла,платформой и - Lapki IDE в конце
  const [title, setTitle] = useState<string>('Lapki IDE');
  // TODO: а если у нас будет несколько редакторов?

  const [theme, setTheme] = useState<Theme>('dark');

  const lapki = useEditorManager();
  const editor = lapki.editor;
  const manager = lapki.managerRef.current;
  const editorData = lapki.editorData;

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
    editorData,
    openLoadError,
    openPlatformModal,
    openSaveError,
  });

  const handleChangeTheme = (theme: Theme) => {
    setTheme(theme);

    document.documentElement.dataset.theme = theme;

    monaco.editor.setTheme(getColor('codeEditorTheme').trim());

    if (editor) {
      editor.container.isDirty = true;
    }
  };

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
      console.log('plaforms loaded!');
      hideLoadingOverlay();
      const errs = getPlatformsErrors();
      if (Object.keys(errs).length > 0) {
        openPlatformError(errs);
      }
    });
  }, []);

  // Переименование вынес сюда из EditorManager.
  useEffect(() => {
    const platform = editor?.container.machine.platformIdx
      ? ` [${editor!.container.machine.platformIdx}]`
      : '';
    if (editorData.shownName) {
      setTitle(`${editorData.shownName}${platform} – Lapki IDE`);
    }
  }, [editorData.shownName, editor?.container.machine.platformIdx]);

  return (
    <DocumentTitle title={title}>
      <ThemeContext.Provider value={{ theme, setTheme: handleChangeTheme }}>
        <div className="h-screen select-none">
          <div className="flex h-full w-full flex-row overflow-hidden">
            <Sidebar editorRef={lapki} callbacks={sidebarCallbacks} />

            <div className="relative w-full min-w-0 bg-bg-primary">
              {editorData.content ? (
                <Tabs manager={manager!} editor={editor} setEditor={lapki.setEditor} />
              ) : (
                <p className="pt-24 text-center text-base">
                  Откройте файл или перенесите его сюда...
                </p>
              )}

              <Documentations
                topOffset={!!editorData.content}
                baseUrl={'https://lapki-doc.polyus-nt.ru/'}
              />
            </div>
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
