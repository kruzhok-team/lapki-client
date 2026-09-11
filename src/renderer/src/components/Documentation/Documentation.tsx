import React, { useEffect, useRef, useState } from 'react';

import { Resizable } from 're-resizable';
import {
  ImperativePanelGroupHandle,
  ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as ArrowIcon } from '@renderer/assets/icons/arrow-down.svg';
import { CloseButton } from '@renderer/components/UI/Modal/CloseButton';
import { useFetch, useSettings } from '@renderer/hooks';
import { useDoc } from '@renderer/store/useDoc';
import { File } from '@renderer/types/documentation';

import { Navigation } from './components/Navigation';
import { Show } from './components/Show';
import { Tree } from './components/Tree';

import ReferencePanel from '../ReferenceModal/Reference';
import { TaskBook } from '../Tasks';

export interface CurrentItem {
  isHtml: boolean;
  url: string;
  path: string;
}

export interface DocumentationProps {
  width: number;
  onWidthChange: (width: number) => void;
}

interface DocumentationSectionProps {
  canCollapse: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

const DocumentationSection: React.FC<DocumentationSectionProps> = ({
  canCollapse,
  isCollapsed,
  onClose,
  onToggleCollapse,
}) => {
  const [doc] = useSettings('doc');
  const rawUrl = doc?.type === 'local' ? doc?.localHost ?? '' : doc?.remoteHost ?? '';
  const url = rawUrl ? (rawUrl.endsWith('/') ? rawUrl : rawUrl + '/') : '';
  const { data, isLoading, error, refetch } = useFetch<{ body: File }>(
    url && `${url}index.json?nocache=true`
  );
  const [activeTab, setActiveTab] = useState<number>(0);
  const [currentItem, setCurrentItem] = useState<CurrentItem | null>(null);

  const onItemClick = (filePath: string) => {
    setActiveTab(1);

    if (filePath.endsWith('html')) {
      return setCurrentItem({
        isHtml: true,
        path: filePath,
        url: encodeURI(`${url}${filePath}?nocache=true`),
      });
    }

    return setCurrentItem({
      isHtml: false,
      path: filePath,
      url: encodeURI(`${url}${filePath}`),
    });
  };

  useEffect(() => {
    if (!error) return;

    toast.error('Ошибка при подключении к серверу документации', {
      description: error.toString(),
    });
  }, [error]);

  if (isLoading) return <div>Загрузка...</div>;

  if (error || !data) {
    return (
      <div className="px-4 pt-10">
        <div className="text-xs">Ошибка загрузки. Что-то пошло не так.</div>
        <button className="btn-primary" onClick={refetch}>
          Перезагрузить
        </button>
      </div>
    );
  }

  return (
    <section
      className={twMerge(
        'flex h-full select-none flex-col bg-bg-primary px-3 text-xs',
        !isCollapsed && 'pt-4'
      )}
    >
      <div
        className={twMerge(
          'relative flex items-center justify-between pb-1',
          !isCollapsed && 'mb-3 mt-2'
        )}
      >
        {canCollapse ? (
          <button
            type="button"
            className="flex h-11 items-center"
            aria-label={isCollapsed ? 'Развернуть документацию' : 'Свернуть документацию'}
            onClick={onToggleCollapse}
          >
            <ArrowIcon
              className={twMerge(
                'size-3 rotate-0 transition-transform',
                isCollapsed && '-rotate-90'
              )}
            />
            <h1 className="h2-header ml-1">Документация</h1>
          </button>
        ) : (
          <h1 className="h2-header">Документация</h1>
        )}
        {!isCollapsed && <CloseButton aria-label="Закрыть документацию" onClick={onClose} />}
      </div>
      {!isCollapsed && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <button
              className={twMerge(
                'rounded-lg bg-[#F1F1F1] px-3 py-[5px]',
                activeTab === -1 && 'bg-[#E6F4FF] font-medium'
              )}
              onClick={() => setActiveTab(-1)}
            >
              Компоненты
            </button>
            <button
              className={twMerge(
                'rounded-lg bg-[#F1F1F1] px-3 py-[5px]',
                activeTab === 0 && 'bg-[#E6F4FF] font-medium'
              )}
              onClick={() => setActiveTab(0)}
            >
              Содержание
            </button>
            <button
              className={twMerge(
                'rounded-lg bg-[#F1F1F1] px-3 py-[5px] disabled:cursor-not-allowed',
                activeTab === 1 && 'bg-[#E6F4FF] font-medium'
              )}
              onClick={() => setActiveTab(1)}
              disabled={!currentItem}
            >
              Просмотр
            </button>
          </div>
          <div className="h-full overflow-y-hidden pt-3">
            <div className={twMerge('h-full', activeTab !== -1 && 'hidden')}>
              <ReferencePanel />
            </div>
            <div className={twMerge('h-full', activeTab !== 0 && 'hidden')}>
              <Tree root={data.body} onItemClick={onItemClick} />
            </div>
            <div className={twMerge('h-full', activeTab !== 1 && 'hidden')}>
              {currentItem && (
                <>
                  <Show key={currentItem.url} item={currentItem} />
                  <Navigation
                    data={data}
                    onItemClick={onItemClick}
                    currentPath={currentItem.path}
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export const Documentation: React.FC<DocumentationProps> = ({ width, onWidthChange }) => {
  const [isOpen, toggleOpen, visibleViews, mountedViews, closeView, toggleDocumentation] = useDoc(
    (state) => [
      state.isOpen,
      state.toggleOpen,
      state.visibleViews,
      state.mountedViews,
      state.closeView,
      state.onDocumentationToggle,
    ]
  );
  const [minWidth, setMinWidth] = useState(5);
  const [maxWidth, setMaxWidth] = useState('60vw');
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const documentationPanelRef = useRef<ImperativePanelHandle>(null);
  const tasksPanelRef = useRef<ImperativePanelHandle>(null);
  const splitLayout = useRef([50, 50]);
  const [isDocumentationCollapsed, setDocumentationCollapsed] = useState(false);
  const [isTasksCollapsed, setTasksCollapsed] = useState(false);
  const bothMounted = mountedViews.documentation && mountedViews.tasks;
  const bothVisible = visibleViews.documentation && visibleViews.tasks;
  const hasVisibleView = visibleViews.documentation || visibleViews.tasks;

  const handleResize = (event, _direction, ref) => {
    if (event.pageX < 0.95 * window.innerWidth && !isOpen) toggleOpen();
    if (event.pageX >= 0.95 * window.innerWidth && isOpen) toggleOpen();
    onWidthChange(parseInt(ref.style.width));
  };

  useEffect(() => {
    if (!isOpen) {
      setMaxWidth('5px');
      setMinWidth(5);
    } else {
      setMaxWidth('60vw');
      setMinWidth(420);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'F1') {
        event.preventDefault();
        toggleDocumentation();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleDocumentation]);

  useEffect(() => {
    if (!bothMounted || !hasVisibleView) return;

    if (bothVisible) panelGroupRef.current?.setLayout(splitLayout.current);
    else if (visibleViews.documentation) panelGroupRef.current?.setLayout([100, 0]);
    else panelGroupRef.current?.setLayout([0, 100]);
  }, [bothMounted, bothVisible, hasVisibleView, visibleViews.documentation]);

  const rememberSplit = (layout: number[]) => {
    if (bothVisible && layout[0] > 0 && layout[1] > 0) splitLayout.current = layout;
  };

  const togglePanel = (view: 'documentation' | 'tasks') => {
    const panel = view === 'documentation' ? documentationPanelRef.current : tasksPanelRef.current;
    if (!panel) return;

    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  };

  return (
    <Resizable
      enable={{ left: true }}
      size={{ width, height: '100%' }}
      minWidth={minWidth}
      maxWidth={maxWidth}
      onResize={handleResize}
      className="h-full overflow-hidden rounded-l-2xl border-l border-border-primary bg-bg-secondary shadow-[-2px_0_4px_rgba(0,0,0,0.25)] [[data-theme=light]_&]:bg-white"
    >
      <div className="h-full min-h-0">
        {isOpen && !hasVisibleView && (
          <div className="flex h-full items-center justify-center px-6 text-center text-text-inactive">
            Откройте документацию или задачник
          </div>
        )}

        <div className={twMerge('h-full min-h-0', (!isOpen || !hasVisibleView) && 'hidden')}>
          <PanelGroup
            ref={panelGroupRef}
            direction="vertical"
            className="min-h-0"
            onLayout={rememberSplit}
          >
            {mountedViews.documentation && (
              <Panel
                ref={documentationPanelRef}
                key="documentation"
                id="documentation"
                order={0}
                collapsible
                collapsedSize={visibleViews.documentation ? 6 : 0}
                minSize={20}
                defaultSize={50}
                onCollapse={() => setDocumentationCollapsed(true)}
                onExpand={() => setDocumentationCollapsed(false)}
                className="min-h-0"
              >
                <DocumentationSection
                  canCollapse={bothVisible}
                  isCollapsed={isDocumentationCollapsed}
                  onClose={() => closeView('documentation')}
                  onToggleCollapse={() => togglePanel('documentation')}
                />
              </Panel>
            )}

            {bothMounted && (
              <PanelResizeHandle
                key="right-sidebar-resize-handle"
                className={twMerge('group relative h-px shrink-0', !bothVisible && 'hidden')}
              >
                <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border-primary transition-colors group-hover:h-1 group-hover:bg-primary group-active:h-1 group-active:bg-primary [[data-theme=light]_&]:bg-[#eeeeee]" />
              </PanelResizeHandle>
            )}

            {mountedViews.tasks && (
              <Panel
                ref={tasksPanelRef}
                key="tasks"
                id="tasks"
                order={1}
                collapsible
                collapsedSize={visibleViews.tasks ? 6 : 0}
                minSize={20}
                defaultSize={50}
                onCollapse={() => setTasksCollapsed(true)}
                onExpand={() => setTasksCollapsed(false)}
                className="min-h-0"
              >
                <TaskBook
                  canCollapse={bothVisible}
                  isCollapsed={isTasksCollapsed}
                  onClose={() => closeView('tasks')}
                  onToggleCollapse={() => togglePanel('tasks')}
                />
              </Panel>
            )}
          </PanelGroup>
        </div>
      </div>
    </Resizable>
  );
};
