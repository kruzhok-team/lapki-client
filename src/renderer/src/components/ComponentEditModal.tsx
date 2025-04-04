import React, { useLayoutEffect, useState } from 'react';

import { Modal } from '@renderer/components/UI';
import { ValidationResult } from '@renderer/lib/data/ModelController/UserInputValidator';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component as ComponentData } from '@renderer/types/diagram';
import { ComponentProto } from '@renderer/types/platform';

import { ComponentFormFields } from './ComponentFormFields';

// название ключа ошибки для поля ввода имени, он также нужен для ComponentFormFields
export const idError = 'id';

interface ComponentEditModalProps {
  isOpen: boolean;
  onClose: () => void;

  id: string;
  data: ComponentData;
  proto: ComponentProto;
  onEdit: (id: string, data: Omit<ComponentData, 'order' | 'position'>, newName?: string) => void;
  onDelete: (idx: string) => void;
  validateComponentId: (
    name: string,
    validateProto: ComponentProto,
    idx: string
  ) => ValidationResult;
}

export const ComponentEditModal: React.FC<ComponentEditModalProps> = ({
  isOpen,
  id,
  data,
  proto,
  onClose,
  onEdit,
  onDelete,
  validateComponentId,
}) => {
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const controller = modelController.controllers[headControllerId];
  const editor = controller.app;
  const [name, setName] = useState<string | undefined>();
  const [componentId, setComponentId] = useState('');
  // const platformId = model.useData(smId, 'elements.platform');
  // const platform = getPlatform(platformId);
  const [parameters, setParameters] = useState<ComponentData['parameters']>({});

  const [errors, setErrors] = useState({} as Record<string, string>);

  // Сброс к начальному состоянию после закрытия
  const handleAfterClose = () => {
    setName(data.name);
    setComponentId(id);
    setParameters({ ...data.parameters });
    editor.focus();
  };

  const handleNameValidation = (): boolean => {
    const validationResult = validateComponentId(componentId, proto, id);
    if (validationResult.status) return true;

    setErrors((prevErrors) => ({
      ...prevErrors,
      [idError]: validationResult.error,
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
    const submitData = { type: data.type, name: name === '' ? undefined : name, parameters };
    const newId = componentId === id ? undefined : componentId;

    onEdit(id, submitData, newId);
    onClose();
  };

  const handleDelete = () => {
    onDelete(id);
    onClose();
  };

  const componentType = data.type;
  const componentName = proto.singletone ? componentType : `${componentType} ${id}`;

  useLayoutEffect(() => {
    setName(data.name);
    setComponentId(id);
  }, [id, data.name]);

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
        id={componentId}
        setComponentId={setComponentId}
        parameters={parameters}
        setParameters={setParameters}
        errors={errors}
        setErrors={setErrors}
      />
    </Modal>
  );
};
