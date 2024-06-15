import { useEffect, useRef, useState } from 'react';

import { SerialMonitor } from '@renderer/components/Modules/SerialMonitor';
import { useSerialMonitor } from '@renderer/store/useSerialMonitor';

import { Select, SelectOption, Switch, TextInput } from './UI';

export const SerialMonitorTab: React.FC = () => {
  const { autoScroll, setAutoScroll, inputValue, setInputValue, messages, setMessages } =
    useSerialMonitor();
  const [port, setPort] = useState<SelectOption | null>({ label: 'COM1', value: 'COM1' });
  const [baudRate, setBaudRate] = useState<SelectOption | null>({ label: '9600', value: '9600' });
  const [bytes, setBytes] = useState<SelectOption | null>({ label: '1024', value: '1024' });

  const messageContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (autoScroll && messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    SerialMonitor.bindReact(autoScroll, messages, setMessages, setInputValue);
    SerialMonitor.connect();

    return () => {
      // Отключаем обработчики событий и закрываем WebSocket при размонтировании компонента
      SerialMonitor.closeWebSocket();
    };
  }, []);

  // При изменении messages прокручиваем вниз, если включена автопрокрутка
  useEffect(() => {
    scrollToBottom();
  }, [messages, autoScroll]);

  useEffect(() => {
    if (
      SerialMonitor.ws &&
      SerialMonitor.ws.readyState === WebSocket.OPEN &&
      port &&
      baudRate &&
      bytes
    ) {
      SerialMonitor.ws.send(
        JSON.stringify({ port: port.value, baudRate: baudRate.value, bytes: bytes.value })
      );
    }
  }, [port, baudRate, bytes]);

  const handleSend = () => {
    if (inputValue.trim()) {
      // Отправляем сообщение через SerialMonitor
      SerialMonitor.send(JSON.stringify({ command: inputValue }));
      setInputValue('');
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
              onChange={(option) => {
                if (option) {
                  setPort(option as SelectOption);
                }
              }}
              options={[
                { label: 'COM1', value: 'COM1' },
                { label: 'COM2', value: 'COM2' },
                { label: 'COM3', value: 'COM3' },
                { label: 'COM4', value: 'COM4' },
                { label: 'COM5', value: 'COM5' },
                { label: 'COM6', value: 'COM6' },
                { label: 'COM7', value: 'COM7' },
                { label: 'COM8', value: 'COM8' },
                { label: 'COM9', value: 'COM9' },
              ]}
            />
          </div>
          <div className="mr-2 w-48">
            <Select
              isSearchable={false}
              value={baudRate}
              onChange={(option) => {
                if (option) {
                  setBaudRate(option as SelectOption);
                }
              }}
              options={[
                { label: '9600', value: '9600' },
                { label: '19200', value: '19200' },
                { label: '38400', value: '38400' },
                { label: '57600', value: '57600' },
                { label: '115200', value: '115200' },
              ]}
            />
          </div>
          <div className="mr-2 w-48">
            <Select
              isSearchable={false}
              value={bytes}
              onChange={(option) => {
                if (option) {
                  setBytes(option as SelectOption);
                }
              }}
              options={[
                { label: '64', value: '64' },
                { label: '128', value: '128' },
                { label: '256', value: '256' },
                { label: '512', value: '512' },
                { label: '1024', value: '1024' },
              ]}
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
