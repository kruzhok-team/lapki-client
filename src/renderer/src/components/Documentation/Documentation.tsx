import { useEffect, useState } from 'react';

import { Resizable } from 're-resizable';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as Question } from '@renderer/assets/icons/question.svg';
import { EditorSettings } from '@renderer/components';
import { useFetch, useSettings } from '@renderer/hooks';
import { useModelContext } from '@renderer/store/ModelContext';
import { useDoc } from '@renderer/store/useDoc';
import { File } from '@renderer/types/documentation';

import { Navigation } from './components/Navigation';
import { Show } from './components/Show';
import { Tree } from './components/Tree';

export interface CurrentItem {
  isHtml: boolean;
  url: string;
  path: string;
}

interface DocumentationProps {
  topOffset?: boolean;
}

export const Documentation: React.FC<DocumentationProps> = ({ topOffset = false }) => {
  const modelController = useModelContext();
  const editor = modelController.getCurrentCanvas();
  const [doc] = useSettings('doc');
  const url = doc?.host ?? '';

  const { data, isLoading, error, refetch } = useFetch<{ body: File }>(
    url && `${url}/index.json?nocache=true`
  );

  const [activeTab, setActiveTab] = useState<number>(0);
  const [currentItem, setCurrentItem] = useState<CurrentItem | null>(null);

  const [isOpen, onDocumentationToggle] = useDoc((state) => [
    state.isOpen,
    state.onDocumentationToggle,
  ]);

  const [width, setWidth] = useState(0);
  const [minWidth, setMinWidth] = useState(5);
  const [maxWidth, setMaxWidth] = useState('60vw');

  const handleResize = (e, _direction, ref) => {
    if (e.pageX < 0.95 * window.innerWidth && !isOpen) {
      onDocumentationToggle();
    }

    if (e.pageX >= 0.95 * window.innerWidth && isOpen) {
      onDocumentationToggle();
    }
    //Получаем ширину блока документации
    setWidth(parseInt(ref.style.width));
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
    const handleKeyPress = (e) => {
      if (e.key === 'F1') {
        onDocumentationToggle();
      }
    };
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [onDocumentationToggle]);

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

  const renderContent = () => {
    if (isLoading) {
      return <div>Загрузка...</div>;
    }

    if (error || !data) {
      return (
        <div className="px-4 pt-10">
          <div className="text-lg">Ошибка загрузки. Что-то пошло не так.</div>
          <button className="btn-primary" onClick={refetch}>
            Перезагрузить
          </button>
        </div>
      );
    }

    return (
      <section className="flex h-full select-none flex-col px-2 pt-4">
        <div className="grid grid-cols-2 gap-1 pb-2">
          <button
            className={twMerge(
              'rounded border border-primary p-2',
              activeTab === 0 && 'bg-primary text-text-secondary'
            )}
            onClick={() => setActiveTab(0)}
          >
            Содержание
          </button>
          <button
            className={twMerge(
              'rounded border border-primary p-2',
              activeTab === 1 && 'bg-primary text-text-secondary'
            )}
            onClick={() => setActiveTab(1)}
          >
            Просмотр
          </button>
        </div>
        <div className="h-full overflow-y-hidden">
          <div className={twMerge('h-full', activeTab !== 0 && 'hidden')}>
            {<Tree root={data.body} borderWidth={0} onItemClick={onItemClick} />}
          </div>

          <div className={twMerge('h-full', activeTab !== 1 && 'hidden')}>
            {currentItem && (
              <>
                <Show item={currentItem} />
                <Navigation data={data} onItemClick={onItemClick} currentPath={currentItem.path} />
              </>
            )}
          </div>
        </div>
      </section>
    );
  };

  useEffect(() => {
    if (!error) return;

    toast.error('Ошибка при подключении к серверу документации', {
      description: error.toString(),
    });
  }, [error]);

  return (
    <div
      className={twMerge(
        'absolute right-0 top-0 flex h-full',
        topOffset && 'top-[44.19px] h-[calc(100vh-44.19px)]'
      )}
    >
      <Resizable
        enable={{ left: true }}
        size={{ width: width, height: '100%' }}
        minWidth={minWidth}
        maxWidth={maxWidth}
        onResize={handleResize}
        className="border-l border-border-primary bg-bg-secondary"
      >
        {!topOffset ? (
          <button
            className="absolute -left-14 bottom-0 m-2 text-primary"
            onClick={onDocumentationToggle}
          >
            <Question height={40} width={40} />
          </button>
        ) : (
          <EditorSettings toggle={onDocumentationToggle} canvas={editor} />
        )}
        <div className="h-full">{renderContent()}</div>
      </Resizable>
    </div>
  );
};
