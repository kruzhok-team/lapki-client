import React, { useEffect, useState } from 'react';

// import { useForm } from 'react-hook-form';
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
  onComponentEdit: (idx: string, data: ComponentData, newName?: string) => void;
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
  // const { reset, handleSubmit: hookHandleSubmit } = useForm<ComponentEditModalFormValues>();

  const [dataState, setDataState] = useState(data);

  useEffect(() => {
    console.log(data);
    setDataState(data);
  }, [data]);

  const handleInputChange = (e) => {
    const updatedState = structuredClone(dataState);
    updatedState.data.parameters[e.target.name] = e.target.value;
    setDataState(updatedState);
    console.log(updatedState);
  };

  const handleNameChange = (e) => {
    const updatedState = structuredClone(dataState);
    updatedState.idx = e.target.value;
    setDataState(updatedState);
    console.log(updatedState);
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    // onComponentDelete(data.idx);
    console.log('ComponentEdit onEdit');
    const submitData = { type: dataState.data.type, parameters: dataState.data.parameters };
    console.log(submitData);
    const newName = dataState.idx === data.idx ? undefined : dataState.idx;
    onComponentEdit(data.idx, submitData, newName);
    onRequestClose();
  };

  const handleDelete = () => {
    onComponentDelete(data.idx);
    onRequestClose();
  };

  const onRequestClose = () => {
    onClose();
  };

  const componentType = data.proto.name ?? data.data.type;
  const componentName = data.proto.singletone ? componentType : `${componentType} ${data.idx}`;

  const parameters = Object.entries(dataState.proto.parameters ?? {}).map(([idx, param]) => {
    const name = param.name ?? idx;
    const data = dataState.data.parameters[name];
    return (
      <>
        <label className="mx-1 flex flex-col">
          {name}
          <input
            className="w-[250px] max-w-[250px] rounded border bg-transparent px-2 py-1 outline-none transition-colors placeholder:font-normal"
            value={data}
            name={name}
            onChange={(e) => handleInputChange(e)}
          />
        </label>
      </>
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
      <input
        className="w-[250px] max-w-[250px] rounded bg-transparent px-2 py-1 outline-none transition-colors placeholder:font-normal"
        maxLength={20}
        value={dataState.idx}
        name={dataState.idx}
        onChange={(e) => handleNameChange(e)}
      />
      <hr />
      {parameters}
    </Modal>
  );
};
