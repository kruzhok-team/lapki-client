import Websocket from 'isomorphic-ws';

import { ClientStatus } from './ClientStatus';
import { ReconnectTimer } from './ReconnectTimer';

export abstract class ClientWS {
  static port: number;
  static host: string;
  // соединение с удалённым сервером, если оно отсутстует, то undefined
  static connection: Websocket | undefined;

  // не стоит инициализировать таймер здесь, так как иначе все наследники буду иметь доступ к одному и тому же объекту
  static reconnectTimer: ReconnectTimer | undefined = undefined;

  static onStatusChange: (newConnectionStatus: string) => void;

  static setOnStatusChange(onStatusChange: (newConnectionStatus: string) => void): void {
    this.onStatusChange = onStatusChange;
  }

  /**
   * переподключение к последнему адресом к которому клиент пытался подключиться
   */
  static reconnect() {
    // если мы переподключаемся, то можно сбросить текущий таймер переподключения
    // это позволяется избежать ситуации, когда автоматическое переподключение происходит однвременно с ручным (по нажатию на кнопку)
    this.reconnectTimer?.clearTimer();
    this.connect(this.host, this.port);
  }

  /**
   * подключение к заданному хосту и порту, отключается от предыдущего адреса
   */
  static async connect(host: string, port: number): Promise<Websocket | undefined> {
    if (!this.isEqualAdress(host, port)) {
      this.initOrResetReconnectTimer();
      // чтобы предовратить повторное соединение
    } else if (this.connection && (this.connection.OPEN || this.connection.CONNECTING)) {
      return this.connection;
    }
    /*
      перед отключением нужно глобально поменять значения хоста и порта, 
      чтобы клиент не пытался подключиться обратно
    */
    this.host = host;
    this.port = port;
    this.connection?.close();
    this.onStatusChange(ClientStatus.CONNECTING);

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
      this.onStatusChange(ClientStatus.NO_CONNECTION);
      this.connection = undefined;
      if (this.reconnectTimer && this.reconnectTimer.isAutoReconnect()) {
        this.reconnectTimer.tryToReconnect(() => {
          this.reconnect();
        });
      }
    }
  }

  static errorHandler(error) {
    console.log('Websocket error', error);
    this.onStatusChange(ClientStatus.CONNECTION_ERROR);
    this.connection = undefined;
  }

  static onOpenHandler() {
    this.initOrResetReconnectTimer();
    //console.log(`Client: connected to ${this.host}:${this.port}!`);
    this.onStatusChange(ClientStatus.CONNECTED);
  }

  static cancelConnection() {
    this.reconnectTimer?.reset(false);
    this.connection?.close();
  }

  static isEqualAdress(host: string, port: number) {
    return host == this.host && port == this.port;
  }

  static initOrResetReconnectTimer() {
    if (this.reconnectTimer) {
      this.reconnectTimer.reset();
    } else {
      this.reconnectTimer = new ReconnectTimer();
    }
  }
}
