/*
Окно менеджера для МС-ТЮК
*/
import { useEffect, useLayoutEffect, useRef } from 'react';

import { useAddressBook } from '@renderer/hooks/useAddressBook';
import { useModal } from '@renderer/hooks/useModal';
import { useSettings } from '@renderer/hooks/useSettings';
import { useManagerMS } from '@renderer/store/useManagerMS';

import { AddressBookModal } from './AddressBook';
import { FlashSelect } from './FirmwareSelectMS1';
import { ManagerMS } from './Modules/ManagerMS';
import { Switch } from './UI';

export const ManagerMSTab: React.FC = () => {
  const { device, log, setLog, address: serverAddress, meta, compilerData } = useManagerMS();
  const {
    addressBookSetting,
    selectedAddress,
    selectedAddressIndex,
    setSelectedAddress,
    onEdit,
    displayEntry,
    getID,
    onAdd,
    onRemove,
    onSwapEntries,
    stateMachineAddresses,
    assignStateMachineToAddress,
    selectedFirmwares,
    setSelectedFirmwares,
  } = useAddressBook();
  const [managerMSSetting, setManagerMSSetting] = useSettings('managerMS');
  const [isAddressBookOpen, openAddressBook, closeAddressBook] = useModal(false);
  const [isFlashSelectOpen, openFlashSelect, closeFlashSelect] = useModal(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // При изменении log прокручиваем вниз, если включена автопрокрутка
  useLayoutEffect(() => {
    if (managerMSSetting?.autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [log, managerMSSetting]);
  useEffect(() => {
    if (device) {
      setSelectedAddress(device.address ?? '');
    } else {
      setSelectedAddress('');
    }
  }, [device]);
  useEffect(() => {
    if (serverAddress === '') return;
    setSelectedAddress(serverAddress);
  }, [serverAddress]);
  useEffect(() => {
    const address = selectedAddress();
    if (!address || !device) return;
    device.address = address;
  }, [selectedAddress]);
  useEffect(() => {
    if (!meta || addressBookSetting === null) return;
    const metaStr = `
- bootloader REF_HW: ${meta.RefBlChip} (${meta.type})
- bootloader REF_FW: ${meta.RefBlFw}
- bootloader REF_CHIP: ${meta.RefBlChip}
- booloader REF_PROTOCOL: ${meta.RefBlProtocol}
- cybergene REF_FW: ${meta.RefCgFw}
- cybergene REF_HW: ${meta.RefCgHw}
- cybergene REF_PROTOCOL: ${meta.RefCgProtocol}
    `;
    if (selectedAddressIndex === null) {
      ManagerMS.addLog(`Получены метаданные, но не удаётся найти адрес устройства:${metaStr}`);
      return;
    }
    ManagerMS.addLog(
      `Получены метаданные для устройства ${displayEntry(selectedAddressIndex)}: ${metaStr}`
    );
    const entry = addressBookSetting[selectedAddressIndex];
    onEdit(
      {
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
      },
      selectedAddressIndex
    );
  });
  const handleGetAddress = () => {
    if (!device) return;
    ManagerMS.getAddress(device.deviceID);
  };
  const handleOpenAddressBook = () => {
    openAddressBook();
  };
  const handlePing = () => {
    if (!device) return;
    ManagerMS.ping(device.deviceID, selectedAddress());
    ManagerMS.addLog('Отправлен пинг на устройство.');
  };
  const handleReset = () => {
    if (!device) return;
    ManagerMS.reset(device.deviceID, selectedAddress());
    ManagerMS.addLog('Отправлен запрос на сброс устройства.');
  };
  const handleGetMetaData = () => {
    if (!device) return;
    ManagerMS.getMetaData(device.deviceID, selectedAddress());
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
  const isFlashDisabled = () => {
    if (selectedFirmwares.length === 0) return true;
    return !selectedFirmwares.every((item) => {
      if (!item.firmware.isFile) {
        if (!compilerData) return false;
        const data = compilerData.state_machines[item.firmware.source];
        return data && data.binary && data.binary.length !== 0;
      }
      return true;
    });
  };

  const handleSendBin = () => {
    if (!device) {
      ManagerMS.addLog('Прошивку начать нельзя! Выберите устройство!');
      return;
    }
    selectedFirmwares.forEach((item) => {
      if (item.firmware.isFile) {
        // TODO
      } else {
        if (!compilerData) return;
        const smData = compilerData.state_machines[item.firmware.source];
        if (!smData || !smData.binary || smData.binary.length === 0) {
          ManagerMS.addLog(
            `Ошибка! Загрузка по адресу ${item.address} невозможна! Отсутствуют бинарные данные для машины состояния ${item.firmware.source}.`
          );
          return;
        }
        ManagerMS.binAdd({
          address: item.address,
          device: device,
          verification: managerMSSetting ? managerMSSetting.verification : false,
          binaries: smData.binary,
        });
      }
    });
    ManagerMS.binStart();
  };
  if (!managerMSSetting) {
    return null;
  }
  return (
    <section className="mr-3 flex h-full flex-col bg-bg-secondary">
      <div className="m-2 flex justify-between">{handleCurrentDeviceDisplay()}</div>
      <label className="m-2">
        Адрес: {displayEntry(selectedAddressIndex ?? -1) ?? 'выберите из адресной книги'}
      </label>
      <div className="m-2 flex">
        <button className="btn-primary mr-4" onClick={handleGetAddress}>
          Узнать адрес...
        </button>
        <button className="btn-primary mr-4" onClick={handleOpenAddressBook}>
          Адресная книга
        </button>
        <button
          className="btn-primary mr-4"
          onClick={handlePing}
          disabled={selectedAddress() === ''}
        >
          Пинг
        </button>
        <button
          className="btn-primary mr-4"
          onClick={handleReset}
          disabled={selectedAddress() === ''}
        >
          Сброс
        </button>
        <button
          className="btn-primary mr-4"
          onClick={handleGetMetaData}
          disabled={selectedAddress() === ''}
        >
          Получить метаданные
        </button>
      </div>
      <div className="m-2 flex">
        <button
          className="btn-primary mr-4"
          onClick={() => handleSendBin()}
          disabled={isFlashDisabled()}
        >
          Отправить bin...
        </button>
        <button className="btn-primary mr-4" onClick={openFlashSelect}>
          Выбрать прошивки...
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
        isOpen={isAddressBookOpen}
        onClose={closeAddressBook}
        onSubmit={(selectedAddress: string) => {
          setSelectedAddress(selectedAddress);
        }}
        addressBookSetting={addressBookSetting}
        getID={getID}
        onAdd={onAdd}
        onEdit={onEdit}
        onRemove={onRemove}
        onSwapEntries={onSwapEntries}
      ></AddressBookModal>
      <FlashSelect
        addressBookSetting={addressBookSetting}
        isOpen={isFlashSelectOpen}
        onClose={closeFlashSelect}
        stateMachineAddresses={stateMachineAddresses}
        assignStateMachineToAddress={assignStateMachineToAddress}
        selectedFirmwares={selectedFirmwares}
        setSelectedFirmwares={setSelectedFirmwares}
      ></FlashSelect>
    </section>
  );
};
