import React, { useLayoutEffect, useState } from 'react';

import { Modal } from '@renderer/components/UI';
import { useModelContext } from '@renderer/store/ModelContext';

import { StateMachineFormFields } from './StateMachineFormFields';

// название ключа ошибки для поля ввода имени, он также нужен для ComponentFormFields
export const nameError = 'name';

interface StateMachineEditModalProps {
  isOpen: boolean;
  onClose: () => void;

  idx: string;
  data: StateMachineData;
  onEdit: (idx: string, data: StateMachineData) => void;
  onDelete: (idx: string) => void;
}

export type StateMachineData = {
  name: string;
  platform: string;
};

export const StateMachineEditModal: React.FC<StateMachineEditModalProps> = ({
  isOpen,
  idx,
  data,
  onClose,
  onEdit,
  onDelete,
}) => {
  const modelController = useModelContext();
  const editor = modelController.getCurrentCanvas();

  const [name, setName] = useState('');
  const [parameters, setParameters] = useState<StateMachineData>({ name: '', platform: '' });

  const [errors, setErrors] = useState({} as Record<string, string>);

  // Сброс к начальному состоянию после закрытия
  const handleAfterClose = () => {
    setName(idx);
    setParameters({ ...data });
    editor.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Если есть ошибка то не отправляем форму
    for (const key in errors) {
      if (errors[key]) return;
    }

    const submitData = parameters;

    onEdit(idx, submitData);
    onClose();
  };

  const handleDelete = () => {
    onDelete(idx);
    onClose();
  };

  useLayoutEffect(() => {
    setName(idx);
  }, [idx]);

  useLayoutEffect(() => {
    setParameters({ ...data });
  }, [data]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      onAfterClose={handleAfterClose}
      title={name}
      submitLabel="Применить"
      onSubmit={handleSubmit}
      sideLabel="Удалить"
      onSide={handleDelete}
    >
      <StateMachineFormFields
        parameters={{ ...data, ...parameters }}
        setParameters={setParameters}
        errors={errors}
        setErrors={setErrors}
      />
    </Modal>
  );
};
