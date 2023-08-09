import React from 'react';
import ReactModal, { Props } from 'react-modal';

import './Modal/style.css';
import { TextSelect } from './Modal/TextSelect';
import { EventSelection } from '../lib/drawable/Events';
import { useForm } from 'react-hook-form';
import { State } from '@renderer/lib/drawable/State';

interface EventsModalProps extends Props {
  isData: { state: State; event: EventSelection } | undefined;
  title: string;
  cancelLabel?: string;
  submitLabel?: string;
  extraLabel?: string;
  children?: React.ReactNode;
  onExtra?: React.FormEventHandler;
  onSubmit: (data: CreateEventsModalFormValues) => void;
  onClose: () => void;
}

export interface CreateEventsModalFormValues {
  id: { state: State; event: EventSelection } | undefined;
  doComponent: string;
  doMethod: string;
}

export const CreateEventsModal: React.FC<EventsModalProps> = ({
  isData,
  title,
  cancelLabel,
  submitLabel,
  extraLabel,
  children,
  onExtra,
  onSubmit,
  onClose,
  ...props
}) => {
  const {
    register,
    handleSubmit: hookHandleSubmit,
    formState: { errors },
  } = useForm<CreateEventsModalFormValues>();

  const handleSubmit = hookHandleSubmit((data) => {
    data.id = isData;
    onSubmit(data);
  });
  return (
    <ReactModal
      {...props}
      className="absolute left-1/2 top-28 w-full max-w-sm -translate-x-1/2 rounded-lg bg-neutral-800 p-6 text-neutral-100 outline-none"
      overlayClassName="bg-neutral-700 fixed inset-0 backdrop-blur z-50"
      closeTimeoutMS={100}
      onRequestClose={onClose}
    >
      <div className="relative mb-5 justify-between border-b border-neutral-400 pb-1">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <TextSelect
            label="Компонент:"
            placeholder="Выберите компонент события"
            {...register('doComponent', {
              required: 'Это поле обязательно к заполнению!',
            })}
            error={!!errors.doComponent}
            errorMessage={errors.doComponent?.message ?? ''}
          />
          <TextSelect
            label="Действие:"
            placeholder="Выберите метод события"
            {...register('doMethod', {
              required: 'Это поле обязательно к заполнению!',
            })}
            error={!!errors.doMethod}
            errorMessage={errors.doMethod?.message ?? ''}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded px-4 py-2 text-neutral-400 transition-colors hover:text-neutral-50"
            onClick={onClose}
          >
            {cancelLabel ?? 'Закрыть'}
          </button>
          <button
            type="button"
            className="rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
            hidden={!extraLabel}
            onClick={onExtra}
          >
            {extraLabel ?? ''}
          </button>
          <button
            type="submit"
            className="rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
            hidden={!onSubmit}
          >
            {submitLabel ?? 'Сохранить'}
          </button>
        </div>
      </form>
    </ReactModal>
  );
};
