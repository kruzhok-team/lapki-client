import { useState, useEffect, useMemo } from 'react';

import { useFloating, offset, flip, shift } from '@floating-ui/react';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as CopyIcon } from '@renderer/assets/icons/copy.svg';
import { ReactComponent as StateMachineIcon } from '@renderer/assets/icons/cpu-bw.svg';
import { ReactComponent as DeleteIcon } from '@renderer/assets/icons/delete.svg';
import { ReactComponent as EditIcon } from '@renderer/assets/icons/edit.svg';
import { ReactComponent as NoteIcon } from '@renderer/assets/icons/note.svg';
import { ReactComponent as PasteIcon } from '@renderer/assets/icons/paste.svg';
import { useModal, useClickOutside, useStateMachines, useComponents } from '@renderer/hooks';
import { useProperties } from '@renderer/hooks/useProperties';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { getAvailablePlatforms } from '@renderer/lib/data/PlatformLoader';
import { DrawableComponent } from '@renderer/lib/drawable';
import { DrawableStateMachine } from '@renderer/lib/drawable/StateMachineNode';
import { Point } from '@renderer/lib/types';
import { useModelContext } from '@renderer/store/ModelContext';
import { getVirtualElement } from '@renderer/utils';

import { ContextMenu, MenuItem } from './ContextMenu';

import { ComponentDeleteModal } from '../ComponentDeleteModal';
import { ComponentEditModal } from '../ComponentEditModal';
import { PropertiesModal } from '../PropertiesModal';
import { StateMachineEditModal } from '../StateMachineEditModal';

type MenuVariant =
  | { type: 'view'; position: Point }
  | { type: 'stateMachine'; stateMachine: DrawableStateMachine }
  | { type: 'component'; component: DrawableComponent };

interface SchemeScreenContextMenuProps {
  controller: CanvasController;
}

/*
  Контекстное меню при работе со схемотехническим экраном.
*/
export const SchemeScreenContextMenu: React.FC<SchemeScreenContextMenuProps> = ({ controller }) => {
  // TODO(L140-beep): Контекстное меню для схемотехнического экрана
  const modelController = useModelContext();

  const [isOpen, open, close] = useModal(false);
  const [menuVariant, setMenuVariant] = useState<MenuVariant | null>(null);
  const { propertiesModalProps, setSelectedSmId, openPropertiesModal } = useProperties(controller);
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom',
    middleware: [offset(), flip(), shift({ padding: 5 })],
  });

  const platformList = getAvailablePlatforms().map((platform) => {
    return { value: platform.idx, label: platform.name };
  });

  const sMFuncs = useStateMachines();

  const componentFuncs = useComponents(controller);
  useClickOutside(refs.floating.current, close, !isOpen, '#color-picker');

  useEffect(() => {
    const handleEvent = (menuVariant: MenuVariant, position: Point) => {
      refs.setPositionReference(getVirtualElement(position));
      setMenuVariant(menuVariant);
      open();
    };

    const handleViewContextMenu = (position: Point) => {
      handleEvent({ type: 'view', position }, position);
    };

    const handleComponentContextMenu = ({
      position,
      component,
    }: {
      position: Point;
      component: DrawableComponent;
    }) => {
      handleEvent({ type: 'component', component }, position);
    };

    const handleStateMachineContextMenu = ({
      position,
      stateMachine,
    }: {
      position: Point;
      stateMachine: DrawableStateMachine;
    }) => {
      handleEvent({ type: 'stateMachine', stateMachine }, position);
    };

    // контекстное меню для пустого поля
    controller.view.on('contextMenu', handleViewContextMenu);
    controller.components.on('contextMenu', handleComponentContextMenu);
    controller.stateMachines.on('contextMenu', handleStateMachineContextMenu);
    //! Не забывать удалять слушатели
    return () => {
      controller.view.off('contextMenu', handleViewContextMenu);
      controller.stateMachines.off('contextMenu', handleStateMachineContextMenu);
      controller.components.off('contextMenu', handleComponentContextMenu);
    };
  }, [controller, open, refs]);

  const content = useMemo(() => {
    if (!menuVariant) return null;
    if (menuVariant.type === 'view') {
      // const { position } = menuVariant;
      // const mouseOffset = controller.view.app.mouse.getOffset();
      // const canvasPos = controller.view.windowToWorldCoords({
      //   x: position.x - mouseOffset.x,
      //   y: position.y - mouseOffset.y,
      // });

      return (
        <ContextMenu onClose={close}>
          <MenuItem onClick={sMFuncs.onRequestAddStateMachine}>
            <StateMachineIcon className="size-6 flex-shrink-0 fill-border-contrast" />
            Вставить машину состояний
          </MenuItem>
        </ContextMenu>
      );
    }

    if (menuVariant.type === 'component') {
      const componentSmId = menuVariant.component.smId;
      const components =
        modelController.model.data.elements.stateMachines[componentSmId].components;
      return (
        <ContextMenu onClose={close}>
          <MenuItem
            onClick={() =>
              componentFuncs.onRequestEditComponent(
                componentSmId,
                components,
                menuVariant.component.id
              )
            }
          >
            <EditIcon className="size-6 flex-shrink-0" />
            Редактировать
          </MenuItem>
          <MenuItem onClick={() => modelController.copySelected()}>
            <CopyIcon className="size-6 flex-shrink-0" />
            Копировать
          </MenuItem>
          <MenuItem onClick={() => modelController.pasteSelected()}>
            <PasteIcon className="size-6 flex-shrink-0" />
            Вставить
          </MenuItem>
          <MenuItem
            onClick={() =>
              componentFuncs.onRequestDeleteComponent(
                menuVariant.component.id,
                components,
                componentSmId
              )
            }
          >
            <DeleteIcon className="size-6 flex-shrink-0" />
            Удалить
          </MenuItem>
        </ContextMenu>
      );
    }

    if (menuVariant.type === 'stateMachine') {
      setSelectedSmId(menuVariant.stateMachine.id);
      return (
        <ContextMenu onClose={close}>
          <MenuItem onClick={() => sMFuncs.onRequestEditStateMachine(menuVariant.stateMachine.id)}>
            <EditIcon className="size-6 flex-shrink-0" />
            Редактировать
          </MenuItem>
          <MenuItem onClick={openPropertiesModal}>
            <NoteIcon className="size-6 flex-shrink-0" />
            Открыть свойства
          </MenuItem>
          <MenuItem
            onClick={() => modelController.duplicateStateMachine(menuVariant.stateMachine.id)}
          >
            <PasteIcon className="size-6 flex-shrink-0" />
            Дублировать
          </MenuItem>
        </ContextMenu>
      );
    }

    return null;
  }, [controller, isOpen, close, menuVariant]);

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className={twMerge('z-50 w-80 rounded bg-bg-secondary p-2 shadow-xl', !isOpen && 'hidden')}
    >
      {content}
      <ComponentDeleteModal {...componentFuncs.deleteProps} />
      <ComponentEditModal {...componentFuncs.editProps} />
      <StateMachineEditModal
        form={sMFuncs.addProps.addForm}
        isOpen={sMFuncs.addProps.isOpen}
        onClose={sMFuncs.addProps.onClose}
        onSubmit={sMFuncs.addProps.onSubmit}
        submitLabel="Добавить"
        onSide={undefined}
        sideLabel={undefined}
        platformList={platformList}
        isDuplicateName={sMFuncs.isDuplicateName}
        selectPlatformDisabled={false}
      />
      <StateMachineEditModal
        form={sMFuncs.editProps.editForm}
        isOpen={sMFuncs.editProps.isOpen}
        onClose={sMFuncs.editProps.onClose}
        onSubmit={sMFuncs.editProps.onEdit}
        submitLabel="Применить"
        onSide={sMFuncs.editProps.onDelete}
        sideLabel="Удалить"
        platformList={platformList}
        isDuplicateName={sMFuncs.isDuplicateName}
        selectPlatformDisabled={true}
        duplicateStateMachine={sMFuncs.onDuplicateStateMachine}
      />
      <PropertiesModal {...propertiesModalProps} />
    </div>
  );
};
