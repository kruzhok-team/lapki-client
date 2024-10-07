import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import UnknownIcon from '@renderer/assets/icons/unknown.svg';
import { ScrollableList } from '@renderer/components/ScrollableList';
import { Modal } from '@renderer/components/UI';
import { ComponentEntry } from '@renderer/lib/data/PlatformManager';
import { icons } from '@renderer/lib/drawable';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component } from '@renderer/types/diagram';

import { StateMachineData } from './StateMachineEditModal';
import { convert } from './utils/html-element-to-react';
import { stringToHTML } from './utils/stringToHTML';

interface ComponentAddModalProps {
  isOpen: boolean;
  onClose: () => void;

  vacantComponents: ComponentEntry[];
  onSubmit: (name: string, platform: string) => void;
}

export const ComponentAddModal: React.FC<ComponentAddModalProps> = ({
  onClose,
  onSubmit,
  vacantComponents,
  ...props
}) => {
  const modelController = useModelContext();
  const editor = modelController.getCurrentCanvas();

  const [cursor, setCursor] = useState<StateMachineData | null>(null);

  const handleAfterClose = () => {
    editor.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cursor) return;

    onSubmit(cursor.name, cursor.platform);
    onRequestClose();
  };

  const onRequestClose = () => {
    onClose();

    setCursor(null);
  };

  // TODO: double click
  // TODO: arrow up, arrow down

  return (
    <Modal
      {...props}
      onAfterClose={handleAfterClose}
      onRequestClose={onRequestClose}
      title="Создание машины состояний"
      submitLabel="Добавить"
      onSubmit={handleSubmit}
    ></Modal>
  );
};
