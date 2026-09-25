import React from 'react';

import { Props } from 'react-modal';
import { twMerge } from 'tailwind-merge';

import './style.css';
import { CloseButton } from './CloseButton';
import { Window } from './MovingWindow';

interface ModalProps extends Omit<Props, 'className' | 'overlayClassName'> {
  id: string;
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
  cancelClassName?: string;
  submitClassName?: string;
  extraClassName?: string;
  sideClassName?: string;
  middleClassName?: string;
  hideCancelButton?: boolean;
  onCancel?: () => void;
  position?: { x: number; y: number };
}

export const MovingModal: React.FC<ModalProps> = ({
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
  cancelClassName,
  submitClassName,
  extraClassName,
  sideClassName,
  middleClassName,
  hideCancelButton,
  onCancel,
  ...props
}) => {
  const hasFooter = Boolean(
    sideLabel || middleLabel || !hideCancelButton || extraLabel || onSubmit
  );

  const handleCancel = (e: React.MouseEvent) => {
    // debugger;
    if (onCancel) return onCancel();

    if (props.onRequestClose) return props.onRequestClose(e);
    // removeWindow(props.id);
  };

  return (
    <Window
      {...props}
      id={props.id}
      className={twMerge(
        'rounded-lg bg-bg-primary p-6 outline-none scrollbar-thin scrollbar-track-transparent scrollbar-thumb-current',
        className
      )}
      header={
        <div className="relative mb-6 flex w-full items-center justify-between border-b border-border-primary pb-6">
          <h1 className="text-[12px] font-medium">{title}</h1>
          <CloseButton onClick={props.onRequestClose} />
        </div>
      }
    >
      <form onSubmit={onSubmit} className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1">{children}</div>

        {hasFooter && (
          <div className="flex items-center justify-end gap-2 pt-6">
            <button
              type="button"
              className={
                sideClassName ?? 'btn-secondary border border-primary font-medium text-primary'
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
              className={cancelClassName ?? 'btn-secondary font-medium'}
              onClick={handleCancel}
              hidden={hideCancelButton}
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
              className={submitClassName ?? 'btn-primary'}
              hidden={!onSubmit}
              disabled={submitDisabled}
            >
              {submitLabel ?? 'Сохранить'}
            </button>
          </div>
        )}
      </form>
    </Window>
  );
};
