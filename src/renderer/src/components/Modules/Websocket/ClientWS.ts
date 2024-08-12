import Websocket from 'isomorphic-ws';

import { ReconnectTimer } from './ReconnectTimer';

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
    this.reconnectTimer.clearTimer();
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
    this.onStatusChange(ClientStatus.CONNECTING);
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
      this.onStatusChange(ClientStatus.NO_CONNECTION);
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
    this.onStatusChange(ClientStatus.CONNECTION_ERROR);
    this.connection = undefined;
  }

  static onOpenHandler() {
    this.reconnectTimer.reset();
    //console.log(`Client: connected to ${this.host}:${this.port}!`);
    this.onStatusChange(ClientStatus.CONNECTED);
  }

  static cancelConnection() {
    this.reconnectTimer.reset(false);
    this.connection?.close();
  }
}
