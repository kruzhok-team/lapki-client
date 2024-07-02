import Websocket from 'isomorphic-ws';

class ReconnectTimer {
  static timerID: NodeJS.Timeout | undefined;
  // первоначальное значение timeout
  static initialTimeout: number = 5000;
  // на сколько мс увеличивается время перед новой попыткой подключения
  static incTimeout: number = this.initialTimeout;
  /**  
    максимальное количество автоматических попыток переподключения,
    значение меньше нуля означает, что ограничения на попытки отсутствует
  */
  static maxReconnectAttempts: number = 3;
  // количество совершённых попыток переподключения, сбрасывается при удачном подключении или при смене хоста
  static curReconnectAttemps: number = 0;
  /**  
  максимальное количество мс, через которое клиент будет пытаться переподключиться,
  не должно быть негативным числом (поэтому не стоит делать эту переменную зависимой от maxReconnectAttempts)
  */
  static maxTimeout: number = this.incTimeout * 10;
  static timeout: number = this.initialTimeout;
}

export abstract class ClientWS {
  static port: number;
  static host: string;
  // хост + порт
  static base_address: string;
  // соединение с удалённым сервером, если оно отсутстует, то undefined
  static connection: Websocket | undefined;
  // true - в данный момент идёт подключение
  static connecting: boolean = false;
  static reconnectTimer: ReconnectTimer;
  // true = во время вызова таймера для переключения ничего не будет происходить.
  private static freezeReconnection: boolean = false;
  // true = пытаться переподключиться автоматически
  private static reconnection: boolean = false;
  // true = соединение было отменено пользователем и переподключаться не нунжо.
  private static connectionCanceled: boolean = false;

  static checkConnection(): boolean {
    return this.connection !== undefined;
  }

  /** переподключение к последнему адресом к которому клиент пытался подключиться*/
  static reconnect() {
    this.connect(this.host, this.port);
  }

  /** 
   подключение к заданному хосту и порту, если оба параметра не заданы, то идёт подключение к локальному хосту, если только один из параметров задан, то меняется только тот параметр, что был задан.
  */
  static async connect(host: string, port: number): Promise<Websocket | undefined> {
    if (this.connecting) return;
    this.connecting = true;
    //this.setFlasherConnectionStatus(FLASHER_CONNECTING);
    //this.clearTimer();

    this.host = host;
    this.port = port;

    const new_address = this.makeAddress(this.host, this.port);
    // означает, что хост должен смениться
    if (new_address != this.base_address) {
      //Flasher.curReconnectAttemps = 1;
      this.base_address = new_address;
      //Flasher.timeout = Flasher.initialTimeout;
    }
    host = this.host;
    port = this.port;
    this.connection?.close();
    //this.setFlasherDevices(new Map());
    this.connectionCanceled = false;

    let ws: Websocket;
    try {
      ws = new Websocket(this.base_address);
      this.connection = ws;
      //this.setErrorMessage(undefined);
    } catch (error) {
      //this.setErrorMessage(`${error}`);
      //console.log('Flasher websocket error', error);
      //this.setFlasherConnectionStatus(FLASHER_CONNECTION_ERROR);
      this.end();
      return;
    }

    ws.onopen = () => {
      //ReconnectTimer.curReconnectAttemps = 0;
      //console.log(`Flasher: connected to ${Flasher.host}:${Flasher.port}!`);
      //this.setFlasherConnectionStatus(FLASHER_CONNECTED);

      this.connecting = false;
      ws.onmessage = (msg: Websocket.MessageEvent) => {
        this.messageHandler(msg);
      };
    };

    ws.onclose = async () => {
      if (host == this.host && port == this.port) {
        //this.setFlasherConnectionStatus(FLASHER_NO_CONNECTION);
        this.end();
      }
    };

    return ws;
  }

  // действия после закрытии или ошибке соединения
  private static end() {
    this.connecting = false;
    this.connection = undefined;
  }

  // получение адреса в виде строки
  static makeAddress(host: string, port: number): string {
    return `ws://${host}:${port}`;
  }

  static messageHandler(msg: Websocket.MessageEvent) {
    return;
  }
}
