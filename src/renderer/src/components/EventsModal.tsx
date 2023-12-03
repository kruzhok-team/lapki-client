import React, { useLayoutEffect, useState } from 'react';

import './Modal/style.css';
import { Select, SelectOption } from '@renderer/components/UI';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { State } from '@renderer/lib/drawable/State';
import { Action, Event } from '@renderer/types/diagram';
import { ArgumentProto } from '@renderer/types/platform';

import { Modal } from './Modal';

import { EventSelection } from '../lib/drawable/Events';

type ArgSet = { [k: string]: string };
type ArgFormEntry = { name: string; description?: string };
type ArgForm = ArgFormEntry[];

interface FormPreset {
  compo: SelectOption;
  event: SelectOption;
  argSet: ArgSet;
  argForm: ArgForm;
}

interface EventsModalProps {
  editor: CanvasEditor;
  manager: EditorManager;
  isData: { state: State; event: EventSelection; click: boolean } | undefined;
  isOpen: boolean;
  onSubmit: (data: EventsModalResult) => void;
  onClose: () => void;
}

export interface EventsModalResult {
  id: { state; event: EventSelection } | undefined;
  trigger: Event;
  action: Action;
}

export const CreateEventsModal: React.FC<EventsModalProps> = ({
  onSubmit,
  onClose,
  editor,
  manager,
  isData,
  isOpen,
}) => {
  const componentsData = manager.useData('elements.components');
  const machine = editor.container.machineController;
  const isEditingEvent = isData?.event.actionIdx === null;

  const compoEntry = (idx: string) => {
    return {
      value: idx,
      label: (
        <div className="flex items-center">
          {machine.platform.getFullComponentIcon(idx, 'mr-1 h-7 w-7')}
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
            className="mr-1 h-7 w-7 object-contain"
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
            className="mr-1 h-7 w-7 object-contain"
          />
          {name}
        </div>
      ),
    };
  };

  const sysCompoOption = isEditingEvent ? [compoEntry('System')] : [];

  const options = [
    ...sysCompoOption,
    ...Array.from(Object.entries(componentsData)).map(([idx, _component]) => compoEntry(idx)),
  ];

  const [components, setComponents] = useState<SelectOption>(options[0]);

  const optionsMethods = !components
    ? []
    : isEditingEvent
    ? machine.platform.getAvailableEvents(components.value).map(({ name }) => eventEntry(name))
    : machine.platform.getAvailableMethods(components.value).map(({ name }) => actionEntry(name));

  const [methods, setMethods] = useState<SelectOption | null>(optionsMethods[0]);

  useLayoutEffect(() => {
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
    const component = machine.platform.getComponent(compo);
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

  useLayoutEffect(() => {
    if (!isChanged) return;
    setArgSet({});
    if (methods) {
      setArgForm(retrieveArgForm(components.value, methods.value));
    } else {
      setArgForm([]);
    }
  }, [methods]);

  const tryGetData = (): FormPreset | undefined => {
    if (isData) {
      const d = isData;
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
      <label key={name} className="mx-1 flex flex-col">
        {name}
        <input
          className="w-[250px] rounded border border-border-primary bg-transparent px-2 py-1 text-text-primary outline-none"
          value={data}
          name={name}
          onChange={(e) => handleInputChange(e)}
        />
      </label>
    );
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSet = { ...argSet };
    newSet[e.target.name] = e.target.value;
    setArgSet(newSet);
  };

  const [isChanged, setIsChanged] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);
  useLayoutEffect(() => {
    if (!wasOpen && isOpen) {
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
    setWasOpen(isOpen);
  }, [isOpen]);

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();

    if (!methods) {
      return;
    }

    // FIXME: очень некорректное дублирование, его нужно снять
    const data = {
      id: isData,
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
    <Modal
      title={`Выберите ${isEditingEvent ? 'событие' : 'действие'}`}
      onSubmit={handleSubmit}
      submitDisabled={!methods}
      className="max-w-sm"
      overlayClassName="z-[60]"
      isOpen={isOpen}
      onRequestClose={onClose}
    >
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
    </Modal>
  );
};
