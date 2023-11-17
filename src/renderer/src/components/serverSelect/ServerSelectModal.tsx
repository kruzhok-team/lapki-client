import React, { useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from '../Modal/Modal';

import { TextInput } from '../Modal/TextInput';
import { Settings } from '../Modules/Settings';

interface ServerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleCustom: (host: string, port: number) => void;
  // надпись на самом верху
  topTitle: string;
  // надпись над меню выбора типа сервера
  textSelectTitle: string;
  // значение порта, которое сохранилось в electron-settings (при null или undefined пользователь увидит пустую строку)
  //savedPortValue: string | undefined | null;
  // значение хоста, которое сохранилось в electron-settings (при null или undefined пользователь увидит пустую строку)
  //savedHostValue: string | undefined | null;
  // значение хоста к которому клиент подключается при первом запуске
  originaltHostValue: string;
  // значение порта к которому клиент подключается при первом запуске
  originaltPortValue: string;
  // ключ для извлечения настроек
  electronSettingsKey: string;
}

export const ServerSelectModal: React.FC<ServerSelectModalProps> = ({
  onClose,
  handleCustom: handleCustom,
  ...props
}) => {
  // хост, отображаемый пользователю на форме ввода данных
  const [hostInput, setInputHost] = useState('');
  const [portInput, setInputPort] = useState('');

  useEffect(() => {
    Settings.get(props.electronSettingsKey).then((server) => {
      setInputHost(server.host);
      setInputPort(String(server.port));
    });
  }, []);
  const { handleSubmit: hookHandleSubmit } = useForm<{}>();

  const handleSubmit = hookHandleSubmit(() => {
    handleCustom(String(hostInput), Number(portInput));
    onRequestClose();
  });

  const onRequestClose = () => {
    onClose();
  };

  const handleReset = () => {
    setInputHost(props.originaltHostValue);
    setInputPort(props.originaltPortValue);
  };

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={props.topTitle}
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
    >
      <div className={'flex'}>
        <TextInput
          label="Хост:"
          placeholder="Напишите адрес хоста"
          isElse={false}
          error={false}
          errorMessage={''}
          value={hostInput ?? ''}
          //defaultValue={props.savedHostValue ?? ''}
          onChange={(e) => setInputHost(e.target.value)}
          //disabled={isLocal}
        />
        <TextInput
          label="Порт:"
          placeholder="Напишите порт"
          isElse={false}
          error={false}
          errorMessage={''}
          onInput={(event) => {
            const { target } = event;
            if (target) {
              (target as HTMLInputElement).value = (target as HTMLInputElement).value.replace(
                /[^0-9]/g,
                ''
              );
            }
          }}
          value={portInput ?? ''}
          onChange={(e) => setInputPort(e.target.value)}
          //defaultValue={props.savedPortValue ?? ''}
          //disabled={isLocal}
        />
      </div>
      <button type="button" className="btn-secondary" onClick={handleReset}>
        Сброс настроек
      </button>
    </Modal>
  );
};
