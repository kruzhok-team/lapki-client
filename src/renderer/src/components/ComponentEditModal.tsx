import React, { useEffect, useState } from 'react';

import { Component as ComponentData } from '@renderer/types/diagram';
import { ComponentProto } from '@renderer/types/platform';

import { Modal } from './Modal/Modal';

interface ComponentEditModalProps {
  isOpen: boolean;
  onClose: () => void;

  idx: string;
  data: ComponentData;
  proto: ComponentProto;
  onEdit: (idx: string, data: ComponentData, newName?: string) => void;
  onDelete: (idx: string) => void;
}

export interface ComponentEditModalFormValues {
  idx: string;
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
  const [name, setName] = useState('');
  const [parameters, setParameters] = useState<ComponentData['parameters']>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    parameters[e.target.name] = e.target.value;

    setParameters({ ...parameters });
  };

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
  const componentName = proto.singletone ? componentType : `${componentType} ${idx}`;

  useEffect(() => {
    setName(idx);
  }, [idx]);

  useEffect(() => {
    setParameters(data.parameters);
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
    >
      {proto.singletone ? (
        ''
      ) : (
        <>
          <label className="mb-2 flex items-center gap-2">
            Название:
            <input
              className="w-[250px] max-w-[250px] rounded border border-white bg-transparent px-2 py-1 outline-none transition-colors placeholder:font-normal"
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label key="label" className="flex items-center gap-2">
            Метка:
            <input
              className="w-[250px] max-w-[250px] rounded border bg-transparent px-2 py-1 outline-none transition-colors placeholder:font-normal"
              value={parameters['label'] ?? ''}
              name={'label'}
              maxLength={3}
              onChange={handleInputChange}
            />
          </label>
          <label key="labelColor" className="flex items-center gap-2">
            Цвет метки:
            <input
              className="ml-2 rounded border border-neutral-200 bg-transparent text-neutral-50 outline-none transition-colors focus:border-neutral-50"
              value={parameters['labelColor'] ?? '#FFFFFF'}
              name={'labelColor'}
              type="color"
              onChange={handleInputChange}
            />
          </label>
        </>
      )}
      {Object.entries(proto.parameters ?? {}).map(([idx, param]) => {
        const name = param.name ?? idx;
        const value = parameters[name] ?? '';
        return (
          <label key={idx} className="flex items-center gap-2">
            {name}:
            <input
              className="w-[250px] max-w-[250px] rounded border bg-transparent px-2 py-1 outline-none transition-colors placeholder:font-normal"
              value={value}
              name={name}
              onChange={handleInputChange}
            />
          </label>
        );
      })}
    </Modal>
  );
};
