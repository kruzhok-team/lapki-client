import { useEffect, useState } from 'react';

import { Resizable } from 're-resizable';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as Question } from '@renderer/assets/icons/question.svg';
import { useFetch, useSettings } from '@renderer/hooks';
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
  const [doc] = useSettings('doc');
  const url = doc?.host ?? '';

  const { data, isLoading, error, refetch } = useFetch<{ body: File }>(
    url && `${url}/index.json?nocache=true`
  );

  const [currentItem, setCurrentItem] = useState<CurrentItem | null>(null);

  const [isOpen, toggle] = useDoc((state) => [state.isOpen, state.toggle]);

  const [width, setWidth] = useState(0);
  const [minWidth, setMinWidth] = useState(5);
  const [maxWidth, setMaxWidth] = useState('75vw');

  const handleResize = (e, _direction, ref) => {
    if (e.pageX < 0.95 * window.innerWidth && !isOpen) {
      toggle();
    }

    if (e.pageX >= 0.95 * window.innerWidth && isOpen) {
      toggle();
    }
    //Получаем ширину блока документации
    setWidth(parseInt(ref.style.width));
  };

  useEffect(() => {
    if (!isOpen) {
      setMaxWidth('5px');
      setMinWidth(5);
    } else {
      setMaxWidth('75vw');
      setMinWidth(420);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'F1') {
        toggle();
      }
    };
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [toggle]);

  const onItemClick = (filePath: string) => {
    if (width < 840) {
      setWidth(840);
    }

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
        <div className="grid h-full w-full grid-cols-2 overflow-y-hidden">
          <div className={twMerge('col-span-2', width >= 840 && 'col-span-1')}>
            <div className="py-2 text-center text-base transition-colors enabled:hover:bg-bg-hover enabled:active:bg-bg-active disabled:text-text-disabled">
              Содержание
            </div>
            <Tree root={data.body} borderWidth={0} onItemClick={onItemClick} />
          </div>

          {width >= 840 && (
            <div className="flex w-full flex-col">
              <div className="py-2 text-center text-base transition-colors enabled:hover:bg-bg-hover enabled:active:bg-bg-active disabled:text-text-disabled">
                Просмотр
              </div>
              {currentItem && (
                <>
                  <Show item={currentItem} />
                  <Navigation
                    data={data}
                    onItemClick={onItemClick}
                    currentPath={currentItem.path}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <div
      className={twMerge(
        'absolute right-0 top-0 flex justify-end',
        topOffset && 'top-[44.19px] h-[calc(100vh-44.19px)]'
      )}
      onDoubleClick={toggle}
    >
      <Resizable
        enable={{ left: true }}
        size={{ width: width, height: topOffset ? '95.85vh' : '100vh' }}
        minWidth={minWidth}
        maxWidth={maxWidth}
        onResize={handleResize}
        className={twMerge('border-l border-border-primary bg-bg-secondary')}
      >
        {!topOffset && (
          <button className={`absolute -left-[4vw] bottom-0 m-2`} onClick={toggle}>
            <Question height={40} width={40} />
          </button>
        )}
        <div className="h-full">{renderContent()}</div>
      </Resizable>
    </div>
  );
};
