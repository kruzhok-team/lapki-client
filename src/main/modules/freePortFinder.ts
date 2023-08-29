// нахождение незанятого порта для запуска модуля

import { error } from 'console';

// список небезопасных портов для хрома. Источник:https://chromium.googlesource.com/chromium/src.git/+/refs/heads/master/net/base/port_util.cc
const unsafeChromePorts: number[] = [
  1, // tcpmux
  7, // echo
  9, // discard
  11, // systat
  13, // daytime
  15, // netstat
  17, // qotd
  19, // chargen
  20, // ftp data
  21, // ftp access
  22, // ssh
  23, // telnet
  25, // smtp
  37, // time
  42, // name
  43, // nicname
  53, // domain
  69, // tftp
  77, // priv-rjs
  79, // finger
  87, // ttylink
  95, // supdup
  101, // hostriame
  102, // iso-tsap
  103, // gppitnp
  104, // acr-nema
  109, // pop2
  110, // pop3
  111, // sunrpc
  113, // auth
  115, // sftp
  117, // uucp-path
  119, // nntp
  123, // NTP
  135, // loc-srv /epmap
  137, // netbios
  139, // netbios
  143, // imap2
  161, // snmp
  179, // BGP
  389, // ldap
  427, // SLP (Also used by Apple Filing Protocol)
  465, // smtp+ssl
  512, // print / exec
  513, // login
  514, // shell
  515, // printer
  526, // tempo
  530, // courier
  531, // chat
  532, // netnews
  540, // uucp
  548, // AFP (Apple Filing Protocol)
  554, // rtsp
  556, // remotefs
  563, // nntp+ssl
  587, // smtp (rfc6409)
  601, // syslog-conn (rfc3195)
  636, // ldap+ssl
  989, // ftps-data
  990, // ftps
  993, // ldap+ssl
  995, // pop3+ssl
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

/* 
нахождение незанятого порта и безопасного (для хрома) порта на локальном хосте
@param {number} startPort - порт с которого начнётся поиск
@param {Function} action(freep) - действие, которое нужно совершить с найденным портом freep
@param {string} host - хост на котором следует искать свободные порты, по-умолчанию указан адрес локального хоста
@throws {Error} - ошибка из find-free-port
*/
export async function findFreePort(
  action: Function,
  startPort: number = 2,
  host: string = '127.0.0.1'
) {
  if (startPort >= 65536) {
    throw error('no free and safe port is found');
  }
  const freePortFinder = require('find-free-port');
  await freePortFinder(startPort, host)
    .then(async ([freep]) => {
      if (unsafeChromePorts.includes(freep)) {
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
