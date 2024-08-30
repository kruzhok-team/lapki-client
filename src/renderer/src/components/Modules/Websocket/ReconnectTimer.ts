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
  // время окончания таймера
  private timeoutEnd: number = 0;
  private intervalID: NodeJS.Timeout | undefined;
  // длительность интервала intervalID
  private intervalMS: number = 1000;
  // таймер, отвечающий за уничтожение интервала intervalID, по истечению таймаута переподключения
  private intervalDestructorID: NodeJS.Timeout | undefined;

  constructor(
    initialTimeout: number = 5000,
    incTimeout: number = 5000,
    maxReconnectAttempts: number = 3,
    maxTimeout: number = 50000,
    freezeTimeout: number = 1000,
    autoReconnect: boolean = true,
    intervalMS: number = 1000
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

    this.timeoutEnd = 0;
    this.intervalMS = intervalMS;
  }

  clearTimer() {
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = undefined;
      this.timeoutSetted = false;
      this.timeoutEnd = 0;
    }
    if (this.intervalID) {
      clearTimeout(this.intervalID);
    }
    if (this.intervalDestructorID) {
      clearTimeout(this.intervalDestructorID);
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
    // может быть рассинхрон между значением этой переменной и настоящим временем завершения таймера в несколько мс (см. докуметацию setTimeout),
    // но такая погрешность вряд ли сильно повлияет, если округлить результат до секунд
    this.timeoutEnd = new Date().getTime() + nextTimeout;
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

  // получить время до завершения таймера
  getRemainingTime() {
    const remainingTime = this.timeoutEnd - new Date().getTime();
    return remainingTime > 0 ? remainingTime : 0;
  }

  // запустить интервал, который будет работать до попытки переподключения
  // длительность интервала указывается при создании таймера
  // при вызове таймера, будет выполнять функцию action, в которую будет передавать оставшееся время до переподключения
  // возвращает время в мс
  startInterval(action: (remainingTime: number) => void) {
    action(this.getRemainingTime());
    this.intervalID = setInterval(() => {
      action(this.getRemainingTime());
    }, this.intervalMS);
    this.intervalDestructorID = setTimeout(() => {
      clearTimeout(this.intervalID);
      this.intervalID = undefined;
    }, this.curTimeout);
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
