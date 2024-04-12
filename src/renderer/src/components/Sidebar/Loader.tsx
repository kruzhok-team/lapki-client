import React, { useEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as Setting } from '@renderer/assets/icons/settings.svg';
import { ReactComponent as Update } from '@renderer/assets/icons/update.svg';
import { ErrorModal, ErrorModalData } from '@renderer/components/ErrorModal';
import {
  FLASHER_CONNECTED,
  FLASHER_CONNECTING,
  FLASHER_CONNECTION_ERROR,
  FLASHER_NO_CONNECTION,
  Flasher,
} from '@renderer/components/Modules/Flasher';
import {
  FlasherSelectModal,
  FlasherSelectModalFormValues,
} from '@renderer/components/serverSelect/FlasherSelectModal';
import { useSettings } from '@renderer/hooks';
import { useTabs } from '@renderer/store/useTabs';
import { CompilerResult } from '@renderer/types/CompilerTypes';
import { Device, FlashResult } from '@renderer/types/FlasherTypes';

export interface FlasherProps {
  compilerData: CompilerResult | undefined;
}

export const Loader: React.FC<FlasherProps> = ({ compilerData }) => {
  const [flasherSetting, setFlasherSetting] = useSettings('flasher');
  const flasherIsLocal = flasherSetting?.type === 'local';

  const [currentDeviceID, setCurrentDevice] = useState<string | undefined>(undefined);
  const [connectionStatus, setFlasherConnectionStatus] = useState<string>('Не подключен.');
  const [devices, setFlasherDevices] = useState<Map<string, Device>>(new Map());
  const [flasherLog, setFlasherLog] = useState<string | undefined>(undefined);
  const [flasherFile, setFlasherFile] = useState<string | undefined | null>(undefined);
  const [flashing, setFlashing] = useState(false);
  const [flasherError, setFlasherError] = useState<string | undefined>(undefined);

  const [isFlasherModalOpen, setIsFlasherModalOpen] = useState(false);
  const openFlasherModal = () => setIsFlasherModalOpen(true);
  const closeFlasherModal = () => {
    Flasher.freezeReconnectionTimer(false);
    setIsFlasherModalOpen(false);
  };

  const [msgModalData, setMsgModalData] = useState<ErrorModalData>();
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const openMsgModal = (data: ErrorModalData) => {
    setMsgModalData(data);
    setIsMsgModalOpen(true);
  };

  const [flashResult, setFlashResult] = useState<FlashResult>();

  const closeMsgModal = () => setIsMsgModalOpen(false);

  const openTab = useTabs((state) => state.openTab);

  const isActive = (id: string) => currentDeviceID === id;

  const handleGetList = async () => {
    Flasher.getList();
  };

  const handleFlash = async () => {
    if (currentDeviceID == null || currentDeviceID == undefined) {
      console.log('Не удаётся начать прошивку, currentDeviceID =', currentDeviceID);
      return;
    }
    const currentDevice = devices.get(currentDeviceID);
    if (currentDevice == null || currentDevice == undefined) {
      console.log('Не удаётся начать прошивку, currentDevice =', currentDevice);
      return;
    }
    if (flasherFile) {
      Flasher.flash(currentDevice);
    } else {
      Flasher.flashCompiler(compilerData!.binary!, currentDevice);
    }
  };

  const handleHostChange = () => {
    Flasher.freezeReconnectionTimer(true);
    openFlasherModal();
  };

  const handleFlasherModalSubmit = (data: FlasherSelectModalFormValues) => {
    if (!flasherSetting) return;

    Flasher.setAutoReconnect(data.type === 'remote');
    setFlasherSetting({ ...flasherSetting, ...data });
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
    let errorMsg: JSX.Element = <p>`Неизвестный тип ошибки`</p>;
    if (flasherIsLocal) {
      await window.electron.ipcRenderer
        .invoke('Module:getStatus', 'lapki-flasher')
        .then(function (obj) {
          const errorDetails = obj.details;
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
    const msg: ErrorModalData = {
      text: errorMsg,
      caption: 'Ошибка',
    };
    openMsgModal(msg);
  };

  // добавление вкладки с сообщением от avrdude
  const handleAddAvrdudeTab = () => {
    openTab({
      type: 'code',
      name: 'avrdude',
      code: flashResult?.report() ?? '',
      language: 'txt',
    });
  };

  useEffect(() => {
    Flasher.bindReact(
      setFlasherDevices,
      setFlasherConnectionStatus,
      setFlasherLog,
      setFlasherFile,
      setFlashing,
      setFlasherError,
      setFlashResult
    );

    Flasher.initReader(new FileReader());
  }, []);

  useEffect(() => {
    if (!flasherSetting) return;
    const { host, port } = flasherSetting;

    Flasher.connect(host, port);
  }, [flasherSetting]);

  const display = () => {
    if (!flasherIsLocal && connectionStatus == FLASHER_CONNECTING) {
      return 'Отменить';
    }
    if (connectionStatus == FLASHER_CONNECTED) {
      return 'Обновить';
    } else {
      if (flasherIsLocal) {
        return 'Перезапустить';
      } else {
        return 'Переподключиться';
      }
    }
  };

  const handleReconnect = () => {
    if (!flasherSetting) return;
    const { host, port } = flasherSetting;

    if (flasherIsLocal) {
      window.electron.ipcRenderer.invoke('Module:reboot', 'lapki-flasher').then(() => {
        Flasher.connect(host, port);
      });
    } else {
      Flasher.reconnect();
    }
  };

  const flashButtonDisabled = () => {
    if (flashing || connectionStatus != FLASHER_CONNECTED) {
      return true;
    }
    if (!currentDeviceID) {
      return true;
    }
    if (!devices.has(currentDeviceID)) {
      setCurrentDevice(undefined);
      return true;
    }
    if (flasherFile) {
      return false;
    }
    // проверка на соответствие платформы схемы и типа устройства
    if (!(compilerData?.binary === undefined || compilerData.binary.length == 0)) {
      let platform = compilerData?.platform;
      if (platform === undefined) {
        return;
      }
      platform = platform?.toLowerCase();
      const device = devices.get(currentDeviceID)?.name.toLowerCase();
      // TODO: подумать, можно ли найти более надёжный способ сверки платформ на клиенте и сервере
      // названия платформ на загрузчике можно посмотреть здесь: https://github.com/kruzhok-team/lapki-flasher/blob/main/src/device_list.JSON
      switch (platform) {
        case 'arduinomicro':
          // arduino micro - состоит из двух устройств, прошивку можно загрузить в любое
          if (!(device == 'arduino micro' || device == 'arduino micro (bootloader)')) {
            return true;
          }
          break;
        case 'arduinouno':
          if (device != 'arduino uno') {
            return true;
          }
          break;
        default:
          return true;
      }
    } else {
      return true;
    }
    return false;
  };

  return (
    <section className="flex h-full flex-col text-center">
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Загрузчик
      </h3>

      <div className="px-4">
        <div className="mb-2 flex rounded">
          <button
            className={twMerge(
              'btn-primary mr-2 flex w-full items-center justify-center gap-2 px-0',
              flasherIsLocal && connectionStatus == FLASHER_CONNECTING && 'opacity-70'
            )}
            onClick={() => {
              switch (connectionStatus) {
                case FLASHER_CONNECTED:
                  handleGetList();
                  break;
                case FLASHER_CONNECTING:
                  Flasher.cancelConnection();
                  break;
                default:
                  handleReconnect();
                  break;
              }
            }}
            disabled={connectionStatus == FLASHER_CONNECTING && flasherIsLocal}
          >
            <Update width="1.5rem" height="1.5rem" />
            {display()}
          </button>
          <button
            className={twMerge(
              'btn-primary px-2',
              (connectionStatus == FLASHER_CONNECTING || flashing) && 'opacity-70'
            )}
            onClick={handleHostChange}
            disabled={connectionStatus == FLASHER_CONNECTING || flashing}
          >
            <Setting width="1.5rem" height="1.5rem" />
          </button>
        </div>
        <div className="mb-2 h-40 overflow-y-auto break-words rounded bg-bg-primary p-2">
          <ErrorModal isOpen={isMsgModalOpen} data={msgModalData} onClose={closeMsgModal} />
          <p>{connectionStatus}</p>
          <br></br>
          <button
            className="btn-primary mb-2 w-full"
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
        <div className="flex justify-between gap-2">
          <button
            className="btn-primary mb-2 w-full"
            onClick={handleFlash}
            disabled={flashButtonDisabled()}
          >
            Загрузить
          </button>
          <button
            className={flasherFile ? 'btn-primary mb-2' : 'btn-primary mb-2 opacity-70'}
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
        <div>
          <button
            className="btn-primary mb-2"
            onClick={handleAddAvrdudeTab}
            disabled={flashResult == undefined}
          >
            {'Результат прошивки'}
          </button>
        </div>
        <div className="h-96 overflow-y-auto break-words rounded bg-bg-primary p-2">
          {flasherLog}
        </div>
      </div>

      <FlasherSelectModal
        isOpen={isFlasherModalOpen}
        onSubmit={handleFlasherModalSubmit}
        onClose={closeFlasherModal}
      />
    </section>
  );
};
