import React, { useState } from 'react';

import { useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as Update } from '@renderer/assets/icons/update.svg';
import { ErrorModalData } from '@renderer/components/ErrorModal';
import { Flasher } from '@renderer/components/Modules/Flasher';
import { Modal } from '@renderer/components/UI';
import { useSettings } from '@renderer/hooks/useSettings';
import { useFlasher } from '@renderer/store/useFlasher';
import { FlashResult } from '@renderer/types/FlasherTypes';

import { ArduinoDevice, Device, MSDevice } from '../../Modules/Device';
import { ClientStatus } from '../../Modules/Websocket/ClientStatus';

interface DeviceListProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deviceIds: string[]) => void;
  submitLabel: string;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  isOpen,
  onClose,
  onSubmit,
  submitLabel,
  ...props
}) => {
  const [flasherSetting, setFlasherSetting] = useSettings('flasher');
  const flasherIsLocal = flasherSetting?.type === 'local';
  const { handleSubmit: hookHandleSubmit } = useForm();
  const { connectionStatus, devices } = useFlasher();
  const [currentDeviceID, setCurrentDevice] = useState<string | undefined>(undefined);
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

  const [flashResult, setFlashResult] = useState<Map<string, FlashResult>>(new Map());
  // секунд до переподключения, null - означает, что отчёт до переподключения не ведётся
  const [secondsUntilReconnect, setSecondsUntilReconnect] = useState<number | null>(null);

  const closeMsgModal = () => setIsMsgModalOpen(false);

  const isActive = (id: string) => currentDeviceID === id;

  const handleGetList = async () => {
    Flasher.getList();
  };

  //const avrdudeBlock = flasherIsLocal && !hasAvrdude;

  // TODO: перенести во flasher
  // const handleErrorMessageDisplay = async () => {
  //   // выводимое для пользователя сообщение
  //   let errorMsg: JSX.Element = <p>`Неизвестный тип ошибки`</p>;
  //   if (flasherIsLocal) {
  //     await window.electron.ipcRenderer
  //       .invoke('Module:getStatus', 'lapki-flasher')
  //       .then(function (obj) {
  //         const errorDetails = obj.details;
  //         switch (obj.code) {
  //           // код 0 означает, что не было попытки запустить загрузчик, по-идее такая ошибка не может возникнуть, если только нет какой-то ошибки в коде.
  //           case 0:
  //             errorMsg = <p>{'Загрузчик не был запущен по неизвестной причине.'}</p>;
  //             break;
  //           // код 1 означает, что загрузчик работает, но соединение с ним не установлено.
  //           case 1:
  //             switch (connectionStatus) {
  //               case ClientStatus.CONNECTION_ERROR:
  //                 errorMsg = (
  //                   <p>
  //                     {`Локальный загрузчик работает, но он не может подключиться к IDE из-за ошибки.`}
  //                     <br></br>
  //                     {flasherError}
  //                   </p>
  //                 );
  //                 break;
  //               default:
  //                 errorMsg = (
  //                   <p>
  //                     {`Локальный загрузчик работает, но IDE не может установить с ним соединение.`}
  //                   </p>
  //                 );
  //                 break;
  //             }
  //             break;
  //           case 2:
  //             errorMsg = (
  //               <p>
  //                 {`Локальный загрузчик не смог запуститься из-за ошибки.`}
  //                 <br></br>
  //                 {errorDetails}
  //               </p>
  //             );
  //             break;
  //           case 3:
  //             errorMsg = <p>{`Прервана работа локального загрузчика.`}</p>;
  //             break;
  //           case 4:
  //             errorMsg = <p>{`Платформа ${errorDetails} не поддерживается.`}</p>;
  //             break;
  //         }
  //       });
  //   } else {
  //     if (connectionStatus == ClientStatus.CONNECTION_ERROR) {
  //       errorMsg = (
  //         <p>
  //           {`Ошибка соединения.`}
  //           <br></br>
  //           {flasherError}
  //         </p>
  //       );
  //     } else {
  //       errorMsg = <p>{flasherError}</p>;
  //     }
  //   }
  //   const msg: ErrorModalData = {
  //     text: errorMsg,
  //     caption: 'Ошибка',
  //   };
  //   openMsgModal(msg);
  // };

  // useEffect(() => {
  //   window.electron.ipcRenderer.invoke('hasAvrdude').then(function (has: boolean) {
  //     //console.log('hasAvrdude', has);
  //     setHasAvrdude(has);
  //   });
  //   Flasher.bindReact(
  //     setFlasherDevices,
  //     setFlasherConnectionStatus,
  //     setFlasherLog,
  //     setFlasherFile,
  //     setIsFlashing,
  //     setFlasherError,
  //     setFlashResult,
  //     setSecondsUntilReconnect
  //   );
  //   SerialMonitor.bindReact(
  //     addDeviceMessage,
  //     setSerialMonitorDevice,
  //     setSerialConnectionStatus,
  //     setSerialLog
  //   );
  //   ManagerMS.bindReact(setDeviceMS, setLogMS, setAddressMS, setMetaMS);
  //   Flasher.initReader(new FileReader());
  // }, []);

  // TODO: перенести во useFlasherHooks
  // useEffect(() => {
  //   if (!flasherSetting) return;
  //   const { host, port, localPort, type } = flasherSetting;
  //   const autoReconnect = type === 'remote';
  //   if (type === 'local' && port !== localPort) {
  //     setFlasherSetting({ ...flasherSetting, port: localPort }).then(() => {
  //       Flasher.connect(host, localPort, autoReconnect);
  //     });
  //   } else {
  //     Flasher.connect(host, port, autoReconnect);
  //   }
  // }, [flasherSetting, setFlasherSetting]);

  // TODO: перенести во useFlasherHooks
  // useEffect(() => {
  //   if (serialMonitorDevice && !devices.get(serialMonitorDevice.deviceID)) {
  //     SerialMonitor.setDevice(undefined);
  //   }
  //   if (deviceMS && !devices.get(deviceMS.deviceID)) {
  //     setDeviceMS(undefined);
  //   }
  //   if (currentDeviceID && !devices.get(currentDeviceID)) {
  //     setCurrentDevice(undefined);
  //   }
  // }, [devices]);

  // TODO: перенести во flasher
  // const display = () => {
  //   if (!flasherIsLocal && connectionStatus == ClientStatus.CONNECTING) {
  //     return 'Отменить';
  //   }
  //   if (connectionStatus == ClientStatus.CONNECTED) {
  //     return 'Обновить';
  //   } else {
  //     if (flasherIsLocal) {
  //       return 'Перезапустить';
  //     } else {
  //       return 'Подключиться';
  //     }
  //   }
  // };

  // TODO: перенести во flasher
  // const handleReconnect = async () => {
  //   if (flasherIsLocal) {
  //     await window.electron.ipcRenderer.invoke('Module:reboot', 'lapki-flasher');
  //   } else {
  //     Flasher.reconnect();
  //   }
  // };

  // TODO: перенести во flasher
  // // вывод сообщения об отсутствии avrdude и кнопка с подсказкой для пользователя
  // const avrdudeCheck = () => {
  //   if (!avrdudeBlock) return;
  //   return (
  //     <button
  //       type="button"
  //       className="btn-primary mb-2 w-full border-warning bg-warning"
  //       onClick={openAvrdudeGuideModal}
  //     >
  //       Программа avrdude не найдена!
  //     </button>
  //   );
  // };

  const deviceInfoDisplay = (device: Device | undefined) => {
    if (!device) return;
    if (device.isMSDevice()) {
      const MSDevice = device as MSDevice;
      let portNames = MSDevice.portNames[0];
      for (let i = 1; i < MSDevice.portNames.length; i++) {
        portNames = portNames + '; ' + MSDevice.portNames[i];
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

  const handleSubmit = hookHandleSubmit(() => {
    if (!currentDeviceID) {
      onClose();
      return;
    }
    // TODO: реализовать передачу нескольких устройств одновременно
    onSubmit([currentDeviceID]);
    onClose();
  });

  return (
    <Modal
      {...props}
      isOpen={isOpen}
      title="Список устройств"
      onRequestClose={onClose}
      submitLabel={submitLabel}
      onSubmit={handleSubmit}
      className="bg-bg-secondary"
      submitDisabled={!currentDeviceID}
    >
      <section className="flex h-full flex-col text-center">
        <div className="px-4">
          <div className="mb-2 flex rounded">
            <button
              className="btn-primary mr-2 flex w-full items-center justify-center gap-2 px-0"
              onClick={() => handleGetList()}
              disabled={connectionStatus !== ClientStatus.CONNECTED}
              type="button"
            >
              <Update width="1.5rem" height="1.5rem" />
              {'Обновить'}
            </button>
          </div>
          <div className="mb-2 h-32 overflow-y-auto break-words rounded bg-bg-primary p-2">
            {/* 
          TODO: перенести во flasher
          <button
            className="btn-primary mb-2 w-full"
            onClick={() => handleErrorMessageDisplay()}
            style={{
              display:
                connectionStatus === ClientStatus.NO_CONNECTION ||
                connectionStatus === ClientStatus.CONNECTION_ERROR
                  ? 'inline-block'
                  : 'none',
            }}
          >
            Подробнее
          </button> */}
            {[...devices.keys()].map((key) => (
              <button
                key={key}
                className={twMerge(
                  'my-1 flex w-full items-center rounded border-2 border-[#557b91] p-1 hover:bg-[#557b91] hover:text-white',
                  isActive(key) && 'bg-[#557b91] text-white'
                )}
                onClick={() => setCurrentDevice(key)}
                type="button"
              >
                {devices.get(key)?.displayName()}
              </button>
            ))}
          </div>
          <div className="mb-2 h-36 overflow-y-auto break-words rounded bg-bg-primary p-2 text-left">
            {[...devices.keys()].map((key) => (
              <div key={key} className={twMerge('hidden', isActive(key) && 'block')}>
                {deviceInfoDisplay(devices.get(key))}
              </div>
            ))}
          </div>
          <div className="min-h-16 overflow-y-auto break-words rounded bg-bg-primary p-2">
            <div>{flasherLog}</div>
          </div>
        </div>
      </section>
    </Modal>
  );
};
