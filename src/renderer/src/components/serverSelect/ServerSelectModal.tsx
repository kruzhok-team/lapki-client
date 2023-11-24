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
    formState: { isDirty },
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

  const handleSubmit = hookHandleSubmit((data) => {
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

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={props.topTitle}
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
      submitDisabled={!isDirty}
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
