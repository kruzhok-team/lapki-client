import React from 'react';

import { Modal } from '@renderer/components/UI';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component as ComponentData } from '@renderer/types/diagram';
import { ComponentProto } from '@renderer/types/platform';

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
  const modal = useModelContext();
  const headControllerId = modal.model.useData('', 'headControllerId');
  const editor = modal.controllers[headControllerId].app;

  const handleAfterClose = () => {
    editor.focus();
  };

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
      onAfterClose={handleAfterClose}
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
