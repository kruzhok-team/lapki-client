import Websocket from "isomorphic-ws";
import { Dispatch, SetStateAction } from "react";

import { Device, FlashStart, FlashUpdatePort, FlasherMessage, UpdateDelete } from "@renderer/types/FlasherTypes";
import { Binary } from "@renderer/types/CompilerTypes";


export class Flasher {
  static port = 8080;
  static host = "localhost";
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
  static setFlasherLog: Dispatch<SetStateAction<string | undefined>>;
  static setFlasherDevices: Dispatch<SetStateAction<Map<string, Device>>>;
  static setFlasherConnectionStatus: Dispatch<SetStateAction<string>>;

  //Когда прочитывает блоб - отправляет его
  static initReader(): void {
    this.reader.onloadend = function(evt) {
      if (evt.target?.readyState == FileReader.DONE) {
          console.log("BLOB")
          Flasher.connection.send(Flasher.currentBlob);
          Flasher.filePos += Flasher.currentBlob.size;
      }
    };
  }

  static async sendBlob(): Promise<void> {
    var first = this.filePos;
    var last = first + this.blobSize
    if (last > this.binary.size) {
        last = this.binary.size;
    }
    this.currentBlob = this.binary.slice(first, last);
    this.reader.readAsArrayBuffer(this.currentBlob);
  }

  static bindReact(setFlasherDevices: Dispatch<SetStateAction<Map<string, Device>>>, 
                   setFlasherConnectionStatus: Dispatch<SetStateAction<string>>,
                   setFlasherLog: Dispatch<SetStateAction<string | undefined>>): void {
    this.setFlasherConnectionStatus = setFlasherConnectionStatus;
    this.setFlasherDevices = setFlasherDevices;
    this.setFlasherLog = setFlasherLog;
  }

  static addDevice(device: Device): void {
    this.setFlasherDevices((oldValue) => {
      console.log(device)
      const newValue = new Map(oldValue);
      newValue.set(device.deviceID, device)
      return newValue;
    })
  }

  static deleteDevice(deviceID: string): void {
    this.setFlasherDevices(oldValue => {
      const newValue = new Map(oldValue);
      newValue.delete(deviceID);
      return newValue;
    })
  }

  static updatePort(port: FlashUpdatePort): void {
    this.setFlasherDevices(oldValue => {
      const newValue = new Map(oldValue);
      console.log(port.deviceID);
      console.log(oldValue)
      console.log(newValue.get(port.deviceID))
      console.log(oldValue.get(port.deviceID))
      const device = newValue.get(port.deviceID)!;
      device.portName = port.portName;
      newValue.set(port.deviceID, device);
      
      return newValue;
    });
  }

  static getList(): void {
    this.setFlasherDevices(new Map);
    this.connection.send(JSON.stringify({
      type: "get-list",
      payload: undefined
    } as FlasherMessage))
    this.setFlasherLog("Запрос get-list отправлен!")
  }

  static checkConnection(): boolean {
      return this.connection !== undefined
  }

  static connect(route: string, timeout: number = 0): Websocket {
      if(this.checkConnection()) return this.connection!;
      if(this.connecting) return;
      const ws = new Websocket(route);
      this.setFlasherConnectionStatus("Идет подключение...");
      this.connecting = true;

      ws.onopen = () => {
        console.log("Flasher: connected!")
        this.setFlasherConnectionStatus("Подключен")
        
        this.connection = ws;
        this.connecting = false;
        this.timeoutSetted = false;

        this.getList();
        
        timeout = 0;
      };

      ws.onmessage = (msg: MessageEvent) => {
        console.log(msg.data)
        const response = JSON.parse(msg.data) as FlasherMessage;
        switch(response.type) {
          case "flash-next-block": {
            this.sendBlob();
            break;
          };
          case "flash-done": {
            this.setFlasherLog("Загрузка завершена!");
            break;
          };
          case "device": {
            this.addDevice(response.payload as Device);
            this.setFlasherLog("Добавлено устройство!");
            break;
          };
          case "device-update-delete": {
            this.deleteDevice((response.payload as UpdateDelete).deviceID);
            break;
          };
          case "device-update-port": {
            this.updatePort(response.payload as FlashUpdatePort);
            break;
          };
          case "unmarshal-error": {
            this.setFlasherLog("Не удалось распарсить json-сообщение от клиента");
            break;
          };
          case "flash-blocked": {
            this.setFlasherLog("Устройство заблокировано другим пользователем для прошивки");
            break;
          };
          case "flash-large-file": {
            this.setFlasherLog("Указанный размер файла превышает максимально допустимый размер файла, установленный сервером.");
            break;
          };
          case "flash-avrdude-error": {
            this.setFlasherLog(`${response.payload}`);
            break;
          };
          case "flash-disconnected": {
            this.setFlasherLog("Устройство есть в списке, но оно не подключено к серверу");
            break;
          };
          case "flash-wrong-id": {
            this.setFlasherLog("Устройства с таким id нету в списке");
            break;
          };
          case "flash-not-finished": {
            this.setFlasherLog("Предыдущая операция прошивки ещё не завершена");
            break;
          };
          case "flash-not-started": {
            this.setFlasherLog("Получены бинарные данных, хотя запроса на прошивку не было");
            break;
          };
          case "event-not-supported": {
            this.setFlasherLog("Сервер получил от клиента неизвестный тип сообщения");
            break;
          };
          case "get-list-cooldown": {
            this.setFlasherLog("Запрос на 'get-list' отклонён так как, клиент недавно уже получил новый список");
            break;
          };
        };
      };

      ws.onclose = () => {
          console.log("closed");
          this.connecting = false;
          this.setFlasherConnectionStatus("Не подключен")
          this.connection = undefined;
          if(!this.timeoutSetted){
            this.timeoutSetted = true;
            timeout += 5000;
            setTimeout(() => {
              this.connect(route, timeout);
              this.timeoutSetted = false;
            }, timeout
            );
          }
      };

      return ws
  }

  static refresh(): void {
    this.filePos = 0;
  }

  static setBinary(binaries: Array<Binary>){
    binaries.map((binary)=> {
      if(binary.filename.match(".hex")){
        this.binary = binary.binary;
        return;
      };
    })
  }

  static async flash(binaries: Array<Binary>, deviceID: string): Promise<void>{
    this.refresh();
    this.setBinary(binaries);

    const payload = {
      deviceID: deviceID,
      fileSize: this.binary.size
    } as FlashStart;
    const request = {
      type: "flash-start",
      payload: payload
    } as FlasherMessage;
    console.log(request);
    this.connection.send(JSON.stringify(request));
    this.setFlasherLog("Идет загрузка...");
  }
} 