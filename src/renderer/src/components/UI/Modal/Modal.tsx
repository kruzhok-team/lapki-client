import React from 'react';

import ReactModal, { Props } from 'react-modal';
import { twMerge } from 'tailwind-merge';

import './style.css';
import { CloseButton } from './CloseButton';

ReactModal.setAppElement('#root');

interface ModalProps extends Omit<Props, 'className' | 'overlayClassName'> {
  title: React.ReactNode;
  cancelLabel?: string;
  submitLabel?: string;
  extraLabel?: string;
  sideLabel?: string;
  middleLabel?: string;
  children: React.ReactNode;
  onMiddle?: React.FormEventHandler;
  onExtra?: React.FormEventHandler;
  onSide?: React.FormEventHandler;
  onSubmit?: React.FormEventHandler;
  submitDisabled?: boolean;
  className?: string;
  overlayClassName?: string;
  cancelClassName?: string;
  submitClassName?: string;
  extraClassName?: string;
  sideClassName?: string;
  middleClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  closeClassName?: string;
  closeIconClassName?: string;
  formClassName?: string;
  contentClassName?: string;
  actionsClassName?: string;
  hideCancelButton?: boolean;
  onCancel?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  children,
  title,
  onSubmit,
  cancelLabel,
  submitLabel,
  extraLabel,
  sideLabel,
  middleLabel,
  onMiddle,
  onExtra,
  onSide,
  submitDisabled,
  className,
  overlayClassName,
  cancelClassName,
  submitClassName,
  extraClassName,
  sideClassName,
  middleClassName,
  headerClassName,
  titleClassName,
  closeClassName,
  closeIconClassName,
  formClassName,
  contentClassName,
  actionsClassName,
  hideCancelButton,
  onCancel,
  ...props
}) => {
  const handleCancel = onCancel ?? props.onRequestClose;
  return (
    <ReactModal
      {...props}
      className={twMerge(
        'absolute left-1/2 top-12 max-h-[90vh] w-full max-w-3xl -translate-x-1/2 rounded-lg bg-bg-primary p-6 outline-none scrollbar-thumb-current',
        className
      )}
      overlayClassName={twMerge(
        'fixed inset-0 z-[300] bg-[rgba(0,0,0,0.6)] backdrop-blur',
        overlayClassName
      )}
      closeTimeoutMS={100}
    >
      <div
        className={twMerge(
          'relative mb-6 flex items-center justify-between border-b border-border-primary pb-6',
          headerClassName
        )}
      >
        <h1 className={twMerge('text-[12px] font-medium', titleClassName)}>{title}</h1>
        <CloseButton
          className={closeClassName}
          iconClassName={closeIconClassName}
          onClick={props.onRequestClose}
        />
      </div>

      <form className={formClassName} onSubmit={onSubmit}>
        <div className={twMerge('mb-4', contentClassName)}>{children}</div>

        <div className={twMerge('flex items-center justify-end gap-2', actionsClassName)}>
          <button
            type="button"
            className={
              sideClassName ?? 'rounded px-4 py-2 text-red-400 transition-colors hover:text-red-200'
            }
            onClick={onSide}
            hidden={!sideLabel}
          >
            {sideLabel}
          </button>
          <button
            type="button"
            className={middleClassName ?? 'btn-secondary font-medium'}
            onClick={onMiddle}
            hidden={!middleLabel}
          >
            {middleLabel}
          </button>
          <div className="flex-grow"></div>
          <button
            type="button"
            className={twMerge(
              'inline-flex items-center justify-center leading-[14px]',
              cancelClassName ?? 'btn-secondary font-medium',
              hideCancelButton && 'hidden'
            )}
            onClick={handleCancel}
          >
            {cancelLabel ?? 'Закрыть'}
          </button>
          <button
            type="button"
            className={extraClassName ?? 'btn-primary'}
            hidden={!extraLabel}
            onClick={onExtra}
          >
            {extraLabel ?? ''}
          </button>
          <button
            type="submit"
            className={twMerge(
              'inline-flex items-center justify-center leading-[14px]',
              submitClassName ?? 'btn-primary'
            )}
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
