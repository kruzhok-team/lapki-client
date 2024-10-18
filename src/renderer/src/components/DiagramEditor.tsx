import { useEffect, useRef, useState } from 'react';

import {
  NoteEdit,
  StateNameEdit,
  ActionsModal,
  ActionsModalData,
  StateModal,
  TransitionModal,
} from '@renderer/components';
import { useSettings } from '@renderer/hooks';
import { useModal } from '@renderer/hooks/useModal';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { EventSelection, State } from '@renderer/lib/drawable';
import { Point } from '@renderer/lib/types';
import { useModelContext } from '@renderer/store/ModelContext';
import { Event } from '@renderer/types/diagram';
interface DiagramEditorProps {
  editor: CanvasEditor;
  controller: CanvasController;
}

export const DiagramEditor: React.FC<DiagramEditorProps> = (props: DiagramEditorProps) => {
  const editor = props.editor;
  const controller = props.controller;
  const [canvasSettings] = useSettings('canvas');
  const modelController = useModelContext();
  const stateMachines = Object.keys(controller.stateMachinesSub);
  const smId = stateMachines[0]; // TODO: Как понять в какую именно машину состояний мы добавляем?
  const isMounted = modelController.model.useData('', 'canvas.isMounted', editor.id) as boolean;
  const containerRef = useRef<HTMLDivElement>(null);

  const [isActionsModalOpen, openActionsModal, closeActionsModal] = useModal(false);
  const [actionsModalData, setActionsModalData] = useState<ActionsModalData>();
  // Дополнительные данные о родителе события
  const [actionsModalParentData, setActionsModalParentData] = useState<{
    state: State;
    eventSelection: EventSelection;
  }>();

  useEffect(() => {
    // Проверяем на идентификатор '', чтобы не совершать какие-либо операции
    // над "призрачным" канвасом, который нужен только при запуске приложения,
    // когда мы еще не редактируем какую-либо машину состояний.
    if (!containerRef.current || controller.id === '') return;
    editor.mount(containerRef.current);

    const handleDblclick = (position: Point) => {
      if (controller.type === 'scheme') return;
      modelController.createState({
        smId: smId,
        name: 'Состояние',
        events: [],
        dimensions: { width: 450, height: 100 },
        position,
        placeInCenter: true,
      });
    };

    const handleChangeEvent = (data: {
      state: State;
      eventSelection: EventSelection;
      event: Event;
      isEditingEvent: boolean;
    }) => {
      if (controller.type === 'scheme') return;
      const { state, eventSelection, event, isEditingEvent } = data;

      setActionsModalParentData({ state, eventSelection });
      setActionsModalData({ action: event, isEditingEvent });
      openActionsModal();
    };

    editor.view.on('dblclick', handleDblclick);
    editor.controller.states.on('changeEvent', handleChangeEvent);

    //! Не забывать удалять слушатели
    return () => {
      editor.view.off('dblclick', handleDblclick);
      editor.controller.states.off('changeEvent', handleChangeEvent);
      editor.unmount();
    };
    // FIXME: containerRef не влияет на перезапуск эффекта.
    // Скорее всего, контейнер меняться уже не будет, поэтому
    // реф закомментирован, но если что, https://stackoverflow.com/a/60476525.
    // }, [ containerRef.current ]);
  }, [editor, openActionsModal]);

  useEffect(() => {
    if (!canvasSettings) return;

    editor.setSettings(canvasSettings);
  }, [canvasSettings, editor]);

  const handleActionsModalSubmit = (data: Event) => {
    if (!actionsModalParentData) return;

    modelController.changeEvent({
      smId: smId,
      stateId: actionsModalParentData.state.id,
      event: actionsModalParentData.eventSelection,
      newValue: data,
    });

    closeActionsModal();
  };
  // TODO: Прокинуть smId в другие модалки

  return (
    <>
      <div className="relative h-full overflow-hidden bg-neutral-800" ref={containerRef}></div>

      {isMounted && (
        <>
          <StateNameEdit />
          <NoteEdit />

          <StateModal smId={smId} editorController={controller} />
          <TransitionModal smId={smId} />

          <ActionsModal
            initialData={actionsModalData}
            onSubmit={handleActionsModalSubmit}
            isOpen={isActionsModalOpen}
            onClose={closeActionsModal}
          />
        </>
      )}
    </>
  );
};
