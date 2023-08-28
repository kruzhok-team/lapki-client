import React, { useEffect, useState } from 'react';
import ReactModal, { Props } from 'react-modal';

import './Modal/style.css';
import { EventSelection } from '../lib/drawable/Events';
import { Action } from '@renderer/types/diagram';
import { State } from '@renderer/lib/drawable/State';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Select, SelectOption } from '@renderer/components/UI';

interface EventsModalProps extends Props {
  editor: CanvasEditor | null;
  isData: { state: State; event: EventSelection; click: boolean } | undefined;
  isOpen: boolean;
  cancelLabel?: string;
  submitLabel?: string;
  onSubmit: (data: EventsModalFormValues) => void;
  onClose: () => void;
}

export interface EventsModalFormValues {
  id: { state; event: EventSelection } | undefined;
  doComponent: string;
  doMethod: string;
  doArgs: { [key: string]: string } | undefined;
  condition: Action;
}

export const CreateEventsModal: React.FC<EventsModalProps> = ({
  cancelLabel,
  submitLabel,
  onSubmit,
  onClose,
  editor,
  ...props
}) => {
  const machine = editor!.container.machine;
  const isEditingEvent = props.isData?.event.actionIdx === null;

  const compoEntry = (idx: string) => {
    return {
      value: idx,
      label: (
        <div className="flex items-center">
          <img src={machine.platform.getComponentIconUrl(idx, true)} className="mr-1 h-7 w-7" />
          {idx}
        </div>
      ),
    };
  };

  const eventEntry = (name: string, compo?: string) => {
    return {
      value: name,
      label: (
        <div className="flex items-center">
          <img
            src={machine.platform.getEventIconUrl(compo ?? components.value, name, true)}
            className="mr-1 h-7 w-7"
          />
          {name}
        </div>
      ),
    };
  };

  const actionEntry = (name: string, compo?: string) => {
    return {
      value: name,
      label: (
        <div className="flex items-center">
          <img
            src={machine.platform.getActionIconUrl(compo ?? components.value, name, true)}
            className="mr-1 h-7 w-7"
          />
          {name}
        </div>
      ),
    };
  };

  const sysCompoOption = isEditingEvent
    ? [
        {
          value: 'System',
          label: (
            <div className="flex items-center">
              <img
                src={machine.platform.getComponentIconUrl('System', true)}
                className="mr-1 h-7 w-7"
              />
              {'System'}
            </div>
          ),
        },
      ]
    : [];

  const options = [
    ...sysCompoOption,
    ...Array.from(machine.components.entries()).map(([idx, _component]) => compoEntry(idx)),
  ];

  const [components, setComponents] = useState<SelectOption>(options[0]);

  const optionsMethods = isEditingEvent
    ? machine.platform.getAvailableEvents(components.value).map(({ name }) => eventEntry(name))
    : machine.platform.getAvailableMethods(components.value).map(({ name }) => actionEntry(name));

  const [methods, setMethods] = useState<SelectOption>(optionsMethods[0]);
  useEffect(() => {
    if (!isChanged) return;
    setMethods(optionsMethods[0]);
  }, [components]);

  const tryGetData = () => {
    if (props.isData) {
      const d = props.isData;
      if (d.event.eventIdx >= 0) {
        const evs = d.state.eventBox.data[d.event.eventIdx];
        if (evs) {
          if (d.event.actionIdx === null) {
            return [
              compoEntry(evs.trigger.component),
              eventEntry(evs.trigger.method, evs.trigger.component),
            ];
          } else {
            const ac = evs.do[d.event.actionIdx];
            if (ac) {
              return [compoEntry(ac.component), actionEntry(ac.method, ac.component)];
            }
          }
        }
      }
    }
    return undefined;
  };

  const [isChanged, setIsChanged] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);
  useEffect(() => {
    if (!wasOpen && props.isOpen) {
      const d: SelectOption[] | undefined = tryGetData();
      if (d) {
        setComponents(d[0]);
        setMethods(d[1]);
      } else {
        setComponents(components[0]);
      }
      setIsChanged(false);
    }
    setWasOpen(props.isOpen);
  }, [props.isOpen]);

  const handleSubmit = (ev) => {
    ev.preventDefault();

    const data = {
      id: props.isData,
      doComponent: components.value,
      doMethod: methods.value,
      doArgs: {},
      condition: {
        component: components.value,
        method: methods.value,
        args: {},
      },
    };
    onSubmit(data);
  };

  const onSelect = (fn) => (value) => {
    setIsChanged(true);
    fn(value as SelectOption);
  };

  return (
    <ReactModal
      {...props}
      className="absolute left-1/2 top-12 w-full max-w-sm -translate-x-1/2 rounded-lg bg-neutral-800 p-6 text-neutral-100 outline-none"
      overlayClassName="bg-neutral-700 fixed inset-0 backdrop-blur z-50"
      onRequestClose={onClose}
    >
      <div className="relative mb-3 justify-between border-b border-neutral-400 pb-1">
        <h1 className="text-2xl font-bold">Редактирование события</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col items-center">
          <Select
            className="mb-6 h-[34px] w-[200px] max-w-[200px] py-1"
            options={options}
            onChange={onSelect(setComponents)}
            value={components}
            isSearchable={false}
          />
          <Select
            className="mb-6 h-[34px] w-[200px] max-w-[200px] py-1"
            options={optionsMethods}
            onChange={onSelect(setMethods)}
            value={methods}
            isSearchable={false}
          />
          {/* <TextInput
            label="Параметр:"
            placeholder="Напишите параметр"
            {...register('doArgs', {
              required: 'Это поле обязательно к заполнению!',
            })}
            isElse={false}
            error={!!errors.doArgs}
            // FIXME: некритичная ошибка по типам
            // @ts-ignore
            errorMessage={errors.doArgs?.message ?? ''}
          /> */}
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded px-4 py-2 text-neutral-400 transition-colors hover:text-neutral-50"
            onClick={onClose}
          >
            {cancelLabel ?? 'Закрыть'}
          </button>
          <button
            type="submit"
            className="rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
            hidden={!onSubmit}
          >
            {submitLabel ?? 'Сохранить'}
          </button>
        </div>
      </form>
    </ReactModal>
  );
};
