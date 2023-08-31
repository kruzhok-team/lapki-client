import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import { Modal } from './Modal/Modal';
import { ScrollableList } from '@renderer/components/ScrollableList';
import { ComponentEntry } from '@renderer/lib/data/PlatformManager';
import UnknownIcon from '@renderer/assets/icons/unknown.svg';
import { icons } from '@renderer/lib/drawable/Picto';
import { convert } from './utils/html-element-to-react';
import { stringToHTML } from './utils/stringToHTML';

export interface ComponentSelectData {
  vacantComponents: ComponentEntry[];
  existingComponents: Set<string>;
}

export const emptyCompData: ComponentSelectData = {
  vacantComponents: [],
  existingComponents: new Set(),
};

interface ComponentSelectModalProps {
  isOpen: boolean;
  data: ComponentSelectData;
  onClose: () => void;
  onSubmit: (compo: string, name?: string) => void;
}

export interface ComponentSelectModalFormValues {
  compo: string;
}

export const ComponentSelectModal: React.FC<ComponentSelectModalProps> = ({
  onClose,
  onSubmit,
  data: { vacantComponents, existingComponents },
  ...props
}) => {
  const { handleSubmit: hookHandleSubmit } = useForm<ComponentSelectModalFormValues>();
  const [cursor, setCursor] = useState<ComponentEntry | null>(null);
  const [compoName, setCompoName] = useState('');
  const [nameChanged, setNameChanged] = useState(false);
  const [isNameConflict, setIsNameConflict] = useState(false);

  const handleSubmit = hookHandleSubmit(() => {
    if (!cursor) return;
    const name = cursor.singletone ? undefined : compoName ?? undefined;
    onSubmit(cursor!.idx, name);
    onRequestClose();
  });

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;

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

    if (!nameChanged || compoName.length == 0) {
      var idx = 1;
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

  return (
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title="Выберите компонент"
      submitLabel="Добавить"
      onSubmit={handleSubmit}
      submitDisabled={addIsBlocked}
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
                style={{ height: '32px' }}
                src={icons.get(entry.img ?? 'unknown')?.src ?? UnknownIcon}
              />
              <p className="line-clamp-1">{entry.name}</p>
            </div>
          )}
        />
        <div className="pl-4">{description}</div>
      </div>

      {cursor && !cursor.singletone && (
        <div className="mt-4 flex items-center gap-2">
          <label>Название:</label>
          <input
            className={twMerge(
              'w-full rounded border bg-transparent px-2 py-[0.23rem] outline-none transition-colors placeholder:font-normal',
              addIsBlocked && 'border-red-500 placeholder:text-red-500',
              !addIsBlocked && 'border-neutral-200 text-neutral-50 focus:border-neutral-50'
            )}
            value={compoName}
            onChange={onNameChange}
            maxLength={20}
          />
        </div>
      )}
    </Modal>
  );
};
