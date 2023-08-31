# lapki-client

Клиентская часть Lapki IDE.

## Зависимости

Поддерживаемые ОС:
 - Windows 7 и новее
   - Для прошивки могут понадобиться драйвера прошиваемых устройств (например, нестандартных Arduino или в Windows 7).
 - Linux-дистрибутивы с менеджером **Systemd**. 
   - Для прошивки потребуется `libusb`, для опроса устройств также используется `udevadm`. Возможна работа с `eudev`, но это не тестировалось.

Также для прошивки потребуется **avrdude**. В Linux достаточно установить утилиту встроенным пакетным менеджером, под Windows предлагается установить [форк от maurisgreuel](https://github.com/mariusgreuel/avrdude), положить в рабочую директорию или PATH.

## Разработка

Для работы с репозиторием рекомендуется использовать [VSCode](https://code.visualstudio.com/) с расширениями [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) и [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode). 

Для запуска dev-версии потребуется установить Node 18.х и новее c npm, после выполнить команды:

```bash
# Загрузить зависимости
$ npm install

# Запустить dev-сервер и Electron
$ npm run dev
```

Dev-версия работает в режиме горячей замены, но некоторые изменения (например, затрагивающие хранение данных схемы) могут приводить к проблемам, не проявляющимся в обычной работе.

### Сборка

```bash
# Под Windows
$ npm run build:win

# Под Linux
$ npm run build:linux
```
