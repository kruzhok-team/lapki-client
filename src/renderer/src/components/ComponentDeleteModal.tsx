import React from 'react';

import { Modal } from './Modal/Modal';

import { ComponentProto } from '@renderer/types/platform';
import { Component as ComponentData } from '@renderer/types/diagram';

interface ComponentDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;

  idx: string;
  data: ComponentData;
  proto: ComponentProto;
  onSubmit: (idx: string) => void;
}

export const ComponentDeleteModal: React.FC<ComponentDeleteModalProps> = ({
  idx,
  data,
  proto,
  onClose,
  onSubmit,
  ...props
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit(idx);
    onClose();
  };

  const type = data.type;

  const compoLabel = type && !proto.singletone ? `${type} ${idx}` : idx;

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
