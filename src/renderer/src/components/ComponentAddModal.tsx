import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import UnknownIcon from '@renderer/assets/icons/unknown.svg';
import { Modal, ScrollArea } from '@renderer/components/UI';
import { ComponentEntry } from '@renderer/lib/data/PlatformManager';
import { icons } from '@renderer/lib/drawable';
import { useModelContext } from '@renderer/store/ModelContext';

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
  const controller = modelController.controllers[headControllerId];
  const editor = controller.app;

  const [cursor, setCursor] = useState<ComponentEntry | null>(null);

  const handleAfterClose = () => {
    editor.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cursor) return;

    onSubmit(
      cursor.idx,
      cursor.singletone ? undefined : modelController.validator.getComponentName(cursor.idx)
    );
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
      title="Новый компонент"
      submitLabel="Добавить"
      onSubmit={handleSubmit}
      submitDisabled={!cursor}
      className="top-[18px] box-border flex h-[544px] max-h-[calc(100vh-36px)] w-[calc(100%-40px)] max-w-[640px] flex-col p-6"
      formClassName="flex min-h-0 flex-1 flex-col"
      contentClassName="mb-0 min-h-0 flex-1"
      actionsClassName="mt-auto"
      submitClassName="btn-primary h-8 min-w-[82px] px-3 py-1.5"
      hideCancelButton
    >
      <div className="grid h-full grid-cols-[254px_minmax(0,1fr)] gap-[6px]">
        <ScrollArea
          className="h-full py-0"
          viewportClassName="px-[8px] py-[8px]"
          verticalOverflowViewportClassName="pr-0"
        >
          {vacantComponents.map((entry) => (
            <button
              type="button"
              key={entry.idx}
              className={twMerge(
                'flex h-[42px] w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-bg-hover',
                entry.idx === cursor?.idx && 'bg-bg-active'
              )}
              onClick={() => onCompClick(entry)}
              title={entry.name}
            >
              <img
                className="h-[25px] w-[25px] shrink-0 object-contain"
                src={icons.get(entry.img || 'stubComponent')?.src ?? UnknownIcon}
              />
              <span className="line-clamp-1">{entry.name}</span>
            </button>
          ))}
        </ScrollArea>
        <ScrollArea className="h-full" viewportClassName="pt-1 leading-[15px]">
          {description}
        </ScrollArea>
      </div>
    </Modal>
  );
};
