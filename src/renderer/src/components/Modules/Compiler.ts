import { Elements } from "@renderer/types/diagram";
import Websocket from "isomorphic-ws";
import { CompilerSettings, CompilerResult } from "@renderer/types/CompilerTypes";
import { Dispatch, SetStateAction } from "react";

export class Compiler {
    static port = 8081;
    static host = "localhost";
    static base_address = `ws://${this.host}:${this.port}/`;
    // key: Route, value: Websocket
    static connection: Websocket | undefined;
    static setCompilerData: Dispatch<SetStateAction<CompilerResult | string | undefined>>;
    static setCompilerStatus: Dispatch<SetStateAction<string>>;
    static timeoutSetted = false;

    static bindReact(setCompilerData: Dispatch<SetStateAction<CompilerResult | string | undefined>>, 
                     setCompilerStatus: Dispatch<SetStateAction<string>>): void {
      this.setCompilerData = setCompilerData;
      this.setCompilerStatus = setCompilerStatus;
    }

    static checkConnection(): boolean {
        return this.connection === undefined
    }

    static async connect(route: string, timeout: number = 0): Promise<Websocket> {
        if(!this.checkConnection()) return this.connection!;
        const ws = new Websocket(route);
        this.setCompilerStatus("Не подключен")
        ws.onopen = () => {
          this.setCompilerStatus("Подключен")
          this.connection = ws;
          this.timeoutSetted = false;
          timeout = 0;
        };

        ws.onmessage = (msg: CompilerResult | string) => {
            console.log(msg["data"]);
            this.setCompilerData(JSON.parse(msg["data"]));
        };

        ws.onclose = () => {
            console.log("closed");
            this.setCompilerStatus("Не подключен")
            this.connection = undefined;
            if(!this.timeoutSetted){
              this.timeoutSetted = true;
              timeout += 2000;
              setTimeout(() => {
                console.log(timeout);
                this.connect(route, timeout);
                this.timeoutSetted = false;
              }, timeout
              );
            }
        };

        return ws
    }

    static async compile(platform: string, data: Elements){
      const route = `${this.base_address}main`  
      const ws: Websocket = await this.connect(route);
      const compilerSettings: CompilerSettings = {compiler: "arduino-cli", filename: "biba", flags: ["-b", "avr:arduino:uno"] }; 
      const obj = {   
              ...data, 
              compilerSettings: compilerSettings
            }
            
      ws.send(platform);
      ws.send(JSON.stringify(obj));
      this.setCompilerStatus("Идет компиляция...");
    }
} 
