import { useState, useEffect } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as Arrow } from '@renderer/assets/icons/arrow.svg';
import { useDoc } from '@renderer/store/useDoc';

import Show from './components/Show';
import { Tree } from './components/Tree';

import { Settings } from '../Modules/Settings';

/*Загрузка документации*/

interface DocumentationsProps {
  topOffset?: boolean;
}

// TODO: используется для того, чтобы задать значение переменной извне, но это выглядит костыльно
let SET_URL;
let SET_DATA;
export function setURL(url) {
  SET_URL(url);
  getData(url);
}

function getData(url) {
  fetch(url)
    .then((data) => data.json())
    .then((data) => {
      SET_DATA(data);
    });
}

export function Documentations({ topOffset = false }: DocumentationsProps) {
  const [url, setUrl] = useState('');
  SET_URL = setUrl;
  const [activeTab, setActiveTab] = useState<number>(0);
  const [data, setData] = useState<{ body: File }>();
  SET_DATA = setData;
  const [html, setHtml] = useState('');
  const [documentLink, setDocumentLink] = useState('');

  const [isOpen, toggle] = useDoc((state) => [state.isOpen, state.toggle]);

  const onItemClicked = (event: React.MouseEvent<HTMLLIElement, MouseEvent>, item) => {
    event.stopPropagation();
    if (item.path.endsWith('html')) {
      fetch(encodeURI(`${url}${item.path}`))
        .then((data) => data.text())
        .then((html) => {
          setHtml(html);
          setActiveTab(1);
        });
    } else {
      setHtml('');
      setDocumentLink(`${url}${item.path}`);
      setActiveTab(1);
    }
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
        <section className="flex h-full select-none flex-col border-l-[1px] border-[#4391BF] bg-bg-secondary px-1 py-4 text-base ">
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
                <Tree root={data.body} borderWidth={0} onItemClicked={onItemClicked} />
              ) : (
                <span>Загрузка</span>
              )}
            </div>

            <div className={twMerge('h-full', activeTab !== 1 && 'hidden')}>
              <Show html={html} documentLink={documentLink} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
