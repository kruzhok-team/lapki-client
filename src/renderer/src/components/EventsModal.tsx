import React, { useEffect, useState } from 'react';
import ReactModal, { Props } from 'react-modal';

import './Modal/style.css';
import { EventSelection } from '../lib/drawable/Events';
import { Action, Event } from '@renderer/types/diagram';
import { State } from '@renderer/lib/drawable/State';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { Select, SelectOption } from '@renderer/components/UI';
import { ArgumentProto } from '@renderer/types/platform';

type ArgSet = { [k: string]: string };
type ArgFormEntry = { name: string; description?: string };
type ArgForm = ArgFormEntry[];

interface FormPreset {
  compo: SelectOption;
  event: SelectOption;
  argSet: ArgSet;
  argForm: ArgForm;
}

interface EventsModalProps extends Props {
  editor: CanvasEditor | null;
  isData: { state: State; event: EventSelection; click: boolean } | undefined;
  isOpen: boolean;
  cancelLabel?: string;
  submitLabel?: string;
  onSubmit: (data: EventsModalResult) => void;
  onClose: () => void;
}

export interface EventsModalResult {
  id: { state; event: EventSelection } | undefined;
  trigger: Event;
  action: Action;
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

  const sysCompoOption = isEditingEvent ? [compoEntry('System')] : [];

  const options = [
    ...sysCompoOption,
    ...Array.from(machine.components.entries()).map(([idx, _component]) => compoEntry(idx)),
  ];

  const [components, setComponents] = useState<SelectOption>(options[0]);

  const optionsMethods = !components
    ? []
    : isEditingEvent
    ? machine.platform.getAvailableEvents(components.value).map(({ name }) => eventEntry(name))
    : machine.platform.getAvailableMethods(components.value).map(({ name }) => actionEntry(name));

  const [methods, setMethods] = useState<SelectOption | null>(optionsMethods[0]);

  useEffect(() => {
    if (!isChanged) return;
    if (optionsMethods.length > 0) {
      setMethods(optionsMethods[0]);
    } else {
      setMethods(null);
    }
  }, [components]);

  const [argSet, setArgSet] = useState<ArgSet>({});
  const [argForm, setArgForm] = useState<ArgForm>([]);

  const retrieveArgForm = (compo: string, method: string) => {
    const compoType = machine.platform.resolveComponent(compo);
    const component = machine.platform.data.components[compoType];
    if (!component) return [];

    const argList: ArgumentProto[] | undefined = isEditingEvent
      ? component.signals[method]?.parameters
      : component.methods[method]?.parameters;

    if (!argList) return [];
    const argForm: ArgForm = argList.map((arg) => {
      return { name: arg.name, description: arg.description };
    });
    return argForm;
  };

  useEffect(() => {
    if (!isChanged) return;
    setArgSet({});
    if (methods) {
      setArgForm(retrieveArgForm(components.value, methods.value));
    } else {
      setArgForm([]);
    }
  }, [methods]);

  const tryGetData: () => FormPreset | undefined = () => {
    if (props.isData) {
      const d = props.isData;
      if (d.event.eventIdx >= 0) {
        const evs = d.state.eventBox.data[d.event.eventIdx];
        if (evs) {
          if (d.event.actionIdx === null) {
            const compoName = evs.trigger.component;
            const methodName = evs.trigger.method;
            return {
              compo: compoEntry(compoName),
              event: eventEntry(methodName, compoName),
              argSet: evs.trigger.args ?? {},
              argForm: retrieveArgForm(compoName, methodName),
            };
          } else {
            const ac = evs.do[d.event.actionIdx];
            if (ac) {
              const compoName = ac.component;
              const methodName = ac.method;
              const form = retrieveArgForm(compoName, methodName);
              return {
                compo: compoEntry(compoName),
                event: actionEntry(methodName, compoName),
                argSet: ac.args ?? {},
                argForm: form,
              };
            }
          }
        }
      }
    }
    return undefined;
  };

  const parameters = argForm.map((entry) => {
    const name = entry.name;
    const data = argSet[entry.name] ?? '';
    return (
      <>
        <label className="mx-1 flex flex-col">
          {name}
          <input
            className="w-[250px] max-w-[250px] rounded border bg-transparent px-2 py-1 outline-none transition-colors placeholder:font-normal"
            value={data}
            name={name}
            onChange={(e) => handleInputChange(e)}
          />
        </label>
      </>
    );
  });

  const handleInputChange = (e) => {
    const newSet = { ...argSet };
    newSet[e.target.name] = e.target.value;
    setArgSet(newSet);
  };

  const [isChanged, setIsChanged] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);
  useEffect(() => {
    if (!wasOpen && props.isOpen) {
      const d: FormPreset | undefined = tryGetData();
      if (d) {
        setComponents(d.compo);
        setMethods(d.event);
        setArgSet(d.argSet);
        setArgForm(d.argForm);
      } else {
        setComponents(components);
      }
      setIsChanged(false);
    }
    setWasOpen(props.isOpen);
  }, [props.isOpen]);

  const handleSubmit = (ev) => {
    ev.preventDefault();

    if (!methods) {
      return;
    }

    // FIXME: очень некорректное дублирование, его нужно снять
    const data = {
      id: props.isData,
      trigger: {
        component: components.value,
        method: methods.value,
        args: argSet,
      },
      action: {
        component: components.value,
        method: methods.value,
        args: argSet,
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
        <h1 className="text-2xl font-bold">Выберите {isEditingEvent ? 'событие' : 'действие'}</h1>
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
          {parameters?.length > 0 ? <div className="mb-6">{parameters}</div> : ''}
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
            className="rounded bg-neutral-700 px-4 py-2 transition-colors hover:enabled:bg-neutral-600"
            hidden={!onSubmit}
            disabled={!methods}
          >
            {submitLabel ?? 'Сохранить'}
          </button>
        </div>
      </form>
    </ReactModal>
  );
};
