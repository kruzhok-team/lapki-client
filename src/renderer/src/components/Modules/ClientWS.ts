import Websocket from 'isomorphic-ws';

class ReconnectTimer {
  private timerID: NodeJS.Timeout | undefined;
  // первоначальное значение timeout (в мс)
  private initialTimeout: number = 5000;
  // на сколько мс увеличивается время перед новой попыткой подключения
  private incTimeout: number = this.initialTimeout;
  // значение timeout (в мс) при заморозке таймера
  private freezeTimeout: number = 1000;
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
  // true = установлен timerID
  private timeoutSetted: boolean = false;
  // true = соединение было отменено пользователем и переподключаться не нунжо.
  // private connectionCanceled: boolean = false;

  constructor(
    initialTimeout: number = 5000,
    incTimeout: number = 5000,
    maxReconnectAttempts: number = 3,
    maxTimeout: number = 50000,
    freezeTimeout: number = 1000,
    autoReconnect: boolean = true
  ) {
    this.initialTimeout = initialTimeout;
    this.curTimeout = initialTimeout;
    this.maxTimeout = maxTimeout;
    this.incTimeout = incTimeout;
    this.freezeTimeout = freezeTimeout;
    this.timeoutSetted = false;

    this.maxReconnectAttempts = maxReconnectAttempts;
    this.curReconnectAttemps = 0;

    this.autoReconnect = autoReconnect;
    this.freezeReconnection = false;
    // this.connectionCanceled = false;
  }

  setTimerID(timerID: NodeJS.Timeout | undefined) {
    this.timerID = timerID;
  }

  setReconnection(reconnection: boolean) {
    this.autoReconnect = reconnection;
  }

  private clearTimer() {
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = undefined;
      this.timeoutSetted = false;
    }
  }

  reset(autoReconnect: boolean = true) {
    this.clearTimer();

    this.curTimeout = this.initialTimeout;

    this.curReconnectAttemps = 0;

    this.autoReconnect = autoReconnect;
    this.freezeReconnection = false;
    //this.connectionCanceled = false;
  }

  freeze(freeze: boolean) {
    this.freezeReconnection = freeze;
  }

  setAutoReconnect(autoReconnect: boolean) {
    this.autoReconnect = autoReconnect;
  }

  isAutoReconnect(): boolean {
    return this.autoReconnect;
  }

  incReconnectAttempt() {
    this.curReconnectAttemps = Math.min(this.curReconnectAttemps + 1, this.maxReconnectAttempts);
  }

  // переподключение по таймеру
  tryToReconnect(reconnectFunction: () => void, nextTimeout: number = this.curTimeout) {
    if (
      !this.autoReconnect ||
      this.timeoutSetted || // проверка на то, что на данный момент отсутствует другой таймер
      (this.maxReconnectAttempts >= 0 && this.curReconnectAttemps >= this.maxReconnectAttempts)
    ) {
      return;
    }
    this.timeoutSetted = true;
    this.timerID = setTimeout(() => {
      console.log(
        `inTimer: ${this.curTimeout}, attempt ${this.curReconnectAttemps + 1}/${
          this.maxReconnectAttempts
        }`
      );
      if (!this.freezeReconnection) {
        this.curTimeout = Math.min(this.curTimeout + this.incTimeout, this.maxTimeout);
        this.incReconnectAttempt();
        this.timeoutSetted = false;
        reconnectFunction();
      } else {
        console.log('the timer is frozen');
        this.timeoutSetted = false;
        this.tryToReconnect(reconnectFunction, this.freezeTimeout);
      }
    }, nextTimeout);
  }
}

export class ClientStatus {
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

  static bindReactSuper(setConnectionStatus: (newConnectionStatus: string) => void): void {
    this.setConnectionStatus = setConnectionStatus;
  }

  /**
   * переподключение к последнему адресом к которому клиент пытался подключиться
   */
  static reconnect() {
    this.connect(this.host, this.port);
  }

  /**
   * подключение к заданному хосту и порту, отключается от предыдущего адреса
   */
  static async connect(host: string, port: number): Promise<Websocket | undefined> {
    // чтобы предовратить повторное соединение
    if (this.connection && this.connection.CONNECTING) return this.connection;
    // проверяем, что адрес является новым
    if (this.host != host || this.port != port) {
      this.reconnectTimer = new ReconnectTimer();
      // проверяем, что не идёт переподключения к текущему соединению
    } else if (this.connection && this.connection.OPEN) {
      return this.connection;
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
      this.onOpenHandler();
    };

    ws.onmessage = (msg: Websocket.MessageEvent) => {
      this.messageHandler(msg);
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
    console.log(msg);
    return;
  }

  static closeHandler(host: string, port: number, event: Websocket.CloseEvent) {
    console.log('Close connection', event);
    if (host == this.host && port == this.port) {
      this.setConnectionStatus(ClientStatus.NO_CONNECTION);
      this.connection = undefined;
      if (this.reconnectTimer.isAutoReconnect()) {
        this.reconnectTimer.tryToReconnect(() => {
          this.reconnect();
        });
      }
    }
  }

  static errorHandler(error) {
    console.log('Websocket error', error);
    this.setConnectionStatus(ClientStatus.CONNECTION_ERROR);
    this.connection = undefined;
  }

  static onOpenHandler() {
    this.reconnectTimer.reset();
    //console.log(`Client: connected to ${this.host}:${this.port}!`);
    this.setConnectionStatus(ClientStatus.CONNECTED);
  }

  static cancelConnection() {
    this.reconnectTimer.reset(false);
    this.connection?.close();
  }
}
