// TODO: нужно как-то объединить файлы FlasherSelectModal.tsx, ServerSelectModal.tsx, DocSelectModal.tsx, чтобы уменьшить повторения кода
import React, { useState } from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from '../Modal/Modal';

import { TextInput } from '../Modal/TextInput';

import { twMerge } from 'tailwind-merge';

interface DocSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleCustom: (host: string) => void;
  // надпись на самом верху
  topTitle: string;
  // значение пользовательского хоста, которое сохранилось в electron-settings (при null или undefined пользователь увидит пустую строку)
  savedHostValue: string | undefined | null;
  // значение хоста к которому клиент подключается при первом запуске
  originaltHostValue: string;
}

export const DocSelectModal: React.FC<DocSelectModalProps> = ({
  onClose,
  handleCustom: handleCustom,
  ...props
}) => {
  const { handleSubmit: hookHandleSubmit } = useForm<{}>();

  // хост, отображаемый пользователю на форме ввода данных
  const [hostInput, setInputHost] = useState(props.savedHostValue);

  //const hostRef = useRef(props.customHostValue);
  //const hostRef = useRef<HTMLInputElement>(null);

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
        Сброс настроек
      </button>
    </Modal>
  );
  // TODO: использовать символ ↺ (или что похожее) для кнопки сброса
  // <button className="w-0">↺</button>
  // <button className="h-0 w-0">↺</button>;
};
