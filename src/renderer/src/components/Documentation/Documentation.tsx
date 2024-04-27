import { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as Arrow } from '@renderer/assets/icons/arrow.svg';
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

  const [activeTab, setActiveTab] = useState<number>(0);
  const [currentItem, setCurrentItem] = useState<CurrentItem | null>(null);

  const [isOpen, toggle] = useDoc((state) => [state.isOpen, state.toggle]);

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
              activeTab === 0 && 'bg-primary'
            )}
            onClick={() => setActiveTab(0)}
          >
            Содержание
          </button>
          <button
            className={twMerge(
              'rounded border border-primary p-2',
              activeTab === 1 && 'bg-primary'
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

  return (
    <div
      className={twMerge(
        'absolute right-0 top-0 flex h-full translate-x-[calc(100%-2rem)] bg-bg-secondary transition-transform',
        isOpen && 'translate-x-0',
        topOffset && 'top-[44.19px] h-[calc(100vh-44.19px)]'
      )}
    >
      <button className="w-8 border-r border-border-primary" onClick={toggle}>
        <Arrow className={twMerge('rotate-180 transition-transform', isOpen && 'rotate-0')} />
      </button>

      <div className="w-[400px]">{renderContent()}</div>
    </div>
  );
};
