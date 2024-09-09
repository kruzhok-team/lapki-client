/*
Окно менеджера для МС-ТЮК
*/
import { useState } from 'react';

import { Device } from '@renderer/types/FlasherTypes';

import { TextField } from './UI';

export interface ManagerMSProps {
  device: Device | undefined;
}

export const ManagerMSTab: React.FC<ManagerMSProps> = ({ device }) => {
  const [inputValue, setInputValue] = useState<string>('');
  const handleGetAddress = () => {
    console.log('address');
  };
  const handleSendBin = () => {
    console.log('bin');
  };
  const handlePing = () => {
    console.log('ping');
  };
  const handleCurrentDeviceDisplay = () => {
    if (device === undefined) {
      return 'Устройство отсутствует';
    }
    return `${device?.name} (${device?.portName})`;
  };
  return (
    <section className="mr-3 flex h-full flex-col bg-bg-secondary">
      <div className="m-2 flex justify-between">{handleCurrentDeviceDisplay()}</div>
      <div className="m-2">
        <TextField
          label="Адрес:"
          className="mr-2 max-w-full"
          placeholder="Напишите адрес"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>
      <div className="m-2 flex">
        <button className="btn-primary mr-4" onClick={handleGetAddress}>
          Узнать адрес...
        </button>
        <button className="btn-primary mr-4" onClick={handleSendBin}>
          Отправить bin...
        </button>
        <button className="btn-primary mr-4" onClick={handlePing}>
          Пинг
        </button>
      </div>
    </section>
  );
};
