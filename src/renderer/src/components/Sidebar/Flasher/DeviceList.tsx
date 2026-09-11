import React, { useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as Update } from '@renderer/assets/icons/update.svg';
import { Flasher } from '@renderer/components/Modules/Flasher';
import { Modal, ScrollArea } from '@renderer/components/UI';
import { useFlasher } from '@renderer/store/useFlasher';

import { ArduinoDevice, BlgMbDevice, Device, MSDevice } from '../../Modules/Device';
import { ClientStatus } from '../../Modules/Websocket/ClientStatus';

interface DeviceListProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deviceIds: string[]) => void;
  submitLabel: string;
  devices: Map<string, Device>;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  isOpen,
  onClose,
  onSubmit,
  submitLabel,
  devices,
  ...props
}) => {
  const { handleSubmit: hookHandleSubmit } = useForm();
  const { connectionStatus } = useFlasher();
  const [currentDeviceID, setCurrentDevice] = useState<string | undefined>(undefined);

  const isActive = (id: string) => currentDeviceID === id;

  useEffect(() => {
    if (!currentDeviceID) return;

    if (!devices.has(currentDeviceID)) {
      setCurrentDevice(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices]);

  const handleGetList = async () => {
    Flasher.getList();
  };

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
          <p>{MSDevice.name}</p>
          <p>Порты: {portNames}</p>
        </div>
      );
    } else if (device.isArduinoDevice()) {
      const ArduinoDevice = device as ArduinoDevice;
      return (
        <div>
          <p> {ArduinoDevice.name}</p>
          <p>Серийный номер: {ArduinoDevice.serialID}</p>
          <p>Порт: {ArduinoDevice.portName}</p>
          <p>Контроллер: {ArduinoDevice.controller}</p>
          <p>Программатор: {ArduinoDevice.programmer}</p>
        </div>
      );
    } else if (device.isBlgMbDevice()) {
      const BlgMbDevice = device as BlgMbDevice;
      return (
        <div>
          <p> {BlgMbDevice.name}</p>
          <p>Версия: {BlgMbDevice.version}</p>
        </div>
      );
    } else {
      return <div className="text-center">Дополнительная информация отсутствует</div>;
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

  const renderContent = () => {
    if (connectionStatus === ClientStatus.CONNECTED) {
      return (
        <div className="grid w-[618px] grid-cols-[310px_284px] gap-x-6">
          <div>
            <div className="mb-[11px] flex items-center gap-3 font-medium">
              <span>Устройства</span>
              <button
                className="text-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleGetList}
                disabled={connectionStatus !== ClientStatus.CONNECTED}
                type="button"
                aria-label="Обновить"
                title="Обновить"
              >
                <Update className="h-4 w-4" />
              </button>
            </div>
            <ScrollArea
              className="h-[140px] rounded-lg border border-border-primary bg-bg-control"
              viewportClassName="px-[8px]"
              horizontalScroll={false}
            >
              {devices.size === 0 ? (
                <p className="px-3 py-2 text-text-inactive">Устройства не найдены</p>
              ) : (
                [...devices.keys()].map((key) => (
                  <button
                    key={key}
                    className={twMerge(
                      'flex h-[25px] w-full cursor-pointer select-none items-center rounded-lg px-3 text-left leading-4 transition-colors hover:bg-bg-hover',
                      isActive(key) && 'bg-bg-active'
                    )}
                    onClick={() => setCurrentDevice(key)}
                    type="button"
                  >
                    {devices.get(key)?.displayName()}
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          <div>
            <h2 className="mb-[11px] font-medium">Описание</h2>
            <ScrollArea
              className="h-[140px]"
              viewportClassName="break-words text-left leading-4"
              horizontalScroll={false}
            >
              {currentDeviceID ? (
                deviceInfoDisplay(devices.get(currentDeviceID))
              ) : (
                <p>Выберите устройство из списка, чтобы посмотреть информацию о нем</p>
              )}
            </ScrollArea>
          </div>
        </div>
      );
    } else {
      return (
        <div className="grid h-full place-items-center text-text-inactive">
          Отсутствует подключение к загрузчику
        </div>
      );
    }
  };

  return (
    <Modal
      {...props}
      isOpen={isOpen}
      title="Список устройств"
      onRequestClose={onClose}
      submitLabel={submitLabel}
      onSubmit={handleSubmit}
      hideCancelButton
      submitDisabled={!currentDeviceID}
    >
      {renderContent()}
    </Modal>
  );
};
