import { useEffect } from 'react';

import { SerialMonitor } from '@renderer/components/Modules/SerialMonitor';
import { useSerialMonitor } from '@renderer/store/useSerialMonitor';

import { Select, Switch, TextInput } from './UI';

export const SerialMonitorTab: React.FC = () => {
  const { autoScroll, setAutoScroll, inputValue, setInputValue, messages, setMessages } =
    useSerialMonitor();

  console.log(messages);

  useEffect(() => {
    SerialMonitor.bindReact(autoScroll, messages, setMessages, setInputValue);
    SerialMonitor.connect(); // Подключаем WebSocket при монтировании компонента
  }, [autoScroll, messages, setInputValue, setMessages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      SerialMonitor.send(inputValue);
      setInputValue('');
    }
  };

  // Функция для прокрутки вниз при добавлении нового сообщения
  const scrollToBottom = (data) => {
    if (autoScroll) {
      data.scrollTop = data.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom; // Вызываем функцию прокрутки при изменении сообщений
  }, [messages]); // Зависимости: сообщения и автоскролл

  return (
    <section className="flex h-full flex-col bg-bg-secondary">
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
      <div className="mx-2 h-full overflow-y-auto break-words bg-bg-primary">
        {messages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>
      <div className="m-2 flex justify-between">
        <div
          className="flex w-40 items-center justify-between"
          onScroll={(data) => scrollToBottom(data)}
        >
          <Switch checked={autoScroll} onCheckedChange={() => setAutoScroll(!autoScroll)} />
          Автопрокрутка
        </div>
        <div className="flex flex-row">
          <div className="mr-2 w-48">
            <Select isSearchable={false} />
          </div>
          <div className="w-48">
            <Select isSearchable={false} />
          </div>
        </div>
      </div>
    </section>
  );
};
