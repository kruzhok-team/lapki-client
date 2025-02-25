/*
Окно загрузчика
*/
import React, { useEffect, useLayoutEffect, useRef } from 'react';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Device } from '@renderer/components/Modules/Device';
import { ClientStatus } from '@renderer/components/Modules/Websocket/ClientStatus';
import { useAddressBook } from '@renderer/hooks/useAddressBook';
import { useModal } from '@renderer/hooks/useModal';
import { useSettings } from '@renderer/hooks/useSettings';
import { useModelContext } from '@renderer/store/ModelContext';
import { useFlasher } from '@renderer/store/useFlasher';
import { useManagerMS } from '@renderer/store/useManagerMS';
import { useTabs } from '@renderer/store/useTabs';
import {
  AddressData,
  FirmwareTargetType,
  FlashTableItem,
  OperationType,
} from '@renderer/types/FlasherTypes';

import { AddressBookModal } from './AddressBook';
import { AddressEntryEditModal } from './AddressEntryModal';
import { DeviceList } from './DeviceList';
import { FlasherTable } from './FlasherTable';
import { MsGetAddressModal } from './MsGetAddressModal';

import { ManagerMS } from '../../Modules/ManagerMS';
import { Switch, WithHint } from '../../UI';

export const FlasherTab: React.FC = () => {
  const modelController = useModelContext();
  const {
    device: deviceMs,
    log,
    address: serverAddress,
    setAddress: setServerAddress,
    metaID,
    compilerData,
  } = useManagerMS();
  const {
    addressBookSetting,
    onEdit,
    getID,
    getEntryById,
    onAdd,
    onRemove,
    onSwapEntries,
    idCounter,
  } = useAddressBook();
  const {
    connectionStatus,
    secondsUntilReconnect,
    flashResult,
    devices,
    flashTableData,
    setFlashTableData,
  } = useFlasher();

  const [managerMSSetting, setManagerMSSetting] = useSettings('managerMS');

  const openTab = useTabs((state) => state.openTab);
  const closeTab = useTabs((state) => state.closeTab);

  const [isAddressBookOpen, openAddressBook, closeAddressBook] = useModal(false);
  const [isMsGetAddressOpen, openMsGetAddressModal, closeMsGetAddressModal] = useModal(false);
  const [isDeviceListOpen, openDeviceList, closeDeviceList] = useModal(false);

  const [isAddressEnrtyEditOpen, openAddressEnrtyEdit, closeAddressEnrtyEdit] = useModal(false); // для редактирования существующих записей в адресной книге
  const addressEntryEditForm = useForm<AddressData>();
  const [isAddressEnrtyAddOpen, openAddressEnrtyAdd, closeAddressEnrtyAdd] = useModal(false); // для добавления новых записей в адресную книгу
  const addressEntryAddForm = useForm<AddressData>();

  const noConnection = connectionStatus !== ClientStatus.CONNECTED;
  const commonOperationDisabled =
    noConnection ||
    flashTableData.find((item) => {
      return item.isSelected;
    }) === undefined;

  const logContainerRef = useRef<HTMLDivElement>(null);

  // При изменении log прокручиваем вниз, если включена автопрокрутка
  useLayoutEffect(() => {
    if (managerMSSetting?.autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [log, managerMSSetting]);

  const addToTable = (item: FlashTableItem) => {
    if (
      flashTableData.find((v) => {
        return v.targetId === item.targetId;
      }) !== undefined
    ) {
      return false;
    }
    setFlashTableData([...flashTableData, item]);
    return true;
  };

  const removeFromTable = (ID: number) => {
    const tableIndex = flashTableData.findIndex((v) => {
      return v.targetId === ID;
    });
    if (tableIndex === -1) return;
    setFlashTableData(flashTableData.toSpliced(tableIndex, 1));
  };

  useEffect(() => {
    if (serverAddress === '' || addressBookSetting === null) return;
    setServerAddress('');
    const index = addressBookSetting.findIndex((v) => {
      return v.address === serverAddress;
    });
    let ID: number | null;
    if (index === -1) {
      onAdd({ name: '', address: serverAddress, type: '', meta: undefined });
      ID = idCounter;
    } else {
      ID = getID(index);
      if (ID === null) {
        ManagerMS.addLog(
          'Ошибка подключения платы! Индекс записи присутствует в таблице, но её ID не удалось определить!'
        );
        return;
      }
    }
    const isAdded = addToTable({
      isFile: false,
      isSelected: true,
      targetId: ID,
      targetType: FirmwareTargetType.tjc_ms,
    });
    if (!isAdded) {
      const entry = getEntryById(ID);
      if (entry === undefined) {
        return;
      }
      ManagerMS.addLog(
        `Устройство ${ManagerMS.displayAddressInfo(entry)} уже было добавлено в таблицу ранее.`
      );
    }
  }, [serverAddress]);

  useEffect(() => {
    if (!metaID || addressBookSetting === null) return;
    const meta = metaID.meta;
    const metaStr = `
- bootloader REF_HW: ${meta.RefBlHw} (${metaID.type})
- bootloader REF_FW: ${meta.RefBlFw}
- bootloader REF_CHIP: ${meta.RefBlChip}
- booloader REF_PROTOCOL: ${meta.RefBlProtocol}
- cybergene REF_FW: ${meta.RefCgFw}
- cybergene REF_HW: ${meta.RefCgHw}
- cybergene REF_PROTOCOL: ${meta.RefCgProtocol}
    `;
    const op = ManagerMS.finishOperation(`Получены метаданные: ${metaStr}`);
    if (op === undefined) {
      return;
    }
    const index = addressBookSetting.findIndex((v) => {
      return v.address === op.addressInfo.address;
    });
    if (index === -1) {
      return;
    }
    const entry = addressBookSetting[index];
    onEdit(
      {
        name: entry.name,
        address: entry.address,
        type: metaID.type,
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
      index
    );
  }, [metaID]);

  useEffect(() => {
    if (deviceMs === undefined) {
      ManagerMS.addLog('Потеряно соединение с устройством.');
      return;
    }
  }, [deviceMs]);

  const handleGetAddressAndMeta = () => {
    if (!deviceMs || !managerMSSetting) return;
    if (!managerMSSetting.hideGetAddressModal) {
      openMsGetAddressModal();
    } else {
      ManagerMS.getAddressAndMeta(deviceMs.deviceID);
    }
  };
  const handleOpenAddressBook = () => {
    openAddressBook();
  };

  const getOpName = (op: OperationType) => {
    switch (op) {
      case OperationType.ping:
        return 'Пинг';
      case OperationType.reset:
        return 'Перезагрузить';
      case OperationType.meta:
        return 'Получить метаданные';
      default:
        throw Error('Неизвестная операция');
    }
  };

  const handleOperation = (op: OperationType) => {
    for (const item of flashTableData) {
      if (item.isSelected) {
        if (item.targetType === FirmwareTargetType.tjc_ms) {
          if (!deviceMs) continue;
          const addr = getEntryById(item.targetId as number);
          if (addr === undefined) {
            continue;
          }
          ManagerMS.addOperation({
            addressInfo: addr,
            deviceId: deviceMs.deviceID,
            type: op,
          });
        } else if (item.targetType === FirmwareTargetType.arduino) {
          const dev = devices.get(item.targetId as string);
          ManagerMS.addLog(
            `${dev ? dev.displayName() : 'Неизвестное устройство'}: операция "${getOpName(
              op
            )}" не поддерживается для этого устройства.`
          );
        } else {
          throw Error('Неизвестный тип устройства');
        }
      }
    }
  };

  const handleSendBin = async () => {
    // TODO: авто-закрытие монитора порта
    // if (
    //   serialMonitorDevice &&
    //   serialMonitorDevice.deviceID == currentDeviceID &&
    //   serialConnectionStatus == SERIAL_MONITOR_CONNECTING //SERIAL_MONITOR_CONNECTED
    // ) {
    //   /*
    //   см. 'flash-open-serial-monitor' в Flasher.ts обработку случая,
    //   когда монитор порта не успевает закрыться перед отправкой запроса на прошивку
    //   */
    //   SerialMonitor.closeMonitor(serialMonitorDevice.deviceID);
    // }
    for (const item of flashTableData) {
      if (!item.isSelected) continue;
      let notFound = false;
      let dev: Device | undefined = undefined;
      let address: AddressData | undefined = undefined;
      let devName: string = '';
      switch (item.targetType) {
        case FirmwareTargetType.arduino: {
          dev = devices.get(item.targetId as string);
          if (!dev) {
            notFound = true;
            break;
          }
          devName = dev.displayName();
          break;
        }
        case FirmwareTargetType.tjc_ms: {
          if (!addressBookSetting) {
            ManagerMS.addLog(
              `${ManagerMS.displayDeviceInfo}: Ошибка! Адресная книга не загрузилась!`
            );
            continue;
          }
          address = getEntryById(item.targetId as number);
          if (!address) {
            notFound = true;
            break;
          }
          if (!deviceMs) {
            ManagerMS.addLog(
              `${ManagerMS.displayAddressInfo(address)}: прошивку начать нельзя, подключите МС-ТЮК.`
            );
            continue;
          }
          dev = deviceMs;
          devName = ManagerMS.displayAddressInfo(address);
          break;
        }
        default: {
          ManagerMS.addLog(`Операция прошивки не поддерживается для выбранного устройства.`);
          continue;
        }
      }

      // значит плата или машина состояний были удалены
      if (notFound) {
        ManagerMS.addLog(
          `Ошибка! Не удаётся найти плату для ${
            item.isFile ? 'файла с прошивкой' : 'машины состояний'
          } (${item.source}). Возможно Вы удалили плату из таблицы или ${
            item.isFile ? 'файл с прошивкой' : 'машину состояний'
          }.`
        );
        continue;
      }
      if (!item.source) {
        ManagerMS.addLog(
          `${devName}: не удалось прошить, так как для этой платы не указана прошивка.`
        );
        continue;
      }
      if (item.isFile) {
        const [binData, errorMessage] = await window.api.fileHandlers.readFile(item.source);
        if (errorMessage !== null) {
          ManagerMS.addLog(
            `Ошибка! Не удалось извлечь данные из файла ${item.source}. Текст ошибки: ${errorMessage}`
          );
          continue;
        }
        if (binData !== null) {
          ManagerMS.binAdd({
            addressInfo: address,
            device: dev!, // проверка осуществляется ранее в этой функции
            verification: managerMSSetting ? managerMSSetting.verification : false,
            binaries: new Blob([binData]),
            isFile: true,
          });
        }
      } else {
        const noBinary = `${devName}: отсутствуют бинарные данные для выбранной машины состояния. Перейдите во вкладку компилятор, чтобы скомпилировать схему.`;
        if (!compilerData) {
          ManagerMS.addLog(noBinary);
          continue;
        }
        const smData = compilerData.state_machines[item.source];
        if (!smData || !smData.binary || smData.binary.length === 0) {
          ManagerMS.addLog(noBinary);
          continue;
        }
        ManagerMS.binAdd({
          addressInfo: address,
          device: dev!, // проверка осуществляется ранее в этой функции
          verification: managerMSSetting ? managerMSSetting.verification : false,
          binaries: smData.binary,
          isFile: false,
        });
      }
    }
    ManagerMS.binStart();
  };

  const handleRemoveDevs = () => {
    const newTable: FlashTableItem[] = [];
    for (const item of flashTableData) {
      if (!item.isSelected) {
        newTable.push(item);
      }
    }
    setFlashTableData(newTable);
  };

  /**
   * Обновление адресной книги после редактирования
   */
  const addressEntryEditSubmitHandle = (data: AddressData) => {
    if (addressBookSetting === null) return;
    // TODO: найти более оптимальный вариант
    const index = addressBookSetting.findIndex((entry) => {
      return entry.address === data.address;
    });
    if (index === -1) return;
    onEdit(data, index);
  };

  const addressEntryAddSubmitHandle = (data: AddressData) => {
    addressEntryAddForm.reset();
    onAdd(data);
  };

  /**
   * Открытие модального окна для редактирования существующей записи в адресной книге
   * @param data данные, которые нужно отредактированть
   */
  const addressEnrtyEdit = (data: AddressData) => {
    addressEntryEditForm.reset(data);
    openAddressEnrtyEdit();
  };

  const serverStatus = () => {
    const prefix = `Статус: ${connectionStatus}`;
    if (secondsUntilReconnect !== null) {
      return `${prefix} (до повторного подключения: ${secondsUntilReconnect} сек.)`;
    }
    return prefix;
  };

  // добавление вкладки с сообщением от программы загрузки прошивки (например от avrdude)
  const handleAddFlashResultTab = () => {
    flashResult.forEach((result, key) => {
      closeTab(key, modelController);
      openTab(modelController, {
        type: 'code',
        name: key,
        code: result.report() ?? '',
        language: 'txt',
      });
    });
  };

  const handleAddDevice = (deviceIds: string[]) => {
    const newFlashTableData: FlashTableItem[] = [];
    for (const devId of deviceIds) {
      const dev = devices.get(devId);
      if (!dev) continue;
      if (dev.isMSDevice()) {
        handleGetAddressAndMeta();
        continue;
      }
      newFlashTableData.push({
        isFile: false,
        isSelected: true,
        targetId: devId,
        targetType: FirmwareTargetType.arduino,
      });
    }
    setFlashTableData(flashTableData.concat(newFlashTableData));
  };

  // добавление вкладки с serial monitor
  // пока клиент может мониторить только один порт
  const handleAddSerialMonitorTab = () => {
    openTab(modelController, {
      type: 'serialMonitor',
      name: 'Монитор порта',
    });
  };

  if (!managerMSSetting) {
    return null;
  }

  return (
    <section className="mr-3 flex h-full flex-col bg-bg-secondary">
      <label className="m-2">{serverStatus()}</label>
      <div className="m-2 flex">
        <button className="btn-primary mr-4" onClick={openDeviceList} disabled={noConnection}>
          Подключить плату
        </button>
        <button className="btn-primary mr-4" onClick={handleOpenAddressBook}>
          Адреса плат МС-ТЮК
        </button>
        <button className="btn-primary mr-4" onClick={handleAddSerialMonitorTab}>
          Монитор порта
        </button>
      </div>
      <div className="m-2">
        <label>Устройства на прошивку</label>
        <FlasherTable addressEnrtyEdit={addressEnrtyEdit} getEntryById={getEntryById} />
      </div>
      <div className="m-2 flex overflow-y-auto">
        <WithHint hint={'Убрать отмеченные платы из таблицы.'}>
          {(hintProps) => (
            <button {...hintProps} className="btn-error mr-6" onClick={handleRemoveDevs}>
              Убрать
            </button>
          )}
        </WithHint>
        <button
          className="btn-primary mr-4"
          onClick={() => handleSendBin()}
          disabled={commonOperationDisabled}
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
          onClick={() => handleOperation(OperationType.ping)}
          disabled={commonOperationDisabled}
        >
          {getOpName(OperationType.ping)}
        </button>
        <button
          className="btn-primary mr-4"
          onClick={() => handleOperation(OperationType.reset)}
          disabled={commonOperationDisabled}
        >
          {getOpName(OperationType.reset)}
        </button>
        <button
          className="btn-primary mr-4"
          onClick={() => handleOperation(OperationType.meta)}
          disabled={commonOperationDisabled}
        >
          {getOpName(OperationType.meta)}
        </button>
      </div>
      <div className="m-2">
        <button
          className="btn-primary"
          onClick={handleAddFlashResultTab}
          disabled={flashResult.size === 0}
        >
          Результаты прошивки
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
        onSubmit={(entryId: number) => {
          const isAdded = addToTable({
            targetId: entryId,
            isFile: false,
            isSelected: true,
            targetType: FirmwareTargetType.tjc_ms,
          });
          if (isAdded) {
            toast.info('Добавлена плата в таблицу прошивок!');
          } else {
            toast.info('Выбранная плата была добавлена в таблицу прошивок ранее');
          }
        }}
        addressBookSetting={addressBookSetting}
        getID={getID}
        onRemove={(index) => {
          const id = getID(index);
          if (id !== null) {
            removeFromTable(id);
          }
          onRemove(index);
        }}
        onSwapEntries={onSwapEntries}
        addressEnrtyEdit={addressEnrtyEdit}
        openAddressEnrtyAdd={openAddressEnrtyAdd}
      />
      <AddressEntryEditModal
        addressBookSetting={addressBookSetting}
        form={addressEntryEditForm}
        isOpen={isAddressEnrtyEditOpen}
        onClose={closeAddressEnrtyEdit}
        onSubmit={addressEntryEditSubmitHandle}
        submitLabel="Сохранить"
        allowAddressEdit={false}
      />
      <AddressEntryEditModal
        addressBookSetting={addressBookSetting}
        form={addressEntryAddForm}
        isOpen={isAddressEnrtyAddOpen}
        onClose={closeAddressEnrtyAdd}
        onSubmit={addressEntryAddSubmitHandle}
        submitLabel="Добавить"
        allowAddressEdit={true}
      />
      <MsGetAddressModal
        isOpen={isMsGetAddressOpen}
        onClose={closeMsGetAddressModal}
        onSubmit={() => {
          if (!deviceMs) return;
          ManagerMS.getAddressAndMeta(deviceMs.deviceID);
        }}
        onNoRemind={() => {
          setManagerMSSetting({
            ...managerMSSetting,
            hideGetAddressModal: true,
          });
        }}
      />
      <DeviceList isOpen={isDeviceListOpen} onClose={closeDeviceList} onSubmit={handleAddDevice} />
    </section>
  );
};
