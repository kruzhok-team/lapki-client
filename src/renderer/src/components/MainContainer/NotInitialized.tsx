import React from 'react';

import { ReactComponent as Icon } from '@renderer/assets/icons/icon.svg';

const combination = [
  {
    name: 'Создать файл',
    command: {
      button1: 'Ctrl',
      button2: 'N',
    },
  },
  {
    name: 'Открыть файл',
    command: {
      button1: 'Ctrl',
      button2: 'O',
    },
  },
  {
    name: 'Импорт схемы (Cyberiada-GraphML)',
    command: {
      button1: 'Ctrl',
      button2: 'I',
    },
  },
  {
    name: 'Во весь экран',
    command: {
      button1: 'F11',
      button2: undefined,
    },
  },
  {
    name: 'Справка',
    command: {
      button1: 'F1',
      button2: undefined,
    },
  },
];

export const NotInitialized: React.FC = () => {
  return (
    <div className="flex flex-col items-center pt-24">
      <Icon />
      <p className="py-6 text-center text-base">
        Перетащите файл в эту область или воспользуйтесь комбинацией клавиш:
      </p>
      <div>
        {combination.map((value, key) => (
          <div key={key} className="my-3 flex justify-between">
            <div className="px-1">{value.name}</div>
            <div className="flex items-start">
              <div className="rounded border-b-2 bg-gray-600 px-1 text-gray-300">
                {value.command.button1}
              </div>
              {value.command.button2 && (
                <>
                  <p className="px-1">+</p>
                  <div className="rounded border-b-2 bg-gray-600 px-1 text-gray-300">
                    {value.command.button2}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
