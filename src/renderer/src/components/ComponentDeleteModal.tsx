import React from 'react';

import { useForm } from 'react-hook-form';
import { Modal } from './Modal/Modal';

export interface ComponentDeleteData {
  idx: string;
  type: string;
}

export const emptyCompDeleteData: ComponentDeleteData = {
  idx: '',
  type: '',
};

interface ComponentDeleteModalProps {
  isOpen: boolean;
  data: ComponentDeleteData;
  onClose: () => void;
  onComponentDelete: (idx: string) => void;
}

export interface ComponentDeleteModalFormValues {
  idx: string;
}

export const ComponentDeleteModal: React.FC<ComponentDeleteModalProps> = ({
  data,
  onClose,
  onComponentDelete,
  ...props
}) => {
  const { reset, handleSubmit: hookHandleSubmit } = useForm<ComponentDeleteModalFormValues>();

  const handleSubmit = hookHandleSubmit((_data) => {
    onComponentDelete(data.idx);
    onRequestClose();
  });

  const onRequestClose = () => {
    onClose();
    reset();
  };

  const compoLabel = data.type ? `${data.type} ${data.idx}` : data.idx;

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={`Удаление компонента`}
      submitLabel="Удалить"
      onSubmit={handleSubmit}
    >
      <p>
        Вы действительно хотите удалить компонент{' '}
        <span className="px-1 font-bold">{compoLabel}</span>?
      </p>
      <br />
      <p className="italic text-red-500">
        Удаление компонента приведёт к удалению всех событий, переходов и действий, связанных с этим
        компонентом.
      </p>
    </Modal>
  );
};
