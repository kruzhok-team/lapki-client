import { Binary } from '@renderer/types/CompilerTypes';
import { Device, FlashStart, FlasherMessage } from '@renderer/types/FlasherTypes';
import Websocket from 'isomorphic-ws';
import { Dispatch, SetStateAction } from 'react';

export class Flasher {
  static port = 8080;
  static host = 'localhost';
  static base_address = `ws://${this.host}:${this.port}/flasher`;
  static connection: Websocket | undefined;
  static connecting: boolean = false;
  static timeoutSetted = false;

  static devices: Map<string, Device>;

  // Переменные, связанные с отправкой бинарных данных
  static reader = new FileReader();
  static binary: Blob;
  static currentBlob: Blob;
  static filePos: number = 0;
  static blobSize: number = 1024;
  static setFlasherDevices: Dispatch<SetStateAction<Map<string, Device>>>;
  static setFlasherConnectionStatus: Dispatch<SetStateAction<string>>;

  //Когда прочитывает блоб - отправляет его
  static initReader(): void {
    this.reader.onloadend = function (evt) {
      if (evt.target?.readyState == FileReader.DONE) {
        console.log('BLOB');
        Flasher.connection.send(Flasher.currentBlob);
        Flasher.filePos += Flasher.currentBlob.size;
      }
    };
  }

  static async sendBlob(): Promise<void> {
    const ws: Websocket = await this.connect(this.base_address);
    var first = this.filePos;
    var last = first + this.blobSize;
    if (last > this.binary.size) {
      last = this.binary.size;
    }
    this.currentBlob = this.binary.slice(first, last);
    this.reader.readAsArrayBuffer(this.currentBlob);
  }

  static bindReact(
    setFlasherDevices: Dispatch<SetStateAction<Map<string, Device>>>,
    setFlasherConnectionStatus: Dispatch<SetStateAction<string>>
  ): void {
    this.setFlasherConnectionStatus = setFlasherConnectionStatus;
    this.setFlasherDevices = setFlasherDevices;
  }

  static addDevice(device: Device): void {
    if (device) {
      this.setFlasherDevices((oldValue) => {
        console.log(device);
        const newValue = new Map(oldValue);
        newValue.set(device.deviceID, device);
        return newValue;
      });
    }
  }

  static getList(): void {
    this.setFlasherDevices(new Map());
    this.connection.send(
      JSON.stringify({
        type: 'get-list',
        payload: undefined,
      } as FlasherMessage)
    );
  }

  static checkConnection(): boolean {
    return this.connection !== undefined;
  }

  static connect(route: string, timeout: number = 0): Websocket {
    if (this.checkConnection()) return this.connection!;
    if (this.connecting) return;
    const ws = new Websocket(route);
    this.setFlasherConnectionStatus('Идет подключение...');
    this.connecting = true;

    ws.onopen = () => {
      console.log('Flasher: connected!');
      this.setFlasherConnectionStatus('Подключен');

      this.connection = ws;
      this.connecting = false;
      this.timeoutSetted = false;

      this.getList();

      timeout = 0;
    };

    ws.onmessage = (msg: MessageEvent) => {
      console.log(msg.data);
      const response = JSON.parse(msg.data) as FlasherMessage;
      console.log(response.type);
      switch (response.type) {
        case 'flash-next-block': {
          this.sendBlob();
        }
        case 'flash-done': {
        }
        case 'device': {
          this.addDevice(response.payload as Device);
        }
      }
    };

    ws.onclose = () => {
      console.log('closed');
      this.connecting = false;
      this.setFlasherConnectionStatus('Не подключен');
      this.connection = undefined;
      if (!this.timeoutSetted) {
        this.timeoutSetted = true;
        timeout += 5000;
        setTimeout(() => {
          this.connect(route, timeout);
          this.timeoutSetted = false;
        }, timeout);
      }
    };

    return ws;
  }

  static refresh(): void {
    this.filePos = 0;
  }

  static setBinary(binaries: Array<Binary>) {
    binaries.map((binary) => {
      if (binary.filename.match('.hex')) {
        this.binary = binary.binary;
        return;
      }
    });
  }

  static async flash(binaries: Array<Binary>, deviceID: string): Promise<void> {
    this.refresh();
    this.setBinary(binaries);

    const payload = {
      deviceID: deviceID,
      fileSize: this.binary.size,
    } as FlashStart;
    const request = {
      type: 'flash-start',
      payload: payload,
    } as FlasherMessage;
    console.log(request);
    this.connection.send(JSON.stringify(request));
  }
}
