import React from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from '@renderer/components/UI';
import { useSettings } from '@renderer/hooks';

interface SaveRemindModalProps {
  isOpen: boolean;
  data: SaveModalData | null;
  onClose: () => void;
}

export type SaveModalData = {
  shownName: string | null;
  question?: string;
  onConfirm: () => void;
  onSave: () => void;
  onOpen: () => void;
};

export interface SaveRemindModalFormValues {}

export const SaveRemindModal: React.FC<SaveRemindModalProps> = ({ onClose, data, ...props }) => {
  const { reset, handleSubmit: hookHandleSubmit } = useForm<SaveRemindModalFormValues>();
  const [, setRestoreSession] = useSettings('restoreSession');

  const handleSave = hookHandleSubmit(async () => {
    await setRestoreSession(false);
    await data?.onSave();
    await data?.onOpen();
    // FIXME: не выполняет подтверждаемое действие после сохранения
    onRequestClose();
  });

  const onRequestClose = () => {
    onClose();
    reset();
  };

  const handleUnsave = async () => {
    await setRestoreSession(false);
    data?.onConfirm();
    onRequestClose();
  };

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={'Подтверждение'}
      extraLabel="Не сохранять"
      submitLabel="Сохранить"
      extraClassName="btn-error"
      onSubmit={handleSave}
      onExtra={handleUnsave}
      cancelLabel="Отменить"
    >
      <h3>Файл был отредактирован.</h3>
      <h3>{data?.question ?? 'Хотите его сохранить, прежде чем продолжить?'}</h3>
    </Modal>
  );
};
