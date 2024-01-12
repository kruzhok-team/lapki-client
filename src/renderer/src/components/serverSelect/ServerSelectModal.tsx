import { useState } from 'react';

import { useForm } from 'react-hook-form';

import { Modal, TextInput } from '@renderer/components/UI';

import { Settings } from '../Modules/Settings';

interface ServerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleCustom: (host: string, port: number) => void;
  // надпись на самом верху
  topTitle: string;
  // надпись над меню выбора типа сервера
  textSelectTitle: string;
  // значение хоста к которому клиент подключается при первом запуске
  originaltHostValue: string;
  // значение порта к которому клиент подключается при первом запуске
  originaltPortValue: string;
  // ключ для извлечения настроек
  electronSettingsKey: string;
}

interface formValues {
  // текущее значение поля ввода для хоста
  inputHost: string;
  // текущее значение поля ввода для порта
  inputPort: string;
}

export const ServerSelectModal: React.FC<ServerSelectModalProps> = ({
  onClose,
  handleCustom: handleCustom,
  ...props
}) => {
  const {
    handleSubmit: hookHandleSubmit,
    setValue,
    register,
    reset,
  } = useForm<formValues>({
    defaultValues: async () => {
      return Settings.get(props.electronSettingsKey).then((server) => {
        return {
          inputHost: server.host,
          inputPort: server.port,
        };
      });
    },
  });

  // последнии отправленные пользователем хост и порт
  const [lastHost, setLastHost] = useState<string | undefined>(undefined);
  const [lastPort, setLastPort] = useState<string | undefined>(undefined);

  const handleSubmit = hookHandleSubmit((data) => {
    setLastHost(data.inputHost);
    setLastPort(data.inputPort);
    handleCustom(data.inputHost, Number(data.inputPort));
    onRequestClose();
  });

  const onRequestClose = () => {
    onClose();
  };

  const handleReturnOriginalValues = () => {
    setValue('inputHost', props.originaltHostValue);
    setValue('inputPort', props.originaltPortValue);
  };

  const onAfterOpen = () => {
    if (lastHost != undefined && lastPort != undefined) {
      reset({ inputHost: lastHost, inputPort: lastPort });
    } else {
      reset();
    }
  };

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={props.topTitle}
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
      onAfterOpen={onAfterOpen}
    >
      <div className={'flex'}>
        <TextInput
          maxLength={80}
          {...register('inputHost')}
          label="Хост:"
          placeholder="Напишите адрес хоста"
          isHidden={false}
          error={false}
          errorMessage={''}
        />
        <TextInput
          {...register('inputPort')}
          label="Порт:"
          placeholder="Напишите порт"
          isHidden={false}
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
        />
      </div>
      <button type="button" className="btn-secondary" onClick={handleReturnOriginalValues}>
        Сбросить настройки
      </button>
    </Modal>
  );
};
