import { useState, useEffect } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as Arrow } from '@renderer/assets/icons/arrow.svg';
import { useDoc } from '@renderer/store/useDoc';
import { File } from '@renderer/types/documentation';

import { Navigation } from './components/Navigation';
import { Show } from './components/Show';
import { Tree } from './components/Tree';

import { Settings } from '../Modules/Settings';

/*Загрузка документации*/

interface DocumentationProps {
  topOffset?: boolean;
}

const BAD_DATA = {
  body: { name: 'index', children: [{ name: 'Не загрузилось :(', path: 'index.json' }] },
};

// TODO: используется для того, чтобы задать значение переменной извне, но это выглядит костыльно
let SET_URL;
let SET_DATA;
export function setURL(url) {
  SET_URL(url);
  getData(url, true);
}

function getData(url: string, nocache?: boolean) {
  const arg = nocache ?? false ? '?nocache=true' : '';
  fetch(`${url}/index.json${arg}`)
    .then((response) => {
      if (!response.ok) throw response;
      return response.json();
    })
    .then((data) => {
      SET_DATA(data);
    })
    .catch((reason) => {
      console.warn(reason);
      SET_DATA(BAD_DATA);
      // TODO: подробнее отразить в интерфейсе
    });
}

export const Documentation: React.FC<DocumentationProps> = ({ topOffset = false }) => {
  const [url, setUrl] = useState('');
  SET_URL = setUrl;
  const [activeTab, setActiveTab] = useState<number>(0);
  const [data, setData] = useState<{ body: File }>();
  SET_DATA = setData;
  const [html, setHtml] = useState('');
  const [documentLink, setDocumentLink] = useState('');

  const [isOpen, toggle] = useDoc((state) => [state.isOpen, state.toggle]);

  const [currentPath, setCurrentPath] = useState<string>();

  const fetchItem = async (path: string, nocache?: boolean) => {
    const arg = nocache ?? false ? '?nocache=true' : '';
    try {
      const response = await fetch(encodeURI(`${url}${path}${arg}`));
      if (!response.ok) throw response;
      const html = await response.text();
      setHtml(`<base href="${url}${path}" />` + html);
      setActiveTab(1);
    } catch (reason) {
      console.warn(reason);
    }
  };

  const onItemClick = (filePath: string) => {
    setCurrentPath(filePath);

    if (filePath.endsWith('html')) {
      return fetchItem(filePath);
    }

    setHtml('');
    setDocumentLink(`${url}${filePath}`);
    setActiveTab(1);
    return;
  };

  useEffect(() => {
    Settings.getDocSettings().then((doc) => {
      setURL(doc.host);
    });
  }, []);

  return (
    <div
      className={twMerge(
        'absolute right-0 top-0 flex h-full translate-x-[calc(100%-2rem)] bg-bg-secondary transition-transform',
        isOpen && 'translate-x-0',
        topOffset && 'top-[44.19px] h-[calc(100vh-44.19px)]'
      )}
    >
      <button className="w-8" onClick={toggle}>
        <Arrow className={twMerge('rotate-180 transition-transform', isOpen && 'rotate-0')} />
      </button>

      <div className="w-[400px]">
        <section className="flex h-full select-none flex-col border-l-[1px] border-[#4391BF] bg-bg-secondary px-1 pt-4 text-base">
          <div className="flex gap-1 py-2">
            <button
              className={twMerge(
                'w-1/2 border border-[#4391BF] p-2',
                activeTab === 0 && 'bg-[#4391BF] bg-opacity-50'
              )}
              onClick={() => setActiveTab(0)}
            >
              Содержание
            </button>
            <button
              className={twMerge(
                'w-1/2 border border-[#4391BF] p-2',
                activeTab === 1 && 'bg-[#4391BF] bg-opacity-50'
              )}
              onClick={() => setActiveTab(1)}
            >
              Просмотр
            </button>
          </div>

          {/* <input
        type="text"
        placeholder="Поиск"
        className="mb-2 border border-[#4391BF] px-4 py-2 outline-none"
      /> */}

          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-track-slate-700 scrollbar-thumb-slate-500">
            <div className={twMerge(activeTab !== 0 && 'hidden')}>
              {data ? (
                <Tree root={data.body} borderWidth={0} onItemClick={onItemClick} />
              ) : (
                <span>Загрузка</span>
              )}
            </div>

            <div className={twMerge('flex h-full flex-col', activeTab !== 1 && 'hidden')}>
              {currentPath && (
                <Navigation data={data} onItemClick={onItemClick} currentPath={currentPath} />
              )}

              <Show html={html} documentLink={documentLink} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
