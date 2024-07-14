import { useLayoutEffect, useRef, useState } from 'react';

import { SerialMonitor } from '@renderer/components/Modules/SerialMonitor';
import { useSerialMonitor } from '@renderer/store/useSerialMonitor';

import { Select, SelectOption, Switch, TextInput } from './UI';

export const SerialMonitorTab: React.FC = () => {
  const { autoScroll, setAutoScroll, inputValue, setInputValue, messages, setMessages, ports } =
    useSerialMonitor();
  //Выбранный порт на данный момент
  const [port, setPort] = useState<SelectOption | null>(null);
  //Список рабочих портов
  const optionsPort: SelectOption[] = ports.map((device) => ({
    value: device,
    label: device,
  }));
  const [baudRate, setBaudRate] = useState<SelectOption | null>({ label: '9600', value: '9600' });
  const baudRateAll = [
    { label: '9600', value: '9600' },
    { label: '19200', value: '19200' },
    { label: '38400', value: '38400' },
    { label: '57600', value: '57600' },
    { label: '115200', value: '115200' },
  ];

  const messageContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (autoScroll && messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  };

  useLayoutEffect(() => {
    // После обновления очищаем значение port
    if (port && !ports.includes(port.value)) {
      setPort(null);
    }
  }, [ports, port]);

  // При изменении messages прокручиваем вниз, если включена автопрокрутка
  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages, autoScroll]);

  useLayoutEffect(() => {
    if (SerialMonitor.ws && SerialMonitor.ws.readyState === WebSocket.OPEN && port && baudRate) {
      SerialMonitor.ws.send(JSON.stringify({ port: port.value, baudRate: baudRate.value }));
    }
  }, [port, baudRate]);

  const handleSend = () => {
    if (inputValue.trim()) {
      // Отправляем сообщение через SerialMonitor
      SerialMonitor.send(JSON.stringify({ command: inputValue }));
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages(() => []);
  };

  return (
    <section className="mr-3 flex h-full flex-col bg-bg-secondary">
      <div className="m-2 flex">
        <TextInput
          className="mr-2 max-w-full"
          placeholder="Напишите значение"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn-primary" onClick={handleSend}>
          Отправить
        </button>
      </div>
      <div className="m-2 flex justify-between">
        <div className="flex w-40 items-center justify-between">
          <Switch checked={autoScroll} onCheckedChange={() => setAutoScroll(!autoScroll)} />
          Автопрокрутка
        </div>
        <div className="flex flex-row items-center">
          <div className="mr-2 w-48">
            <Select
              isSearchable={false}
              value={port}
              placeholder="Выберите порт..."
              onChange={(option) => {
                if (option) {
                  setPort(option as SelectOption);
                }
              }}
              options={optionsPort}
            />
          </div>
          <div className="mr-2 w-48">
            <Select
              isSearchable={false}
              value={baudRate}
              placeholder="Выберите скорость передачи..."
              onChange={(option) => {
                if (option) {
                  setBaudRate(option as SelectOption);
                }
              }}
              options={baudRateAll}
            />
          </div>
          <div>
            <button className="btn-primary" onClick={handleClear}>
              Очистить
            </button>
          </div>
        </div>
      </div>
      <div
        className="mx-2 h-full overflow-y-auto bg-bg-primary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb"
        ref={messageContainerRef}
      >
        {messages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>
    </section>
  );
};
