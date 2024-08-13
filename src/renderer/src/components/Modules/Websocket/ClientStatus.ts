export class ClientStatus {
  static CONNECTING: string = 'Идет подключение...';
  static CONNECTED: string = 'Подключен';
  static NO_CONNECTION: string = 'Не подключен';
  static CONNECTION_ERROR = 'Ошибка при попытке подключиться';
}

export class CompilerStatus extends ClientStatus {
  static COMPILATION: string = 'Идет компиляция...';
}
