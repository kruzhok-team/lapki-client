import { Controller, UseFormReturn } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import { Modal, Select } from '@renderer/components/UI';
import { useModelContext } from '@renderer/store/ModelContext';

import { ComponentFormFieldLabel } from './ComponentFormFieldLabel';

type optionType = {
  label: string;
  value: string;
};

interface StateMachineEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StateMachineData) => void;
  submitLabel: string;
  sideLabel: string | undefined;
  onSide: (() => void) | undefined;
  form: UseFormReturn<StateMachineData>;
  platformList: optionType[];
  isDuplicateName: (name: string) => boolean;
  selectPlatformDisabled: boolean;
}

// TODO (Roundabout1): наверное стоит перенести этот тип данных в другое место?
export type StateMachineData = {
  name: string;
  platform: string;
};

export const StateMachineEditModal: React.FC<StateMachineEditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  submitLabel,
  sideLabel,
  onSide,
  form,
  platformList,
  isDuplicateName,
  selectPlatformDisabled: selectorDisable,
}) => {
  const {
    handleSubmit: hookHandleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = form;
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const editor = modelController.controllers[headControllerId].app;

  // Сброс к начальному состоянию после закрытия
  const handleAfterClose = () => {
    editor.focus();
  };

  const handleSubmit = hookHandleSubmit((data) => {
    if (isDuplicateName(data.name)) {
      setError('name', { message: 'Имя не должно повторять имена или ID других машин состояний' });
      return;
    }
    if (!data.platform) {
      setError('platform', { message: 'Выберите платформу' });
      return;
    }
    onSubmit(data);
    reset({ name: undefined, platform: undefined });
    onClose();
  });

  const handleDelete = () => {
    if (onSide === undefined) return;
    onSide();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      onAfterClose={handleAfterClose}
      title="Машина состояний"
      submitLabel={submitLabel}
      onSubmit={handleSubmit}
      sideLabel={sideLabel}
      onSide={handleDelete ?? undefined}
    >
      <div className="flex flex-col gap-2">
        <Controller
          name="name"
          control={control}
          render={({ field: { onChange, value } }) => (
            <ComponentFormFieldLabel
              label="Название"
              placeholder="Введите название..."
              onChange={onChange}
              value={value ?? ''}
              error={errors.name?.message}
            ></ComponentFormFieldLabel>
          )}
        />
        <Controller
          name="platform"
          control={control}
          render={({ field: { onChange, value } }) => (
            <ComponentFormFieldLabel label="Платформа" error={errors.platform?.message}>
              <Select
                className={twMerge('w-[250px]', selectorDisable && 'opacity-60')}
                isSearchable={false}
                placeholder="Выберите платформу..."
                options={platformList}
                value={platformList.find((opt) => opt.value === value)}
                onChange={(opt) => {
                  onChange(opt?.value);
                }}
                isDisabled={selectorDisable}
              />
            </ComponentFormFieldLabel>
          )}
        />
      </div>
    </Modal>
  );
};
