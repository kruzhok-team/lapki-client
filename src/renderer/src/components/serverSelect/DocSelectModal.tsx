// TODO: нужно как-то объединить файлы FlasherSelectModal.tsx, ServerSelectModal.tsx, DocSelectModal.tsx, чтобы уменьшить повторения кода
import React, { useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import { Modal } from '../Modal/Modal';
import { TextInput } from '../Modal/TextInput';
import { Settings } from '../Modules/Settings';

interface DocSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleCustom: (host: string) => void;
  // надпись на самом верху
  topTitle: string;
  // значение пользовательского хоста, которое сохранилось в electron-settings (при null или undefined пользователь увидит пустую строку)
  //savedHostValue: string | undefined | null;
  // значение хоста к которому клиент подключается при первом запуске
  originaltHostValue: string;
  // ключ для извлечения настроек
  electronSettingsKey: string;
}

export const DocSelectModal: React.FC<DocSelectModalProps> = ({
  onClose,
  handleCustom: handleCustom,
  ...props
}) => {
  const { handleSubmit: hookHandleSubmit } = useForm<Record<string, never>>();

  // хост, отображаемый пользователю на форме ввода данных
  const [hostInput, setInputHost] = useState('');
  useEffect(() => {
    Settings.get(props.electronSettingsKey).then((server) => {
      setInputHost(server.host);
    });
  }, []);

  const handleSubmit = hookHandleSubmit(() => {
    //console.log('SUBMIT', hostInput, hostCur);
    //setCurHost(hostInput);
    handleCustom(String(hostInput));
    onRequestClose();
  });

  const onRequestClose = () => {
    //console.log('CLOSE', hostInput, hostCur);
    //setInputHost(hostCur);
    onClose();
  };

  const handleReset = () => {
    setInputHost(props.originaltHostValue);
  };

  const handleInput = (e) => {
    setInputHost(e.target.value);
  };
  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={props.topTitle}
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
      //submitDisabled={hostCur == hostInput}
    >
      <div className={twMerge('flex')}>
        <TextInput
          label="Адрес:"
          placeholder="Напишите адрес"
          isElse={false}
          error={false}
          errorMessage={''}
          //defaultValue={props.customHostValue ?? ''}
          value={hostInput ?? ''}
          onChange={handleInput}
          //disabled={isLocal}
        />
      </div>
      <button type="button" className="btn-secondary" onClick={handleReset}>
        Сбросить настройки
      </button>
    </Modal>
  );
  // TODO: использовать символ ↺ (или что похожее) для кнопки сброса
  // <button className="w-0">↺</button>
  // <button className="h-0 w-0">↺</button>;
};
