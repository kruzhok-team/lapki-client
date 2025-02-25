import React, { useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as Update } from '@renderer/assets/icons/update.svg';
import { Flasher } from '@renderer/components/Modules/Flasher';
import { Modal } from '@renderer/components/UI';
import { useFlasher } from '@renderer/store/useFlasher';

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
  const { handleSubmit: hookHandleSubmit } = useForm();
  const { connectionStatus, devices } = useFlasher();
  const [currentDeviceID, setCurrentDevice] = useState<string | undefined>(undefined);

  const isActive = (id: string) => currentDeviceID === id;

  useEffect(() => {
    if (!currentDeviceID) return;

    if (!devices.has(currentDeviceID)) {
      setCurrentDevice(undefined);
    }
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
    } else {
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

  const renderBottom = () => {
    if (connectionStatus === ClientStatus.CONNECTED) {
      return (
        <div>
          <label>Устройства</label>
          <div className="mb-2 h-32 overflow-y-auto break-words rounded bg-bg-primary p-2">
            {[...devices.keys()].map((key) => (
              <button
                key={key}
                className={twMerge(
                  'my-1 flex w-full items-center justify-center rounded border-2 border-[#557b91] p-1 hover:bg-[#557b91] hover:text-white',
                  isActive(key) && ' bg-[#557b91] text-white'
                )}
                onClick={() => setCurrentDevice(key)}
                type="button"
              >
                {devices.get(key)?.displayName()}
              </button>
            ))}
          </div>
          <label>Информация об устройстве</label>
          <div className="mb-2 h-36 items-center overflow-y-auto break-words rounded bg-bg-primary p-2 text-left">
            {[...devices.keys()].map((key) => (
              <div key={key} className={twMerge('hidden', isActive(key) && 'block')}>
                {deviceInfoDisplay(devices.get(key))}
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      return <label>Отсутствует подключение к загрузчику</label>;
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
              Обновить
            </button>
          </div>
          {renderBottom()}
        </div>
      </section>
    </Modal>
  );
};
