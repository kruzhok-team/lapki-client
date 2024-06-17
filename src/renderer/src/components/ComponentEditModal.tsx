import React, { useLayoutEffect, useMemo, useState } from 'react';

import { Modal } from '@renderer/components/UI';
import { useEditorContext } from '@renderer/store/EditorContext';
import { Component as ComponentData } from '@renderer/types/diagram';
import { ComponentProto } from '@renderer/types/platform';

import { ComponentFormFields } from './ComponentFormFields';

interface ComponentEditModalProps {
  isOpen: boolean;
  onClose: () => void;

  idx: string;
  data: ComponentData;
  proto: ComponentProto;
  onEdit: (idx: string, data: Omit<ComponentData, 'order'>, newName?: string) => void;
  onDelete: (idx: string) => void;
}

export const ComponentEditModal: React.FC<ComponentEditModalProps> = ({
  isOpen,
  idx,
  data,
  proto,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { model } = useEditorContext();
  const components = model.useData('elements.components');

  const [name, setName] = useState('');
  const [parameters, setParameters] = useState<ComponentData['parameters']>({});

  const [errors, setErrors] = useState({} as Record<string, string>);

  // Сброс к начальному состоянию после закрытия
  const handleAfterClose = () => {
    setName(idx);
    setParameters({ ...data.parameters });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Если есть ошибка то не отправляем форму
    for (const key in errors) {
      if (errors[key]) return;
    }

    const submitData = { type: data.type, parameters };
    const newName = name === idx ? undefined : name;

    onEdit(idx, submitData, newName);
    onClose();
  };

  const handleDelete = () => {
    onDelete(idx);
    onClose();
  };

  const componentType = proto.name ?? data.type;
  const componentName = proto.singletone ? componentType : `${componentType} ${idx}`;

  // Ограничение на повтор имён
  const submitDisabled = useMemo(() => idx !== name && name in components, [components, idx, name]);

  useLayoutEffect(() => {
    setName(idx);
  }, [idx]);

  useLayoutEffect(() => {
    setParameters({ ...data.parameters });
  }, [data.parameters]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      onAfterClose={handleAfterClose}
      title={componentName}
      submitLabel="Применить"
      onSubmit={handleSubmit}
      sideLabel="Удалить"
      onSide={handleDelete}
      submitDisabled={submitDisabled}
    >
      <ComponentFormFields
        showMainData={!proto.singletone}
        protoParameters={proto.parameters}
        name={name}
        setName={setName}
        parameters={parameters}
        setParameters={setParameters}
        errors={errors}
        setErrors={setErrors}
      />
    </Modal>
  );
};
