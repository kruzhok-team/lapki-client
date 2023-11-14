import React, { useState } from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from './Modal/Modal';

import { TextInput } from './Modal/TextInput';

import { TextSelectOptions } from './Modal/TextSelectOptions';
import { twMerge } from 'tailwind-merge';

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
  // значение пользовательского порта по-умолчанию (при null или undefined пользователь увидит пустую строку)
  customPortValue: string | undefined | null;
  // значение пользовательского хоста по-умолчанию (при null или undefined пользователь увидит пустую строку)
  customHostValue: string | undefined | null;
}

const SELECT_DEFAULT: string = 'DEFAULT_OPTION_VALUE';
const SELECT_CUSTOM: string = 'CUSTOM_OPTION_VALUE';

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
  const { register, handleSubmit: hookHandleSubmit } = useForm<selectModalFormValues>();

  // настройка видимости текстовых полей
  const [isHidden, setHidden] = useState(false);
  const handleHidden = (event) => {
    // текстовые поля становятся видимыми, если выбран пользовательский хост
    setHidden(event.target.value != SELECT_CUSTOM);
  };

  const handleSubmit = hookHandleSubmit((data) => {
    if (data.serverType == SELECT_DEFAULT) {
      handleDefault();
    } else {
      handleCustom(data.host, data.port);
    }
    onRequestClose();
  });

  const onRequestClose = () => {
    onClose();
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
            { value: SELECT_CUSTOM, label: props.customTitle },
            { value: SELECT_DEFAULT, label: props.defaultTitle },
          ]}
        />
      </div>
      <div className={twMerge('flex', isHidden && 'opacity-50')}>
        <TextInput
          label="Хост:"
          {...register('host')}
          placeholder="Напишите адрес хоста"
          isElse={isHidden}
          error={false}
          errorMessage={''}
          defaultValue={props.customHostValue ?? ''}
          //disabled={isLocal}
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
          defaultValue={props.customPortValue ?? ''}
          //disabled={isLocal}
        />
      </div>
    </Modal>
  );
};
