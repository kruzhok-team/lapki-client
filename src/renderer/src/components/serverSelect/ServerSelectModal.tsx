import { useForm } from 'react-hook-form';

import { Modal, TextField } from '@renderer/components/UI';

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
  host: string;
  // текущее значение поля ввода для порта
  port: string;
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
          host: server.host,
          port: server.port,
        };
      });
    },
  });

  const handleSubmit = hookHandleSubmit((data) => {
    handleCustom(data.host, Number(data.port));
    onRequestClose();
  });

  const onRequestClose = () => {
    onClose();
  };

  const handleReturnOriginalValues = () => {
    setValue('host', props.originaltHostValue);
    setValue('port', props.originaltPortValue);
  };

  const reloadSettings = () => {
    Settings.get(props.electronSettingsKey).then((server) => {
      reset({ host: server.host, port: server.port });
    });
  };

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={props.topTitle}
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
      onAfterClose={reloadSettings}
    >
      <div className={'mb-2 flex gap-2'}>
        <TextField
          maxLength={80}
          {...register('host')}
          label="Хост:"
          placeholder="Напишите адрес хоста"
          hidden={false}
          error={false}
          errorMessage={''}
        />
        <TextField
          {...register('port')}
          label="Порт:"
          placeholder="Напишите порт"
          hidden={false}
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
