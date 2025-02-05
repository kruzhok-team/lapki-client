import React from 'react';

import { Modal } from './UI';

interface RestoreDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
  onCancelRestore: () => void;
}

export const RestoreDataModal: React.FC<RestoreDataModalProps> = ({
  onClose,
  onRestore,
  onCancelRestore,
  ...props
}) => {
  const onRequestClose = () => {
    onCancelRestore();
    onClose();
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRestore();
    onClose();
  };
  return (
    <Modal
      shouldCloseOnEsc={false}
      shouldCloseOnOverlayClick={false}
      {...props}
      onRequestClose={onRequestClose}
      title="Восстановление схемы"
      submitLabel="Да"
      onSubmit={handleSubmit}
      cancelLabel="Нет"
      cancelClassName="btn-error"
    >
      Работа программы была прервана неожиданно. Хотите восстановить предыдущую схему?
      <br></br>
      <b>Внимание!</b> Если Вы не выберете «Да», то схема может быть утеряна навсегда!
    </Modal>
  );
};
