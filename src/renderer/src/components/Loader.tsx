import React, { Dispatch} from 'react';
import { ReactComponent as Update } from '@renderer/assets/icons/update.svg';
import { ReactComponent as Setting } from '@renderer/assets/icons/settings.svg';
import { twMerge } from 'tailwind-merge';
import { Device } from '@renderer/types/FlasherTypes';

export interface FlasherProps {
  devices: Map<string, Device>,
  currentDevice: string | undefined,
  connectionStatus: string,
  setCurrentDevice: Dispatch<string | undefined>
  handleGetList: () => void;
  handleFlash: () => void;
}   

export const Loader: React.FC<FlasherProps> = ({currentDevice, devices, connectionStatus, setCurrentDevice, handleGetList, handleFlash}) => {
  const isActive = (id: string) => currentDevice === id;
  console.log(devices)

  return (
    <section className="flex h-full flex-col bg-[#a1c8df] text-center font-Fira text-base">
      <div className="w-full px-4 pt-2">
        <h1 className="mb-3 border-b border-white pb-2 text-lg">Загрузчик</h1>
      </div>
      <div className="my-2 flex rounded border-2 border-[#557b91]">
        <button className="flex w-full items-center p-1 hover:bg-[#557b91] hover:text-white" onClick={handleGetList}>
          <Update width="1.5rem" height="1.5rem" className="mr-1" fill="#FFFFFF;" />
          Обновить
        </button>
        <button className="p-1 hover:bg-[#557b91] hover:text-white">
          <Setting width="1.5rem" height="1.5rem" />
        </button>
      </div>

      <div className=" h-40 select-text items-center overflow-y-auto break-words rounded bg-white p-2">
        <p>{connectionStatus}</p>
        {[...devices.keys()].map((key) => (
          <button key={key}
          className="my-1 flex w-full items-center rounded border-2 border-[#557b91] p-1 hover:bg-[#557b91] hover:text-white"
          onClick={() => setCurrentDevice(key)}>
          {devices.get(key)?.name}
          </button>
        ))}
      </div>
      <div className="mt-1 h-64 select-text items-center overflow-y-auto break-words rounded bg-white p-2 text-left">
        {[...devices.keys()].map((key)=>(
            <div key={key} className={twMerge('hidden', isActive(key) && 'block')}>
            <div className="flex items-center">
              {devices.get(key)?.name}
            </div>
            <p>Device ID: {devices.get(key)?.deviceID}</p>
            <p>Serial ID: {devices.get(key)?.serialID}</p>
            <p>Port: {devices.get(key)?.portName}</p>
            <p>Controller: {devices.get(key)?.controller}</p>
            <p>Programmer: {devices.get(key)?.programmer}</p>
          </div>
        ))}
      </div>

      <button className="my-2 rounded border-2 border-[#557b91] p-2 hover:bg-[#557b91] hover:text-white" onClick={handleFlash}>
        Загрузить
      </button>
      <div className="mt-1 h-96 select-text items-center overflow-y-auto break-words rounded bg-white p-2 text-left">
        <div>
          Данные, которые необходимо отобразить, после загрузки на Arduino;
          <br />
          <br />
          Данные, которые необходимо отобразить, после загрузки на Arduino;
          <br />
          <br />
          Данные, которые необходимо отобразить, после загрузки на Arduino;
        </div>
      </div>
    </section>
  );
};
