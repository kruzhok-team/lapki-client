import React from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from './Modal/Modal';

interface SaveRemindModalProps {
  isOpen: boolean;
  isData: SaveModalData | undefined;
  onClose: () => void;
}

export type SaveModalData = {
  shownName: string | null;
  question?: string;
  onConfirm: () => void;
  onSave: () => void;
};

export interface SaveRemindModalFormValues {}

export const SaveRemindModal: React.FC<SaveRemindModalProps> = ({ onClose, isData, ...props }) => {
  const { reset, handleSubmit: hookHandleSubmit } = useForm<SaveRemindModalFormValues>();

  const handleSubmit = hookHandleSubmit(() => {
    // data.id = isData?.state.target.id;
    isData?.onConfirm();
    onRequestClose();
  });

  const onRequestClose = () => {
    onClose();
    reset();
  };

  const handleSave = () => {
    isData?.onSave();
    // FIXME: не выполняет подтверждаемое действие после сохранения
    onRequestClose();
  };

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={'Подтверждение'}
      extraLabel={isData?.onSave ? 'Сохранить' : undefined}
      submitLabel="Не сохранять"
      onSubmit={handleSubmit}
      onExtra={handleSave}
    >
      <h3>Файл был отредактирован.</h3>
      <h3>{isData?.question ?? 'Хотите его сохранить, прежде чем продолжить?'}</h3>
    </Modal>
  );
};
