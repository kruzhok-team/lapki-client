import React, { useEffect, useState } from 'react';

import { ReactComponent as StateMachineIcon } from '@renderer/assets/icons/MS.svg';
import { appName, appVersion, askAppVersion } from '@renderer/version';

const combination = [
  {
    name: 'Создать новый документ',
    command: {
      button1: 'Ctrl',
      button2: 'N',
    },
  },
  {
    name: 'Открыть файл документа',
    command: {
      button1: 'Ctrl',
      button2: 'O',
    },
  },
  {
    name: 'Импорт схемы из Защиты пасеки',
    command: {
      button1: 'Ctrl',
      button2: 'I',
    },
  },
  {
    name: 'Открыть справку',
    command: {
      button1: 'F1',
      button2: undefined,
    },
  },
  {
    name: 'Во весь экран',
    command: {
      button1: 'F11',
      button2: undefined,
    },
  },
];

export const NotInitialized: React.FC = () => {
  const [shownVersion, setShownVersion] = useState(appVersion);

  useEffect(() => {
    askAppVersion().then(() => {
      setShownVersion(appVersion);
    });
  }, []);

  const hotKeyStyle =
    'flex h-5 min-w-5 items-center justify-center rounded border border-border-contrast px-1 text-xs leading-none';

  return (
    <section className="flex flex-col items-center leading-5 text-text-primary">
      <StateMachineIcon />
      <p className="text-center text-base font-bold leading-5">
        {appName} {shownVersion ? `v${shownVersion}` : ''}
      </p>
      <p className="mt-3 text-center font-medium">
        Перетащите файл в эту область или воспользуйтесь комбинацией клавиш:
      </p>
      <table>
        <tbody>
          {combination.map((value) => (
            <tr key={value.name}>
              <td className="pr-6 pt-3">{value.name}</td>
              <td className="flex items-center pt-3 first:py-0">
                <div className={hotKeyStyle}>{value.command.button1}</div>
                {value.command.button2 && (
                  <>
                    <span className="px-1">+</span>
                    <div className={hotKeyStyle}>{value.command.button2}</div>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};
