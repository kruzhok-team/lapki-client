import React, { useState } from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from './Modal/Modal';

import { TextInput } from './Modal/TextInput';

import { SELECT_LOCAL, SELECT_REMOTE, TextSelectFlasher } from './Modal/TextSelectFlasher';
import { Position } from 'monaco-editor';

const localStorageHost = 'host';
const localStoragePort = 'port';

interface FlasherSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleLocal: () => void;
  handleRemote: (host: string, port: number) => void;
}

export interface FlasherSelectModalFormValues {
  host: string;
  port: number;
  flasherType: string;
}

export const FlasherSelectModal: React.FC<FlasherSelectModalProps> = ({
  onClose,
  handleLocal,
  handleRemote,
  ...props
}) => {
  const {
    register,
    reset,
    handleSubmit: hookHandleSubmit,
  } = useForm<FlasherSelectModalFormValues>();

  // настройка видимости текстовых полей
  const [isHidden, setHidden] = useState(true);
  const handleHidden = (event) => {
    // текстовые поля становятся видимыми, если выбран удалённый хост
    setHidden(event.target.value != SELECT_REMOTE);
  };

  const handleSubmit = hookHandleSubmit((data) => {
    onRequestClose();
    if (data.flasherType == SELECT_LOCAL) {
      handleLocal();
    } else {
      localStorage.setItem(localStorageHost, data.host);
      localStorage.setItem(localStoragePort, data.port.toString());
      handleRemote(data.host, data.port);
    }
  });

  const onRequestClose = () => {
    setHidden(true);
    onClose();
    reset();
  };
  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={'Выберите загрузчик'}
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center">
        <TextSelectFlasher
          label="Загрузчик"
          {...register('flasherType', {
            required: 'Это поле обязательно к заполнению!',
          })}
          onChange={handleHidden}
          isElse={false}
          error={false}
          errorMessage={''}
        />
      </div>
      <div className="flex">
        <TextInput
          label="Хост:"
          {...register('host')}
          placeholder="Напишите адрес хоста"
          isElse={isHidden}
          error={false}
          errorMessage={''}
          defaultValue={localStorage.getItem(localStorageHost) ?? ''}
        />
        <TextInput
          label="Порт:"
          {...register('port')}
          placeholder="Напишите порт"
          isElse={isHidden}
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
          defaultValue={localStorage.getItem(localStoragePort) ?? ''}
        />
      </div>
    </Modal>
  );
};
