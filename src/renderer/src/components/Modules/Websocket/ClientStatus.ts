// TODO: заменить на тип
export class ClientStatus {
  static CONNECTING: string = 'Идет подключение...';
  static CONNECTED: string = 'Подключен';
  static NO_CONNECTION: string = 'Не подключен';
  static CONNECTION_ERROR = 'Ошибка при попытке подключиться';
}

export class CompilerStatus extends ClientStatus {
  static COMPILATION: string = 'Идет компиляция...';
}

export class CompilerNoDataStatus {
  static DEFAULT: string = 'Нет данных';
  static TIMEOUT: string = 'Превышено время ожидания компиляции';
}
