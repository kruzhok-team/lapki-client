import React, { useState } from 'react';
import { ReactComponent as Update } from '@renderer/assets/icons/update.svg';
import { ReactComponent as Setting } from '@renderer/assets/icons/settings.svg';
import { twMerge } from 'tailwind-merge';

const button = [
  {
    name: 'Название-1',
    connection: true,
    content: 'Информация об устройстве №1',
  },
  {
    name: 'Название-2',
    connection: false,
    content: 'Устройство не подключено!',
  },
  {
    name: 'Название-3',
    connection: true,
    content: 'Информация об устройстве №3',
  },
  {
    name: 'Название-4',
    connection: true,
    content: 'Информация об устройстве №4',
  },
  {
    name: 'Название-5',
    connection: false,
    content: 'Устройство не подключено!',
  },
  {
    name: 'Название-6',
    connection: false,
    content: 'Устройство не подключено!',
  },
  {
    name: 'Название-7',
    connection: true,
    content: 'Информация об устройстве №7',
  },
];

export const Loader: React.FC = ({}) => {
  const [active, setActive] = useState<number | 0>(0);
  const isActive = (index: number) => active === index;

  const handleDevice = (id: number) => {
    if (active === id) {
      setActive(active);
    }
    setActive(id);
  };
  return (
    <section className="flex h-full flex-col bg-[#a1c8df] text-center font-Fira text-base">
      <div className="w-full px-4 pt-2">
        <h1 className="mb-3 border-b border-white pb-2 text-lg">Загрузчик</h1>
      </div>
      <div className="my-2 flex rounded border-2 border-[#557b91]">
        <button className="flex w-full items-center p-1 hover:bg-[#557b91] hover:text-white">
          <Update width="1.5rem" height="1.5rem" className="mr-1" fill="#FFFFFF;" />
          Обновить
        </button>
        <button className="p-1 hover:bg-[#557b91] hover:text-white">
          <Setting width="1.5rem" height="1.5rem" />
        </button>
      </div>

      <div className=" h-40 select-text items-center overflow-y-auto break-words rounded bg-white p-2">
        {button.map(({ name, connection }, id) => (
          <button
            key={'loader' + id}
            className="my-1 flex w-full items-center rounded border-2 border-[#557b91] p-1 hover:bg-[#557b91] hover:text-white"
            onClick={() => handleDevice(id)}
          >
            <div
              className={twMerge(
                'mr-1 h-4 w-4 rounded-full bg-red-600',
                connection && 'bg-green-600'
              )}
            />
            {name}
          </button>
        ))}
      </div>
      <div className="mt-1 h-64 select-text items-center overflow-y-auto break-words rounded bg-white p-2 text-left">
        {button.map(({ name, connection, content }, id) => (
          <div key={'device' + id} className={twMerge('hidden', isActive(id) && 'block')}>
            <div className="flex items-center">
              <div
                className={twMerge(
                  'mr-1 h-4 w-4 rounded-full bg-red-600',
                  connection && 'bg-green-600'
                )}
              />
              {name}
            </div>
            <p>{content}</p>
          </div>
        ))}
      </div>

      <button className="my-2 rounded border-2 border-[#557b91] p-2 hover:bg-[#557b91] hover:text-white">
        Загрузить
      </button>
      <div className="mt-1 h-96 select-text items-center overflow-y-auto break-words rounded bg-white p-2 text-left">
        <div>
          Данные, которые необходимо отобразить, после загрузки на Arduino;
          <br />
          <br />
          Данные, которые необходимо отобразить, после загрузки на Arduino;
          <br />
          <br />
          Данные, которые необходимо отобразить, после загрузки на Arduino;
        </div>
      </div>
    </section>
  );
};
