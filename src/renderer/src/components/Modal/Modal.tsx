import React from 'react';

import { ReactComponent as Cross } from '@renderer/assets/icons/cross.svg';
import ReactModal, { Props } from 'react-modal';

import './style.css';

ReactModal.setAppElement('#root');

interface ModalProps extends Props {
  title: string;
  cancelLabel?: string;
  submitLabel?: string;
  extraLabel?: string;
  children: React.ReactNode;
  onExtra?: React.FormEventHandler;
  onSubmit: React.FormEventHandler;
}

export const Modal: React.FC<ModalProps> = ({
  children,
  title,
  onSubmit,
  cancelLabel,
  submitLabel,
  extraLabel: extraButton,
  onExtra: onExtraButton,
  ...props
}) => {
  return (
    <ReactModal
      {...props}
      className="absolute left-1/2 top-28 w-full max-w-2xl -translate-x-1/2 rounded-lg bg-neutral-800 p-6 text-neutral-100 outline-none"
      overlayClassName="bg-neutral-700 fixed inset-0 backdrop-blur"
      closeTimeoutMS={100}
    >
      <div className="relative mb-5 flex items-center justify-between border-b border-neutral-400 pb-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        <button
          className="rounded-full border-none p-3 text-neutral-50 shadow-none outline-1 outline-neutral-100 transition-colors hover:bg-neutral-700"
          onClick={props.onRequestClose}
        >
          <Cross width="1rem" height="1rem" />
        </button>
      </div>

      <form onSubmit={onSubmit}>
        <div className="mb-4">{children}</div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded px-4 py-2 text-neutral-400 transition-colors hover:text-neutral-50"
            onClick={props.onRequestClose}
          >
            {cancelLabel ?? 'Закрыть'}
          </button>
          <button
            type="button"
            className="rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
            hidden={!extraButton}
            onClick={onExtraButton}
          >
            {extraButton ?? ''}
          </button>
          <button
            type="submit"
            className="rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
          >
            {submitLabel ?? 'Сохранить'}
          </button>
        </div>
      </form>
    </ReactModal>
  );
};
