// нахождение незанятого порта для запуска модуля

import { error } from 'console';

// список небезопасных портов для хрома. Источник:https://chromium.googlesource.com/chromium/src.git/+/refs/heads/master/net/base/port_util.cc
const UNSAFE_CHROME_PORTS: number[] = [
  1719, // h323gatestat
  1720, // h323hostcall
  1723, // pptp
  2049, // nfs
  3659, // apple-sasl / PasswordServer
  4045, // lockd
  5060, // sip
  5061, // sips
  6000, // X11
  6566, // sane-port
  6665, // Alternate IRC [Apple addition]
  6666, // Alternate IRC [Apple addition]
  6667, // Standard IRC [Apple addition]
  6668, // Alternate IRC [Apple addition]
  6669, // Alternate IRC [Apple addition]
  6697, // IRC + TLS
  10080, // Amanda
];
const LAST_UNSAFE_PORT: number = UNSAFE_CHROME_PORTS.slice(-1)[0];
// порт с которого начинаются пользовательские порты
const USER_PORTS: number = 1024;
// порт с которого начинаются динамические порты
const DYNAMIC_PORTS: number = 49152;
/* 
нахождение незанятого порта и безопасного (для хрома) порта на локальном хосте
@param {number} startPort - порт с которого начнётся поиск (по-умолчанию начинает поиск в диапозоне динамических портов, не разрешается искать порт в системных портах)
@param {Function} action(freep) - действие, которое нужно совершить с найденным портом freep
@param {string} host - хост на котором следует искать свободные порты, по-умолчанию указан адрес локального хоста
@throws {Error} - ошибка из find-free-port
*/
export async function findFreePort(
  action: Function,
  startPort: number = DYNAMIC_PORTS,
  host: string = '127.0.0.1'
) {
  if (startPort < USER_PORTS) {
    startPort = USER_PORTS;
  }
  if (startPort >= 65536) {
    throw error('no free and safe port is found');
  }

  const freePortFinder = require('find-free-port');
  await freePortFinder(startPort, host)
    .then(async ([freep]) => {
      if (freep <= LAST_UNSAFE_PORT && UNSAFE_CHROME_PORTS.includes(freep)) {
        //await findFreePort(action, Math.floor(Math.random() * 65536));
        await findFreePort(action, startPort + 1);
        return;
      }
      action(freep);
      return;
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}
