import React from 'react';

import { Modal } from './Modal/Modal';

interface ComponentDeleteModalProps {
  isOpen: boolean;
  idx: string;
  type: string;
  onClose: () => void;
  onSubmit: (idx: string) => void;
}

export const ComponentDeleteModal: React.FC<ComponentDeleteModalProps> = ({
  idx,
  type,
  onClose,
  onSubmit,
  ...props
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit(idx);
    onClose();
  };

  const compoLabel = type ? `${type} ${idx}` : idx;

  return (
    <Modal
      {...props}
      onRequestClose={onClose}
      title="Удаление компонента"
      submitLabel="Удалить"
      onSubmit={handleSubmit}
    >
      <p>
        Вы действительно хотите удалить компонент{' '}
        <span className="px-1 font-bold">{compoLabel}</span>?
      </p>
      <br />
      <p className="italic">
        Удаление не затрагивает переходы, события и действия, их содержимое будет заменено
        характерными значками. Вам необходимо удалить эти элементы вручную.
      </p>
    </Modal>
  );
};
