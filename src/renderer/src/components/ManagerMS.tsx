/*
Окно менеджера для МС-ТЮК
*/
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useModal } from '@renderer/hooks/useModal';
import { useSettings } from '@renderer/hooks/useSettings';
import { useManagerMS } from '@renderer/store/useManagerMS';
import { useSerialMonitor } from '@renderer/store/useSerialMonitor';

import { AddressBookModal } from './AddressBook';
import { Flasher } from './Modules/Flasher';
import { ManagerMS } from './Modules/ManagerMS';
import { Switch } from './UI';

export const ManagerMSTab: React.FC = () => {
  const { device, log, setLog, address: serverAddress } = useManagerMS();
  const { device: serialMonitorDevice, connectionStatus: serialConnectionStatus } =
    useSerialMonitor();
  const [addressBookSetting, setAddressBookSetting] = useSettings('addressBookMS');
  const [managerMSSetting, setManagerMSSetting] = useSettings('managerMS');
  const [address, setAddress] = useState<string>('');
  const [isAddressBookOpen, openAddressBook, closeAddressBook] = useModal(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  // При изменении log прокручиваем вниз, если включена автопрокрутка
  useLayoutEffect(() => {
    if (managerMSSetting?.autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [log, managerMSSetting]);
  useEffect(() => {
    setAddress('');
  }, [device]);
  useEffect(() => {
    if (serverAddress == '' || addressBookSetting == null) return;
    setAddress(serverAddress);
    let found = false;
    for (const addr of addressBookSetting) {
      if (addr.address == serverAddress) {
        found = true;
        break;
      }
    }
    if (!found) {
      const newRow = {
        name: '',
        address: serverAddress,
        type: '',
      };
      setAddressBookSetting([...addressBookSetting, newRow]);
    }
  }, [serverAddress]);
  const handleGetAddress = () => {
    if (!device) return;
    ManagerMS.getAddress(device.deviceID);
  };
  const handleOpenAddressBook = () => {
    openAddressBook();
  };
  const handleSendBin = () => {
    if (!device) return;
    Flasher.setFile().then((isOpen: boolean) => {
      if (isOpen) {
        ManagerMS.binStart(
          device,
          address,
          managerMSSetting?.verification,
          serialMonitorDevice,
          serialConnectionStatus
        );
      }
    });
  };
  const handlePing = () => {
    if (!device) return;
    ManagerMS.ping(device.deviceID, address);
    ManagerMS.addLog('Отправлен пинг на устройство.');
  };
  const handleReset = () => {
    if (!device) return;
    ManagerMS.reset(device.deviceID, address);
    ManagerMS.addLog('Отправлен запрос на сброс устройства.');
  };
  const handleCurrentDeviceDisplay = () => {
    if (device === undefined) {
      return 'Устройство отсутствует.';
    }
    return device.displayName();
  };
  const handleClear = () => {
    setLog(() => []);
  };
  if (!managerMSSetting) {
    return null;
  }
  return (
    <section className="mr-3 flex h-full flex-col bg-bg-secondary">
      <div className="m-2 flex justify-between">{handleCurrentDeviceDisplay()}</div>
      <label className="m-2">Адрес: {address}</label>
      <div className="m-2 flex">
        <button className="btn-primary mr-4" onClick={handleGetAddress}>
          Узнать адрес...
        </button>
        <button className="btn-primary mr-4" onClick={handleOpenAddressBook}>
          Адресная книга
        </button>
        <button className="btn-primary mr-4" onClick={handlePing} disabled={address == ''}>
          Пинг
        </button>
        <button className="btn-primary mr-4" onClick={handleReset} disabled={address == ''}>
          Сброс
        </button>
      </div>
      <div className="m-2 flex">
        <button className="btn-primary mr-4" onClick={handleSendBin} disabled={address == ''}>
          Отправить bin...
        </button>
        <div className="mr-4 flex w-40 items-center justify-between">
          <Switch
            checked={managerMSSetting.verification}
            onCheckedChange={() =>
              setManagerMSSetting({
                ...managerMSSetting,
                verification: !managerMSSetting.verification,
              })
            }
          />
          Верификация
        </div>
      </div>
      <div className="m-2 flex">
        <div className="mr-4 flex w-40 items-center justify-between">
          <Switch
            checked={managerMSSetting.autoScroll}
            onCheckedChange={() =>
              setManagerMSSetting({ ...managerMSSetting, autoScroll: !managerMSSetting.autoScroll })
            }
          />
          Автопрокрутка
        </div>
        <button className="btn-primary" onClick={handleClear}>
          Очистить
        </button>
      </div>
      <div
        className="mx-2 h-full overflow-y-auto whitespace-break-spaces bg-bg-primary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb"
        ref={logContainerRef}
      >
        {log.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>
      <AddressBookModal
        addressBookSetting={addressBookSetting}
        setAddressBookSetting={setAddressBookSetting}
        isOpen={isAddressBookOpen}
        onClose={closeAddressBook}
        onSelect={(selectedAddress: string) => {
          setAddress(selectedAddress);
        }}
      ></AddressBookModal>
    </section>
  );
};
