import React from 'react';

import { Modal } from './UI';

interface RestoreDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => Promise<void>;
  onCancelRestore: () => Promise<void>;
}

export const RestoreDataModal: React.FC<RestoreDataModalProps> = ({
  onClose,
  onRestore,
  onCancelRestore,
  ...props
}) => {
  const onRequestClose = () => {
    onCancelRestore().then(() => onClose());
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRestore().then(() => {
      onClose();
    });
  };
  return (
    <Modal
      {...props}
      shouldCloseOnEsc={false}
      shouldCloseOnOverlayClick={false}
      onRequestClose={onRequestClose}
      title="Восстановление документа"
      submitLabel="Да"
      onSubmit={handleSubmit}
      cancelLabel="Нет"
    >
      Работа программы была прервана неожиданно. Хотите восстановить несохранённые данные?
      <br></br>
      <span className="font-medium">Внимание!</span> Если Вы выберете «Нет» или закроете окно, то
      несохранённые данные будут утеряны навсегда!
    </Modal>
  );
};
