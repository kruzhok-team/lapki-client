// TODO: нужно как-то объединить файлы FlasherSelectModal.tsx, ServerSelectModal.tsx, DocSelectModal.tsx, чтобы уменьшить повторения кода

import { useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import { Modal, TextField } from '@renderer/components/UI';

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
  host: string;
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
    reset,
  } = useForm<formValues>({
    defaultValues: async () => {
      return Settings.get(props.electronSettingsKey).then((server) => {
        return {
          host: server.host ?? '',
        };
      });
    },
  });

  // текущий адрес к которому подключен клиент
  const handleSubmit = hookHandleSubmit((data) => {
    handleCustom(String(data.host));
    onRequestClose();
  });

  const onRequestClose = () => {
    onClose();
  };

  const handleReturnOriginalValues = () => {
    setValue('host', props.originaltHostValue);
  };

  const resetSettings = () => {
    Settings.get(props.electronSettingsKey).then((server) => {
      reset({ host: server.host ?? '' });
    });
  };

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={props.topTitle}
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
      onAfterClose={resetSettings}
    >
      <div className={twMerge('flex')}>
        <TextField
          maxLength={80}
          {...register('host')}
          label="Адрес:"
          placeholder="Напишите адрес"
          hidden={false}
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
