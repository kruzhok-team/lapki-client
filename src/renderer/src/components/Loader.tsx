import React, { useEffect, useState } from 'react';
import { ReactComponent as Update } from '@renderer/assets/icons/update.svg';
import { ReactComponent as Setting } from '@renderer/assets/icons/settings.svg';
import { twMerge } from 'tailwind-merge';
import { Device } from '@renderer/types/FlasherTypes';
import { CompilerResult } from '@renderer/types/CompilerTypes';
import {
  FLASHER_CONNECTED,
  FLASHER_CONNECTING,
  FLASHER_SWITCHING_HOST,
  FLASHER_CONNECTION_ERROR,
  FLASHER_NO_CONNECTION,
  Flasher,
} from './Modules/Flasher';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { FlasherSelectModal } from './FlasherSelectModal';
export interface FlasherProps {
  manager: EditorManager | null;
  compilerData: CompilerResult | undefined;
}

export const Loader: React.FC<FlasherProps> = ({ manager, compilerData }) => {
  const [currentDevice, setCurrentDevice] = useState<string | undefined>(undefined);
  const [connectionStatus, setFlasherConnectionStatus] = useState<string>('Не подключен.');
  const [devices, setFlasherDevices] = useState<Map<string, Device>>(new Map());
  const [flasherLog, setFlasherLog] = useState<string | undefined>(undefined);
  const [flasherFile, setFlasherFile] = useState<string | undefined | null>(undefined);
  const [flashing, setFlashing] = useState(false);
  const [flasherError, setFlasherError] = useState<string | undefined>(undefined);
  const [flasherIsLocal, setFlasherIslocal] = useState<boolean>(true);

  const [isFlasherModalOpen, setIsFlasherModalOpen] = useState(false);
  const openFlasherModal = () => setIsFlasherModalOpen(true);
  const closeFlasherModal = () => {
    Flasher.freezeReconnectionTimer(false);
    setIsFlasherModalOpen(false);
  };

  const isActive = (id: string) => currentDevice === id;

  const handleGetList = async () => {
    manager?.getList();
  };

  const handleFlash = async () => {
    if (flasherFile) {
      Flasher.flash(currentDevice!);
    } else {
      Flasher.flashCompiler(compilerData!.binary!, currentDevice!);
    }
  };

  const handleHostChange = () => {
    Flasher.freezeReconnectionTimer(true);
    openFlasherModal();
  };

  const handleLocalFlasher = async () => {
    console.log('local');
    setFlasherIslocal(true);
    await manager?.startLocalModule('lapki-flasher');
    //Стандартный порт
    manager?.changeFlasherLocal();
  };

  const handleRemoteFlasher = (host: string, port: number) => {
    setFlasherIslocal(false);
    console.log('remote');
    // await manager?.stopLocalModule('lapki-flasher');
    manager?.changeFlasherHost(host, port);
  };

  const handleFileChoose = () => {
    if (flasherFile) {
      console.log('cancel file choose');
      setFlasherFile(undefined);
    } else {
      console.log('file chooser');
      Flasher.setFile();
    }
  };

  const handleErrorMessageDisplay = async () => {
    // выводимое для пользователя сообщение
    var errorMsg: JSX.Element = <p>`Неизвестный тип ошибки`</p>;
    if (flasherIsLocal) {
      await window.electron.ipcRenderer
        .invoke('Module:getStatus', 'lapki-flasher')
        .then(function (obj) {
          let errorDetails = obj.details;
          switch (obj.code) {
            // код 0 означает, что не было попытки запустить загрузчик, по-идее такая ошибка не может возникнуть, если только нет какой-то ошибки в коде.
            case 0:
              errorMsg = <p>{'Загрузчик не был запущен по неизвестной причине.'}</p>;
              break;
            // код 1 означает, что загрузчик работает, но соединение с ним не установлено.
            case 1:
              switch (connectionStatus) {
                case FLASHER_CONNECTION_ERROR:
                  errorMsg = (
                    <p>
                      {`Локальный загрузчик работает, но он не может подключиться к IDE из-за ошибки.`}
                      <br></br>
                      {flasherError}
                    </p>
                  );
                  break;
                default:
                  errorMsg = (
                    <p>
                      {`Локальный загрузчик работает, но IDE не может установить с ним соединение.`}
                    </p>
                  );
                  break;
              }
              break;
            case 2:
              errorMsg = (
                <p>
                  {`Локальный загрузчик не смог запуститься из-за ошибки.`}
                  <br></br>
                  {errorDetails}
                </p>
              );
              break;
            case 3:
              errorMsg = <p>{`Прервана работа локального загрузчика.`}</p>;
              break;
            case 4:
              errorMsg = <p>{`Платформа ${errorDetails} не поддерживается.`}</p>;
              break;
          }
        });
    } else {
      if (connectionStatus == FLASHER_CONNECTION_ERROR) {
        errorMsg = (
          <p>
            {`Ошибка соединения.`}
            <br></br>
            {flasherError}
          </p>
        );
      } else {
        errorMsg = <p>{flasherError}</p>;
      }
    }
    const msg: MessageModalData = {
      text: errorMsg,
      caption: 'Ошибка',
    };
    openMsgModal(msg);
  };

  useEffect(() => {
    Flasher.bindReact(
      setFlasherDevices,
      setFlasherConnectionStatus,
      setFlasherLog,
      setFlasherFile,
      setFlashing,
      setFlasherError,
      setFlasherIslocal
    );
    const reader = new FileReader();
    Flasher.initReader(reader);
    console.log('CONNECTING TO FLASHER');
    Flasher.connect();
    // если не указывать второй аргумент '[]', то эта функция будет постоянно вызываться.
  }, []);

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
