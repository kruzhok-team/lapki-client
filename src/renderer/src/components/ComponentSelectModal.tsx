import React, { useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from './Modal/Modal';
import ScrollableList, { ScrollableListItem } from './utils/ScrollableList';
import { ComponentEntry } from '@renderer/lib/data/PlatformManager';
import UnknownIcon from '@renderer/assets/icons/unknown.svg';
import { twMerge } from 'tailwind-merge';
import { icons } from '@renderer/lib/drawable/Picto';
import './modal-list.css';
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
  const [wasOpen, setWasOpen] = useState(false);

  useEffect(() => {
    if (!wasOpen) {
      // console.log('compo add modal open');
      setCursor(null);
      setCompoName('');
      setIsNameConflict(false);
      setNameChanged(false);
    }
    setWasOpen(props.isOpen);
  }, [props.isOpen]);

  const handleSubmit = hookHandleSubmit(() => {
    if (!cursor) return;
    const name = cursor.singletone ? undefined : compoName ?? undefined;
    onSubmit(cursor!.idx, name);
    onRequestClose();
  });

  const onNameChange = (e) => {
    const name = e.target.value;
    setCompoName(name);
    setIsNameConflict(existingComponents.has(name));
    setNameChanged(true);
  };

  const onRequestClose = onClose;

  // TODO: double click
  // TODO: arrow up, arrow down

  const onCompClick = (e: React.MouseEvent, entry: ComponentEntry) => {
    e.stopPropagation();
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

  const content: ScrollableListItem[] = vacantComponents.map((entry) => ({
    id: entry.idx,
    content: (
      <div
        className={twMerge(
          entry.name == cursor?.idx && 'bg-slate-600',
          'flex items-center pb-1 pt-1'
        )}
        onClick={(e) => onCompClick(e, entry)}
      >
        <img
          style={{ height: '32px' }}
          src={icons.get(entry.img ?? 'unknown')?.src ?? UnknownIcon}
        />
        <p className={twMerge('line-clamp-1', entry.idx == cursor?.idx && 'text-white')}>
          {entry.name}
        </p>
      </div>
    ),
  }));

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
      title={'Выберите компонент'}
      submitLabel="Добавить"
      onSubmit={handleSubmit}
      submitDisabled={addIsBlocked}
    >
      <div className="flex flex-row">
        <div className="flex-[50%]">
          <ScrollableList
            listItems={content ?? []}
            heightOfItem={10}
            maxItemsToRender={50}
            className="modal-list"
          />
        </div>
        <div className="flex-[50%]">{description}</div>
      </div>
      {cursor && !cursor.singletone ? (
        <div className="mt-2 flex flex-row items-center">
          <label className="flex-[1%]">Название:</label>
          <input
            className={twMerge(
              'flex-[70%] rounded border bg-transparent px-2 py-[0.23rem] outline-none transition-colors placeholder:font-normal',
              addIsBlocked && 'border-red-500 placeholder:text-red-500',
              !addIsBlocked && 'border-neutral-200 text-neutral-50 focus:border-neutral-50'
            )}
            value={compoName}
            onChange={onNameChange}
            maxLength={20}
          />
        </div>
      ) : (
        ''
      )}
    </Modal>
  );
};
