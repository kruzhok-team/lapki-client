import React, { useEffect, useState } from 'react';

import { ReactComponent as Icon } from '@renderer/assets/icons/icon.svg';
import { ReactComponent as SeriousIcon } from '@renderer/assets/icons/state_machine.svg';
import { appName, appVersion, askAppVersion, seriousMode } from '@renderer/version';

const combination = [
  {
    name: 'Создать новую схему',
    command: {
      button1: 'Ctrl',
      button2: 'N',
    },
  },
  {
    name: 'Открыть файл схемы',
    command: {
      button1: 'Ctrl',
      button2: 'O',
    },
  },
  {
    name: 'Импорт схемы из другого формата',
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
      if (shownVersion !== appVersion) setShownVersion(appVersion);
    });
  }, []);

  const seriousIcon = <SeriousIcon width={200} opacity={0.3} />;
  const lapkiIcon = <Icon width={200} opacity={0.3} />;
  const icon = seriousMode ? seriousIcon : lapkiIcon;

  const hotKeyStyle = 'rounded border-2 border-border-contrast px-1';

  return (
    <div className="flex flex-col items-center pt-24">
      {icon}
      <br />
      <p className="text-center text-2xl font-bold">
        {appName} {shownVersion ? `v${shownVersion}` : ''}
      </p>
      <p className="py-6 text-center text-base">
        Перетащите файл в эту область или воспользуйтесь комбинацией клавиш:
      </p>
      <table>
        <tbody>
          {combination.map((value, key) => (
            <tr key={key}>
              <td className="px-1 py-1">{value.name}</td>
              <td className="ml-3 flex items-start py-1">
                <div className={hotKeyStyle}>{value.command.button1}</div>
                {value.command.button2 && (
                  <>
                    <p className="px-1">+</p>
                    <div className={hotKeyStyle}>{value.command.button2}</div>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
