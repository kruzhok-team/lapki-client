import { useEffect } from 'react';

import { Buffer } from 'buffer';

import { ArduinoDevice, Device, MSDevice } from '@renderer/components/Modules/Device';
import { Flasher } from '@renderer/components/Modules/Flasher';
import { ManagerMS } from '@renderer/components/Modules/ManagerMS';
import {
  SERIAL_MONITOR_CONNECTED,
  SERIAL_MONITOR_NO_CONNECTION,
  SERIAL_MONITOR_NO_SERVER_CONNECTION,
  SerialMonitor,
} from '@renderer/components/Modules/SerialMonitor';
import { ClientStatus } from '@renderer/components/Modules/Websocket/ClientStatus';
import { useFlasher } from '@renderer/store/useFlasher';
import { useManagerMS } from '@renderer/store/useManagerMS';
import { useSerialMonitor } from '@renderer/store/useSerialMonitor';
import {
  AddressData,
  DeviceCommentCode,
  FlashBacktrackMs,
  FlashResult,
  FlashUpdatePort,
  MetaDataID,
  MSAddressAndMeta,
  MSOperationReport,
  SerialRead,
  UpdateDelete,
} from '@renderer/types/FlasherTypes';

import { useSettings } from './useSettings';

export const useFlasherHooks = () => {
  const [flasherSetting, setFlasherSetting] = useSettings('flasher');
  const [monitorSetting] = useSettings('serialmonitor');

  const {
    flasherMessage,
    setFlasherMessage,
    setConnectionStatus,
    setSecondsUntilReconnect,
    setDevices,
    devices,
    setIsFlashing,
    flashResult,
    setFlashResult,
    connectionStatus,
    setErrorMessage,
    setHasAvrdude,
    binaryFolder,
    setBinaryFolder,
  } = useFlasher();

  const {
    device: deviceMS,
    setDevice: setDeviceMS,
    setLog,
    devicesCnt: msDevicesCnt,
    setDevicesCnt: setMsDevicesCnt,
    setAddressAndMeta,
  } = useManagerMS();

  const {
    device: serialMonitorDevice,
    setDevice: setSerialMonitorDevice,
    addDeviceMessage: addSerialDeviceMessage,
    addBytesFromDevice: addBytesFromSerial,
    setConnectionStatus: setSerialConnectionStatus,
    setLog: setSerialLog,
  } = useSerialMonitor();

  // const {
  //   addressBookSetting,
  //   onEdit,
  //   getID,
  //   getEntryById,
  //   onAdd,
  //   onRemove,
  //   onSwapEntries,
  //   idCounter,
  // } = useAddressBook();

  /**
    Добавляет устройство в список устройств

    @param {device} устройство для добавления
  */
  const addDevice = (device: Device) => {
    const newMap = new Map(devices);
    if (device.isMSDevice() && !devices.has(device.deviceID)) {
      setMsDevicesCnt(msDevicesCnt + 1);
      if (!deviceMS) {
        setDeviceMS(device as MSDevice);
      }
    }
    newMap.set(device.deviceID, device);
    setDevices(newMap);
  };

  const deleteDevice = (deviceID: string) => {
    const newMap = new Map(devices);
    newMap.delete(deviceID);
    setDevices(newMap);

    if (serialMonitorDevice && serialMonitorDevice.deviceID === deviceID) {
      setSerialMonitorDevice(undefined);
    }
    const dev = devices.get(deviceID);
    if (dev && dev.isMSDevice()) {
      setMsDevicesCnt(msDevicesCnt - 1);
    }
    if (deviceMS && deviceMS.deviceID === deviceID) {
      if (msDevicesCnt === 2) {
        for (const [, dev] of newMap) {
          if (dev.isMSDevice()) {
            setDeviceMS(dev as MSDevice);
            break;
          }
        }
      } else {
        setDeviceMS(undefined);
      }
    }
  };

  /**
   * обновление порта (сообщение приходит только для {@link ArduinoDevice})
   * @param port сообщение от сервера об обновлении порта
   */
  const updatePort = (port: FlashUpdatePort) => {
    const newMap = new Map(devices);
    const device = newMap.get(port.deviceID) as ArduinoDevice;
    device.portName = port.portName;
    newMap.set(port.deviceID, device);
    setDevices(newMap);
  };

  /**
   * Обработка завершения процесса прошивки
   *
   * Следует вызывать сразу после завершения прошивки
   *
   * Обновляет лог (@var setLog)
   *
   * Обновляет результат прошивки (@var setFlashResult)
   * @param {string} result - описание результата прошивки для пользователя, используется для обновление лога и результата прошивки
   * @param {string | undefined} avrdudeMsg - сообщение от avrdude, undefined - если отсутствует
   * */
  const flashingEnd = (result: string, avrdudeMsg: string | undefined) => {
    setIsFlashing(false);
    let flashResultKey: string = '';
    let addressInfo: AddressData | undefined = undefined;
    if (!Flasher.currentFlashingDevice) {
      flashResultKey = 'Неизвестное устройство';
    } else {
      if (Flasher.currentFlashingDevice.isMSDevice()) {
        const msDev = Flasher.currentFlashingDevice as MSDevice;
        const getName = () => {
          const addressInfo = ManagerMS.getFlashingAddress();
          if (!addressInfo) return 'Неизвестная плата';
          return addressInfo.name ? addressInfo.name : addressInfo.address;
        };
        flashResultKey = `${getName()} - ${msDev.displayName()}`;
        addressInfo = ManagerMS.getFlashingAddress();
        ManagerMS.flashingAddressEndLog(result);
      } else {
        flashResultKey = Flasher.currentFlashingDevice.displayName();
        // TODO: унификация с flashingAddressEndLog?
        ManagerMS.addLog(`${flashResultKey}: ${result}`);
      }
    }
    const flashReport = new FlashResult(
      Flasher.currentFlashingDevice,
      result,
      avrdudeMsg,
      addressInfo
    );
    const newMap = new Map(flashResult);
    newMap.set(flashResultKey, flashReport);
    setFlashResult(newMap);
    Flasher.currentFlashingDevice = undefined;
    ManagerMS.binStart();
  };

  useEffect(() => {
    window.electron.ipcRenderer.invoke('hasAvrdude').then(function (has: boolean) {
      setHasAvrdude(has);
    });
    Flasher.bindReact(
      setErrorMessage,
      setConnectionStatus,
      setSecondsUntilReconnect,
      setFlasherMessage
    );
    SerialMonitor.bindReact(
      addSerialDeviceMessage,
      setSerialMonitorDevice,
      setSerialConnectionStatus,
      setSerialLog
    );
    ManagerMS.bindReact(setDeviceMS, setLog);
    Flasher.initReader(new FileReader());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!flasherSetting) return;
    const { host, port, localPort, type } = flasherSetting;
    const autoReconnect = type === 'remote';
    if (type === 'local' && port !== localPort) {
      setFlasherSetting({ ...flasherSetting, port: localPort }).then(() => {
        Flasher.connect(host, localPort, autoReconnect);
      });
    } else {
      Flasher.connect(host, port, autoReconnect);
    }
  }, [flasherSetting, setFlasherSetting]);

  useEffect(() => {
    setDevices(new Map());
    setMsDevicesCnt(0);
    setDeviceMS(undefined);
    setIsFlashing(false);
    if (connectionStatus !== ClientStatus.CONNECTED) {
      setSerialConnectionStatus(SERIAL_MONITOR_NO_SERVER_CONNECTION);
      setSerialMonitorDevice(undefined);
      ManagerMS.clearQueue();
      if (Flasher.currentFlashingDevice) {
        flashingEnd(
          'Потеряно соединение с сервером. Статус загрузки прошивки неизвестен.',
          undefined
        );
      }
    } else {
      setSerialConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus]);

  useEffect(() => {
    if (flasherMessage === null) return;

    // TODO: заменить на map
    switch (flasherMessage.type) {
      case 'binary-data': {
        if (binaryFolder) {
          // async функция
          ManagerMS.writeBinary(binaryFolder, flasherMessage.payload as Uint8Array);
          Flasher.send('ms-get-firmware-next-block', null);
        } else {
          ManagerMS.flashingAddressLog(
            'Ошибка! Отсутствует папка для сохранения выгруженных прошивок.'
          );
        }
        break;
      }
      case 'flash-next-block': {
        setIsFlashing(true);
        Flasher.sendBlob();
        break;
      }
      // TODO: возможно эта команда более не актуальна, нужно проверить
      case 'flash-not-supported': {
        flashingEnd(
          `Устройство ${flasherMessage.payload} не поддерживается для прошивки в данной версии IDE.`,
          undefined
        );
        break;
      }
      case 'device': {
        const device = new ArduinoDevice(flasherMessage.payload as ArduinoDevice);
        addDevice(device);
        break;
      }
      case 'ms-device': {
        const device = new MSDevice(flasherMessage.payload as MSDevice);
        addDevice(device);
        break;
      }
      case 'blg-mb-device': {
        const device = new Device(flasherMessage.payload as Device, 'blg-mb');
        addDevice(device);
        break;
      }
      case 'device-update-delete': {
        // TODO: нужно что-то сделать, если устройство находится в таблице прошивок
        deleteDevice((flasherMessage.payload as UpdateDelete).deviceID);
        break;
      }
      case 'device-update-port': {
        updatePort(flasherMessage.payload as FlashUpdatePort);
        break;
      }
      case 'unmarshal-err': {
        ManagerMS.addLog('Не удалось прочесть запрос от клиента (возможно, конфликт версий).');
        break;
      }
      case 'flash-done': {
        flashingEnd('Загрузка завершена.', `${flasherMessage.payload}.`);
        break;
      }
      case 'flash-blocked': {
        flashingEnd('Устройство заблокировано другим пользователем для прошивки.', undefined);
        break;
      }
      case 'flash-large-file': {
        flashingEnd(
          'Указанный размер файла превышает максимально допустимый размер файла, установленный сервером.',
          undefined
        );
        break;
      }
      case 'flash-avrdude-error': {
        flashingEnd('Возникла ошибка во время прошивки.', `${flasherMessage.payload}.`);
        break;
      }
      case 'flash-disconnected': {
        flashingEnd(
          'Не удалось выполнить операцию прошивки, так как устройство больше не подключено.',
          undefined
        );
        break;
      }
      case 'flash-wrong-id': {
        flashingEnd(
          'Не удалось выполнить операцию прошивки, так как так устройство не подключено.',
          undefined
        );
        break;
      }
      case 'flash-not-finished': {
        ManagerMS.addLog('Предыдущая операция прошивки ещё не завершена.');
        break;
      }
      // эта ошибка скорее для разработчиков, чем для пользователя, она означает, что-то пошло не так на клиенте (либо на сервере)
      case 'flash-not-started': {
        flashingEnd(
          'Сервер начал получать файл с прошивкой, но процесс загрузки не был инициализирован.',
          undefined
        );
        break;
      }
      case 'incorrect-file-size': {
        flashingEnd(
          'Ошибка! Указанный размер файла меньше 1 байта. Прошивку начать невозможно.',
          undefined
        );
        break;
      }
      case 'file-write-error': {
        flashingEnd(
          'Ошибка! Возникла ошибка при записи блока с бинарными данным. Прошивка прекращена.',
          undefined
        );
        break;
      }
      case 'flash-backtrack-ms': {
        const payload = flasherMessage.payload as FlashBacktrackMs;
        // TODO: пока обратная связь реализована только для МС-ТЮК
        ManagerMS.backtrack(payload);
        break;
      }
      case 'event-not-supported': {
        // TODO: прекращение текущих операций, типа прошивки?
        ManagerMS.addLog('Загрузчик получил неизвестный тип сообщения.');
        break;
      }
      case 'get-list-cooldown': {
        // TODO: отображать в окне с устройствами
        ManagerMS.addLog(
          'Запрос на обновление списка устройств отклонён, потому что он недавно был обновлён.'
        );
        break;
      }
      case 'empty-list': {
        // TODO: отображать в окне с устройствами
        ManagerMS.addLog('Устройства не найдены.');
        break;
      }
      case 'serial-connection-status': {
        const serialStatus = flasherMessage.payload as DeviceCommentCode;
        switch (serialStatus.code) {
          case 0:
            SerialMonitor.addLog('Открыт монитор порта!');
            SerialMonitor.setConnectionStatus(SERIAL_MONITOR_CONNECTED);
            break;
          case 1: {
            const mainMessage = 'Монитор порта закрыт';
            if (serialStatus.comment != '') {
              SerialMonitor.addLog(`${mainMessage}. Текст ошибки: ${serialStatus.comment}`);
            } else {
              SerialMonitor.addLog(`${mainMessage}.`);
            }
            SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
            break;
          }
          case 2:
            SerialMonitor.addLog(`Монитор порта закрыт, так как устройство не подключено.`);
            SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
            break;
          case 3:
            SerialMonitor.addLog(`Нельзя открыть монитор порта для фальшивого устройства.`);
            SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
            break;
          case 4:
            SerialMonitor.addLog(
              `Сервер не смог обработать JSON-сообщение от клиента. Текст ошибки: ${serialStatus.comment}`
            );
            SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
            break;
          case 5:
            SerialMonitor.addLog(
              `Нельзя открыть монитор порта, так как устойство прошивается. Дождитесь окончания прошивки и повторите попытку.`
            );
            SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
            break;
          case 6:
            SerialMonitor.addLog(`Монитор порта открыт другим клиентом.`);
            SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
            break;
          case 7:
            SerialMonitor.addLog(
              `Произошла ошибка чтения данных. Порт закрыт. Текст ошибки: ${serialStatus.comment}`
            );
            SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
            break;
          case 8:
            SerialMonitor.addLog(`Монитор порта закрыт по вашему запросу.`);
            SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
            break;
          case 9:
            SerialMonitor.addLog(
              `Не удалось сменить скорость передачи данных. Соединение прервано. Выберите другую скорость и попробуйте снова.`
            );
            SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
            break;
          case 10:
            SerialMonitor.addLog(
              `Монитор порта заново открыт на скорости ${serialStatus.comment} бод.`
            );
            SerialMonitor.setConnectionStatus(SERIAL_MONITOR_CONNECTED);
            break;
          case 11:
            SerialMonitor.addLog(
              `Не удалось сменить скорость передачи данных из-за ошибки обработки JSON-сообщения. Текст ошибки: ${serialStatus.comment}`
            );
            SerialMonitor.setConnectionStatus(SERIAL_MONITOR_CONNECTED);
            break;
          case 12:
            SerialMonitor.addLog(
              `Нельзя сменить скорость передачи данных, так как монитор порта закрыт.`
            );
            SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
            break;
          case 13:
            SerialMonitor.addLog(
              `Нельзя сменить скорость передачи данных, так как монитор порта открыт другим клиентом.`
            );
            SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
            break;
          case 14:
            SerialMonitor.addLog(
              `Этот монитор порта нельзя закрыть, так как он открыт другим клиентом.`
            );
            SerialMonitor.setConnectionStatus(SERIAL_MONITOR_NO_CONNECTION);
            break;
          case 15:
            SerialMonitor.addLog(`Старая скорость передачи данных совпадает с новой.`);
            SerialMonitor.setConnectionStatus(SERIAL_MONITOR_CONNECTED);
            break;
        }
        break;
      }
      case 'serial-sent-status': {
        const serialStatus = flasherMessage.payload as DeviceCommentCode;
        switch (serialStatus.code) {
          case 0:
            SerialMonitor.addLog('Сообщение доставлено на устройство.');
            break;
          case 1: {
            const mainMessage = 'Сообщение не удалось доставить на устройство';
            if (serialStatus.comment != '') {
              SerialMonitor.addLog(`${mainMessage}. Текст ошибки: ${serialStatus.comment}`);
            } else {
              SerialMonitor.addLog(`${mainMessage}.`);
            }
            break;
          }
          case 2:
            SerialMonitor.addLog(
              `Сообщение не удалось доставить на устройство, так как оно не подключено.`
            );
            break;
          case 3:
            SerialMonitor.addLog(
              `Сообщение не удалось доставить на устройство, так как монитор порта закрыт.`
            );
            break;
          case 4:
            SerialMonitor.addLog(
              `Сообщение не удалось доставить на устройство, из-за ошибки обработки JSON. Текст ошибки: ${serialStatus.comment}`
            );
            break;
          case 5:
            SerialMonitor.addLog(
              `Сообщение не удалось доставить на устройство, так его монитор порта открыт другим клиентом.`
            );
            break;
        }
        break;
      }
      case 'serial-device-read': {
        const serialRead = flasherMessage.payload as SerialRead;
        const buffer = Buffer.from(serialRead.msg, 'base64');
        addBytesFromSerial(buffer);
        switch (monitorSetting?.textMode) {
          case 'text':
            addSerialDeviceMessage(SerialMonitor.toText(buffer));
            break;
          case 'hex':
            addSerialDeviceMessage(SerialMonitor.toHex(buffer));
            break;
        }
        break;
      }
      case 'flash-open-serial-monitor':
        // если не удалось закрыть монитор порта перед прошивкой, то повторяем попытку
        // console.log('flash-open-serial-monitor');
        if (Flasher.currentFlashingDevice) {
          SerialMonitor.closeMonitor(Flasher.currentFlashingDevice.deviceID);
          Flasher.flash(Flasher.currentFlashingDevice);
        } else {
          /*
          если эта ошибка получена и currentFlashingDevice == undefined, то значит что-то пошло не так,
          ведь перед тем как получить эту ошибку клиент должен вызвать функцию flash в которой назначается
          currentFlashingDevice
          */
          flashingEnd(
            'Получена неожиданная ошибка типа "flash-open-serial-monitor", сообщите об этом разработчикам! Эта ошибка означает, что монитор порта не удалось отключить автоматически перед тем, как начать прошивку. Вам придётся самостоятельно отключить монитор порта и повторить попытку прошивки.',
            undefined
          );
        }
        break;
      case 'ms-ping-result':
        {
          const pingResult = flasherMessage.payload as DeviceCommentCode;
          switch (pingResult.code) {
            case 0:
              ManagerMS.finishOperation('Получен ответ устройства на пинг');
              break;
            case 1:
              ManagerMS.finishOperation(
                'Не удалось отправить пинг, так как устройство не подключено.'
              );
              break;
            case 2: {
              const errorText = pingResult.comment;
              const errorLog = 'Возникла ошибка при попытке отправить пинг';
              if (errorText != '') {
                ManagerMS.finishOperation(`${errorLog}. Текст ошибки ${errorText}`);
              } else {
                ManagerMS.finishOperation(`${errorLog}.`);
              }
              break;
            }
            case 3:
              ManagerMS.finishOperation(
                'Не удалось отправить пинг, так как переданное устройство не является МС-ТЮК.'
              );
              break;
            case 4: {
              const errorText = pingResult.comment;
              const errorLog =
                'Не удалось отправить пинг на устройство из-за ошибки обработки JSON';
              if (errorText != '') {
                ManagerMS.finishOperation(`${errorLog}. Текст ошибки: ${errorText}`);
              } else {
                ManagerMS.finishOperation(`${errorLog}.`);
              }
              break;
            }
          }
        }
        break;
      case 'ms-address': {
        // TODO: обновление адресной книги здесь
        const getAddressStatus = flasherMessage.payload as DeviceCommentCode;
        switch (getAddressStatus.code) {
          case 0:
            ManagerMS.addLog(`Получен адрес устройства: ${getAddressStatus.comment}`);
            setAddressAndMeta({
              deviceID: getAddressStatus.deviceID,
              address: getAddressStatus.comment,
            });
            break;
          case 1:
            ManagerMS.addLog('Не удалось получить адрес устройства, так как оно не подключено.');
            break;
          case 2: {
            const errorText = getAddressStatus.comment;
            const errorLog = 'Возникла ошибка при попытке узнать адрес';
            if (errorText != '') {
              ManagerMS.addLog(`${errorLog}. Текст ошибки: ${getAddressStatus.comment}`);
            } else {
              ManagerMS.addLog(`${errorLog}.`);
            }
            break;
          }
          case 3:
            ManagerMS.addLog(
              'Не удалось узнать адрес, так как переданное устройство не является МС-ТЮК.'
            );
            break;
          case 4: {
            const errorText = getAddressStatus.comment;
            const errorLog = 'Не удалось узнать адрес устройства из-за ошибки обработки JSON';
            if (errorText != '') {
              ManagerMS.addLog(`${errorLog}. Текст ошибки: ${errorText}`);
            } else {
              ManagerMS.addLog(`${errorLog}.`);
            }
            break;
          }
        }
        break;
      }
      case 'ms-reset-result': {
        const result = flasherMessage.payload as DeviceCommentCode;
        switch (result.code) {
          case 0:
            ManagerMS.finishOperation(`Выполнена операция перезагрузки.`);
            break;
          case 1:
            ManagerMS.finishOperation(
              'Не удалось выполнить перезагрузка устройства, так как оно не подключено.'
            );
            break;
          case 2: {
            const errorText = result.comment;
            const errorLog = 'Возникла ошибка при попытке перезагрузить устройство';
            if (errorText != '') {
              ManagerMS.finishOperation(`${errorLog}. Текст ошибки: ${result.comment}`);
            } else {
              ManagerMS.finishOperation(`${errorLog}.`);
            }
            break;
          }
          case 3:
            ManagerMS.finishOperation('Переданное устройство для перезагрузки не является МС-ТЮК.');
            break;
          case 4: {
            const errorText = result.comment;
            const errorLog = 'Не удалось перезагрузить устройство из-за ошибки обработки JSON';
            if (errorText != '') {
              ManagerMS.finishOperation(`${errorLog}. Текст ошибки: ${errorText}`);
            } else {
              ManagerMS.finishOperation(`${errorLog}.`);
            }
            break;
          }
        }
        break;
      }
      case 'ms-meta-data': {
        // TODO: обновление адресной книги здесь
        const meta = flasherMessage.payload as MetaDataID;
        setAddressAndMeta({
          deviceID: meta.deviceID,
          meta: meta.meta,
          type: meta.type,
        });
        break;
      }
      case 'ms-meta-data-error': {
        const result = flasherMessage.payload as DeviceCommentCode;
        const comment = result.comment;
        switch (result.code) {
          case 1: {
            const text = 'Не удалось получить метаданные из-за ошибки';
            if (comment) {
              ManagerMS.finishOperation(`${text}. Текст ошибки: ${comment}`);
            } else {
              ManagerMS.finishOperation(`${text}.`);
            }
            break;
          }
          case 2:
            ManagerMS.finishOperation(
              'Не удалось получить метаданные, так как устройство не найдено.'
            );
            break;
          case 3:
            ManagerMS.finishOperation(
              'Не удалось получить метаданные, так как запрашиваемое устройство не является МС-ТЮК.'
            );
            break;
          case 4: {
            const text = 'Не удалось получить метаданные из-за ошибки обработки JSON-сообщения';
            if (comment) {
              ManagerMS.finishOperation(`${text}. Текст ошибки: ${comment}`);
            } else {
              ManagerMS.finishOperation(`${text}.`);
            }
            break;
          }
          default:
            ManagerMS.finishOperation(
              `Не удалось получить метаданные из-за незизвестной ошибки с кодом ${result.code}. ${comment}`
            );
        }
        break;
      }
      case 'ms-address-and-meta': {
        const result = flasherMessage.payload as MSAddressAndMeta;
        switch (result.errorCode) {
          case 0: {
            // TODO: обновление адресной книги здесь
            ManagerMS.addLog(`Получен адрес устройства: ${result.address}`);
            setAddressAndMeta({
              deviceID: result.deviceID,
              meta: result.meta,
              type: result.type,
              address: result.address,
            });
            break;
          }
          case 1: {
            const errorLog = 'Возникла ошибка при попытке узнать адрес';
            if (result.errorMsg != '') {
              ManagerMS.addLog(`${errorLog}. Текст ошибки: ${result.errorMsg}`);
            } else {
              ManagerMS.addLog(`${errorLog}.`);
            }
            break;
          }
          case 2: {
            const prefix = `Получен адрес устройства: ${result.address}. Однако возникла ошибка при попытке узнать тип.`;
            if (result.errorMsg != '') {
              ManagerMS.addLog(`${prefix}. Текст ошибки: ${result.errorMsg}`);
            } else {
              ManagerMS.addLog(`${prefix}.`);
            }
            setAddressAndMeta({
              deviceID: result.deviceID,
              address: result.address,
            });
            break;
          }
          case 3: {
            ManagerMS.addLog(`Не удалось получить адрес устройства, так как оно не подключено.`);
            break;
          }
          case 4: {
            ManagerMS.addLog(
              `Не удалось получить адрес устройства, так как запрашиваемое устройство не является МС-ТЮК.`
            );
            break;
          }
          default: {
            const prefix = `Получена неизвестная ошибка с кодом ${result.errorCode} при попытке узнать адрес устройства`;
            if (result.errorMsg != '') {
              ManagerMS.addLog(`${prefix}. Текст ошибки: ${result.errorMsg}`);
            } else {
              ManagerMS.addLog(`${prefix}.`);
            }
            break;
          }
        }
        break;
      }
      case 'ms-get-firmware-approve': {
        Flasher.send('ms-get-firmware-next-block', null);
        break;
      }
      case 'ms-get-firmware-finish': {
        const result = flasherMessage.payload as MSOperationReport;
        const errorPostfix = result.comment ? ` Текст ошибки ${result.comment}` : '';
        switch (result.code) {
          case 0:
            ManagerMS.flashingAddressEndLog('Выгрузка завершена.');
            break;
          case 1:
            ManagerMS.flashingAddressEndLog(
              'Порт для загрузки не найден. Возможно плата не подключена.'
            );
            break;
          case 2:
            ManagerMS.flashingAddressEndLog(
              'Возникла ошибка при попытке выгрузить прошивку.' + errorPostfix
            );
            break;
          case 3:
            ManagerMS.flashingAddressEndLog(
              'Возникла ошибка при попытке выгрузить прошивку.' + errorPostfix
            );
            break;
          case 4:
            // Этот лог оставлен на всякий случай. Клиент не должен видеть этот лог, так как кнопки для загрузки/выгрузки должны быть заблокированы в этот момент.
            ManagerMS.flashingAddressEndLog(
              'Нельзя начать выгрузку, так как в данный момент IDE занято работой с одним из подключённых устройств.'
            );
            break;
          case 5:
            ManagerMS.flashingAddressEndLog(
              'Нельзя начать выгрузку, так как в данный момент порт устройства занят другим клиентом'
            );
            break;
          case 6:
            ManagerMS.flashingAddressEndLog(
              `Нельзя начать выгрузку, так как указан не верный размер передаваемых блоков с бинарным файлами: ${result.comment}. Сообщите об этой ошибке разработчикам IDE.`
            );
            break;
          case 7:
            // это ещё не реализовано на сервере
            ManagerMS.flashingAddressEndLog(
              `Выгрузка прекращена, так как истекло время ожидания запроса на бинарные данные от клиента. Сообщите об этой ошибке разработчикам IDE.`
            );
            break;
        }
        Flasher.currentFlashingDevice = undefined;
        if (!ManagerMS.getFirmwareStart()) {
          setBinaryFolder(null);
        }
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flasherMessage]);
};
