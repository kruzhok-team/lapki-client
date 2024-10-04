import React from 'react';

import { UseFormReturn, useFieldArray } from 'react-hook-form';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { ReactComponent as CloseIcon } from '@renderer/assets/icons/close.svg';
import { TextArea, TextInput } from '@renderer/components/UI';

export interface MetaFormValues {
  meta: { name: string; value: string }[];
}

interface MetaProps {
  form: UseFormReturn<MetaFormValues>;
}

export const Meta: React.FC<MetaProps> = ({ form }) => {
  const {
    control,
    register,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    name: 'meta',
    control,
  });

  return (
    <div>
      <h3 className="mb-1 text-xl">Метаданные</h3>

      <div className="mb-2 flex flex-col gap-1">
        {fields.length === 0 && <p className="text-text-inactive">Метаданных нет</p>}

        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-1">
            <label className="flex flex-col">
              <TextInput
                {...register(`meta.${index}.name` as const, { required: 'Обязательное поле' })}
                error={!!errors?.meta?.[index]?.name}
                placeholder="Название"
              />
              <p className="text-sm text-error">{errors?.meta?.[index]?.name?.message}</p>
            </label>

            <label className="flex w-full flex-col">
              <TextArea
                {...register(`meta.${index}.value` as const, { required: 'Обязательное поле' })}
                error={!!errors?.meta?.[index]?.value}
                rows={1}
                placeholder="Значение"
                className="w-full max-w-full"
              />
              <p className="text-sm text-error">{errors?.meta?.[index]?.value?.message}</p>
            </label>
            <button
              type="button"
              className="rounded p-2 transition-colors hover:bg-bg-hover active:bg-bg-active"
              onClick={() => remove(index)}
            >
              <CloseIcon className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn-primary flex items-center gap-3 pl-5"
        onClick={() => append({ name: '', value: '' })}
      >
        <AddIcon className="size-6" />
        Добавить
      </button>
    </div>
  );
};
