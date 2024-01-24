import { Controller, useForm } from 'react-hook-form';

import { Select, Modal, TextInput } from '@renderer/components/UI';

import { Settings } from '../Modules/Settings';

const SELECT_LOCAL = 'local';
const SELECT_REMOTE = 'remote';

const options = [
  { value: SELECT_REMOTE, label: 'Удалённый' },
  { value: SELECT_LOCAL, label: 'Локальный' },
];

interface FlasherSelectModalProps {
  isOpen: boolean;
  isLocal: boolean;
  onClose: () => void;
  handleLocal: () => void;
  handleRemote: (host: string, port: number) => void;
}

interface formValues {
  host: string;
  port: number;
  flasherType: string;
}

export const FlasherSelectModal: React.FC<FlasherSelectModalProps> = ({
  onClose,
  handleLocal,
  handleRemote,
  isLocal,
  ...props
}) => {
  const {
    register,
    control,
    handleSubmit: hookHandleSubmit,
    watch,
    reset,
  } = useForm<formValues>({
    defaultValues: async () => {
      return Settings.getFlasherSettings().then((server) => {
        return {
          host: String(server.host),
          port: Number(server.port),
          flasherType: SELECT_REMOTE,
        };
      });
    },
  });
  // октрыта ли опция выбора локального загрузчика
  const showSecondaryField = watch('flasherType') === SELECT_REMOTE;

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

  const currentServer = () => {
    return `Текущий тип сервера: ${isLocal ? 'локальный' : 'удалённый'}`;
  };

  const resetSettings = () => {
    Settings.getFlasherSettings().then((server) => {
      reset({ host: String(server.host), port: Number(server.port), flasherType: SELECT_REMOTE });
    });
  };

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={'Выберите загрузчик'}
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
      onAfterClose={resetSettings}
    >
      <div className="flex items-center">
        <Controller
          control={control}
          name="flasherType"
          render={({ field: { value, onChange } }) => (
            <div>
              Тип
              <Select
                value={options.find((opt) => opt.value === value)}
                onChange={(v) => onChange((v as any).value)}
                options={options}
              />
            </div>
          )}
        />
      </div>
      <div className="flex">
        <TextInput
          maxLength={80}
          className="disabled:opacity-50"
          label="Хост:"
          {...register('host')}
          placeholder="Напишите адрес хоста"
          isHidden={false}
          error={false}
          errorMessage={''}
          disabled={!showSecondaryField}
        />
        <TextInput
          className="disabled:opacity-50"
          label="Порт:"
          {...register('port')}
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
          disabled={!showSecondaryField}
        />
      </div>
      <div> {currentServer()}</div>
    </Modal>
  );
};
