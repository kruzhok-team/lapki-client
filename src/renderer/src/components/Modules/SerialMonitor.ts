export class SerialMonitor {
  static autoScroll: boolean;
  static setInputValue: (newInputValue: string) => void;
  static messages: string[];
  static setMessages: (update: (prevMessages: string[]) => string[]) => void;
  static devices: string[];
  static setDevices: (prevPorts: string[]) => void;

  static ws: WebSocket | null = null;

  static bindReact(
    autoScroll: boolean,
    setInputValue: (newInputValue: string) => void,
    messages: string[],
    setMessages: (update: (prevMessages: string[]) => string[]) => void,
    devices: string[],
    setDevices: (prevPorts: string[]) => void
  ): void {
    this.autoScroll = autoScroll;
    this.setInputValue = setInputValue;
    this.messages = messages;
    this.setMessages = setMessages;
    this.devices = devices;
    this.setDevices = setDevices;
  }

  static async connect() {
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.ws = new WebSocket('ws://localhost:8080/serialmonitor');

      this.ws.onopen = () => {
        console.log('WebSocket работает!');
      };

      this.ws.onmessage = (message) => {
        try {
          const data = JSON.parse(message.data); // Парсим JSON
          if (Array.isArray(data)) {
            // Если данные - это массив, это список портов
            this.setDevices(data); // Устанавливаем массив строк в devices
            console.log(data);
          }
        } catch (error) {
          // Если не удалось распарсить JSON, это не список портов
          // Используем данные как сообщение
          this.setMessages((prevMessages) => [...prevMessages, message.data]);
        }
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
