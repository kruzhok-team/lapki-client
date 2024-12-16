import {
  AddressData,
  BinariesMsType,
  FlashBacktrackMs,
  MetaDataID,
} from '@renderer/types/FlasherTypes';

import { MSDevice } from './Device';
import { Flasher } from './Flasher';

export class ManagerMS {
  static setDevice: (currentDevice: MSDevice | undefined) => void;
  static setLog: (update: (prevMessages: string[]) => string[]) => void;
  static setAddress: (curAddress: string) => void;
  static setMeta: (curMeta: MetaDataID) => void;
  private static backtrackMap: Map<string, string> = new Map([
    ['PING', 'отправка пинга на устройство...'],
    ['PREPARE_FIRMWARE', 'открытие прошивки и формирование пакетов...'],
    ['CHANGE_MODE_TO_PROG', 'перевод в режим программирования...'],
    ['CHANGE_MODE_TO_RUN', 'запуск загруженной прошивки...'],
    ['ERASE_OLD_FIRMWARE', 'очистка страниц старой прошивки...'],
    ['PUSH_FIRMWARE', 'загрузка прошивки...'],
    ['PULL_FIRMWARE', 'загрузка записанного кода прошивки для проверки...'],
    ['VERIFY_FIRMWARE', 'проверка целостности загруженной прошивки...'],
  ]);
  private static flashQueue: BinariesMsType[] = [];
  private static flashingAddress = '';

  static bindReact(
    setDevice: (currentDevice: MSDevice | undefined) => void,
    setLog: (update: (prevMessages: string[]) => string[]) => void,
    setAddress: (curAddress: string) => void,
    setMeta: (curMeta: MetaDataID) => void
  ): void {
    this.setDevice = setDevice;
    this.setLog = setLog;
    this.setAddress = setAddress;
    this.setMeta = setMeta;
  }
  static binAdd(binariesInfo: BinariesMsType) {
    this.flashQueue.push(binariesInfo);
  }
  static binStart() {
    const binariesInfo = this.flashQueue.shift();
    if (!binariesInfo) return;
    Flasher.setBinary(binariesInfo.binaries, binariesInfo.device);
    Flasher.flashPreparation(binariesInfo.device);
    this.flashingAddress = this.displayAddressInfo(binariesInfo.addressInfo);
    ManagerMS.flashingAddressLog('Начат процесс прошивки...');
    Flasher.send('ms-bin-start', {
      deviceID: binariesInfo.device.deviceID,
      fileSize: Flasher.binary.size,
      address: binariesInfo.addressInfo.address,
      verification: binariesInfo.verification,
    });
  }
  static ping(deviceID: string, address: string) {
    Flasher.send('ms-ping', {
      deviceID: deviceID,
      address: address,
    });
  }
  static getAddress(deviceID: string) {
    Flasher.send('ms-get-address', {
      deviceID: deviceID,
    });
  }
  static addLog(log: string) {
    this.setLog((prevMessages) => [...prevMessages, log]);
  }
  static flashingAddressLog(log: string) {
    ManagerMS.addLog(`${this.flashingAddress}: ${log}`);
  }
  static flashingAddressEndLog(log: string) {
    ManagerMS.flashingAddressLog(log);
    this.flashingAddress = '';
  }
  static reset(deviceID: string, address: string) {
    Flasher.send('ms-reset', {
      deviceID: deviceID,
      address: address,
    });
  }
  static getMetaData(deviceID: string, address: string) {
    Flasher.send('ms-get-meta-data', {
      deviceID: deviceID,
      address: address,
    });
  }
  static backtrack(backtrack: FlashBacktrackMs) {
    const uploadStage = this.backtrackMap.get(backtrack.UploadStage);
    const status = 'Статус загрузки';
    if (uploadStage) {
      const prefix = `${status}: ${uploadStage}`;
      const progress = backtrack.NoPacks ? '' : ` ${backtrack.CurPack}/${backtrack.TotalPacks}`;
      ManagerMS.flashingAddressLog(prefix + progress);
    } else {
      ManagerMS.flashingAddressLog(
        `${status}: получено неизвестное сообщение (${uploadStage}) от загрузчика`
      );
    }
  }
  static displayAddressInfo(addressInfo: AddressData) {
    const name = addressInfo.name === '' ? addressInfo.address : addressInfo.name;
    const type = addressInfo.type ? ` (${addressInfo.type})` : '';
    return name + type;
  }
  static clearLog() {
    this.setLog(() => []);
  }
}
