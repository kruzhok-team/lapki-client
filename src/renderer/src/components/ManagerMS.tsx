/*
Окно менеджера для МС-ТЮК
*/
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useModal } from '@renderer/hooks/useModal';
import { useSettings } from '@renderer/hooks/useSettings';
import { useManagerMS } from '@renderer/store/useManagerMS';
import { useSerialMonitor } from '@renderer/store/useSerialMonitor';

import { AddressBookModal } from './AddressBook';
import { Device, MSDevice } from './Modules/Device';
import { Flasher } from './Modules/Flasher';
import { ManagerMS } from './Modules/ManagerMS';
import { Switch } from './UI';

export interface ManagerMSProps {
  devices: Map<string, Device>;
}

export const ManagerMSTab: React.FC<ManagerMSProps> = ({ devices }) => {
  const { device, log, setLog, address: serverAddress, meta } = useManagerMS();
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
    if (device) {
      setAddress(device.address ?? '');
    } else {
      setAddress('');
    }
  }, [device]);
  useEffect(() => {
    if (serverAddress == '' || addressBookSetting == null) return;
    setAddress(serverAddress);
    if (!isDuplicate(serverAddress)) {
      const newRow = {
        name: '',
        address: serverAddress,
        type: '',
        meta: {
          RefBlHw: '',
          RefBlFw: '',
          RefBlUserCode: '',
          RefBlChip: '',
          RefBlProtocol: '',
          RefCgHw: '',
          RefCgFw: '',
          RefCgProtocol: '',
        },
      };
      setAddressBookSetting([...addressBookSetting, newRow]);
    }
  }, [serverAddress]);
  useEffect(() => {
    if (!address || !device) return;
    device.address = address;
  }, [address]);
  useEffect(() => {
    if (!meta || !addressBookSetting) return;
    const dev = devices.get(meta.deviceID) as MSDevice;
    const metaStr = `
- bootloader REF_HW: ${meta.RefBlChip} (${meta.type})
- bootloader REF_FW: ${meta.RefBlFw}
- bootloader REF_CHIP: ${meta.RefBlChip}
- booloader REF_PROTOCOL: ${meta.RefBlProtocol}
- cybergene REF_FW: ${meta.RefCgFw}
- cybergene REF_HW: ${meta.RefCgHw}
- cybergene REF_PROTOCOL: ${meta.RefCgProtocol}
    `;
    if (!dev) {
      ManagerMS.addLog(
        `Получены метаданные, но не удаётся определить для какого устройства, возможно оно больше не подключено:${metaStr}`
      );
      return;
    }
    ManagerMS.addLog(`Получены метаданные для устройства ${dev.displayName()}: ${metaStr}`);
    const newBook = addressBookSetting.map((entry) => {
      if (entry.address === dev.address) {
        return {
          name: entry.name,
          address: entry.address,
          type: meta.type,
          meta: {
            RefBlHw: meta.RefBlHw,
            RefBlFw: meta.RefBlFw,
            RefBlUserCode: meta.RefBlUserCode,
            RefBlChip: meta.RefBlChip,
            RefBlProtocol: meta.RefBlProtocol,
            RefCgHw: meta.RefCgHw,
            RefCgFw: meta.RefCgFw,
            RefCgProtocol: meta.RefCgProtocol,
          },
        };
      } else {
        return entry;
      }
    });
    setAddressBookSetting(newBook);
  }, [meta]);
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
  const handleGetMetaData = () => {
    if (!device) return;
    ManagerMS.getMetaData(device.deviceID, address);
    ManagerMS.addLog('Отправлен запрос на метаданные устройства.');
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
  /**
   * Проверка на наличие адреса в адресной книге
   * @param address адрес МС-ТЮК
   * @returns истина, если адрес уже встречается в адресной книге; undefined, если адресная книга не загрузилась (если она является null)
   */
  const isDuplicate = (address: string): boolean | undefined => {
    if (!addressBookSetting) return undefined;
    let found = false;
    for (const addr of addressBookSetting) {
      if (addr.address == address) {
        found = true;
        break;
      }
    }
    return found;
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
        <button className="btn-primary mr-4" onClick={handleGetMetaData} disabled={address == ''}>
          Получить метаданные
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
        onSubmit={(selectedAddress: string) => {
          setAddress(selectedAddress);
        }}
        isDuplicate={isDuplicate}
      ></AddressBookModal>
    </section>
  );
};
