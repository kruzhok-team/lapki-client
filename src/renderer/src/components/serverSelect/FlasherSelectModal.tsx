import React, { useState } from 'react';

import { useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import { Modal } from '../Modal/Modal';
import { TextInput } from '../Modal/TextInput';
import { TextSelectOptions } from '../Modal/TextSelectOptions';
import { Flasher } from '../Modules/Flasher';

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
  const { register, handleSubmit: hookHandleSubmit } = useForm<FlasherSelectModalFormValues>();

  const SELECT_LOCAL = 'local';
  const SELECT_REMOTE = 'remote';

  // октрыта ли опция выбора локального загрузчика
  const [isLocal, setLocal] = useState(false);
  const handleHidden = (event) => {
    // текстовые поля становятся видимыми, если выбран удалённый хост
    setLocal(event.target.value == SELECT_LOCAL);
  };

  const handleSubmit = hookHandleSubmit((data) => {
    if (data.flasherType == SELECT_LOCAL) {
      handleLocal();
    } else {
      handleRemote(data.host, data.port);
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
      title={'Выберите загрузчик'}
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center">
        <TextSelectOptions
          label="Загрузчик"
          {...register('flasherType', {
            required: 'Это поле обязательно к заполнению!',
          })}
          onChange={handleHidden}
          isElse={false}
          error={false}
          errorMessage={''}
          options={[
            { value: SELECT_REMOTE, label: 'Удалённый' },
            { value: SELECT_LOCAL, label: 'Локальный' },
          ]}
        />
      </div>
      <div className={twMerge('flex', isLocal && 'opacity-50')}>
        <TextInput
          label="Хост:"
          {...register('host')}
          placeholder="Напишите адрес хоста"
          isElse={isLocal}
          error={false}
          errorMessage={''}
          defaultValue={Flasher.remoteHost ?? ''}
          //disabled={isLocal}
        />
        <TextInput
          label="Порт:"
          {...register('port')}
          placeholder="Напишите порт"
          isElse={isLocal}
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
          defaultValue={Flasher.remotePort ?? ''}
          //disabled={isLocal}
        />
      </div>
    </Modal>
  );
};
