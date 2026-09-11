/*
Окно загрузчика
*/
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ReactComponent as DeleteIcon } from '@renderer/assets/icons/delete.svg';
import { AvrdudeGuideModal } from '@renderer/components/AvrdudeGuide';
import { Device, MSDevice } from '@renderer/components/Modules/Device';
import { Flasher } from '@renderer/components/Modules/Flasher';
import { ClientStatus } from '@renderer/components/Modules/Websocket/ClientStatus';
import { useAddressBook } from '@renderer/hooks/useAddressBook';
import { useModal } from '@renderer/hooks/useModal';
import { useSettings } from '@renderer/hooks/useSettings';
import { useFlasher } from '@renderer/store/useFlasher';
import { useManagerMS } from '@renderer/store/useManagerMS';
import {
  AddressData,
  FirmwareTargetType,
  FlasherMessage,
  FlashTableItem,
  GetFirmware,
  MetaData,
  MetaDataID,
  MSGetFirmware,
  OperationType,
} from '@renderer/types/FlasherTypes';

import { AddressBookModal } from './AddressBook';
import { AddressEntryEditModal, AddressEntryForm } from './AddressEntryModal';
import { DeviceList } from './DeviceList';
import { FailureActions } from './FailureActions';
import { FlasherTable } from './FlasherTable';
import { MsGetAddressModal } from './MsGetAddressModal';

import { ManagerMS } from '../../Modules/ManagerMS';
import { Checkbox, DropdownMenu, DropdownMenuItem, ScrollArea } from '../../UI';

export const FlasherStatus: React.FC = () => {
  const { connectionStatus, secondsUntilReconnect } = useFlasher();

  return (
    <span className="font-normal">
      <span className="font-medium">Статус: </span>
      <span className="text-primary">{connectionStatus}</span>
      {secondsUntilReconnect !== null && (
        <span> (до повторного подключения: {secondsUntilReconnect} сек.)</span>
      )}
    </span>
  );
};

export const FlasherTab: React.FC = () => {
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
  const { addressBookSetting, onEdit, getID, getEntryById, onAdd, onRemove, idCounter } =
    useAddressBook();
  const {
    connectionStatus,
    flashResult,
    devices,
    flashTableData,
    setFlashTableData,
    hasAvrdude,
    errorMessage,
    setBinaryFolder,
  } = useFlasher();

  const [managerMSSetting, setManagerMSSetting] = useSettings('managerMS');

  const [isAddressBookOpen, openAddressBook, closeAddressBook] = useModal(false);
  const [isMsGetAddressOpen, openMsGetAddressModal, closeMsGetAddressModal] = useModal(false);
  const [isDeviceListOpen, openDeviceList, closeDeviceList] = useModal(false);
  const [isDeviceMsListOpen, openDeviceMsList, closeDeviceMsList] = useModal(false);
  const [isAvrdudeGuideModalOpen, openAvrdudeGuideModal, closeAvrdudeGuideModal] = useModal(false);

  const [isAddressEnrtyEditOpen, openAddressEnrtyEdit, closeAddressEnrtyEdit] = useModal(false); // для редактирования существующих записей в адресной книге
  const addressEntryEditForm = useForm<AddressEntryForm>();
  const [isAddressEnrtyAddOpen, openAddressEnrtyAdd, closeAddressEnrtyAdd] = useModal(false); // для добавления новых записей в адресную книгу
  const addressEntryAddForm = useForm<AddressEntryForm>();

  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActionsMenuOpen) return;

    const closeMenu = (event: MouseEvent) => {
      if (!actionsMenuRef.current?.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    const closeMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsActionsMenuOpen(false);
    };

    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeMenuOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeMenuOnEscape);
    };
  }, [isActionsMenuOpen]);

  const selectedDevicesCount = useMemo(() => {
    return flashTableData.filter((item) => item.isSelected).length;
  }, [flashTableData]);
  const allDevicesSelected =
    flashTableData.length > 0 && selectedDevicesCount === flashTableData.length;
  const noConnection = connectionStatus !== ClientStatus.CONNECTED;
  const commonOperationDisabled =
    noConnection ||
    // TODO: вынести выбранные платы в отдельную константу?
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
    - bootloader REF_HW: ${meta.RefBlHw} (${metaID.type ? metaID.type : 'Неизвестный тип'})
    - bootloader REF_FW: ${meta.RefBlFw}
    - bootloader REF_CHIP: ${meta.RefBlChip}
    - bootloader REF_PROTOCOL: ${meta.RefBlProtocol}
    - bootloader USER_CODE: ${meta.RefBlUserCode}
    - cybergene REF_FW: ${meta.RefCgFw}
    - cybergene REF_HW: ${meta.RefCgHw}
    - cybergene REF_PROTOCOL: ${meta.RefCgProtocol}
        `;
    const op = ManagerMS.finishOperation(`Получены метаданные: ${metaStr}`);
    if (op === undefined) {
      throw Error('undefined операция');
    }
    if (op.addressInfo === undefined) {
      throw Error('undefined адрес');
    }
    const index = addressBookSetting.findIndex((v) => {
      // мы делаем проверку на undefined ранее
      return v.address === op.addressInfo?.address;
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
      extensions: ['bin'],
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
        return 'Сброс';
      case OperationType.meta:
        return 'Метаданные';
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
            device: deviceMs,
            type: op,
          });
        } else {
          const dev = devices.get(item.targetId as string);
          if (!dev) {
            throw Error('Устройства для выполнения операции не найдено!');
          }
          if (dev.isOperationSupported(op)) {
            ManagerMS.addOperation({
              device: dev,
              type: op,
            });
          } else {
            ManagerMS.addLog(
              `${dev.displayName()}: Операция "${getOpName(
                op
              )}" не поддерживается для этого устройства.`
            );
          }
        }
      }
    }
  };

  const handleSendBin = async (doVerify?: boolean, uploadFactory?: boolean) => {
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
          if (doVerify) {
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
      const getSource = async () => {
        if (uploadFactory) {
          const getTypeId = () => {
            if (item.targetType === FirmwareTargetType.dev && dev) {
              return ManagerMS.getDevicePlatform(dev);
            } else if (item.targetType === FirmwareTargetType.tjc_ms && address) {
              return address.type;
            } else {
              return null;
            }
          };
          const typeId = getTypeId();
          if (!typeId) {
            ManagerMS.addLog(
              `${devName}: Не удалось определить тип устройства для загрузки заводской прошивки. Пропускаю его.`
            );
            return null;
          }
          const [valid, path] = await window.api.fileHandlers.getDefaultFirmwarePath(
            typeId,
            dev?.isArduinoDevice() ? 'hex' : 'bin'
          );
          if (!valid) {
            ManagerMS.addLog(
              `${devName}: Загрузка заводской прошивки не поддерживается для данного устройства.`
            );
            return null;
          }
          return path;
        }
        if (!item.source) {
          ManagerMS.addLog(`${devName}: Для этого устройства не указана прошивка. Пропускаю его.`);
          return null;
        }
        return item.source;
      };
      const source = await getSource();
      if (!source) {
        continue;
      }
      if (item.isFile || uploadFactory) {
        const [binData, errorMessage] = await window.api.fileHandlers.readFile(source);
        if (errorMessage !== null) {
          ManagerMS.addLog(
            `${devName}: Ошибка! Не удалось извлечь данные из файла ${source}. Текст ошибки: ${errorMessage}`
          );
          continue;
        }
        if (binData !== null) {
          ManagerMS.binAdd({
            addressInfo: address,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            device: dev!, // проверка осуществляется ранее в этой функции
            verification: doVerify ?? false,
            binaries: new Blob([new Uint8Array(binData)]),
            isFile: true,
          });
        }
      } else {
        const noBinary = `${devName}: данная машина состояний не компилировалась. Чтобы получить данные для прошивки, перейдите на вкладку Компилятор.`;
        if (!compilerData) {
          ManagerMS.addLog(noBinary);
          continue;
        }
        const smData = compilerData.state_machines[source];
        if (!smData || !smData.binary || smData.binary.length === 0) {
          ManagerMS.addLog(noBinary);
          continue;
        }
        ManagerMS.binAdd({
          addressInfo: address,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          device: dev!, // проверка осуществляется ранее в этой функции
          verification: doVerify ?? false,
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
  const addressEntryEditSubmitHandle = (data: AddressEntryForm) => {
    if (addressBookSetting === null) return;
    // TODO: найти более оптимальный вариант
    const index = addressBookSetting.findIndex((entry) => {
      return entry.address === data.address;
    });
    if (index === -1) return;
    const addressData = addressBookSetting[index];
    onEdit({ ...addressData, name: data.name, address: data.address, type: data.type }, index);
  };

  const addressEntryAddSubmitHandle = (data: AddressEntryForm) => {
    addressEntryAddForm.reset();
    onAdd({
      address: data.address,
      name: data.name,
      type: data.type,
      meta: undefined,
    });
  };

  /**
   * Открытие модального окна для редактирования существующей записи в адресной книге
   * @param data данные, которые нужно отредактированть
   */
  const addressEnrtyEdit = (data: AddressData) => {
    addressEntryEditForm.reset({
      ...data,
      addressEditBlock: true,
      typeEditBlock: data.type !== '' && data.type !== undefined,
    });
    openAddressEnrtyEdit();
  };

  const handleAddDevice = (deviceIds: string[]) => {
    for (const devId of deviceIds) {
      const dev = devices.get(devId);
      if (!dev) continue;
      if (dev.isMSDevice()) {
        handleGetAddressAndMeta();
        continue;
      }
      const extensions: string[] = ['bin'];
      if (dev.isArduinoDevice()) {
        extensions.push('hex');
      }
      const isAdded = addToTable({
        targetId: devId,
        isFile: false,
        isSelected: true,
        targetType: FirmwareTargetType.dev,
        extensions: extensions,
      });
      if (!isAdded) {
        ManagerMS.addLog(`${dev.displayName()}: устройство уже было добавлено ранее в таблицу.`);
      }
    }
  };

  const needAvrdude = useMemo(() => {
    if (!flasherSetting?.type || flasherSetting.type === 'remote' || hasAvrdude) return false;
    return flashTableData.some((item) => {
      if (item.targetType !== FirmwareTargetType.dev) {
        return false;
      }
      const dev = devices.get(item.targetId as string);
      if (!dev) return false;
      return dev.isArduinoDevice();
    });
  }, [flashTableData, hasAvrdude, flasherSetting?.type, devices]);

  // вывод сообщения об отсутствии avrdude и кнопка с подсказкой для пользователя
  const avrdudeCheck = () => {
    if (!needAvrdude) return;
    return (
      <button
        type="button"
        className="btn-primary mr-1 border-warning bg-warning p-0 px-2"
        onClick={openAvrdudeGuideModal}
      >
        Программа avrdude не найдена!
      </button>
    );
  };

  const operationButtons = () => {
    const runMenuAction = (action: () => void) => {
      setIsActionsMenuOpen(false);
      action();
    };

    const showUploadLog = () => {
      flashResult.forEach((result) => ManagerMS.addLog(result.report()));
    };

    return (
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="btn-primary h-8 min-w-0 px-3 py-1.5"
          onClick={() => handleSendBin(false)}
          disabled={commonOperationDisabled}
        >
          Прошить
        </button>
        <div ref={actionsMenuRef} className="relative">
          <button
            type="button"
            className="btn-secondary flex h-8 min-w-9 items-center justify-center border-primary px-2 py-1 text-base leading-none text-primary"
            aria-haspopup="menu"
            aria-expanded={isActionsMenuOpen}
            aria-label="Дополнительные действия"
            onClick={() => setIsActionsMenuOpen((isOpen) => !isOpen)}
          >
            …
          </button>
          {isActionsMenuOpen && (
            <DropdownMenu className="absolute left-0 top-[36px] z-30 w-[212px]">
              <DropdownMenuItem
                disabled={flashResult.size === 0}
                onClick={() => runMenuAction(showUploadLog)}
              >
                Журнал загрузки
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={commonOperationDisabled}
                onClick={() => runMenuAction(() => handleSendBin(true))}
              >
                Прошить с проверкой
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={commonOperationDisabled}
                onClick={() => runMenuAction(() => handleOperation(OperationType.ping))}
              >
                Пинг
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={commonOperationDisabled}
                onClick={() => runMenuAction(() => handleOperation(OperationType.reset))}
              >
                Сброс
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={commonOperationDisabled}
                onClick={() => runMenuAction(() => handleOperation(OperationType.meta))}
              >
                Метаданные
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={commonOperationDisabled}
                onClick={() => runMenuAction(handleGetFirmware)}
              >
                Скачать прошивку
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={commonOperationDisabled}
                onClick={() => runMenuAction(() => handleSendBin(false, true))}
              >
                Загрузить заводскую прошивку
              </DropdownMenuItem>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  };

  const handleErrorMessageDisplay = async () => {
    if (!flasherSetting) return;

    let description = 'Неизвестный тип ошибки.';
    if (flasherSetting.type === 'local') {
      try {
        const status = await window.electron.ipcRenderer.invoke(
          'Module:getStatus',
          'lapki-flasher'
        );
        const errorDetails = status.details;

        switch (status.code) {
          // код 0 означает, что не было попытки запустить загрузчик, по-идее такая ошибка не может возникнуть, если только нет какой-то ошибки в коде.
          case 0:
            description = 'Загрузчик не был запущен по неизвестной причине.';
            break;
          // код 1 означает, что загрузчик работает, но соединение с ним не установлено.
          case 1:
            description =
              connectionStatus === ClientStatus.CONNECTION_ERROR
                ? `Локальный загрузчик работает, но он не может подключиться к IDE из-за ошибки.\n${errorMessage}`
                : 'Локальный загрузчик работает, но IDE не может установить с ним соединение.';
            break;
          case 2:
            description = `Локальный загрузчик не смог запуститься из-за ошибки.\n${errorDetails}`;
            break;
          case 3:
            description = 'Прервана работа локального загрузчика.';
            break;
          case 4:
            description = `Платформа ${errorDetails} не поддерживается.`;
            break;
        }
      } catch (error) {
        description = `Не удалось получить описание ошибки.\n${String(error)}`;
      }
    } else {
      description =
        connectionStatus === ClientStatus.CONNECTION_ERROR
          ? `Ошибка соединения.\n${errorMessage}`
          : errorMessage ?? 'Описание ошибки отсутствует.';
    }

    ManagerMS.addLog(description);
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

  const handleGetFirmware = async () => {
    const [isCanceled, directory, error] = await window.api.fileHandlers.createFolder(
      `прошивки-${Date.now()}`
    );
    if (error) {
      ManagerMS.addLog(`Ошибка: ${error}`);
      return;
    }
    if (isCanceled) {
      return;
    }
    const uploadArray: FlasherMessage[] = [];
    const blockSize = 1024;
    for (const item of flashTableData) {
      if (!item.isSelected) continue;
      if (item.targetType !== FirmwareTargetType.tjc_ms) {
        uploadArray.push({
          type: 'get-firmware',
          payload: {
            blockSize: blockSize,
            deviceID: item.targetId as string,
          } as GetFirmware,
        });
        continue;
      }
      const entry = getEntryById(item.targetId as number);
      if (!entry) {
        // Если это произошло, то значит что-то пошло не так на клиенте, такой сценарий не должен быть возможным.
        ManagerMS.addLog(`Ошибка! Не удаётся найти запись с ID ${item.targetId} в адресной книге.`);
        continue;
      }
      if (!deviceMs) {
        ManagerMS.addLog(
          `${ManagerMS.displayAddressInfo(entry)}: подключите центральную плату МС-ТЮК.`
        );
        continue;
      }
      uploadArray.push({
        type: 'ms-get-firmware',
        payload: {
          blockSize: blockSize,
          deviceID: deviceMs.deviceID,
          address: entry.address,
          RefBlChip: entry.meta ? entry.meta.RefBlChip : '',
        } as MSGetFirmware,
      });
      ManagerMS.getFirmwareAdd({
        addressInfo: entry,
        dev: deviceMs,
      });
    }
    if (uploadArray.length > 0) {
      setBinaryFolder(directory);
      Flasher.sendPack(uploadArray);
    }
  };

  if (!managerMSSetting) {
    return null;
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-bg-primary">
      {(errorMessage || needAvrdude) && (
        <div className="mb-3 flex items-center">
          {errorMessage && (
            <FailureActions
              reconnectLabel={displayReconnect()}
              reconnectDisabled={
                flasherSetting?.type === 'local' && connectionStatus === ClientStatus.CONNECTING
              }
              onReconnect={handleReconnect}
              onShowErrorDescription={handleErrorMessageDisplay}
            />
          )}
          {avrdudeCheck()}
        </div>
      )}
      <div className="flex min-h-8 shrink-0 items-center gap-5 overflow-x-auto">
        <button
          type="button"
          className="btn-secondary h-8 min-w-0 whitespace-nowrap border-primary px-3 py-1.5 text-primary"
          onClick={openDeviceList}
          disabled={noConnection}
        >
          Подключить плату
        </button>
        <button
          type="button"
          className="btn-secondary h-8 min-w-0 whitespace-nowrap border-primary px-3 py-1.5 text-primary"
          onClick={openDeviceMsList}
          disabled={noConnection}
          hidden={devicesMsCnt < 2}
        >
          Выбрать МС-ТЮК
        </button>
        <button
          type="button"
          className="min-w-0 whitespace-nowrap px-0 py-1.5 text-primary transition-opacity"
          onClick={handleOpenAddressBook}
        >
          Адресная книга
        </button>
      </div>
      <div className="mt-5 shrink-0">
        <p className="h2-header mb-3">Устройства на прошивку</p>
        <div className="mb-5 flex h-4 items-center gap-3">
          <Checkbox
            checked={allDevicesSelected}
            disabled={flashTableData.length === 0}
            aria-label="Выбрать все устройства"
            onCheckedChange={() =>
              setFlashTableData(
                flashTableData.map((item) => ({ ...item, isSelected: !allDevicesSelected }))
              )
            }
          />
          <button
            type="button"
            className="danger transition-opacity disabled:opacity-30"
            disabled={selectedDevicesCount === 0}
            aria-label="Удалить выбранные устройства"
            onClick={handleRemoveDevs}
          >
            <DeleteIcon className="h-4 w-4" />
          </button>
        </div>
        <FlasherTable addressEnrtyEdit={addressEnrtyEdit} getEntryById={getEntryById} />
      </div>
      <div className="mt-5 shrink-0">{operationButtons()}</div>
      <h2 className="mb-3 mt-6 shrink-0 font-medium text-black">Журнал действий</h2>
      <ScrollArea
        className="min-h-20 flex-1 rounded-lg border border-border-primary bg-bg-primary"
        viewportClassName="whitespace-break-spaces px-3 py-[7px]"
        ref={logContainerRef}
      >
        {log.map((msg, index) => (
          <div key={index} className="select-text">
            {msg}
          </div>
        ))}
      </ScrollArea>
      <AddressBookModal
        isOpen={isAddressBookOpen}
        onClose={closeAddressBook}
        onSubmit={(entryId: number) => {
          const isAdded = addToTable({
            targetId: entryId,
            isFile: false,
            isSelected: true,
            targetType: FirmwareTargetType.tjc_ms,
            extensions: ['bin'],
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
        addressEnrtyEdit={addressEnrtyEdit}
        openAddressEnrtyAdd={openAddressEnrtyAdd}
      />
      <AddressEntryEditModal
        title="Редактирование записи"
        addressBookSetting={addressBookSetting}
        form={addressEntryEditForm}
        isOpen={isAddressEnrtyEditOpen}
        onClose={closeAddressEnrtyEdit}
        onSubmit={addressEntryEditSubmitHandle}
        submitLabel="Сохранить"
      />
      <AddressEntryEditModal
        title="Добавление записи"
        addressBookSetting={addressBookSetting}
        form={addressEntryAddForm}
        isOpen={isAddressEnrtyAddOpen}
        onClose={closeAddressEnrtyAdd}
        onSubmit={addressEntryAddSubmitHandle}
        submitLabel="Добавить"
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
    </section>
  );
};
