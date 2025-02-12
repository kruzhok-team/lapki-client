/*
Окно загрузчика
*/
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useAddressBook } from '@renderer/hooks/useAddressBook';
import { useModal } from '@renderer/hooks/useModal';
import { useSettings } from '@renderer/hooks/useSettings';
import { useFlasher } from '@renderer/store/useFlasher';
import { useManagerMS } from '@renderer/store/useManagerMS';
import { AddressData, SelectedMsFirmwaresType } from '@renderer/types/FlasherTypes';

import { AddressBookModal } from './AddressBook';
import { FlasherTable } from './FlasherTable';
import { MsGetAddressModal } from './MsGetAddressModal';

import { ManagerMS } from '../../Modules/ManagerMS';
import { Switch } from '../../UI';

export const FlasherTab: React.FC = () => {
  const { device, log, address: serverAddress, meta, compilerData } = useManagerMS();
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
  } = useAddressBook();
  const { connectionStatus } = useFlasher();
  const [managerMSSetting, setManagerMSSetting] = useSettings('managerMS');
  const [isAddressBookOpen, openAddressBook, closeAddressBook] = useModal(false);
  const [isMsGetAddressOpen, openMsGetAddressModal, closeMsGetAddressModal] = useModal(false);
  const [selectedFirmwares, setSelectedFirmwares] = useState<SelectedMsFirmwaresType[]>([]);
  const [addressStateMachine, setAddressStateMachine] = useState<
    Map<string, SelectedMsFirmwaresType>
  >(new Map());
  const [checkedStateMachine, setCheckedStateMachine] = useState<Map<string, boolean>>(new Map());
  const [devList, setDevList] = useState<AddressData[]>([
    { address: 'pupupu', name: 'dev', type: '', meta: undefined },
  ]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // При изменении log прокручиваем вниз, если включена автопрокрутка
  useLayoutEffect(() => {
    if (managerMSSetting?.autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [log, managerMSSetting]);

  useEffect(() => {
    if (serverAddress === '') return;
    setSelectedAddress(serverAddress);
  }, [serverAddress]);

  useEffect(() => {
    if (!meta || addressBookSetting === null) return;
    const metaStr = `
- bootloader REF_HW: ${meta.RefBlHw} (${meta.type})
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
  }, [meta]);

  useEffect(() => {
    if (addressBookSetting === null) return;
    // TODO: переименование, удаление и т.д.
  }, [addressBookSetting]);

  const handleGetAddress = () => {
    if (!device || !managerMSSetting) return;
    if (!managerMSSetting.hideGetAddressModal) {
      openMsGetAddressModal();
    } else {
      ManagerMS.getAddress(device.deviceID);
    }
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
  const isFlashDisabled = () => {
    if (selectedFirmwares.length === 0) return true;
    return !selectedFirmwares.every((item) => {
      if (!item.isFile) {
        if (!compilerData) return false;
        const data = compilerData.state_machines[item.target];
        return data && data.binary && data.binary.length !== 0;
      }
      return true;
    });
  };

  const handleSendBin = async () => {
    if (!addressBookSetting) {
      ManagerMS.addLog('Ошибка! Адресная книга не загрузилась!');
      return;
    }
    if (!device) {
      ManagerMS.addLog('Прошивку начать нельзя! Выберите устройство!');
      return;
    }
    for (const item of selectedFirmwares) {
      const addressIndex = stateMachineAddresses.get(item.target);
      // значит адрес или машина состояний были удалены
      if (addressIndex === undefined) {
        ManagerMS.addLog(
          `Ошибка! Не удаётся найти адрес для ${
            item.isFile ? 'файла с прошивкой' : 'машины состояний'
          } (${item.target}). Возможно Вы удалили адрес или ${
            item.isFile ? 'файл с прошивкой' : 'машину состояний'
          }.`
        );
        continue;
      }
      if (item.isFile) {
        const [binData, errorMessage] = await window.api.fileHandlers.readFile(item.target);
        if (errorMessage !== null) {
          ManagerMS.addLog(
            `Ошибка! Не удалось извлечь данные из файла ${item.target}. Текст ошибки: ${errorMessage}`
          );
          continue;
        }
        if (binData !== null) {
          ManagerMS.binAdd({
            addressInfo: addressBookSetting[addressIndex],
            device: device,
            verification: managerMSSetting ? managerMSSetting.verification : false,
            binaries: new Blob([binData]),
            isFile: true,
          });
        }
      } else {
        if (!compilerData) continue;
        const smData = compilerData.state_machines[item.target];
        if (!smData || !smData.binary || smData.binary.length === 0) {
          ManagerMS.addLog(
            `Ошибка! Загрузка по адресу ${displayEntry(
              addressIndex
            )} невозможна! Отсутствуют бинарные данные для машины состояния ${item.target}.`
          );
          continue;
        }
        ManagerMS.binAdd({
          addressInfo: addressBookSetting[addressIndex],
          device: device,
          verification: managerMSSetting ? managerMSSetting.verification : false,
          binaries: smData.binary,
          isFile: false,
        });
      }
    }
    ManagerMS.binStart();
  };
  if (!managerMSSetting) {
    return null;
  }
  return (
    <section className="mr-3 flex h-full flex-col bg-bg-secondary">
      <label className="m-2">Статус: {connectionStatus}</label>
      <div className="m-2 flex">
        <button className="btn-primary mr-4" onClick={handleGetAddress}>
          Подключить плату
        </button>
        <button className="btn-primary mr-4" onClick={handleOpenAddressBook}>
          Адреса плат МС-ТЮК
        </button>
      </div>
      <div className="m-2">
        <FlasherTable
          checkedStateMachine={checkedStateMachine}
          setCheckedStateMachine={setCheckedStateMachine}
          setStateMachineAddresses={setAddressStateMachine}
          stateMachineAddresses={addressStateMachine}
          devList={devList}
        />
      </div>
      <div className="m-2 flex">
        <button
          className="btn-primary mr-4"
          onClick={() => handleSendBin()}
          disabled={isFlashDisabled()}
        >
          Прошить!
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
      <div className="m-2">Журнал действий</div>
      <div
        className="mx-2 h-72 overflow-y-auto whitespace-break-spaces bg-bg-primary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb"
        ref={logContainerRef}
      >
        {log.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>
      <div className="m-2 flex flex-row-reverse">
        <button
          className="btn-primary"
          onClick={() => {
            ManagerMS.clearLog();
          }}
        >
          Очистить
        </button>
        <div className="mr-4 flex w-40 items-center justify-between">
          <Switch
            checked={managerMSSetting.autoScroll}
            onCheckedChange={() =>
              setManagerMSSetting({ ...managerMSSetting, autoScroll: !managerMSSetting.autoScroll })
            }
          />
          Автопрокрутка
        </div>
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
      <MsGetAddressModal
        isOpen={isMsGetAddressOpen}
        onClose={closeMsGetAddressModal}
        onSubmit={() => {
          if (!device) return;
          ManagerMS.getAddress(device.deviceID);
        }}
        onNoRemind={() => {
          setManagerMSSetting({
            ...managerMSSetting,
            hideGetAddressModal: true,
          });
        }}
      ></MsGetAddressModal>
    </section>
  );
};
