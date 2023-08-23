import React from 'react';

import { useForm } from 'react-hook-form';
import { Modal } from './Modal/Modal';

import { ComponentProto } from '@renderer/types/platform';
import { Component as ComponentData } from '@renderer/types/diagram';
import { systemComponent } from '@renderer/lib/data/PlatformManager';

export interface ComponentEditData {
  idx: string;
  data: ComponentData;
  proto: ComponentProto;
  existingComponents: Set<string>;
}

export const emptyCompEditData: ComponentEditData = {
  idx: '',
  data: { type: '', parameters: {} },
  proto: systemComponent,
  existingComponents: new Set(),
};

interface ComponentEditModalProps {
  isOpen: boolean;
  data: ComponentEditData;
  onClose: () => void;
  onComponentEdit: (idx: string, data: ComponentData) => void;
  onComponentDelete: (idx: string) => void;
}

export interface ComponentEditModalFormValues {
  idx: string;
}

export const ComponentEditModal: React.FC<ComponentEditModalProps> = ({
  data,
  onClose,
  onComponentEdit,
  onComponentDelete,
  ...props
}) => {
  const { reset, handleSubmit: hookHandleSubmit } = useForm<ComponentEditModalFormValues>();

  const handleSubmit = hookHandleSubmit((_data) => {
    // onComponentDelete(data.idx);
    console.log('ComponentEdit onEdit');
    onRequestClose();
  });

  const handleDelete = () => {
    onComponentDelete(data.idx);
    // onRequestClose();
  };

  const onRequestClose = () => {
    onClose();
    reset();
  };

  const componentType = data.proto.name ?? data.data.type;
  const componentName = data.proto.singletone ? componentType : `${componentType} ${data.idx}`;

  const parameters = Object.entries(data.proto.parameters ?? {}).map(([idx, param]) => {
    const name = param.name ?? idx;
    return (
      <p>
        {name} = {data.data.parameters[name]}
      </p>
    );
  });

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={componentName}
      submitLabel="Применить"
      onSubmit={handleSubmit}
      sideLabel="Удалить"
      onSide={handleDelete}
    >
      <p>🐈‍⬛</p>
      <hr />
      {parameters}
    </Modal>
  );
};
