import React from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from '@renderer/components/UI';

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

  const handleSubmit = hookHandleSubmit(() => {
    // data.id = data?.state.target.id;
    data?.onConfirm();
    onRequestClose();
  });

  const onRequestClose = () => {
    onClose();
    reset();
  };

  const handleSave = () => {
    data?.onSave();
    data?.onOpen();
    // FIXME: не выполняет подтверждаемое действие после сохранения
    onRequestClose();
  };

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={'Подтверждение'}
      extraLabel={data?.onSave ? 'Сохранить' : undefined}
      submitLabel="Не сохранять"
      onSubmit={handleSubmit}
      onExtra={handleSave}
    >
      <h3>Файл был отредактирован.</h3>
      <h3>{data?.question ?? 'Хотите его сохранить, прежде чем продолжить?'}</h3>
    </Modal>
  );
};
