import React from 'react';

import { useFetch } from '@renderer/hooks';

import { CurrentItem } from '../Documentation';

interface ShowProps {
  item: CurrentItem;
}

const ShowHtml: React.FC<ShowProps> = ({ item }) => {
  const { url, path } = item;

  const { data, isLoading, error, refetch } = useFetch<string>(url, 'text');

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
    <iframe
      className="h-full max-h-[calc(100%-49.6px-41.6px)] w-full overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb"
      srcDoc={`<base href="${url}${path}" />` + data}
    ></iframe>
  );
};

export const Show: React.FC<ShowProps> = ({ item }) => {
  const { isHtml, url } = item;

  if (isHtml) {
    return <ShowHtml item={item} />;
  }

  return (
    <div className="p-4">
      <h2 className="mb-2 text-xl font-bold">
        {url ? 'Ссылка на материал' : 'Выберите раздел в содержании'}
      </h2>
      <a href={url} target="_blank" className="text-blue-500 hover:text-blue-700">
        {url}
      </a>
    </div>
  );
};
