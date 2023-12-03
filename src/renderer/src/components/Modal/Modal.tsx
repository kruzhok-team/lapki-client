import React from 'react';

import ReactModal, { Props } from 'react-modal';

import { ReactComponent as Close } from '@renderer/assets/icons/close.svg';

import './style.css';
import { twMerge } from 'tailwind-merge';

ReactModal.setAppElement('#root');

interface ModalProps extends Omit<Props, 'className' | 'overlayClassName'> {
  title: string;
  cancelLabel?: string;
  submitLabel?: string;
  extraLabel?: string;
  sideLabel?: string;
  children: React.ReactNode;
  onExtra?: React.FormEventHandler;
  onSide?: React.FormEventHandler;
  onSubmit?: React.FormEventHandler;
  submitDisabled?: boolean;
  className?: string;
  overlayClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  children,
  title,
  onSubmit,
  cancelLabel,
  submitLabel,
  extraLabel,
  sideLabel,
  onExtra,
  onSide,
  submitDisabled,
  className,
  overlayClassName,
  ...props
}) => {
  return (
    <ReactModal
      {...props}
      className={twMerge(
        'absolute left-1/2 top-12 max-h-[90vh] w-full max-w-3xl -translate-x-1/2 rounded-lg bg-bg-primary p-6 outline-none',
        className
      )}
      overlayClassName={twMerge(
        'bg-[rgba(0,0,0,0.6)] fixed inset-0 backdrop-blur z-50',
        overlayClassName
      )}
      closeTimeoutMS={100}
    >
      <div className="relative mb-3 flex items-center justify-between border-b border-border-primary pb-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        <button
          className="rounded-full p-3 transition-colors hover:bg-bg-hover active:bg-bg-active"
          onClick={props.onRequestClose}
        >
          <Close width="1rem" height="1rem" />
        </button>
      </div>

      <form onSubmit={onSubmit}>
        <div className="mb-4">{children}</div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded px-4 py-2 text-red-400 transition-colors hover:text-red-200"
            onClick={onSide}
            hidden={!sideLabel}
          >
            {sideLabel}
          </button>
          <div className="flex-grow"></div>
          <button type="button" className="btn-secondary" onClick={props.onRequestClose}>
            {cancelLabel ?? 'Закрыть'}
          </button>
          <button type="button" className="btn-primary" hidden={!extraLabel} onClick={onExtra}>
            {extraLabel ?? ''}
          </button>
          <button
            type="submit"
            className="btn-primary"
            hidden={!onSubmit}
            disabled={submitDisabled}
          >
            {submitLabel ?? 'Сохранить'}
          </button>
        </div>
      </form>
    </ReactModal>
  );
};
