import React from 'react';

import { useForm } from 'react-hook-form';

import { StateMachineData } from '@renderer/components/StateMachineEditModal';
import { Modal } from '@renderer/components/UI';
import { useModelContext } from '@renderer/store/ModelContext';

interface StateMachineDeleteModalProps {
  data: StateMachineData;
  idx: string | undefined;
  isOpen: boolean;
  onClose: () => void;

  onSubmit: () => void;
}

export const StateMachineDeleteModal: React.FC<StateMachineDeleteModalProps> = ({
  data,
  idx,
  onClose,
  onSubmit,
  ...props
}) => {
  const modal = useModelContext();
  const editor = modal.getCurrentCanvas();

  const handleAfterClose = () => {
    editor.focus();
  };

  const { handleSubmit: hookHandleSubmit } = useForm();
  const handleSubmit = hookHandleSubmit(() => {
    onSubmit();
    onClose();
  });
  return (
    <Modal
      {...props}
      onAfterClose={handleAfterClose}
      onRequestClose={onClose}
      title="Удаление машины состояний"
      submitLabel="Удалить"
      onSubmit={handleSubmit}
    >
      <p>
        Вы действительно хотите удалить машину состояний{' '}
        <span className="px-1 font-bold">{`${data.name ?? idx} (${
          data.platform == '' ? 'неизвестная платформа' : data.platform
        })`}</span>
        ?
      </p>
      <br />
      <p className="italic">
        Здесь можно написать дополнительную информацию о том, что произойдёт при удалении. Если этот
        текст не нужен, то его надо удалить.
      </p>
    </Modal>
  );
};
