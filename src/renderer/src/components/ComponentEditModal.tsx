import React, { useLayoutEffect, useState } from 'react';

import { Modal } from '@renderer/components/UI';
import { ComponentEntry } from '@renderer/lib/data/PlatformManager';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component as ComponentData } from '@renderer/types/diagram';
import { ComponentProto } from '@renderer/types/platform';
import { frameworkWords, reservedWordsC, validators } from '@renderer/utils';

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
  const modelController = useModelContext();
  const editor = modelController.getCurrentCanvas();
  const { model } = modelController;
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const stateMachines = Object.keys(modelController.controllers[headControllerId].stateMachinesSub);
  const components = model.useData(stateMachines, 'elements.components');

  const [name, setName] = useState('');
  const [parameters, setParameters] = useState<ComponentData['parameters']>({});

  const [errors, setErrors] = useState({} as Record<string, string>);

  // Сброс к начальному состоянию после закрытия
  const handleAfterClose = () => {
    setName(idx);
    setParameters({ ...data.parameters });
    editor.focus();
  };

  const handleNameValidation = (): boolean => {
    if (proto.singletone) {
      return true;
    }

    if (name !== idx && name in components) {
      setErrors((p) => ({ ...p, [nameError]: `Имя не должно повторяться` }));
      return false;
    }

    if (name == '') {
      setErrors((p) => ({ ...p, [nameError]: `Имя не должно быть пустым` }));
      return false;
    }
    // допустимыми символами на первой позиции являются латинские буквы и подчёркивания
    const firstSymbolRegex = '[A-Z]|[a-z]|_';
    const numberSymbolRegex = '[0-9]';
    if (!name[0].match(firstSymbolRegex)) {
      setErrors((p) => ({
        ...p,
        [nameError]: `Название должно начинаться с латинской буквы или подчёркивания`,
      }));
      return false;
    }
    // допустимыми символами на всех позициях кроме первой являются латинские буквы, подчёркивания и цифры
    const remainingSymbolsRegex = firstSymbolRegex + '|' + numberSymbolRegex;
    for (const symbol of name) {
      if (!symbol.match(remainingSymbolsRegex)) {
        setErrors((p) => ({
          ...p,
          [nameError]: `Допускаются только латинские буквы, цифры и подчёркивания`,
        }));
        return false;
      }
    }
    for (const word of reservedWordsC) {
      if (word == name) {
        setErrors((p) => ({ ...p, [nameError]: `Нельзя использовать ключевые слова языка C` }));
        return false;
      }
    }
    for (const word of frameworkWords) {
      if (word == name) {
        setErrors((p) => ({
          ...p,
          [nameError]: `Название является недопустимым. Выберите другое`,
        }));
        return false;
      }
    }
    // проверка на то, что название не является типом данных
    for (const key in validators) {
      if (key == name) {
        setErrors((p) => ({ ...p, [nameError]: `Нельзя использовать название типа данных` }));
        return false;
      }
    }
    // проверка на то, что название не совпадает с названием класса компонентов
    const vacantComponents = modelController.getVacantComponents() as ComponentEntry[];
    for (const component of vacantComponents) {
      if (component.name == name) {
        setErrors((p) => ({ ...p, [nameError]: `Нельзя дублировать название класса компонентов` }));
        return false;
      }
    }
    return true;
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
