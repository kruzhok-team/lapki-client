import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import UnknownIcon from '@renderer/assets/icons/unknown.svg';
import { ScrollableList } from '@renderer/components/ScrollableList';
import { Modal } from '@renderer/components/UI';
import { ComponentEntry } from '@renderer/lib/data/PlatformManager';
import { icons } from '@renderer/lib/drawable';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component } from '@renderer/types/diagram';

import { convert } from './utils/html-element-to-react';
import { stringToHTML } from './utils/stringToHTML';

interface ComponentAddModalProps {
  isOpen: boolean;
  onClose: () => void;

  vacantComponents: ComponentEntry[];
  onSubmit: (idx: string, name: string | undefined) => void;
}

export const ComponentAddModal: React.FC<ComponentAddModalProps> = ({
  onClose,
  onSubmit,
  vacantComponents,
  ...props
}) => {
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const stateMachines = Object.keys(modelController.controllers[headControllerId].stateMachinesSub);
  const editor = modelController.getCurrentCanvas();
  // TODO: Прокинуть сюда машину состояний
  const components = modelController.model.useData(stateMachines[0], 'elements.components') as {
    [id: string]: Component;
  };

  const [cursor, setCursor] = useState<ComponentEntry | null>(null);

  const handleAfterClose = () => {
    editor.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cursor) return;

    const getName = () => {
      let idx = 1;
      while (`${cursor.idx}${idx}` in components) {
        idx++;
      }

      return `${cursor.idx}${idx}`;
    };

    onSubmit(cursor.idx, cursor.singletone ? undefined : getName());
    onRequestClose();
  };

  const onRequestClose = () => {
    onClose();

    setCursor(null);
  };

  // TODO: double click
  // TODO: arrow up, arrow down
  const onCompClick = (entry: ComponentEntry) => {
    setCursor(entry);
  };

  const descriptionElement = stringToHTML('<div>' + (cursor?.description ?? '') + '</div>');
  const description = descriptionElement.childNodes
    ? convert(descriptionElement.childNodes[0])
    : '';

  return (
    <Modal
      {...props}
      onAfterClose={handleAfterClose}
      onRequestClose={onRequestClose}
      title="Выберите компонент"
      submitLabel="Добавить"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-2">
        <ScrollableList
          className="max-h-[40vh]"
          listItems={vacantComponents}
          heightOfItem={10}
          maxItemsToRender={50}
          renderItem={(entry) => (
            <div
              key={entry.idx}
              className={twMerge(
                'flex items-center gap-2 p-1',
                entry.name == cursor?.idx && 'bg-bg-active'
              )}
              onClick={() => onCompClick(entry)}
            >
              <img
                className="h-8 w-8 object-contain"
                src={icons.get(entry.img ?? 'unknown')?.src ?? UnknownIcon}
              />
              <p className="line-clamp-1">{entry.name}</p>
            </div>
          )}
        />
        <div className="pl-4">{description}</div>
      </div>
    </Modal>
  );
};
