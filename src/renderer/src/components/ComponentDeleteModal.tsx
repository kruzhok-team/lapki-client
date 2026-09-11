import React from 'react';

import { Modal } from '@renderer/components/UI';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component as ComponentData } from '@renderer/types/diagram';
import { ComponentProto } from '@renderer/types/platform';

interface ComponentDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;

  id: string;
  data: ComponentData;
  proto: ComponentProto;
  onSubmit: (idx: string) => void;
}

export const ComponentDeleteModal: React.FC<ComponentDeleteModalProps> = ({
  id,
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

    onSubmit(id);
    onClose();
  };

  const type = proto.name ?? data.type;

  const compoLabel = type && !proto.singletone ? `${id} (тип ${type})` : id;

  return (
    <Modal
      {...props}
      onAfterClose={handleAfterClose}
      onRequestClose={onClose}
      title="Удаление компонента"
      submitLabel="Удалить"
      onSubmit={handleSubmit}
      submitClassName="btn-secondary border-danger danger"
      cancelClassName="hidden"
    >
      <p>
        Вы действительно хотите удалить компонент
        <span className="px-1 font-medium">
          {compoLabel}
          <span className="font-normal">?</span>
        </span>
      </p>
      <br />
      <p className="text-text-inactive">
        Удаление не затрагивает переходы, события и действия, их содержимое будет заменено
        характерными значками. Вам необходимо удалить эти элементы вручную.
      </p>
    </Modal>
  );
};
