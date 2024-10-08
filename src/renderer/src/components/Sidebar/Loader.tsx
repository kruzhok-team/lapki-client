import React, { useEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as Setting } from '@renderer/assets/icons/settings.svg';
import { ReactComponent as Update } from '@renderer/assets/icons/update.svg';
import { ErrorModal, ErrorModalData } from '@renderer/components/ErrorModal';
import { Flasher } from '@renderer/components/Modules/Flasher';
import { useSettings } from '@renderer/hooks/useSettings';
import { useModelContext } from '@renderer/store/ModelContext';
import { useFlasher } from '@renderer/store/useFlasher';
import { useSerialMonitor } from '@renderer/store/useSerialMonitor';
import { useTabs } from '@renderer/store/useTabs';
import { CompilerResult } from '@renderer/types/CompilerTypes';
import { Device, FlashResult } from '@renderer/types/FlasherTypes';

import {
  SERIAL_MONITOR_NO_CONNECTION,
  SERIAL_MONITOR_NO_SERVER_CONNECTION,
  SerialMonitor,
} from '../Modules/SerialMonitor';
import { ClientStatus } from '../Modules/Websocket/ClientStatus';

export interface FlasherProps {
  compilerData: CompilerResult | undefined;
  openLoaderSettings: () => void;
  openAvrdudeGuideModal: () => void;
}

export const Loader: React.FC<FlasherProps> = ({
  compilerData,
  openLoaderSettings,
  openAvrdudeGuideModal,
}) => {
  const modelController = useModelContext();
  const [flasherSetting, setFlasherSetting] = useSettings('flasher');
  const flasherIsLocal = flasherSetting?.type === 'local';
  const { connectionStatus, setFlasherConnectionStatus, isFlashing, setIsFlashing } = useFlasher();
  const {
    device: serialMonitorDevice,
    setDevice: setSerialMonitorDevice,
    setConnectionStatus: setSerialConnectionStatus,
    setLog: setSerialLog,
    addDeviceMessage,
  } = useSerialMonitor();
  const [currentDeviceID, setCurrentDevice] = useState<string | undefined>(undefined);
  const [devices, setFlasherDevices] = useState<Map<string, Device>>(new Map());
  const [flasherLog, setFlasherLog] = useState<string | undefined>(undefined);
  const [flasherFile, setFlasherFile] = useState<string | undefined | null>(undefined);
  const [flasherError, setFlasherError] = useState<string | undefined>(undefined);
  const [hasAvrdude, setHasAvrdude] = useState<boolean>(true);

  const [msgModalData, setMsgModalData] = useState<ErrorModalData>();
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const openMsgModal = (data: ErrorModalData) => {
    setMsgModalData(data);
    setIsMsgModalOpen(true);
  };

  const [flashResult, setFlashResult] = useState<FlashResult>();

  const closeMsgModal = () => setIsMsgModalOpen(false);

  const openTab = useTabs((state) => state.openTab);
  const closeTab = useTabs((state) => state.closeTab);

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

  const handleFileChoose = () => {
    if (flasherFile) {
      setFlasherFile(undefined);
    } else {
      Flasher.setFile();
    }
  };

  const avrdudeBlock = flasherIsLocal && !hasAvrdude;

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
                case ClientStatus.CONNECTION_ERROR:
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
      if (connectionStatus == ClientStatus.CONNECTION_ERROR) {
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
    closeTab('avrdude', modelController);
    openTab({
      type: 'code',
      name: 'avrdude',
      code: flashResult?.report() ?? '',
      language: 'txt',
    });
  };

  // добавление вкладки с serial monitor
  // открытие новой вкладки закрывает соединение со старым портом
  // пока клиент может мониторить только один порт
  const handleAddSerialMonitorTab = () => {
    const curDevice = devices.get(currentDeviceID ?? '');
    if (
      serialMonitorDevice != null &&
      curDevice != serialMonitorDevice &&
      devices.get(serialMonitorDevice.deviceID) != undefined
    ) {
      SerialMonitor.closeMonitor(serialMonitorDevice.deviceID);
    }
    closeTab('Монитор порта', modelController);
    setSerialMonitorDevice(curDevice);
    openTab({
      type: 'serialMonitor',
      name: 'Монитор порта',
    });
  };

  useEffect(() => {
    window.electron.ipcRenderer.invoke('hasAvrdude').then(function (has: boolean) {
      //console.log('hasAvrdude', has);
      setHasAvrdude(has);
    });
    Flasher.bindReact(
      setFlasherDevices,
      setFlasherConnectionStatus,
      setFlasherLog,
      setFlasherFile,
      setIsFlashing,
      setFlasherError,
      setFlashResult
    );
    SerialMonitor.bindReact(
      addDeviceMessage,
      setSerialMonitorDevice,
      setSerialConnectionStatus,
      setSerialLog
    );
    Flasher.initReader(new FileReader());
  }, []);

  useEffect(() => {
    if (!flasherSetting) return;
    const { host, port, localPort, type } = flasherSetting;
    if (type === 'local' && port !== localPort) {
      setFlasherSetting({ ...flasherSetting, port: localPort }).then(() => {
        Flasher.connect(host, localPort);
      });
    } else {
      Flasher.connect(host, port);
    }
  }, [flasherSetting, setFlasherSetting]);

  useEffect(() => {
    /*
      Если соединение с сервером отсутствует, то это означает, что
      связь с портом (если она была) утерена и к нему нельзя подключиться.
      Сервер автоматически прервёт соединение с портом на своей стороне при
      отключении клиента.
    */
    if (connectionStatus != ClientStatus.CONNECTED) {
      setSerialConnectionStatus(SERIAL_MONITOR_NO_SERVER_CONNECTION);
      return;
    }
    /*
      Если установлена новая связь с сервером, то нужно поменять статус с
      того, что нет соединения с сервером (SERIAL_MONITOR_NO_SERVER_CONNECTION) на то,
      что отсутствует соединение с портом, но есть соедиенение с сервером,
      то есть можно подключиться к порту по нажатии на кнопку.
    */
    setSerialConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
  }, [connectionStatus, setSerialConnectionStatus]);

  useEffect(() => {
    if (!serialMonitorDevice) return;
    if (!devices.get(serialMonitorDevice.deviceID)) {
      SerialMonitor.setDevice(undefined);
    }
  }, [devices]);

  const display = () => {
    if (!flasherIsLocal && connectionStatus == ClientStatus.CONNECTING) {
      return 'Отменить';
    }
    if (connectionStatus == ClientStatus.CONNECTED) {
      return 'Обновить';
    } else {
      if (flasherIsLocal) {
        return 'Перезапустить';
      } else {
        return 'Переподключиться';
      }
    }
  };

  const handleReconnect = async () => {
    if (flasherIsLocal) {
      await window.electron.ipcRenderer.invoke('Module:reboot', 'lapki-flasher');
    } else {
      Flasher.reconnect();
    }
  };
  // условия отключения кнопки для загрузки прошивки
  const flashButtonDisabled = () => {
    if (isFlashing || connectionStatus !== ClientStatus.CONNECTED) {
      return true;
    }
    if (avrdudeBlock) {
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
  // вывод сообщения об отсутствии avrdude и кнопка с подсказкой для пользователя
  const avrdudeCheck = () => {
    if (!avrdudeBlock) return;
    return (
      <button
        type="button"
        className="btn-primary mb-2 w-full border-warning bg-warning"
        onClick={openAvrdudeGuideModal}
      >
        Программа avrdude не найдена!
      </button>
    );
  };
  return (
    <section className="flex h-full flex-col text-center">
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Загрузчик
      </h3>

      <div className="px-4">
        <div className="mb-2 flex rounded">
          <button
            className="btn-primary mr-2 flex w-full items-center justify-center gap-2 px-0"
            onClick={() => {
              switch (connectionStatus) {
                case ClientStatus.CONNECTED:
                  handleGetList();
                  break;
                case ClientStatus.CONNECTING:
                  Flasher.cancelConnection();
                  break;
                default:
                  handleReconnect();
                  break;
              }
            }}
            disabled={connectionStatus == ClientStatus.CONNECTING && flasherIsLocal}
          >
            <Update width="1.5rem" height="1.5rem" />
            {display()}
          </button>
          <button
            className="btn-primary px-2"
            onClick={openLoaderSettings}
            disabled={connectionStatus == ClientStatus.CONNECTING || isFlashing}
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
                connectionStatus == ClientStatus.NO_CONNECTION ||
                connectionStatus == ClientStatus.CONNECTION_ERROR
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
        {avrdudeCheck()}
        <div className="flex justify-between gap-2">
          <button
            className="btn-primary mb-2 w-full"
            onClick={handleFlash}
            disabled={flashButtonDisabled()}
          >
            Загрузить
          </button>
          <button
            className={twMerge('btn-primary mb-2 px-4', flasherFile && 'opacity-70')}
            onClick={handleFileChoose}
            disabled={isFlashing || avrdudeBlock}
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
        <button
          className="btn-primary mb-2 w-full"
          onClick={handleAddAvrdudeTab}
          disabled={flashResult === undefined}
        >
          Результат прошивки
        </button>
        <button
          className="btn-primary mb-2 w-full"
          onClick={handleAddSerialMonitorTab}
          disabled={currentDeviceID == undefined}
        >
          Монитор порта
        </button>
        <div className="h-96 overflow-y-auto break-words rounded bg-bg-primary p-2">
          <div>{flasherLog}</div>
        </div>
      </div>
    </section>
  );
};
