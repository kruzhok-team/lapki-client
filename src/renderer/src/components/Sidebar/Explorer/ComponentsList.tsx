import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/new transition.svg';
import { ComponentEditModal, ComponentAddModal, ComponentDeleteModal } from '@renderer/components';
import { ScrollableList } from '@renderer/components/ScrollableList';
import { WithHint } from '@renderer/components/UI';
import { useComponents } from '@renderer/hooks';
import { useEditorContext } from '@renderer/store/EditorContext';

export const ComponentsList: React.FC = () => {
  const editor = useEditorContext();
  const model = editor.model;

  const isInitialized = model.useData('isInitialized');
  const components = model.useData('elements.components');

  const {
    addProps,
    editProps,
    deleteProps,
    onRequestAddComponent,
    onRequestEditComponent,
    onRequestDeleteComponent,
  } = useComponents();

  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const onClick = (key: string) => {
    setSelectedComponent(key);
  };

  const onAuxClick = (key: string) => {
    setSelectedComponent(key);
    onRequestDeleteComponent(key);
  };

  const onCompDblClick = (key: string) => {
    setSelectedComponent(key);
    onRequestEditComponent(key);
  };

  // TODO: контекстное меню? клонировать, переименовать, удалить
  const onCompRightClick = (key: string) => {
    setSelectedComponent(key);
    onRequestEditComponent(key);
  };

  const onCompKeyDown = (e: React.KeyboardEvent, name: string) => {
    if (e.key !== 'Delete') return;

    onRequestDeleteComponent(name);
  };

  const renderComponent = (name: string) => {
    const proto = editor?.controller.platform.getComponent(name);

    return (
      <WithHint key={name} hint={proto?.description ?? ''} placement="right">
        {(props) => (
          <button
            type="button"
            className={twMerge(
              'flex w-full items-center p-1',
              name == selectedComponent && 'bg-bg-active'
            )}
            onClick={() => onClick(name)}
            onAuxClick={() => onAuxClick(name)}
            onDoubleClick={() => onCompDblClick(name)}
            onContextMenu={() => onCompRightClick(name)}
            onKeyDown={(e) => onCompKeyDown(e, name)}
            {...props}
          >
            {editor?.controller.platform?.getFullComponentIcon(name)}
            <p className="ml-2 line-clamp-1">{name}</p>
          </button>
        )}
      </WithHint>
    );
  };

  return (
    <>
      <button
        type="button"
        className="btn-primary mb-2 flex w-full items-center justify-center gap-3"
        disabled={!isInitialized}
        onClick={onRequestAddComponent}
      >
        <AddIcon className="shrink-0" />
        Добавить...
      </button>

      <ScrollableList
        containerProps={{ onClick: (e) => e.stopPropagation() }}
        listItems={Object.keys(components)}
        heightOfItem={10}
        maxItemsToRender={50}
        renderItem={renderComponent}
      />

      <ComponentAddModal {...addProps} />
      <ComponentEditModal {...editProps} />
      <ComponentDeleteModal {...deleteProps} />
    </>
  );
};
