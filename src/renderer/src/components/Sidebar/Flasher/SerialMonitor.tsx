import { useLayoutEffect, useRef, useState } from 'react';

import {
  SERIAL_MONITOR_CONNECTED,
  SERIAL_MONITOR_CONNECTING,
  SERIAL_MONITOR_NO_SERVER_CONNECTION,
  SerialMonitor,
} from '@renderer/components/Modules/SerialMonitor';
import { useModal, useSettings } from '@renderer/hooks';
import { useFlasher } from '@renderer/store/useFlasher';
import { useSerialMonitor } from '@renderer/store/useSerialMonitor';

import { DeviceList } from './DeviceList';

import { Select, Switch, TextInput } from '../../UI';

type LineBreakType = 'LF' | 'CR' | 'CRLF' | 'Без';
// опции выбора символа окончания строки
// при изменение данных здесь, нужно не забыть проверить стандартные настройки (setting.ts)
class LineBreakOptions {
  static LF = {
    label: 'LF' as LineBreakType,
    value: String.fromCharCode(10),
    hint: 'Символ новой строки',
  };
  static CR = {
    label: 'CR' as LineBreakType,
    value: String.fromCharCode(13),
    hint: 'Символ возврата каретки',
  };
  static CRLF = {
    label: 'CRLF' as LineBreakType,
    value: this.CR.value + this.LF.value,
    hint: 'Символы возврата каретки и новой строки',
  };
  static EMPTY = {
    label: 'Без' as LineBreakType,
    value: '',
    hint: 'Без символов окончания строки',
  };
}

export const SerialMonitorTab: React.FC = () => {
  const [monitorSetting, setMonitorSetting] = useSettings('serialmonitor');

  const {
    deviceMessages,
    setDeviceMessages: setMessages,
    device,
    setDevice,
    connectionStatus,
    log,
    setLog,
  } = useSerialMonitor();

  const { devices } = useFlasher();

  const [isDeviceListOpen, openDeviceList, closeDeviceList] = useModal(false);

  const makeOption = (x) => {
    return { label: x, value: x };
  };

  const baudRateAll = [
    50, 75, 110, 134, 150, 200, 300, 600, 750, 1200, 1800, 2400, 4800, 9600, 19200, 31250, 38400,
    57600, 74880, 115200, 230400, 250000, 460800, 500000, 921600, 1000000, 1152000, 1500000,
    2000000, 2500000, 3000000, 3500000, 4000000,
  ].map(makeOption);

  const [inputValue, setInputValue] = useState<string>('');

  const deviceMessageContainerRef = useRef<HTMLDivElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // При изменении deviceMessages и log прокручиваем вниз, если включена автопрокрутка
  useLayoutEffect(() => {
    if (
      monitorSetting?.autoScroll &&
      deviceMessageContainerRef.current &&
      logContainerRef.current
    ) {
      deviceMessageContainerRef.current.scrollTop = deviceMessageContainerRef.current.scrollHeight;
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [deviceMessages, log, monitorSetting]);

  useLayoutEffect(() => {
    if (deviceMessages !== '' && deviceMessages[deviceMessages.length - 1] !== '\n') {
      SerialMonitor.addDeviceMessage('\n');
    }
  }, [device]);

  const handleSend = () => {
    if (inputValue.trim() && device !== undefined && monitorSetting !== null) {
      // Отправляем сообщение через SerialMonitor
      SerialMonitor.sendMessage(
        device?.deviceID,
        inputValue + LineBreakOptions[monitorSetting?.lineBreak].value
      );
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages('');
    setLog(() => []);
  };

  const handleCurrentDeviceDisplay = () => {
    if (connectionStatus === SERIAL_MONITOR_NO_SERVER_CONNECTION) {
      return connectionStatus;
    }
    if (device === undefined) {
      return 'Устройство отсутствует';
    }
    return `${device.displaySerialName()} - ${connectionStatus}`;
  };

  const handleConnectionButton = () => {
    if (device === undefined || monitorSetting === null) {
      return;
    }
    if (connectionStatus === SERIAL_MONITOR_CONNECTED) {
      SerialMonitor.closeMonitor(device?.deviceID);
    } else {
      SerialMonitor.openMonitor(device, Number(monitorSetting.baudRate));
    }
  };

  const settingLineBreak = (newBreakLine: LineBreakType) => {
    if (!monitorSetting) return;
    let settingValue: typeof monitorSetting.lineBreak;
    switch (newBreakLine) {
      case 'Без':
        settingValue = 'EMPTY';
        break;
      default:
        settingValue = newBreakLine;
    }
    setMonitorSetting({
      ...monitorSetting,
      lineBreak: settingValue,
    });
  };

  const settingBaudRate = (newBaudRate: number) => {
    if (!monitorSetting) return;
    setMonitorSetting({
      ...monitorSetting,
      baudRate: newBaudRate,
    });
  };

  if (!monitorSetting) {
    return null;
  }

  const handleAddDevice = (deviceIds: string[]) => {
    if (deviceIds.length === 0) return;

    // поддерживается только выбор одного устройства
    const dev = devices.get(deviceIds[0]);
    if (dev) {
      if (device && connectionStatus === SERIAL_MONITOR_CONNECTED) {
        SerialMonitor.closeMonitor(device.deviceID);
      }
      SerialMonitor.openMonitor(dev, Number(monitorSetting.baudRate));
    }
    setDevice(dev);
  };

  return (
    <section className="mr-3 flex h-full flex-col bg-bg-secondary">
      <div className="m-2 flex justify-between">
        <button
          className="btn-primary"
          onClick={openDeviceList}
          disabled={
            connectionStatus === SERIAL_MONITOR_CONNECTING ||
            connectionStatus === SERIAL_MONITOR_NO_SERVER_CONNECTION
          }
        >
          Выбрать устройство
        </button>
        {`${handleCurrentDeviceDisplay()}`}
      </div>
      <div className="m-2 flex">
        <TextInput
          className="mr-2 max-w-full"
          placeholder="Напишите значение"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="mr-2 w-48">
          <Select
            isSearchable={false}
            value={LineBreakOptions[monitorSetting.lineBreak]}
            placeholder="Выберите конец строки..."
            onChange={(option) => {
              if (option) {
                settingLineBreak(option.label as LineBreakType);
              }
            }}
            options={[
              LineBreakOptions.LF,
              LineBreakOptions.CR,
              LineBreakOptions.CRLF,
              LineBreakOptions.EMPTY,
            ]}
          />
        </div>
        <button
          className="btn-primary"
          onClick={handleSend}
          disabled={connectionStatus != SERIAL_MONITOR_CONNECTED}
        >
          Отправить
        </button>
      </div>
      <div className="m-2 flex justify-between">
        <div className="flex w-40 items-center justify-between">
          <Switch
            checked={monitorSetting.autoScroll}
            onCheckedChange={() => {
              setMonitorSetting({ ...monitorSetting, autoScroll: !monitorSetting.autoScroll });
            }}
          />
          Автопрокрутка
        </div>
        <button className="btn-primary" onClick={handleClear}>
          Очистить
        </button>
        <div className="flex flex-row items-center">
          <div className="mr-2 w-12">{'Бод:'}</div>
          <div className="mr-2 w-48">
            <Select
              isSearchable={false}
              value={makeOption(monitorSetting.baudRate)}
              placeholder="Выберите скорость передачи..."
              onChange={(option) => {
                if (option) {
                  settingBaudRate(Number(option.value));
                  if (device && connectionStatus === SERIAL_MONITOR_CONNECTED) {
                    SerialMonitor.changeBaud(device?.deviceID, Number(option.value));
                  }
                }
              }}
              options={baudRateAll}
              isDisabled={connectionStatus === SERIAL_MONITOR_CONNECTING}
            />
          </div>
          <div>
            <button
              className="btn-primary"
              onClick={handleConnectionButton}
              disabled={
                connectionStatus === SERIAL_MONITOR_NO_SERVER_CONNECTION ||
                connectionStatus === SERIAL_MONITOR_CONNECTING ||
                !device
              }
            >
              {connectionStatus === SERIAL_MONITOR_CONNECTED ? 'Отключиться' : 'Подключиться'}
            </button>
          </div>
        </div>
      </div>
      <div
        className="mx-2 h-full overflow-y-auto whitespace-break-spaces bg-bg-primary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb"
        ref={deviceMessageContainerRef}
      >
        {deviceMessages}
      </div>
      <br></br>
      <hr></hr>
      <br></br>
      <div
        className="mx-2 h-full overflow-y-auto whitespace-break-spaces bg-bg-primary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb"
        ref={logContainerRef}
      >
        {log.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>

      <DeviceList
        isOpen={isDeviceListOpen}
        onClose={closeDeviceList}
        onSubmit={handleAddDevice}
        submitLabel="Выбрать"
      />
    </section>
  );
};
