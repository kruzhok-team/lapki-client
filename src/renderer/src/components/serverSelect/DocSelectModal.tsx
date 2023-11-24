// TODO: нужно как-то объединить файлы FlasherSelectModal.tsx, ServerSelectModal.tsx, DocSelectModal.tsx, чтобы уменьшить повторения кода
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
  // значение хоста к которому клиент подключается при первом запуске
  originaltHostValue: string;
  // ключ для извлечения настроек
  electronSettingsKey: string;
}

interface formValues {
  // текущее значение поля ввода для адреса
  inputHost: string;
}

export const DocSelectModal: React.FC<DocSelectModalProps> = ({
  onClose,
  handleCustom: handleCustom,
  ...props
}) => {
  const {
    register,
    handleSubmit: hookHandleSubmit,
    setValue,
    formState: { isDirty },
  } = useForm<formValues>({
    defaultValues: async () => {
      return Settings.get(props.electronSettingsKey).then((server) => {
        return {
          inputHost: server.host ?? '',
          connectedHost: server.host ?? '',
        };
      });
    },
  });
  // текущий адрес к которому подключен клиент
  const handleSubmit = hookHandleSubmit((data) => {
    handleCustom(String(data.inputHost));
    onRequestClose();
  });

  const onRequestClose = () => {
    onClose();
  };

  const handleReturnOriginalValues = () => {
    setValue('inputHost', props.originaltHostValue);
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
      <div className={twMerge('flex')}>
        <TextInput
          maxLength={80}
          {...register('inputHost')}
          label="Адрес:"
          placeholder="Напишите адрес"
          isHidden={false}
          error={false}
          errorMessage={''}
        />
      </div>
      <button type="button" className="btn-secondary" onClick={handleReturnOriginalValues}>
        Сбросить настройки
      </button>
    </Modal>
  );
  // TODO: использовать символ ↺ (или что похожее) для кнопки сброса
  // <button className="w-0">↺</button>
  // <button className="h-0 w-0">↺</button>;
};
