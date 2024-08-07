import { useLayoutEffect, useRef, useState } from 'react';

import {
  SERIAL_MONITOR_CONNECTED,
  SERIAL_MONITOR_CONNECTING,
  SERIAL_MONITOR_NO_SERVER_CONNECTION,
  SerialMonitor,
} from '@renderer/components/Modules/SerialMonitor';
import { useSerialMonitor } from '@renderer/store/useSerialMonitor';

import { Select, SelectOption, Switch, TextInput } from './UI';

export const SerialMonitorTab: React.FC = () => {
  const {
    autoScroll,
    setAutoScroll,
    inputValue,
    setInputValue,
    deviceMessages,
    setDeviceMessages: setMessages,
    device,
    connectionStatus,
    log,
    setLog,
  } = useSerialMonitor();
  const makeOption = (x) => {
    return { label: x, value: x };
  };
  const [baudRate, setBaudRate] = useState<SelectOption>(makeOption('9600'));
  const baudRateAll = [
    '50',
    '75',
    '110',
    '134',
    '150',
    '200',
    '300',
    '600',
    '750',
    '1200',
    '1800',
    '2400',
    '4800',
    '9600',
    '19200',
    '31250',
    '38400',
    '57600',
    '74880',
    '115200',
    '230400',
    '250000',
    '460800',
    '500000',
    '921600',
    '1000000',
    '1152000',
    '1500000',
    '2000000',
    '2500000',
    '3000000',
    '3500000',
    '4000000',
  ].map(makeOption);

  const deviceMessageContainerRef = useRef<HTMLDivElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // При изменении deviceMessages и log прокручиваем вниз, если включена автопрокрутка
  useLayoutEffect(() => {
    if (autoScroll && deviceMessageContainerRef.current && logContainerRef.current) {
      deviceMessageContainerRef.current.scrollTop = deviceMessageContainerRef.current.scrollHeight;
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [deviceMessages, log, autoScroll]);

  // useLayoutEffect(() => {
  //   if (device && connectionStatus == SERIAL_MONITOR_CONNECTED) {
  //     SerialMonitor.changeBaud(device?.deviceID, Number(baudRate.value));
  //   }
  // }, [baudRate, connectionStatus, device]);

  const handleSend = () => {
    if (inputValue.trim() && device != undefined) {
      // Отправляем сообщение через SerialMonitor
      SerialMonitor.sendMessage(device?.deviceID, inputValue);
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
    if (device === undefined) {
      return 'не выбрано';
    }
    return `${device?.name} (${device?.portName})`;
  };

  const handleConnectionButton = () => {
    if (device == undefined) {
      return;
    }
    if (connectionStatus == SERIAL_MONITOR_CONNECTED) {
      SerialMonitor.closeMonitor(device?.deviceID);
    } else {
      SerialMonitor.openMonitor(device, Number(baudRate.value));
    }
  };

  const handleChangeBaudRate = () => {
    if (device && connectionStatus == SERIAL_MONITOR_CONNECTED) {
      SerialMonitor.changeBaud(device?.deviceID, Number(baudRate.value));
    }
  };

  return (
    <section className="mr-3 flex h-full flex-col bg-bg-secondary">
      <div className="m-2 flex justify-between">{`${handleCurrentDeviceDisplay()} - ${connectionStatus}`}</div>
      <div className="m-2 flex">
        <TextInput
          className="mr-2 max-w-full"
          placeholder="Напишите значение"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
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
          <Switch checked={autoScroll} onCheckedChange={() => setAutoScroll(!autoScroll)} />
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
              value={baudRate}
              placeholder="Выберите скорость передачи..."
              onChange={(option) => {
                if (option) {
                  setBaudRate(option as SelectOption);
                  handleChangeBaudRate();
                }
              }}
              options={baudRateAll}
            />
          </div>
          <div>
            <button
              className="btn-primary"
              onClick={handleConnectionButton}
              disabled={
                connectionStatus == SERIAL_MONITOR_NO_SERVER_CONNECTION ||
                connectionStatus == SERIAL_MONITOR_CONNECTING
              }
            >
              {connectionStatus == SERIAL_MONITOR_CONNECTED ? 'Отключиться' : 'Подключиться'}
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
    </section>
  );
};
