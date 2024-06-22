import Websocket from 'isomorphic-ws';

export class SerialMonitor {
  static port: number;
  static host: string;
  static base_address;
  static connection: Websocket | undefined;
  static connecting: boolean = false;
  static timerID: NodeJS.Timeout | undefined;
  // первоначальное значение timeout
  private static initialTimeout: number = 5000;
  private static timeout: number = this.initialTimeout;
  // на сколько мс увеличивается время перед новой попыткой подключения
  private static incTimeout: number = this.initialTimeout;
  /**  
  максимальное количество мс, через которое клиент будет пытаться переподключиться,
  не должно быть негативным числом (поэтому не стоит делать эту переменную зависимой от maxReconnectAttempts)
  */
  static maxTimeout: number = this.incTimeout * 10;
  // true = во время вызова таймера для переключения ничего не будет происходить.
  private static freezeReconnection: boolean = false;
  // true = пытаться переподключиться автоматически
  private static reconnection: boolean = false;

  static autoScroll: boolean;
  static setInputValue: (newInputValue: string) => void;
  static messages: string[];
  static setMessages: (update: (prevMessages: string[]) => string[]) => void;
  static devices: string[];
  static setDevices: (prevPorts: string[]) => void;

  static ws: Websocket;
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

  static async connect(host: string, port: number): Promise<Websocket | undefined> {
    if (this.connecting) return;
    this.connecting = true;
    this.clearTimer();

    this.host = host;
    this.port = port;
    const new_address = this.makeAddress(this.host, this.port);
    // означает, что хост должен смениться
    if (new_address != this.base_address) {
      this.base_address = new_address;
      this.timeout = this.initialTimeout;
    }
    host = this.host;
    port = this.port;
    this.connection?.close();

    try {
      this.ws = new Websocket(this.base_address);
      this.connection = this.ws;
      this.message(undefined);
    } catch (error) {
      this.message(`${error}`);
      this.message('Serial monitor websocket error' + error);
      this.end();
      return;
    }

    this.ws.onopen = () => {
      console.log(`Serial monitor: connected to ${this.host}:${this.port}!`);

      this.connecting = false;
    };

    this.ws.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data as string); // Парсим JSON
        // Если данные - это массив, это список портов
        if (Array.isArray(data)) {
          this.setDevices(data); // Устанавливаем массив строк в devices
        }
      } catch (error) {
        // Если не удалось распарсить JSON, это не список портов
        // Используем данные как сообщение
        this.message(message.data);
      }
    };

    this.ws.onclose = async () => {
      this.message('Сервер отключён. Подключение будет через 5 секунд...');
      // Повторное подключение через некоторое время, например, через 5 секунд
      setTimeout(() => this.connect(host, port), 5000);
    };

    this.ws.onclose = async (event) => {
      if (!event.wasClean) {
        if (this.connecting) {
          this.message(`Не удалось подключиться к серверу ${this.host}:${this.port}.`);
        } else {
          this.message(
            `Соединение с сервером ${this.host}:${this.port} прервано неожиданно, возможно сеть недоступна или произошёл сбой на сервере.`
          );
        }
      }
      if (host == this.host && port == this.port) {
        this.end();
        if (this.reconnection) {
          this.tryToReconnect();
        }
      }
    };

    return this.ws;
  }

  // получение адреса в виде строки
  static makeAddress(host: string, port: number): string {
    return `ws://${host}:${port}/serialmonitor`;
  }

  // безопасное отключение таймера для переподключения
  private static clearTimer() {
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = undefined;
    }
  }

  // действия после закрытии или ошибке соединения
  private static end() {
    this.connecting = false;
    this.connection = undefined;
  }
  /** переподключение к последнему адресу к которому Flasher пытался подключиться*/
  static reconnect() {
    this.connect(this.host, this.port);
  }

  private static tryToReconnect() {
    this.timerID = setTimeout(() => {
      this.message(`${this.base_address} inTimer: ${this.timeout}`);
      if (!this.freezeReconnection) {
        this.timeout = Math.min(this.timeout + this.incTimeout, this.maxTimeout);
        this.reconnect();
      } else {
        this.message('the timer is frozen');
        if (this.timeout == 0) {
          this.timeout = Math.min(this.incTimeout, this.maxTimeout);
          this.tryToReconnect();
        } else {
          this.tryToReconnect();
        }
      }
    }, this.timeout);
  }

  static async send(data: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      this.message('Сервер отключен или не инициализирован.');
    }
  }

  static closeWebSocket() {
    if (this.ws) {
      this.ws.close(); // Закрываем WebSocket, если он существует
    }
  }

  //Функция для формирования сообщения
  static message(message) {
    this.setMessages((prevMessages) => [...prevMessages, message]);
  }
}
