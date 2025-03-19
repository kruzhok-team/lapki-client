/*
Окно загрузчика
*/
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ReactComponent as QuestionMark } from '@renderer/assets/icons/question-mark.svg';
import { AvrdudeGuideModal } from '@renderer/components/AvrdudeGuide';
import { ErrorModal, ErrorModalData } from '@renderer/components/ErrorModal';
import { Device, MSDevice } from '@renderer/components/Modules/Device';
import { Flasher } from '@renderer/components/Modules/Flasher';
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
  MetaData,
  MetaDataID,
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
  const [flasherSetting] = useSettings('flasher');
  const {
    device: deviceMs,
    setDevice: setDeviceMs,
    log,
    compilerData,
    devicesCnt: devicesMsCnt,
    addressAndMeta,
    setAddressAndMeta,
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
    hasAvrdude,
    errorMessage,
  } = useFlasher();

  const [managerMSSetting, setManagerMSSetting] = useSettings('managerMS');

  const openTab = useTabs((state) => state.openTab);
  const closeTab = useTabs((state) => state.closeTab);

  const [isAddressBookOpen, openAddressBook, closeAddressBook] = useModal(false);
  const [isMsGetAddressOpen, openMsGetAddressModal, closeMsGetAddressModal] = useModal(false);
  const [isDeviceListOpen, openDeviceList, closeDeviceList] = useModal(false);
  const [isDeviceMsListOpen, openDeviceMsList, closeDeviceMsList] = useModal(false);
  const [isAvrdudeGuideModalOpen, openAvrdudeGuideModal, closeAvrdudeGuideModal] = useModal(false);

  const [isAddressEnrtyEditOpen, openAddressEnrtyEdit, closeAddressEnrtyEdit] = useModal(false); // для редактирования существующих записей в адресной книге
  const addressEntryEditForm = useForm<AddressData>();
  const [isAddressEnrtyAddOpen, openAddressEnrtyAdd, closeAddressEnrtyAdd] = useModal(false); // для добавления новых записей в адресную книгу
  const addressEntryAddForm = useForm<AddressData>();

  const [msgModalData, setMsgModalData] = useState<ErrorModalData>();
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const closeMsgModal = () => setIsMsgModalOpen(false);
  const openMsgModal = (data: ErrorModalData) => {
    setMsgModalData(data);
    setIsMsgModalOpen(true);
  };

  const noConnection = connectionStatus !== ClientStatus.CONNECTED;
  const commonOperationDisabled =
    noConnection ||
    flashTableData.find((item) => {
      return item.isSelected;
    }) === undefined;

  const deviceMsList = () => {
    if (devicesMsCnt < 2) return null;
    const devs = new Map();
    for (const [id, dev] of devices) {
      if (dev.isMSDevice()) {
        devs.set(id, dev);
        if (devs.size === devicesMsCnt) {
          break;
        }
      }
    }
    return (
      <DeviceList
        isOpen={isDeviceMsListOpen}
        onClose={closeDeviceMsList}
        onSubmit={(deviceIds) => {
          if (deviceIds.length === 0) return;
          const dev = devices.get(deviceIds[0]);
          if (!dev) return;
          setDeviceMs(dev as MSDevice);
        }}
        submitLabel="Выбрать"
        devices={devs}
        listExtraLabel={`Выбранное устройство: ${deviceMs ? deviceMs.displayName() : 'не указано'}`}
      />
    );
  };

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

  const handleGetMeta = (metaID: MetaDataID) => {
    if (addressBookSetting === null) return;
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
    const enrty = addressBookSetting[index];
    onEdit(
      {
        ...enrty,
        meta: meta,
        type: metaID.type,
      },
      index
    );
  };

  const handleGetAddress = (address: string, meta?: MetaData, type?: string) => {
    if (addressBookSetting === null) return;
    const index = addressBookSetting.findIndex((v) => {
      return v.address === address;
    });
    let ID: number | null;
    if (index === -1) {
      onAdd({
        address: address,
        meta: meta,
        name: '',
        type: type ?? '',
      });
      ID = idCounter;
    } else {
      ID = getID(index);
      if (ID === null) {
        ManagerMS.addLog(
          'Ошибка подключения платы! Индекс записи присутствует в таблице, но её ID не удалось определить!'
        );
        return;
      }
      if (meta || type) {
        const entry = addressBookSetting[index];
        onEdit(
          {
            ...entry,
            meta: meta,
            type: type ?? '',
          },
          index
        );
      }
    }
    const isAdded = addToTable({
      isFile: false,
      isSelected: true,
      targetId: ID,
      targetType: FirmwareTargetType.tjc_ms,
    });
    if (!isAdded && index !== -1) {
      ManagerMS.addLog(
        `Устройство ${ManagerMS.displayAddressInfo(
          addressBookSetting[index]
        )} уже было добавлено в таблицу ранее.`
      );
    }
  };

  useEffect(() => {
    if (addressAndMeta === undefined || addressBookSetting === null) return;
    setAddressAndMeta(undefined);
    if (addressAndMeta.address) {
      handleGetAddress(addressAndMeta.address, addressAndMeta.meta, addressAndMeta.type);
    } else if (addressAndMeta.meta) {
      handleGetMeta({
        deviceID: addressAndMeta.deviceID,
        meta: addressAndMeta.meta,
        type: addressAndMeta.type ?? '',
      });
    } else {
      ManagerMS.addLog('Ошибка получения адреса или метаданных!');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressAndMeta, addressBookSetting, setAddressAndMeta]);

  useEffect(() => {
    setFlashTableData(
      flashTableData.filter((item) => {
        switch (item.targetType) {
          case FirmwareTargetType.dev:
            return devices.has(item.targetId as string);
          default:
            return true;
        }
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices]);

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
          const addr = getEntryById(item.targetId as number);
          if (addr === undefined) {
            ManagerMS.addLog('Ошибка! Не удалось найти адрес в адресной книге.');
            continue;
          }
          if (!deviceMs) {
            if (devicesMsCnt > 0) {
              ManagerMS.addLog(
                `${ManagerMS.displayAddressInfo(
                  addr
                )}: выберите МС-ТЮК через соответствующую кнопку.`
              );
            } else {
              ManagerMS.addLog(
                `${ManagerMS.displayAddressInfo(
                  addr
                )}: МС-ТЮК не найден. Подключите центральную плату МС-ТЮК.`
              );
            }
            continue;
          }
          ManagerMS.addOperation({
            addressInfo: addr,
            deviceId: deviceMs.deviceID,
            type: op,
          });
        } else if (item.targetType === FirmwareTargetType.dev) {
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
    for (const item of flashTableData) {
      if (!item.isSelected) continue;
      let notFound = false;
      let dev: Device | undefined = undefined;
      let address: AddressData | undefined = undefined;
      let devName: string = '';
      switch (item.targetType) {
        case FirmwareTargetType.dev: {
          dev = devices.get(item.targetId as string);
          if (!dev) {
            notFound = true;
            break;
          }
          devName = dev.displayName();
          if (managerMSSetting?.verification) {
            ManagerMS.addLog(
              `${devName}: верификация прошивки для данного устройства не поддерживается.`
            );
          }
          break;
        }
        case FirmwareTargetType.tjc_ms: {
          if (!addressBookSetting) {
            ManagerMS.addLog(`Ошибка! Адресная книга не загрузилась!`);
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
          `${devName}: прошивка пропущена, так как для этой платы не указана прошивка.`
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
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            device: dev!, // проверка осуществляется ранее в этой функции
            verification: managerMSSetting ? managerMSSetting.verification : false,
            binaries: new Blob([binData]),
            isFile: true,
          });
        }
      } else {
        const noBinary = `${devName}: данная машина состояний не компилировалась. Чтобы получить данные для прошивки, перейдите на вкладку Компилятор.`;
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
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
    for (const devId of deviceIds) {
      const dev = devices.get(devId);
      if (!dev) continue;
      if (dev.isMSDevice()) {
        handleGetAddressAndMeta();
        continue;
      }
      if (dev.isArduinoDevice()) {
        const isAdded = addToTable({
          targetId: devId,
          isFile: false,
          isSelected: true,
          targetType: FirmwareTargetType.dev,
        });
        if (!isAdded) {
          ManagerMS.addLog(`${dev.displayName()}: устройство уже было добавлено ранее в таблицу.`);
        }
      } else {
        throw Error('Неизвестный тип устройства!');
      }
    }
  };

  // добавление вкладки с serial monitor
  // пока клиент может мониторить только один порт
  const handleAddSerialMonitorTab = () => {
    openTab(modelController, {
      type: 'serialMonitor',
      name: 'Монитор порта',
    });
  };

  const needAvrdude = useMemo(() => {
    if (!flasherSetting?.type || flasherSetting.type === 'remote' || hasAvrdude) return false;
    return flashTableData.some((item) => item.targetType === FirmwareTargetType.dev);
  }, [flashTableData, hasAvrdude, flasherSetting?.type]);

  // вывод сообщения об отсутствии avrdude и кнопка с подсказкой для пользователя
  const avrdudeCheck = () => {
    if (!needAvrdude) return;
    return (
      <button
        type="button"
        className="btn-primary mr-4 border-warning bg-warning"
        onClick={openAvrdudeGuideModal}
      >
        Программа avrdude не найдена!
      </button>
    );
  };

  const handleErrorMessageDisplay = async () => {
    if (!flasherSetting) return;
    // выводимое для пользователя сообщение
    let errorMsg: JSX.Element = <p>`Неизвестный тип ошибки`</p>;
    if (flasherSetting.type === 'local') {
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
                      {errorMessage}
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
            {errorMessage}
          </p>
        );
      } else {
        errorMsg = <p>{errorMessage}</p>;
      }
    }
    const msg: ErrorModalData = {
      text: errorMsg,
      caption: 'Ошибка',
    };
    openMsgModal(msg);
  };

  const handleReconnect = async () => {
    if (!flasherSetting) return;

    if (connectionStatus === ClientStatus.CONNECTING) {
      Flasher.cancelConnection();
      return;
    }

    if (flasherSetting.type === 'local') {
      await window.electron.ipcRenderer.invoke('Module:reboot', 'lapki-flasher');
    } else {
      Flasher.reconnect();
    }
  };

  const displayReconnect = () => {
    if (!flasherSetting) return;

    if (flasherSetting.type !== 'local' && connectionStatus === ClientStatus.CONNECTING) {
      return 'Отменить подключение';
    }
    if (flasherSetting.type === 'local') {
      return 'Перезапустить';
    } else {
      return 'Переподключиться';
    }
  };

  if (!managerMSSetting) {
    return null;
  }

  return (
    <section className="mr-3 flex h-full flex-col overflow-auto bg-bg-secondary">
      <label className="m-2">{serverStatus()}</label>
      <div className="m-2" hidden={errorMessage ? false : true}>
        <button
          className="btn-primary mr-4"
          onClick={handleReconnect}
          disabled={
            flasherSetting?.type === 'local' && connectionStatus === ClientStatus.CONNECTING
          }
        >
          {displayReconnect()}
        </button>
        <button
          className="btn-primary border-warning bg-warning"
          onClick={handleErrorMessageDisplay}
        >
          Описание ошибки
        </button>
      </div>
      <div className="m-2 flex">
        <button className="btn-primary mr-4" onClick={openDeviceList} disabled={noConnection}>
          Подключить плату
        </button>
        <button
          className="btn-primary mr-4"
          onClick={openDeviceMsList}
          disabled={noConnection}
          hidden={devicesMsCnt < 2}
        >
          Выбрать МС-ТЮК
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
      <div className="m-2 flex">
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
        <div className="mr-4 flex items-center justify-between gap-1">
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
          <WithHint
            hint={
              'Дополнительная проверка целостности загруженной прошивки. Увеличивает общее время загрузки.'
            }
          >
            {(hintProps) => (
              <div className="shrink-0" {...hintProps}>
                <QuestionMark className="h-5 w-5" />
              </div>
            )}
          </WithHint>
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
          className="btn-primary mr-4"
          onClick={handleAddFlashResultTab}
          disabled={flashResult.size === 0}
        >
          Результаты прошивки
        </button>
        {avrdudeCheck()}
      </div>
      <div className="m-2">Журнал действий</div>
      <div
        className="mx-2 min-h-20 overflow-y-auto whitespace-break-spaces bg-bg-primary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb"
        ref={logContainerRef}
      >
        {log.map((msg, index) => (
          <div key={index} className="select-text">
            {msg}
          </div>
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
      <DeviceList
        isOpen={isDeviceListOpen}
        onClose={closeDeviceList}
        onSubmit={handleAddDevice}
        submitLabel="Добавить"
        devices={devices}
      />
      {deviceMsList()}
      <AvrdudeGuideModal isOpen={isAvrdudeGuideModalOpen} onClose={closeAvrdudeGuideModal} />
      <ErrorModal isOpen={isMsgModalOpen} data={msgModalData} onClose={closeMsgModal} />
    </section>
  );
};
