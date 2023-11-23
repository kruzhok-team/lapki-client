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
  // текущий адрес к которому подключен клиент
  connectedHost: string;
  // текущий порт к которому подключен клиент
  connectedPort: string;
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
    watch,
  } = useForm<formValues>({
    defaultValues: async () => {
      return Settings.get(props.electronSettingsKey).then((server) => {
        return {
          inputHost: server.host,
          inputPort: server.port,
          connectedHost: server.host,
          connectedPort: server.port,
        };
      });
    },
  });

  const handleSubmit = hookHandleSubmit((data) => {
    handleCustom(data.inputHost, Number(data.inputPort));
    setValue('connectedHost', data.inputHost);
    setValue('connectedPort', data.inputPort);
    onRequestClose();
  });

  const onRequestClose = () => {
    onClose();
  };

  const handleReturnOriginalValues = () => {
    setValue('inputHost', props.originaltHostValue);
    setValue('inputPort', props.originaltPortValue);
  };

  function handleSubmitDisabled(): boolean | undefined {
    const values = watch();
    return values.connectedHost == values.inputHost && values.connectedPort == values.inputPort;
  }

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={props.topTitle}
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
      submitDisabled={handleSubmitDisabled()}
    >
      <div className={'flex'}>
        <TextInput
          {...register('inputHost')}
          label="Хост:"
          placeholder="Напишите адрес хоста"
          isElse={false}
          error={false}
          errorMessage={''}
        />
        <TextInput
          {...register('inputPort')}
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
        />
      </div>
      <button type="button" className="btn-secondary" onClick={handleReturnOriginalValues}>
        Сбросить настройки
      </button>
    </Modal>
  );
};
