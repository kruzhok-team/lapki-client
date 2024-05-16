import { useEffect, useRef, useState } from 'react';

import {
  TransitionModal,
  EventsModal,
  EventsModalData,
  NoteEdit,
  StateNameModal,
  Scale,
  StateModal,
} from '@renderer/components';
import { useSettings } from '@renderer/hooks';
import { useModal } from '@renderer/hooks/useModal';
import { DEFAULT_STATE_COLOR } from '@renderer/lib/constants';
import { EventSelection, State } from '@renderer/lib/drawable';
import { useEditorContext } from '@renderer/store/EditorContext';
import { Event } from '@renderer/types/diagram';

export const DiagramEditor: React.FC = () => {
  const editor = useEditorContext();

  const isMounted = editor.model.useData('isMounted');

  const [canvasSettings] = useSettings('canvas');

  const containerRef = useRef<HTMLDivElement>(null);

  const [isEventsModalOpen, openEventsModal, closeEventsModal] = useModal(false);
  const [eventsModalData, setEventsModalData] = useState<EventsModalData>();
  // Дополнительные данные о родителе события
  const [eventsModalParentData, setEventsModalParentData] = useState<{
    state: State;
    eventSelection: EventSelection;
  }>();

  console.log('DiagramEditor update');

  useEffect(() => {
    if (!containerRef.current) return;

    editor.mount(containerRef.current);

    editor.view.on('dblclick', (position) => {
      editor.controller.states.createState({
        name: 'Состояние',
        position,
        placeInCenter: true,
        color: DEFAULT_STATE_COLOR,
      });
    });

    editor.controller.states.on('changeEvent', (data) => {
      const { state, eventSelection, event, isEditingEvent } = data;

      setEventsModalParentData({ state, eventSelection });
      setEventsModalData({ event, isEditingEvent });
      openEventsModal();
    });

    return () => {
      // снятие слежки произойдёт по смене редактора новым
      // model.unwatchEditor();
      editor?.cleanUp();
    };
    // FIXME: containerRef не влияет на перезапуск эффекта.
    // Скорее всего, контейнер меняться уже не будет, поэтому
    // реф закомментирован, но если что, https://stackoverflow.com/a/60476525.
    // }, [ containerRef.current ]);
  }, [editor, openEventsModal]);

  useEffect(() => {
    if (!canvasSettings) return;

    editor.setSettings(canvasSettings);
  }, [canvasSettings, editor]);

  const handleEventsModalSubmit = (data: Event) => {
    if (!eventsModalParentData) return;

    editor?.controller.states.changeEvent(
      eventsModalParentData.state.id,
      eventsModalParentData.eventSelection,
      data
    );

    closeEventsModal();
  };

  return (
    <>
      <div className="relative h-full overflow-hidden bg-neutral-800" ref={containerRef}>
        {isMounted && <Scale />}
      </div>

      {isMounted && (
        <>
          <StateNameModal />
          <NoteEdit />

          <EventsModal
            initialData={eventsModalData}
            onSubmit={handleEventsModalSubmit}
            isOpen={isEventsModalOpen}
            onClose={closeEventsModal}
          />

          <StateModal />
          <TransitionModal />
        </>
      )}
    </>
  );
};
