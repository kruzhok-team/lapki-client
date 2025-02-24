import { useEffect, useState } from 'react';

import { ArduinoDevice, Device, MSDevice } from '@renderer/components/Modules/Device';
import { Flasher } from '@renderer/components/Modules/Flasher';
import { ManagerMS } from '@renderer/components/Modules/ManagerMS';
import {
  SERIAL_MONITOR_CONNECTED,
  SERIAL_MONITOR_NO_CONNECTION,
  SerialMonitor,
} from '@renderer/components/Modules/SerialMonitor';
import { ClientStatus } from '@renderer/components/Modules/Websocket/ClientStatus';
import { useFlasher } from '@renderer/store/useFlasher';
import { useManagerMS } from '@renderer/store/useManagerMS';
import {
  AddressData,
  DeviceCommentCode,
  FlashBacktrackMs,
  FlasherMessage,
  FlashResult,
  FlashTableItem,
  FlashUpdatePort,
  MetaDataID,
  MSAddressAndMeta,
  SerialRead,
  UpdateDelete,
} from '@renderer/types/FlasherTypes';

import { useAddressBook } from './useAddressBook';
import { useSettings } from './useSettings';

export const useFlasherHooks = () => {
  const [flasherSetting, setFlasherSetting] = useSettings('flasher');
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
  } = useFlasher();

  const { setDevice, setLog, setAddress, setMetaID } = useManagerMS();

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
    newMap.set(device.deviceID, device);
    setDevices(newMap);
  };

  const deleteDevice = (deviceID: string) => {
    const newMap = new Map(devices);
    newMap.delete(deviceID);
    setDevices(newMap);
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
    if (Flasher.currentFlashingDevice instanceof ArduinoDevice) {
      flashResultKey = Flasher.currentFlashingDevice.displayName();
      // TODO: унификация с flashingAddressEndLog?
      ManagerMS.addLog(`${flashResultKey}: ${result}`);
    } else if (Flasher.currentFlashingDevice instanceof MSDevice) {
      const msDev = Flasher.currentFlashingDevice as MSDevice;
      flashResultKey = `${ManagerMS.getFlashingAddress()?.name} - ${msDev.displayName()}`;
      addressInfo = ManagerMS.getFlashingAddress();
      ManagerMS.flashingAddressEndLog(result);
    } else {
      flashResultKey = 'Неизвестное устройство';
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
    // TODO: общая очередь загрузок
    ManagerMS.binStart();
  };

  useEffect(() => {
    Flasher.bindReact(
      setErrorMessage,
      setConnectionStatus,
      setSecondsUntilReconnect,
      setFlasherMessage
    );
    ManagerMS.bindReact(setDevice, setLog, setAddress, setMetaID);
    Flasher.initReader(new FileReader());
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
    setIsFlashing(false);
    if (connectionStatus === ClientStatus.NO_CONNECTION) {
      ManagerMS.clearQueue();
      if (Flasher.currentFlashingDevice) {
        flashingEnd(
          'Потеряно соединение с сервером. Статус загрузки прошивки неизвестен.',
          undefined
        );
      }
    }
  }, [connectionStatus]);

  useEffect(() => {
    if (flasherMessage === null) return;

    // TODO: заменить на map
    switch (flasherMessage.type) {
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
        ManagerMS.setDevice(device); // TODO: временный костыль для тестирования. Убрать потом!
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
      case 'flash-backtrack-ms': {
        const payload = flasherMessage.payload as FlashBacktrackMs;
        // TODO: пока обратная связь реализована только для МС-ТЮК
        ManagerMS.backtrack(payload);
        break;
      }
      case 'event-not-supported': {
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
        SerialMonitor.addDeviceMessage(serialRead.msg);
        break;
      }
      case 'flash-open-serial-monitor':
        // если не удалось закрыть монитор порта перед прошивкой, то повторяем попытку (см. handleFlash из Loader.tsx)
        // обычно монитор порта закрывается с первой попытки и этот код не воспроизводится
        console.log('flash-open-serial-monitor');
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
            ManagerMS.setAddress(getAddressStatus.comment);
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
            ManagerMS.setAddress('');
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
        ManagerMS.setMeta(meta);
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
            ManagerMS.setAddress(result.address);
            ManagerMS.setMeta({
              deviceID: result.deviceID,
              meta: result.meta,
              type: result.type,
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
            ManagerMS.setAddress(result.address);
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
    }
  }, [flasherMessage]);
};
