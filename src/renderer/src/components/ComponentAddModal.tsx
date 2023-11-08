import React, { useState } from 'react';

import { useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import UnknownIcon from '@renderer/assets/icons/unknown.svg';
import { ScrollableList } from '@renderer/components/ScrollableList';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { ComponentEntry } from '@renderer/lib/data/PlatformManager';
import { icons } from '@renderer/lib/drawable/Picto';
import { Component as ComponentData } from '@renderer/types/diagram';

import { ComponentFormFields } from './ComponentFormFields';
import { Modal } from './Modal/Modal';
import { convert } from './utils/html-element-to-react';
import { stringToHTML } from './utils/stringToHTML';

interface ComponentAddModalProps {
  isOpen: boolean;
  onClose: () => void;

  editor: CanvasEditor | null;

  vacantComponents: ComponentEntry[];
  existingComponents: Set<string>;
  onSubmit: (
    idx: string,
    name: string | undefined,
    parameters: ComponentData['parameters']
  ) => void;
}

export interface ComponentAddModalFormValues {
  compo: string;
}

export const ComponentAddModal: React.FC<ComponentAddModalProps> = ({
  onClose,
  onSubmit,
  editor,
  vacantComponents,
  existingComponents,
  ...props
}) => {
  const { handleSubmit: hookHandleSubmit } = useForm<ComponentAddModalFormValues>();
  const [cursor, setCursor] = useState<ComponentEntry | null>(null);
  const [compoName, setCompoName] = useState('');
  const [nameChanged, setNameChanged] = useState(false);
  const [isNameConflict, setIsNameConflict] = useState(false);
  const [parameters, setParameters] = useState<ComponentData['parameters']>({});

  const handleSubmit = hookHandleSubmit(() => {
    if (!cursor) return;
    const name = cursor.singletone ? undefined : compoName ?? undefined;
    onSubmit(cursor.idx, name, parameters);
    onRequestClose();
  });

  const onNameChange = (name: string) => {
    setCompoName(name);
    setIsNameConflict(existingComponents.has(name));
    setNameChanged(true);
  };

  const onRequestClose = () => {
    onClose();

    setCursor(null);
    setCompoName('');
    setIsNameConflict(false);
    setNameChanged(false);
  };

  // TODO: double click
  // TODO: arrow up, arrow down

  const onCompClick = (entry: ComponentEntry) => {
    setCursor(entry);
    setParameters({});

    if (!nameChanged || compoName.length == 0) {
      let idx = 1;
      while (existingComponents.has(entry.idx + idx.toString())) {
        idx++;
      }
      setCompoName(entry.idx + idx.toString());
      setNameChanged(false);
    }
  };

  const descriptionElement = stringToHTML('<div>' + (cursor?.description ?? '') + '</div>');
  const description = descriptionElement.childNodes
    ? convert(descriptionElement.childNodes[0])
    : '';

  const addIsBlocked: boolean = !(
    cursor &&
    (cursor.singletone || (compoName.length > 0 && !isNameConflict))
  );

  const proto =
    editor && cursor
      ? editor.container.machineController.platform.data.components[cursor.idx]
      : null;

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title="Выберите компонент"
      submitLabel="Добавить"
      onSubmit={handleSubmit}
      submitDisabled={addIsBlocked}
    >
      <div
        className={twMerge(
          'grid grid-cols-2',
          cursor && 'mb-2 border-b border-border-primary pb-2'
        )}
      >
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

      {cursor && (
        <ComponentFormFields
          showMainData={!cursor.singletone}
          protoParameters={proto?.parameters ?? {}}
          name={compoName}
          setName={onNameChange}
          parameters={parameters}
          setParameters={setParameters}
        />
      )}
    </Modal>
  );
};
