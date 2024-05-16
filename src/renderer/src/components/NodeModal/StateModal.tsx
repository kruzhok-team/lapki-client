import React, { useEffect, useState } from 'react';

import { Modal, ColorInput } from '@renderer/components/UI';
import { useModal } from '@renderer/hooks/useModal';
import { DEFAULT_STATE_COLOR } from '@renderer/lib/constants';
import { State } from '@renderer/lib/drawable';
import { useEditorContext } from '@renderer/store/EditorContext';
import {
  Action,
  Condition as ConditionData,
  Event,
  Event as StateEvent,
  Variable as VariableData,
  Transition as TransitionData,
} from '@renderer/types/diagram';

import { Events } from './EventsBlock';
import { useTrigger } from './hooks/useTrigger';
import { Trigger } from './Trigger';

export const StateModal: React.FC = () => {
  const editor = useEditorContext();

  const [isOpen, open, close] = useModal(false);

  const [state, setState] = useState<State | null>(null);

  // Данные формы
  const trigger = useTrigger(true);
  const [color, setColor] = useState(DEFAULT_STATE_COLOR);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { selectedComponent, selectedMethod } = trigger;

    if (!selectedComponent || !selectedMethod || !state) return;

    editor.controller.states.changeStateEvents({
      id: state.id,
      triggerComponent: selectedComponent,
      triggerMethod: selectedMethod,
      actions: [],
      color,
    });

    close();
  };

  // Сброс формы после закрытия
  const handleAfterClose = () => {
    trigger.setSelectedComponent(null);
    trigger.setSelectedMethod(null);

    setColor(DEFAULT_STATE_COLOR);

    setState(null);
  };

  useEffect(() => {
    editor.controller.states.on('changeState', (state) => {
      // if (editor.textMode) return;

      const { data } = state;

      setColor(data.color);

      if (data.events[0]) {
        trigger.setSelectedComponent(data.events[0].trigger.component);
        trigger.setSelectedMethod(data.events[0].trigger.method);
      }

      setState(state);
      open();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      title={`Редактор состояния: ${state?.data.name}`}
      onSubmit={handleSubmit}
      isOpen={isOpen}
      onRequestClose={close}
      onAfterClose={handleAfterClose}
    >
      <div className="flex flex-col gap-3">
        <Trigger {...trigger} />

        {/* <EventsBlock
          state={state}
          transition={transition}
          selectedComponent={trigger.selectedComponent}
          selectedMethod={trigger.selectedMethod}
          events={events}
          setEvents={setEvents}
          onOpenEventsModal={onOpenEventsModal}
          isOpen={isOpen}
        /> */}

        <ColorInput value={color} onChange={setColor} />
      </div>
    </Modal>
  );
};
