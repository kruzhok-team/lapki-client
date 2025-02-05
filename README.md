# Cyberiada IDE

> **ОБРАТИТЕ ВНИМАНИЕ!** 
> 
> Этот репозиторий используется для формирования и распространения релизов Cyberiada IDE.
> 
> Чтобы сделать форк, предложить правки, а также отправить предложение или сообщение об ошибке, перейдите в [репозиторий Lapki IDE](https://github.com/kruzhok-team/lapki-client).
>
> Ветка `cyberiada-unstable` обновляется перезаписыванием (`--force`), поэтому не рекомендуется её клонировать. Для подробностей обратитесь в вики.

![light-theme](https://github.com/kruzhok-team/lapki-client/assets/1689801/aa4417d7-d640-4853-8493-b5b1e72311d1)

Клиентская часть Cyberiada IDE, среды программирования расширенных иерархических машин состояний.

## Зависимости

Поддерживаемые ОС:

- Windows 10 и новее (поддержка более старых систем не гарантируется)
  - Для прошивки могут понадобиться драйвера прошиваемых устройств (например, нестандартных Arduino или необновлённых системах).
- Linux-дистрибутивы с менеджером **Systemd**.
  - Для прошивки потребуется `libusb`, для опроса устройств также используется `udevadm`. Возможна работа с `eudev`, но это не тестировалось.
- macOS (тестировалось на 14-ой версии "Sonoma")
  - См. раздел [Безопасность](https://github.com/kruzhok-team/lapki-client/wiki/%D0%9C%D0%BE%D0%B4%D1%83%D0%BB%D1%8C-%D0%B7%D0%B0%D0%B3%D1%80%D1%83%D0%B7%D1%87%D0%B8%D0%BA%D0%B0-%D0%BD%D0%B0-macOS#%D0%B1%D0%B5%D0%B7%D0%BE%D0%BF%D0%B0%D1%81%D0%BD%D0%BE%D1%81%D1%82%D1%8C) для решения проблем с открытием Lapki IDE.

Также для прошивки потребуется **avrdude**. В Linux достаточно установить утилиту встроенным пакетным менеджером, под Windows предлагается установить [форк от maurisgreuel](https://github.com/mariusgreuel/avrdude), положить в рабочую директорию или PATH. Инструкцию по установке avrdude на macOS можно посмотреть [здесь](https://github.com/kruzhok-team/lapki-client/wiki/%D0%9C%D0%BE%D0%B4%D1%83%D0%BB%D1%8C-%D0%B7%D0%B0%D0%B3%D1%80%D1%83%D0%B7%D1%87%D0%B8%D0%BA%D0%B0-%D0%BD%D0%B0-macOS#avrdude).

## Разработка

Для работы с репозиторием рекомендуется использовать [VSCode](https://code.visualstudio.com/) с расширениями [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) и [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).

Для запуска dev-версии потребуется установить Node 18.х и новее c npm, после выполнить команды:

```bash
# Загрузить подмодули
$ git submodule update --init --recursive

# Загрузить зависимости
$ npm install

# Запустить dev-сервер и Electron
$ npm run dev
```

Dev-версия работает в режиме горячей замены, но некоторые изменения (например, затрагивающие хранение данных документа) могут приводить к проблемам, не проявляющимся в обычной работе.

Для разработки под NixOS предусмотрен shell-файл, запускающий FHS-окружение с VS Code и необходимыми зависимостями.
Команда `nix-shell` автоматически запускает редактор. При первом запуске в VS Code также желательно поставить Prettier и ESLint.

### Сборка

```bash
# Под Windows
$ npm run build:win

# Под Linux
$ npm run build:linux
```
