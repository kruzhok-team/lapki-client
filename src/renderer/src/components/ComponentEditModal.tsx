import React, { useEffect, useMemo, useState } from 'react';

import { EditorManager } from '@renderer/lib/data/EditorManager';
import { Component as ComponentData } from '@renderer/types/diagram';
import { ComponentProto } from '@renderer/types/platform';

import { ComponentFormFields } from './ComponentFormFields';
import { Modal } from './Modal/Modal';

interface ComponentEditModalProps {
  isOpen: boolean;
  onClose: () => void;

  idx: string;
  data: ComponentData;
  proto: ComponentProto;
  onEdit: (idx: string, data: ComponentData, newName?: string) => void;
  onDelete: (idx: string) => void;

  manager: EditorManager;
}

export const ComponentEditModal: React.FC<ComponentEditModalProps> = ({
  isOpen,
  idx,
  data,
  proto,
  onClose,
  onEdit,
  onDelete,
  manager,
}) => {
  const components = manager.useData('elements.components');

  const [name, setName] = useState('');
  const [parameters, setParameters] = useState<ComponentData['parameters']>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
  const componentName = proto.singletone ? componentType : idx;

  // Ограничение на повтор имён
  const submitDisabled = useMemo(() => idx !== name && name in components, [components, idx, name]);

  useEffect(() => {
    setName(idx);
  }, [idx]);

  useEffect(() => {
    setParameters({ ...data.parameters });
  }, [data.parameters]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
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
      />
    </Modal>
  );
};
