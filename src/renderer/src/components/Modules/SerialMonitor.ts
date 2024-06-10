export class SerialMonitor {
  static autoScroll: boolean;
  static messages: string[];
  static setMessages: (newConnectionStatus: string[]) => void;
  static setInputValue: (newInputValue: string) => void;
  static ws: WebSocket;

  static bindReact(
    autoScroll: boolean,
    messages: string[],
    setMessages: (newMessages: string[]) => void,
    setInputValue: (newInputValue: string) => void
  ): void {
    this.autoScroll = autoScroll;
    this.messages = messages;
    this.setMessages = setMessages;
    this.setInputValue = setInputValue;
  }

  /** 
   подключение к заданному хосту и порту, если оба параметра не заданы, то идёт подключение к локальному хосту, если только один из параметров задан, то меняется только тот параметр, что был задан.
  */
  static async connect() {
    this.ws = new WebSocket('ws://localhost:8080/ws');

    this.ws.onopen = () => {
      console.log('WebSocket работает!');
      this.ws.onmessage = (message) => {
        this.setMessages([...this.messages, message.data]); // Обновляем сообщения
        if (this.autoScroll) {
          const messageContainer = document.getElementById('message-container');
          if (messageContainer) {
            messageContainer.scrollTop = messageContainer.scrollHeight;
          }
        }
      };
    };

    this.ws.onclose = async () => {
      this.ws.close();
    };

    return this.ws;
  }

  static async send(data: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      console.error('WebSocket не открыт или не инициализирован.');
    }
  }
}
