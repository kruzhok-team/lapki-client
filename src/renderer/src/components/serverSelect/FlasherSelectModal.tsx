import { useLayoutEffect } from 'react';

import { Controller, useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import { Select, Modal, TextField, Checkbox } from '@renderer/components/UI';
import { useSettings } from '@renderer/hooks';

const options = [
  { value: 'remote', label: 'Удалённый' },
  { value: 'local', label: 'Локальный' },
];

interface FlasherSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FlasherSelectModalFormValues) => void;
}

export interface FlasherSelectModalFormValues {
  host: string;
  port: number;
  type: 'local' | 'remote';
  avrdudePath: string;
  avrdudeSystemPath: boolean;
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
  } = useForm<FlasherSelectModalFormValues>();

  const isSecondaryFieldsDisabled = watch('type') === 'local';

  const isChecked = watch('avrdudeSystemPath') == true;

  const handleSubmit = hookHandleSubmit((data) => {
    onSubmit(data);
    onClose();
  });

  const currentServerLabel = `Текущий тип сервера: ${
    flasherSetting?.type === 'local' ? 'локальный' : 'удалённый'
  }`;

  useLayoutEffect(() => {
    if (!flasherSetting) return;

    setValue('type', flasherSetting.type);
    setValue('host', flasherSetting.host ?? '');
    setValue('port', Number(flasherSetting.port ?? ''));
    setValue('avrdudePath', flasherSetting.avrdudePath);
    setValue('avrdudeSystemPath', flasherSetting.avrdudeSystemPath);
  }, [setValue, flasherSetting]);

  const handleReboot = async () => {
    // TODO: проверка на то, что монитор порта закрыт и прошивка не идёт
    await window.electron.ipcRenderer.invoke('Module:reboot', 'lapki-flasher');
  };

  return (
    <Modal
      {...props}
      onRequestClose={onClose}
      title={'Настройки загрузчика'}
      submitLabel="Подключиться"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center">
        <Controller
          control={control}
          name="type"
          render={({ field: { value, onChange } }) => {
            const handleChange = (v: any) => {
              onChange(v.value);

              if (v.value !== 'local' || !flasherSetting) return;

              setValue('port', flasherSetting.localPort);
              setValue('host', 'localhost');
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
                <div>{currentServerLabel}</div>
              </div>
            );
          }}
        />
      </div>
      <br></br>
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
          onInput={(event) => {
            const { target } = event;
            if (target) {
              (target as HTMLInputElement).value = (target as HTMLInputElement).value.replace(
                /[^0-9]/g,
                ''
              );
            }
          }}
          disabled={isSecondaryFieldsDisabled}
        />
      </div>
      <br></br>
      <div className={twMerge(!isSecondaryFieldsDisabled && 'hidden')}>
        <div className="mb-2 flex gap-2">
          <TextField
            maxLength={200}
            className="disabled:opacity-50"
            label="Путь к avrdude:"
            {...register('avrdudePath')}
            placeholder="Напишите путь к avrdude"
            disabled={isChecked}
          />
          <Checkbox
            checked={isChecked}
            onCheckedChange={() => setValue('avrdudeSystemPath', !isChecked)}
            className="mr-2 mt-[9px]"
          />
          Использовать системный путь
        </div>
        <button className="btn-primary" onClick={handleReboot}>
          Перезапустить <br></br>загрузчик
        </button>
      </div>
    </Modal>
  );
};
