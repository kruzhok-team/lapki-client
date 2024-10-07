import { useEffect, useRef, useState } from 'react';

import {
  NoteEdit,
  StateNameEdit,
  EventsModal,
  EventsModalData,
  StateModal,
  TransitionModal,
} from '@renderer/components';
import { useSettings } from '@renderer/hooks';
import { useModal } from '@renderer/hooks/useModal';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventSelection, State } from '@renderer/lib/drawable';
import { Point } from '@renderer/lib/types';
import { useModelContext } from '@renderer/store/ModelContext';
import { Event } from '@renderer/types/diagram';
interface DiagramEditorProps {
  editor: CanvasEditor;
}

export const DiagramEditor: React.FC<DiagramEditorProps> = (props: DiagramEditorProps) => {
  const editor = props.editor;

  const [canvasSettings] = useSettings('canvas');
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  const stateMachines = Object.keys(modelController.controllers[headControllerId].stateMachinesSub);
  const smId = stateMachines[0]; // TODO: Как понять в какую именно машину состояний мы добавляем?
  const isMounted = modelController.model.useData('', 'canvas.isMounted', editor.id) as boolean;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEventsModalOpen, openEventsModal, closeEventsModal] = useModal(false);
  const [eventsModalData, setEventsModalData] = useState<EventsModalData>();
  // Дополнительные данные о родителе события
  const [eventsModalParentData, setEventsModalParentData] = useState<{
    state: State;
    eventSelection: EventSelection;
  }>();

  useEffect(() => {
    if (!containerRef.current) return;
    editor.mount(containerRef.current);

    const handleDblclick = (position: Point) => {
      modelController.createState({
        smId: smId,
        name: 'Состояние',
        events: [],
        dimensions: { width: 100, height: 50 }, // TODO (L140-beep): перепроверить
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
      const { state, eventSelection, event, isEditingEvent } = data;

      setEventsModalParentData({ state, eventSelection });
      setEventsModalData({ event, isEditingEvent });
      openEventsModal();
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
  }, [stateMachines, editor, openEventsModal]);

  useEffect(() => {
    if (!canvasSettings) return;

    editor.setSettings(canvasSettings);
  }, [canvasSettings, editor]);

  const handleEventsModalSubmit = (data: Event) => {
    if (!eventsModalParentData) return;

    modelController.changeEvent({
      smId: smId,
      stateId: eventsModalParentData.state.id,
      event: eventsModalParentData.eventSelection,
      newValue: data,
    });

    closeEventsModal();
  };

  return (
    <>
      <div className="relative h-full overflow-hidden bg-neutral-800" ref={containerRef}></div>

      {isMounted && (
        <>
          <StateNameEdit />
          <NoteEdit />

          <StateModal />
          <TransitionModal />

          <EventsModal
            initialData={eventsModalData}
            onSubmit={handleEventsModalSubmit}
            isOpen={isEventsModalOpen}
            onClose={closeEventsModal}
          />
        </>
      )}
    </>
  );
};
