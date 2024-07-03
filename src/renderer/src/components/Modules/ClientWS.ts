import Websocket from 'isomorphic-ws';

class ReconnectTimer {
  private timerID: NodeJS.Timeout | undefined;
  // первоначальное значение timeout (в мс)
  private initialTimeout: number = 5000;
  // на сколько мс увеличивается время перед новой попыткой подключения
  private incTimeout: number = this.initialTimeout;
  /**  
    максимальное количество автоматических попыток переподключения,
    значение меньше нуля означает, что ограничения на попытки отсутствует
  */
  private maxReconnectAttempts: number = 3;
  // количество совершённых попыток переподключения, сбрасывается при удачном подключении или при смене хоста
  private curReconnectAttemps: number = 0;
  /**  
  максимальное количество мс, через которое клиент будет пытаться переподключиться,
  не должно быть негативным числом (поэтому не стоит делать эту переменную зависимой от maxReconnectAttempts)
  */
  private maxTimeout: number = this.incTimeout * 10;
  private curTimeout: number = this.initialTimeout;
  private freezeReconnection: boolean = false;
  // true = пытаться переподключиться автоматически
  private autoReconnect: boolean = false;
  // true = соединение было отменено пользователем и переподключаться не нунжо.
  private connectionCanceled: boolean = false;

  constructor(
    initialTimeout: number = 5000,
    incTimeout: number = 5000,
    maxReconnectAttempts: number = 3,
    maxTimeout: number = 50000,
    autoReconnect: boolean = true
  ) {
    this.initialTimeout = initialTimeout;
    this.curTimeout = initialTimeout;
    this.maxTimeout = maxTimeout;
    this.incTimeout = incTimeout;

    this.maxReconnectAttempts = maxReconnectAttempts;
    this.curReconnectAttemps = 0;

    this.autoReconnect = autoReconnect;
    this.freezeReconnection = false;
    this.connectionCanceled = false;
  }

  setTimerID(timerID: NodeJS.Timeout | undefined) {
    this.timerID = timerID;
  }

  setReconnection(reconnection: boolean) {
    this.autoReconnect = reconnection;
  }

  cancelConnection() {
    this.connectionCanceled = true;
    this.curReconnectAttemps = 0;
    this.clearTimer();
  }

  private clearTimer() {
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = undefined;
    }
  }

  reset(autoReconnect: boolean = true) {
    this.clearTimer();

    this.curTimeout = this.initialTimeout;
    this.curReconnectAttemps = 0;

    this.autoReconnect = autoReconnect;
    this.freezeReconnection = false;
    this.connectionCanceled = false;
  }

  freeze(freeze: boolean) {
    this.freezeReconnection = freeze;
  }

  autoReconnectSet(autoReconnect: boolean) {
    this.autoReconnect = autoReconnect;
  }

  IsAutoReconnect(): boolean {
    return this.autoReconnect;
  }

  incReconnectAttempt() {
    this.curReconnectAttemps = Math.max(this.curReconnectAttemps + 1, this.maxReconnectAttempts);
  }

  // переподключение по таймеру
  tryToReconnect(reconnectFunction: () => void) {
    if (
      this.connectionCanceled ||
      (this.maxReconnectAttempts >= 0 && this.curReconnectAttemps >= this.maxReconnectAttempts)
    ) {
      return;
    }
    this.timerID = setTimeout(() => {
      console.log(`inTimer: ${this.curTimeout}`);
      if (!this.freezeReconnection) {
        this.curTimeout = Math.min(this.curTimeout + this.incTimeout, this.maxTimeout);
        this.curReconnectAttemps++;
        reconnectFunction();
      } else {
        console.log('the timer is frozen');
        if (this.curTimeout == 0) {
          this.curTimeout = Math.min(this.incTimeout, this.maxTimeout);
          this.tryToReconnect(reconnectFunction);
        } else {
          this.tryToReconnect(reconnectFunction);
        }
      }
    }, this.curTimeout);
  }
}

class ClientStatus {
  static CONNECTING: string = 'Идет подключение...';
  static CONNECTED: string = 'Подключен';
  static NO_CONNECTION: string = 'Не подключен';
  static CONNECTION_ERROR = 'Ошибка при попытке подключиться';
}

export abstract class ClientWS {
  static port: number;
  static host: string;
  // соединение с удалённым сервером, если оно отсутстует, то undefined
  static connection: Websocket | undefined;
  // true - в данный момент идёт подключение
  // static connecting: boolean = false;
  static reconnectTimer: ReconnectTimer = new ReconnectTimer();

  static setConnectionStatus: (newConnectionStatus: string) => void;

  static bindReact(setConnectionStatus: (newConnectionStatus: string) => void): void {
    this.setConnectionStatus = setConnectionStatus;
  }

  static checkConnection(): boolean {
    return this.connection !== undefined;
  }

  /**
   * переподключение к последнему адресом к которому клиент пытался подключиться
   */
  static reconnect() {
    this.reconnectTimer.incReconnectAttempt();
    this.connect(this.host, this.port);
  }

  /**
   * подключение к заданному хосту и порту, отключается от предыдущего адреса
   */
  static async connect(host: string, port: number): Promise<Websocket | undefined> {
    // чтобы предовратить повторное соединение
    if (this.connection && this.connection.CONNECTING) return;
    // проверяем, что адрес является новым
    if (this.host != host || this.port != port) {
      this.reconnectTimer.reset();
      // проверяем, что не идёт переподключения к текущему соединению
    } else if (this.connection && this.connection.OPEN) {
      return;
    }
    this.setConnectionStatus(ClientStatus.CONNECTING);
    /*
      перед отключением нужно глобально поменять значения хоста и порта, 
      чтобы клиент не пытался подключиться обратно
    */
    this.host = host;
    this.port = port;
    this.connection?.close();

    let ws: Websocket;
    try {
      ws = new Websocket(this.makeAddress(host, port));
      this.connection = ws;
    } catch (error) {
      this.errorHandler(error);
      return;
    }

    ws.onopen = () => {
      this.reconnectTimer.reset();
      console.log(`Client: connected to ${this.host}:${this.port}!`);
      this.setConnectionStatus(ClientStatus.CONNECTED);

      ws.onmessage = (msg: Websocket.MessageEvent) => {
        this.messageHandler(msg);
      };
    };

    ws.onclose = async (event) => {
      this.closeHandler(host, port, event);
    };

    return ws;
  }

  // получение адреса в виде строки
  static makeAddress(host: string, port: number): string {
    return `ws://${host}:${port}`;
  }

  // обработка входящих через вебсоект сообщений
  static messageHandler(msg: Websocket.MessageEvent) {
    return;
  }

  static closeHandler(host: string, port: number, event: Websocket.Event) {
    if (host == this.host && port == this.port) {
      this.setConnectionStatus(ClientStatus.NO_CONNECTION);
      this.connection = undefined;
      if (this.reconnectTimer.IsAutoReconnect()) {
        this.reconnectTimer.tryToReconnect(this.reconnect);
      }
    }
  }

  static errorHandler(error) {
    console.log('Websocket error', error);
    this.setConnectionStatus(ClientStatus.CONNECTION_ERROR);
    this.connection = undefined;
  }
}
