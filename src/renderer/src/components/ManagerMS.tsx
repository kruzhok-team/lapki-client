/*
Окно менеджера для МС-ТЮК
*/
import { useState } from 'react';

import { useModal } from '@renderer/hooks';
import { useManagerMS } from '@renderer/store/useManagerMS';
import { useSerialMonitor } from '@renderer/store/useSerialMonitor';

import { AddressModalMS } from './AddressModalMS';
import { Flasher } from './Modules/Flasher';
import { ManagerMS } from './Modules/ManagerMS';
import { TextField } from './UI';

export const ManagerMSTab: React.FC = () => {
  const { device, log } = useManagerMS();
  const { device: serialMonitorDevice, connectionStatus: serialConnectionStatus } =
    useSerialMonitor();
  const [address, setAddress] = useState<string>('');
  const [isAddressModalOpen, openAddressModal, closeAddressModal] = useModal(false);
  const handleGetAddress = () => {
    if (!device) return;
    ManagerMS.getAddress(device.deviceID);
    openAddressModal();
  };
  const handleSendBin = () => {
    if (!device) return;
    Flasher.setFile().then(() => {
      ManagerMS.binStart(device, address, serialMonitorDevice, serialConnectionStatus);
    });
  };
  const handlePing = () => {
    if (!device) return;
    ManagerMS.ping(device.deviceID, address);
    ManagerMS.addLog('sent ping');
  };
  const handleCurrentDeviceDisplay = () => {
    if (device === undefined) {
      return 'Устройство отсутствует';
    }
    return `${device?.name} (${device?.portName})`;
  };
  return (
    <section className="mr-3 flex h-full flex-col bg-bg-secondary">
      <div className="m-2 flex justify-between">{handleCurrentDeviceDisplay()}</div>
      <div className="m-2">
        <TextField
          label="Адрес:"
          className="mr-2 max-w-full"
          placeholder="Напишите адрес"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <div className="m-2 flex">
        <button className="btn-primary mr-4" onClick={handleGetAddress}>
          Узнать адрес...
        </button>
        <button className="btn-primary mr-4" onClick={handleSendBin}>
          Отправить bin...
        </button>
        <button className="btn-primary mr-4" onClick={handlePing}>
          Пинг
        </button>
      </div>
      <AddressModalMS isOpen={isAddressModalOpen} onClose={closeAddressModal}></AddressModalMS>
      <div className="mx-2 h-full overflow-y-auto whitespace-break-spaces bg-bg-primary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
        {log.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>
    </section>
  );
};
