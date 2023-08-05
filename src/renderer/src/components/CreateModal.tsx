import React from 'react';

import { useForm } from 'react-hook-form';

import { ColorInput } from './Modal/ColorInput';
import { Modal } from './Modal/Modal';
import { TextInput } from './Modal/TextInput';
import { twMerge } from 'tailwind-merge';

interface CreateModalProps {
  isOpen: boolean;
  isData: { state } | undefined;
  isName: { state; position } | undefined;
  onClose: () => void;
  onSubmit: (data: CreateModalFormValues) => void;
}

export interface CreateModalFormValues {
  id: string;
  key: number;
  name: string;
  events: string;
  color: string;
  component: string;
  method: string;
}

export const CreateModal: React.FC<CreateModalProps> = ({
  onSubmit,
  onClose,
  isData,
  isName,
  ...props
}) => {
  const {
    register,
    reset,
    handleSubmit: hookHandleSubmit,
    formState: { errors },
  } = useForm<CreateModalFormValues>({
    defaultValues: {
      color: '#ffffff',
    },
  });

  const input = document.getElementById('input') as HTMLInputElement | null;

  const onRequestClose = () => {
    onClose();
    // TODO: пока кажется лишним затирать текстовые поля
    reset({ color: '#ffffff' });
  };

  const handleSubmit = hookHandleSubmit((data) => {
    isData?.state.id !== undefined
      ? ((data.id = isData?.state.id), (data.name = isData?.state.data.name), (data.key = 1))
      : input?.value !== undefined
      ? ((data.id = isName?.state.id), (data.name = input?.value), (data.key = 2))
      : (data.key = 3);
    onSubmit(data);
  });

  const handleEnter = (e) => {
    var keyCode = e.keyCode;
    if (keyCode === 13 || keyCode === 27) {
      handleSubmit();
    }
  };

  if (input !== null) {
    input.style.left = isName?.position.x + 'px';
    input.style.top = isName?.position.y + 'px';
    input.style.width = isName?.position.width + 'px';
    input.style.height = isName?.position.height + 'px';

    input.onkeydown = handleEnter;

    input.focus();
  }

  return (
    <>
      {isName !== undefined ? (
        <>
          <input
            id="input"
            className={twMerge('fixed rounded-t-[6px] bg-[#525252] font-Fira text-white')}
            placeholder="Придумайте название"
            maxLength={20}
            {...register('name', {
              required: 'Это поле обязательно к заполнению!',
              minLength: { value: 2, message: 'Минимум 2 символа!' },
            })}
          />
        </>
      ) : (
        <>
          <Modal
            {...props}
            onRequestClose={onRequestClose}
            title={
              isData?.state.id !== undefined
                ? 'Редактирование состояния: ' + JSON.stringify(isData?.state.data.name)
                : 'Редактор соединения'
            }
            onSubmit={handleSubmit}
            submitLabel="Сохранить"
          >
            {!isData || (
              <>
                <TextInput
                  label="Событие:"
                  placeholder="Выберите событие"
                  {...register('events', {
                    required: 'Это поле обязательно к заполнению!',
                    minLength: { value: 2, message: 'Минимум 2 символа!' },
                  })}
                  error={!!errors.events}
                  errorMessage={errors.events?.message ?? ''}
                />
              </>
            )}

            <TextInput
              label="Компонент:"
              placeholder="Компонент"
              {...register('component', {
                required: 'Это поле обязательно к заполнению!',
                minLength: { value: 2, message: 'Минимум 2 символа' },
              })}
              error={!!errors.component}
              errorMessage={errors.component?.message ?? ''}
            />
            <TextInput
              label="Метод:"
              placeholder="Метод"
              {...register('method', {
                required: 'Это поле обязательно к заполнению!',
                minLength: { value: 2, message: 'Минимум 2 символа' },
              })}
              error={!!errors.method}
              errorMessage={errors.method?.message ?? ''}
            />
            {isData !== undefined || (
              <>
                <ColorInput
                  label="Цвет связи:"
                  {...register('color', { required: 'Это поле обязательно к заполнению!' })}
                  error={!!errors.color}
                  errorMessage={errors.color?.message ?? ''}
                />
              </>
            )}
          </Modal>
        </>
      )}
    </>
  );
};
