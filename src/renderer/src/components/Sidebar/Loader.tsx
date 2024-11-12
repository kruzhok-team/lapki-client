import React, { useEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as Setting } from '@renderer/assets/icons/settings.svg';
import { ReactComponent as Update } from '@renderer/assets/icons/update.svg';
import { ErrorModal, ErrorModalData } from '@renderer/components/ErrorModal';
import { Flasher } from '@renderer/components/Modules/Flasher';
import { useSettings } from '@renderer/hooks/useSettings';
import { useModelContext } from '@renderer/store/ModelContext';
import { useFlasher } from '@renderer/store/useFlasher';
import { useManagerMS } from '@renderer/store/useManagerMS';
import { useSerialMonitor } from '@renderer/store/useSerialMonitor';
import { useTabs } from '@renderer/store/useTabs';
import { CompilerResult } from '@renderer/types/CompilerTypes';
import { StateMachine } from '@renderer/types/diagram';
import { FlashResult } from '@renderer/types/FlasherTypes';

import { ArduinoDevice, Device, MSDevice } from '../Modules/Device';
import { ManagerMS } from '../Modules/ManagerMS';
import {
  SERIAL_MONITOR_CONNECTING,
  SERIAL_MONITOR_NO_CONNECTION,
  SERIAL_MONITOR_NO_SERVER_CONNECTION,
  SerialMonitor,
} from '../Modules/SerialMonitor';
import { ClientStatus } from '../Modules/Websocket/ClientStatus';
import { Select } from '../UI/Select';

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
  const stateMachinesId = modelController.model.useData('', 'elements.stateMachinesId') as {
    [ID: string]: StateMachine;
  };
  // ключ: ID устройства; значение: ID машины состояний
  const [deviceStateMachine, setDeviceStateMachine] = useState<Map<string, string>>(new Map());
  const [flasherSetting, setFlasherSetting] = useSettings('flasher');
  const flasherIsLocal = flasherSetting?.type === 'local';
  const { connectionStatus, setFlasherConnectionStatus, isFlashing, setIsFlashing } = useFlasher();
  const {
    device: serialMonitorDevice,
    setDevice: setSerialMonitorDevice,
    setConnectionStatus: setSerialConnectionStatus,
    connectionStatus: serialConnectionStatus,
    setLog: setSerialLog,
    addDeviceMessage,
  } = useSerialMonitor();
  const {
    device: deviceMS,
    setDevice: setDeviceMS,
    setLog: setLogMS,
    setAddress: setAddressMS,
  } = useManagerMS();
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
  // секунд до переподключения, null - означает, что отчёт до переподключения не ведётся
  const [secondsUntilReconnect, setSecondsUntilReconnect] = useState<number | null>(null);

  const closeMsgModal = () => setIsMsgModalOpen(false);

  const openTab = useTabs((state) => state.openTab);
  const closeTab = useTabs((state) => state.closeTab);

  const isActive = (id: string) => currentDeviceID === id;

  const handleGetList = async () => {
    Flasher.getList();
  };

  const handleFlash = async () => {
    if (currentDeviceID === null || currentDeviceID === undefined) {
      console.log('Не удаётся начать прошивку, currentDeviceID =', currentDeviceID);
      return;
    }
    const currentDevice = devices.get(currentDeviceID);
    if (currentDevice === null || currentDevice === undefined) {
      console.log('Не удаётся начать прошивку, currentDevice =', currentDevice);
      return;
    }
    if (
      serialMonitorDevice &&
      serialMonitorDevice.deviceID == currentDeviceID &&
      serialConnectionStatus == SERIAL_MONITOR_CONNECTING //SERIAL_MONITOR_CONNECTED
    ) {
      /*
      см. 'flash-open-serial-monitor' в Flasher.ts обработку случая, 
      когда монитор порта не успевает закрыться перед отправкой запроса на прошивку
      */
      SerialMonitor.closeMonitor(serialMonitorDevice.deviceID);
    }
    if (flasherFile) {
      Flasher.flash(currentDevice, serialMonitorDevice, serialConnectionStatus);
    } else {
      Flasher.flashCompiler(
        // проверка на undefined осуществляется в flashButtonDisabled
        compilerData!.state_machines[deviceStateMachine.get(currentDeviceID)!].binary!,
        currentDevice,
        serialMonitorDevice,
        serialConnectionStatus
      );
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

  // добавление вкладки с сообщением от программы загрузки прошивки (например от avrdude)
  const handleAddAvrdudeTab = () => {
    closeTab('Прошивка', modelController);
    openTab(modelController, {
      type: 'code',
      name: 'Прошивка',
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
    openTab(modelController, {
      type: 'serialMonitor',
      name: 'Монитор порта',
    });
  };

  const handleAddManagerMSTab = () => {
    const curDevice = devices.get(currentDeviceID ?? '');
    setDeviceMS(curDevice as MSDevice);
    closeTab('Менеджер МС-ТЮК', modelController);
    openTab(modelController, {
      type: 'managerMS',
      name: 'Менеджер МС-ТЮК',
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
      setFlashResult,
      setSecondsUntilReconnect
    );
    SerialMonitor.bindReact(
      addDeviceMessage,
      setSerialMonitorDevice,
      setSerialConnectionStatus,
      setSerialLog
    );
    ManagerMS.bindReact(setDeviceMS, setLogMS, setAddressMS);
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
    if (serialMonitorDevice && !devices.get(serialMonitorDevice.deviceID)) {
      SerialMonitor.setDevice(undefined);
    }
    if (deviceMS && !devices.get(deviceMS.deviceID)) {
      setDeviceMS(undefined);
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
        return 'Подключиться';
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
    const smId = deviceStateMachine.get(currentDeviceID);
    if (smId === undefined) {
      return true;
    }
    const stateData = compilerData?.state_machines[smId];
    if (stateData === undefined || stateData.binary.length === 0) {
      return true;
    }
    // для безопасности, лучше всего блокировать кнопку загрузки, пока не произойдёт подключения к монитору порта,
    // чтобы гарантированно избежать ситуации одновремнной прошивки и подключения к порту
    if (serialConnectionStatus == SERIAL_MONITOR_CONNECTING) {
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

  const getDevicePlatform = (device: Device) => {
    // TODO: подумать, можно ли найти более надёжный способ сверки платформ на клиенте и сервере
    // названия платформ на загрузчике можно посмотреть здесь: https://github.com/kruzhok-team/lapki-flasher/blob/main/src/device_list.JSON
    const name = device.name.toLocaleLowerCase();
    switch (name) {
      case 'arduino micro':
      case 'arduino micro (bootloader)':
        return 'ArduinoMicro';
      case 'arduino uno':
        return 'ArduinoUno';
    }
    return undefined;
  };

  const stateMachineOptions = () => {
    if (currentDeviceID == undefined) return undefined;
    const currentDevice = devices.get(currentDeviceID);
    if (currentDevice == undefined) return undefined;
    const platform = getDevicePlatform(currentDevice);
    return [...Object.entries(stateMachinesId)]
      .filter(([, sm]) => sm.platform == platform)
      .map(([id, sm]) => {
        return { value: id, label: sm.name ?? id };
      });
  };
  const getSelectMachineStateOption = () => {
    const emptyValue = null;
    if (currentDeviceID == undefined) return emptyValue;
    const smId = deviceStateMachine.get(currentDeviceID);
    if (smId == undefined) return emptyValue;
    const sm = stateMachinesId[smId];
    if (!sm) {
      setDeviceStateMachine((oldValue) => {
        const newValue = new Map(oldValue);
        newValue.delete(currentDeviceID);
        return newValue;
      });
      return emptyValue;
    }
    return { value: smId, label: sm.name ?? smId };
  };
  /**
   * Изменение выбранной машины состояний для текущего устройства
   * @param smId ID машины состояний
   */
  const onSelectMachineState = (smId: string | undefined) => {
    if (currentDeviceID == undefined || smId == undefined) return;
    setDeviceStateMachine((oldValue) => {
      const newValue = new Map(oldValue);
      newValue.set(currentDeviceID, smId);
      return newValue;
    });
  };

  const showReconnectTime = () => {
    if (secondsUntilReconnect == null) return;
    return <p>До подключения: {secondsUntilReconnect} сек.</p>;
  };
  const deviceInfoDisplay = (device: Device | undefined) => {
    if (!device) return;
    if (device.isMSDevice()) {
      const MSDevice = device as MSDevice;
      let portNames = '';
      for (let i = 0; i < MSDevice.portNames.length; i++) {
        portNames = portNames + ' ' + MSDevice.portNames[i];
      }
      return (
        <div>
          <div className="flex items-center">{MSDevice.name}</div>
          <p>Порты: {portNames}</p>
        </div>
      );
    } else {
      const ArduinoDevice = device as ArduinoDevice;
      return (
        <div>
          <div className="flex items-center">{ArduinoDevice.name}</div>
          <p>Серийный номер: {ArduinoDevice.serialID}</p>
          <p>Порт: {ArduinoDevice.portName}</p>
          <p>Контроллер: {ArduinoDevice.controller}</p>
          <p>Программатор: {ArduinoDevice.programmer}</p>
        </div>
      );
    }
  };
  const buttonsDisplay = () => {
    const curDevice = devices.get(currentDeviceID ?? '');
    if (!curDevice || !curDevice.isMSDevice()) {
      return (
        <div>
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
        </div>
      );
    } else {
      return (
        <div>
          <button className="btn-primary mb-2 w-full" onClick={handleAddManagerMSTab}>
            Менеджер МС-ТЮК
          </button>
        </div>
      );
    }
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
          {showReconnectTime()}
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
              {devices.get(key)?.displayName()}
            </button>
          ))}
        </div>
        <div className="mb-2 h-64 overflow-y-auto break-words rounded bg-bg-primary p-2 text-left">
          {[...devices.keys()].map((key) => (
            <div key={key} className={twMerge('hidden', isActive(key) && 'block')}>
              {deviceInfoDisplay(devices.get(key))}
            </div>
          ))}
        </div>
        {avrdudeCheck()}
        {buttonsDisplay()}
        <Select
          className="mb-2"
          isSearchable={false}
          placeholder="Выберите машину состояний..."
          options={stateMachineOptions()}
          value={getSelectMachineStateOption()}
          onChange={(opt) => onSelectMachineState(opt?.value)}
          isDisabled={currentDeviceID == undefined}
          noOptionsMessage={() => 'Нет подходящих машин состояний'}
        />
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
