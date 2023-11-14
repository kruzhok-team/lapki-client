import React, { useState } from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from './Modal/Modal';

import { TextInput } from './Modal/TextInput';

import { SELECT_LOCAL, SELECT_REMOTE } from './Modal/TextSelectFlasher';
import { TextSelectOptions } from './Modal/TextSelectOptions';

const localStorageHost = 'host';
const localStoragePort = 'port';

interface ServerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleDefault: () => void;
  handleCustom: (host: string, port: number) => void;
  // надпись на самом верху
  topTitle: string;
  // надпись над меню выбора типа сервера
  textSelectTitle: string;
  // название опции выбора сервера по-умолчанию
  defaultTitle: string;
  // название опции выбора пользовательского сервера
  customTitle: string;
}

export interface selectModalFormValues {
  host: string;
  port: number;
  serverType: string;
}

export const ServerSelectModal: React.FC<ServerSelectModalProps> = ({
  onClose,
  handleDefault: handleDefault,
  handleCustom: handleCustom,
  ...props
}) => {
  const { register, reset, handleSubmit: hookHandleSubmit } = useForm<selectModalFormValues>();

  // настройка видимости текстовых полей
  const [isHidden, setHidden] = useState(true);
  const handleHidden = (event) => {
    // текстовые поля становятся видимыми, если выбран пользовательский хост
    setHidden(event.target.value != SELECT_REMOTE);
  };

  const handleSubmit = hookHandleSubmit((data) => {
    onRequestClose();
    if (data.serverType == SELECT_LOCAL) {
      handleDefault();
    } else {
      localStorage.setItem(localStorageHost, data.host);
      localStorage.setItem(localStoragePort, data.port.toString());
      handleCustom(data.host, data.port);
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
      title={props.topTitle}
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center">
        <TextSelectOptions
          label={props.textSelectTitle}
          {...register('serverType', {
            required: 'Это поле обязательно к заполнению!',
          })}
          onChange={handleHidden}
          isElse={false}
          error={false}
          errorMessage={''}
          options={[
            { value: SELECT_LOCAL, label: props.defaultTitle },
            { value: SELECT_REMOTE, label: props.customTitle },
          ]}
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
