export class SerialMonitor {
  static autoScroll: boolean;
  static messages: string[];
  static setMessages: (update: (prevMessages: string[]) => string[]) => void;
  static setInputValue: (newInputValue: string) => void;
  static ws: WebSocket | null = null;

  static bindReact(
    autoScroll: boolean,
    messages: string[],
    setMessages: (update: (prevMessages: string[]) => string[]) => void,
    setInputValue: (newInputValue: string) => void
  ): void {
    this.autoScroll = autoScroll;
    this.messages = messages;
    this.setMessages = setMessages;
    this.setInputValue = setInputValue;
  }

  static async connect() {
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.ws = new WebSocket('ws://localhost:8080/serialmonitor');

      this.ws.onopen = () => {
        console.log('WebSocket работает!');
      };

      this.ws.onmessage = (message) => {
        // Используем функцию обратного вызова для обновления сообщений
        this.setMessages((prevMessages) => [...prevMessages, message.data]);

        //this.setMessages([...this.messages, message.data]); // Обновляем сообщения
      };

      this.ws.onclose = async () => {
        console.log('WebSocket закрыт. Повторное подключение будет через несколько секунд...');
        // Повторное подключение через некоторое время, например, через 5 секунд
        setTimeout(() => this.connect(), 5000);
      };
    }

    return this.ws;
  }

  static async send(data: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      console.error('WebSocket не открыт или не инициализирован.');
    }
  }

  static closeWebSocket() {
    if (this.ws) {
      this.ws.close(); // Закрываем WebSocket, если он существует
    }
  }
}
