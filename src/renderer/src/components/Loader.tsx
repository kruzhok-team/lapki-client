import React, { Dispatch } from 'react';
import { ReactComponent as Update } from '@renderer/assets/icons/update.svg';
import { ReactComponent as Setting } from '@renderer/assets/icons/settings.svg';
import { twMerge } from 'tailwind-merge';
import { Device } from '@renderer/types/FlasherTypes';
import { CompilerResult } from '@renderer/types/CompilerTypes';
import {
  FLASHER_CONNECTED,
  FLASHER_CONNECTING,
  FLASHER_SWITCHING_HOST,
  FLASHER_NO_CONNECTION,
  FLASHER_CONNECTION_ERROR,
} from './Modules/Flasher';
export interface FlasherProps {
  devices: Map<string, Device>;
  currentDevice: string | undefined;
  connectionStatus: string;
  flasherLog: string | undefined;
  compilerData: CompilerResult | undefined;
  flasherFile: string | undefined | null;
  flashing: boolean;
  setCurrentDevice: Dispatch<string | undefined>;
  handleGetList: () => void;
  handleFlash: () => void;
  handleHostChange: () => void;
  handleFileChoose: () => void;
  handleErrorMessageDisplay: () => void;
}

export const Loader: React.FC<FlasherProps> = ({
  currentDevice,
  devices,
  connectionStatus,
  compilerData,
  flasherFile,
  flasherLog,
  flashing,
  setCurrentDevice,
  handleGetList,
  handleFlash,
  handleHostChange,
  handleFileChoose,
  handleErrorMessageDisplay: handleErrorMessageDisplay,
}) => {
  const isActive = (id: string) => currentDevice === id;

  return (
    <section className="flex h-full flex-col text-center">
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Загрузчик
      </h3>

      <div className="px-4">
        <div className="mb-2 flex rounded border-2 border-[#557b91]">
          <button
            className={twMerge(
              'flex w-full items-center p-1 hover:bg-[#557b91] hover:text-white',
              connectionStatus != FLASHER_CONNECTED && 'opacity-50'
            )}
            onClick={handleGetList}
            disabled={connectionStatus != FLASHER_CONNECTED}
          >
            <Update width="1.5rem" height="1.5rem" className="mr-1" />
            Обновить
          </button>
          <button
            className={twMerge(
              'p-1 hover:bg-[#557b91] hover:text-white',
              (connectionStatus == FLASHER_CONNECTING ||
                connectionStatus == FLASHER_SWITCHING_HOST ||
                flashing) &&
                'opacity-50'
            )}
            onClick={handleHostChange}
            disabled={
              connectionStatus == FLASHER_CONNECTING ||
              connectionStatus == FLASHER_SWITCHING_HOST ||
              flashing
            }
          >
            <Setting width="1.5rem" height="1.5rem" />
          </button>
        </div>

        <div className="mb-2 h-40 overflow-y-auto break-words rounded bg-bg-primary p-2">
          <p>{connectionStatus}</p>
          <br></br>
          <button
            className="btn-primary mb-2"
            onClick={() => handleErrorMessageDisplay()}
            style={{
              display:
                connectionStatus == FLASHER_NO_CONNECTION ||
                connectionStatus == FLASHER_CONNECTION_ERROR
                  ? 'inline-block'
                  : 'none',
            }}
          >
            Подробнее
          </button>
          {[...devices.keys()].map((key) => (
            <button
              key={key}
              className={twMerge(
                'my-1 flex w-full items-center rounded border-2 border-[#557b91] p-1 hover:bg-[#557b91] hover:text-white',
                isActive(key) && 'bg-[#557b91] text-white'
              )}
              onClick={() => setCurrentDevice(key)}
            >
              {devices.get(key)?.name + ' (' + devices.get(key)?.portName + ')'}
            </button>
          ))}
        </div>

        <div className="mb-2 h-64 overflow-y-auto break-words rounded bg-bg-primary p-2 text-left">
          {[...devices.keys()].map((key) => (
            <div key={key} className={twMerge('hidden', isActive(key) && 'block')}>
              <div className="flex items-center">{devices.get(key)?.name}</div>
              <p>Серийный номер: {devices.get(key)?.serialID}</p>
              <p>Порт: {devices.get(key)?.portName}</p>
              <p>Контроллер: {devices.get(key)?.controller}</p>
              <p>Программатор: {devices.get(key)?.programmer}</p>
            </div>
          ))}
        </div>
        <div>
          <button
            className="btn-primary mb-2"
            onClick={handleFlash}
            disabled={
              flashing ||
              !currentDevice ||
              connectionStatus != FLASHER_CONNECTED ||
              (!flasherFile &&
                (compilerData?.binary === undefined || compilerData.binary.length == 0))
            }
          >
            Загрузить
          </button>
          <button
            className={flasherFile ? 'btn-primary mb-2' : 'btn-primary mb-2 opacity-50'}
            onClick={handleFileChoose}
            disabled={flashing}
          >
            {flasherFile ? '✖' : '…'}
          </button>
        </div>
        {flasherFile ? (
          <p className="mb-2 rounded bg-primaryActive text-white">
            из файла <span className="font-medium">{flasherFile}</span>
          </p>
        ) : (
          ''
        )}
        <div className="h-96 overflow-y-auto break-words rounded bg-bg-primary p-2">
          {flasherLog}
        </div>
      </div>
    </section>
  );
};
