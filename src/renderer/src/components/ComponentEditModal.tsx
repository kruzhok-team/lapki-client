import React, { useLayoutEffect, useState } from 'react';

import { Modal } from '@renderer/components/UI';
import { ValidationResult } from '@renderer/lib/data/ModelController/UserInputValidator';
import { getPlatform } from '@renderer/lib/data/PlatformLoader';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component, Component as ComponentData } from '@renderer/types/diagram';
import { ComponentProto } from '@renderer/types/platform';

import { ComponentFormFields } from './ComponentFormFields';

// название ключа ошибки для поля ввода имени, он также нужен для ComponentFormFields
export const nameError = 'name';

interface ComponentEditModalProps {
  isOpen: boolean;
  onClose: () => void;

  idx: string;
  data: ComponentData;
  proto: ComponentProto;
  onEdit: (idx: string, data: Omit<ComponentData, 'order' | 'position'>, newName?: string) => void;
  onDelete: (idx: string) => void;
  validateComponentName: (
    name: string,
    validateProto: ComponentProto,
    idx: string
  ) => ValidationResult;
}

export const ComponentEditModal: React.FC<ComponentEditModalProps> = ({
  isOpen,
  idx,
  data,
  proto,
  onClose,
  onEdit,
  onDelete,
  validateComponentName,
}) => {
  const modelController = useModelContext();
  const { model } = modelController;
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const controller = modelController.controllers[headControllerId];
  const editor = controller.app;
  const [name, setName] = useState('');
  // const platformId = model.useData(smId, 'elements.platform');
  // const platform = getPlatform(platformId);
  const [parameters, setParameters] = useState<ComponentData['parameters']>({});

  const [errors, setErrors] = useState({} as Record<string, string>);

  // Сброс к начальному состоянию после закрытия
  const handleAfterClose = () => {
    setName(idx);
    setParameters({ ...data.parameters });
    editor.focus();
  };

  const handleNameValidation = (): boolean => {
    const validationResult = validateComponentName(name, proto, idx);
    if (validationResult.status) return true;

    setErrors((prevErrors) => ({
      ...prevErrors,
      [nameError]: validationResult.error,
    }));

    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleNameValidation()) {
      return;
    }
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

  useLayoutEffect(() => {
    setName(idx);
  }, [idx]);

  useLayoutEffect(() => {
    setParameters({ ...data.parameters });
  }, [data.parameters]);

  const showMainData = () => {
    if (proto.singletone) return false;
    // if (platform) return !platform.staticComponents;

    return true;
  };

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
    >
      <ComponentFormFields
        showMainData={showMainData()}
        protoParameters={proto.constructorParameters}
        protoInitializationParameters={proto.initializationParameters}
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
