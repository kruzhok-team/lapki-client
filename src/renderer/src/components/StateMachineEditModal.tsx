import { Controller, UseFormReturn } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import { Modal, ParameterSelect } from '@renderer/components/UI';
import { StateMachineData } from '@renderer/lib/types';
import { useModelContext } from '@renderer/store/ModelContext';

import { ComponentFormFieldLabel } from './ComponentFormFieldLabel';

type optionType = {
  label: string;
  value: string;
};

interface StateMachineEditModalProps {
  variant: 'create' | 'edit';
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
  duplicateStateMachine?: () => void;
}

export const StateMachineEditModal: React.FC<StateMachineEditModalProps> = ({
  variant,
  isOpen,
  onClose,
  onSubmit,
  submitLabel,
  sideLabel,
  onSide,
  duplicateStateMachine,
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
  const isCreateMode = variant === 'create';

  // Сброс к начальному состоянию после закрытия
  const handleAfterClose = () => {
    editor.focus();
    reset();
  };

  const handleSubmit = hookHandleSubmit((data) => {
    if (isDuplicateName(data.name ?? '')) {
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
      title={isCreateMode ? 'Новая машина состояний' : 'Редактор машины состояний'}
      middleLabel={duplicateStateMachine ? 'Дублировать' : undefined}
      onMiddle={duplicateStateMachine}
      submitLabel={submitLabel}
      onSubmit={handleSubmit}
      sideLabel={sideLabel}
      onSide={handleDelete ?? undefined}
      className="top-5 w-[calc(100%-40px)] max-w-[404px]"
      contentClassName="mb-6"
      actionsClassName="gap-3"
      sideClassName="btn-secondary border-danger danger"
      middleClassName="btn-secondary border-primary text-primary"
      hideCancelButton
    >
      <div className="flex flex-col gap-3">
        <Controller
          name="name"
          control={control}
          render={({ field: { onChange, value } }) => (
            <ComponentFormFieldLabel
              label="Название"
              labelClassName="w-[72px]"
              placeholder={isCreateMode ? 'Введите название' : 'Введите название...'}
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
            <ComponentFormFieldLabel
              label="Платформа"
              labelClassName="w-[72px]"
              error={errors.platform?.message}
            >
              <ParameterSelect
                className={twMerge('w-full', selectorDisable && 'opacity-60')}
                isSearchable={false}
                placeholder={isCreateMode ? 'Выберите платформу' : 'Выберите платформу...'}
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
