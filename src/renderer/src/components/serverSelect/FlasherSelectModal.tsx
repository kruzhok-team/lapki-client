import { useLayoutEffect } from 'react';

import { Controller, useForm } from 'react-hook-form';

import { Select, Modal, TextField } from '@renderer/components/UI';
import { useSettings } from '@renderer/hooks';

// import { Settings } from '../Modules/Settings';

// const SELECT_LOCAL = 'local';
// const SELECT_REMOTE = 'remote';

const options = [
  { value: 'remote', label: 'Удалённый' },
  { value: 'local', label: 'Локальный' },
];

interface FlasherSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FlasherSelectModalFormValues) => void;

  handleLocal: () => void;
  handleRemote: (host: string, port: number) => void;
}

export interface FlasherSelectModalFormValues {
  host: string;
  port: number;
  type: 'local' | 'remote';
}

export const FlasherSelectModal: React.FC<FlasherSelectModalProps> = ({
  onClose,
  onSubmit,
  ...props
}) => {
  const [flasherSetting] = useSettings('flasher');

  const {
    register,
    control,
    handleSubmit: hookHandleSubmit,
    watch,
    setValue,
    reset,
  } = useForm<FlasherSelectModalFormValues>({
    // defaultValues: async () => {
    //   return Settings.getFlasherSettings().then((server) => {
    //     return {
    //       host: String(server.host),
    //       port: Number(server.port),
    //       flasherType: SELECT_REMOTE,
    //     };
    //   });
    // },
  });

  const isSecondaryFieldsDisabled = watch('type') === 'local';

  const handleSubmit = hookHandleSubmit((data) => {
    // if (data.flasherType == SELECT_LOCAL) {
    //   handleLocal();
    // } else {
    //   handleRemote(data.host, data.port);
    // }
    onSubmit(data);
    onClose();
  });

  // const currentServer = () => {
  //   return `Текущий тип сервера: ${isLocal ? 'локальный' : 'удалённый'}`;
  // };

  // const resetSettings = () => {
  //   Settings.getFlasherSettings().then((server) => {
  //     reset({ host: String(server.host), port: Number(server.port), flasherType: SELECT_REMOTE });
  //   });
  // };

  const currentServerLabel = `Текущий тип сервера: ${
    flasherSetting?.type === 'local' ? 'локальный' : 'удалённый'
  }`;

  useLayoutEffect(() => {
    if (!flasherSetting) return;

    setValue('type', flasherSetting.type);
    setValue('host', flasherSetting.host ?? '');
    setValue('port', Number(flasherSetting.port ?? ''));
  }, [setValue, flasherSetting]);

  return (
    <Modal
      {...props}
      onRequestClose={onClose}
      title={'Выберите загрузчик'}
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
      // onAfterClose={resetSettings}
    >
      <div className="flex items-center">
        <Controller
          control={control}
          name="type"
          render={({ field: { value, onChange } }) => {
            const handleChange = (v: any) => {
              onChange(v.value);

              console.log('here', v.value);

              if (v.value === 'local') {
                window.electron.ipcRenderer.invoke('Flasher:setFreePort');
              }
            };

            return (
              <div>
                Тип
                <Select
                  value={options.find((opt) => opt.value === value)}
                  onChange={handleChange}
                  options={options}
                  isSearchable={false}
                />
              </div>
            );
          }}
        />
      </div>
      <div className="mb-2 flex gap-2">
        <TextField
          maxLength={80}
          className="disabled:opacity-50"
          label="Хост:"
          {...register('host')}
          placeholder="Напишите адрес хоста"
          disabled={isSecondaryFieldsDisabled}
        />
        <TextField
          className="disabled:opacity-50"
          label="Порт:"
          {...register('port', { valueAsNumber: true })}
          placeholder="Напишите порт"
          // onInput={(event) => {
          //   const { target } = event;
          //   if (target) {
          //     (target as HTMLInputElement).value = (target as HTMLInputElement).value.replace(
          //       /[^0-9]/g,
          //       ''
          //     );
          //   }
          // }}
          disabled={isSecondaryFieldsDisabled}
        />
      </div>

      <div>{currentServerLabel}</div>
    </Modal>
  );
};
