export class ReconnectTimer {
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
  private curReconnectAttempts: number = 0;
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
    this.curReconnectAttempts = 0;

    this.autoReconnect = autoReconnect;
    this.freezeReconnection = false;
  }

  setTimerID(timerID: NodeJS.Timeout | undefined) {
    this.timerID = timerID;
  }

  clearTimer() {
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = undefined;
      this.timeoutSetted = false;
    }
  }

  reset(autoReconnect: boolean = true) {
    this.clearTimer();

    this.curTimeout = this.initialTimeout;

    this.curReconnectAttempts = 0;

    this.autoReconnect = autoReconnect;
    this.freezeReconnection = false;
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
    this.curReconnectAttempts = Math.min(this.curReconnectAttempts + 1, this.maxReconnectAttempts);
  }

  // переподключение по таймеру
  tryToReconnect(reconnectFunction: () => void, nextTimeout: number = this.curTimeout) {
    if (
      !this.autoReconnect ||
      this.timeoutSetted || // проверка на то, что на данный момент отсутствует другой таймер
      (this.maxReconnectAttempts >= 0 && this.curReconnectAttempts >= this.maxReconnectAttempts)
    ) {
      return;
    }
    this.timeoutSetted = true;
    this.timerID = setTimeout(() => {
      console.log(
        `inTimer: ${this.curTimeout}, attempt ${this.curReconnectAttempts + 1}/${
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

export class ComplierTimeoutTimer {
  //Если за данное время не пришел ответ от компилятора
  //мы считаем, что произошла ошибка.
  private timeOutTime: number;
  private timerOutID: NodeJS.Timeout | undefined;
  constructor(timeOutTime: number = 100000) {
    this.timeOutTime = timeOutTime;
  }

  timeOut(complierAction: () => void) {
    this.timerOutID = setTimeout(() => {
      complierAction();
    }, this.timeOutTime);
  }

  clear() {
    clearTimeout(this.timerOutID);
  }
}
