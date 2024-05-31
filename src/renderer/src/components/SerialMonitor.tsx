import { useEffect, useState } from 'react';

import { Select, Switch, TextInput } from './UI';

const client = new WebSocket('ws://localhost:8080/ws');

export const SerialMonitor: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  useEffect(() => {
    client.onopen = () => {
      console.log('WebSocket работает!');
    };

    client.onmessage = (message) => {
      setMessages((prevMessages) => [...prevMessages, message.data]);
      if (autoScroll) {
        const messageContainer = document.getElementById('message-container');
        if (messageContainer) {
          messageContainer.scrollTop = messageContainer.scrollHeight;
        }
      }
    };

    return () => {
      client.close();
    };
  }, [autoScroll]);

  const handleSend = () => {
    if (inputValue.trim()) {
      client.send(inputValue);
      setInputValue('');
    }
  };

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
      <div className="mx-2 h-full bg-bg-primary">
        {messages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>
      <div className="m-2 flex justify-between">
        <div className="flex w-40 items-center justify-between">
          <Switch checked={autoScroll} onChange={() => setAutoScroll(!autoScroll)} />
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
