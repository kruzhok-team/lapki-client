import React, { useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';

import { ColorInput } from './Modal/ColorInput';
import { Modal } from './Modal/Modal';
import { twMerge } from 'tailwind-merge';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { TextInput } from './Modal/TextInput';
import { Action, Condition as ConditionData, Event as StateEvent } from '@renderer/types/diagram';
import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { ReactComponent as SubtractIcon } from '@renderer/assets/icons/subtract.svg';
import { Select, SelectOption } from '@renderer/components/UI';
import { Condition } from '@renderer/lib/drawable/Condition';
import { State } from '@renderer/lib/drawable/State';
import { ArgumentProto } from '@renderer/types/platform';

type ArgSet = { [k: string]: string };
type ArgFormEntry = { name: string; description?: string };
type ArgForm = ArgFormEntry[];

interface FormPreset {
  compo: SelectOption;
  event: SelectOption;
  eventParam1: SelectOption;
  eventParam2: SelectOption;
  argSet: ArgSet;
  argForm: ArgForm;
}

interface CreateModalProps {
  isOpen: boolean;
  editor: CanvasEditor | null;
  isData: { state: State } | undefined;
  isTransition: { target: Condition } | undefined;
  isCondition: Action[] | undefined;
  setIsCondition: React.Dispatch<React.SetStateAction<Action[]>>;
  onOpenEventsModal: () => void;
  onClose: () => void;
  onSubmit: (data: CreateModalResult) => void;
}

export interface CreateModalFormValues {
  id: string;
  key: number;
  name: string;
  //Данные основного события
  triggerComponent: string;
  triggerMethod: string;

  argsOneElse: string;
  argsTwoElse: string;
  color: string;
}

export interface CreateModalResult {
  id: string;
  key: number;
  trigger: StateEvent;
  condition?: ConditionData;
  do: Action[];
  color?: string;
}

export const CreateModal: React.FC<CreateModalProps> = ({
  onSubmit,
  onOpenEventsModal,
  onClose,
  isData,
  editor,
  ...props
}) => {
  const {
    register,
    formState: { errors },
    handleSubmit: hookHandleSubmit,
  } = useForm<CreateModalFormValues>();

  //--------------------------------Работа со списком компонентов---------------------------------------
  const machine = editor!.container.machine;

  const isEditingEvent = isData === undefined;

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

  const conditionEntry = (name: string, compo?: string) => {
    return {
      value: name,
      label: (
        <div className="flex items-center">
          <img
            src={machine.platform.getVariableIconUrl(
              compo ? param1Components.value : param2Components.value,
              name,
              true
            )}
            className="mr-1 h-7 w-7"
          />
          {name}
        </div>
      ),
    };
  };

  const sysCompoOption = !isEditingEvent ? [compoEntry('System')] : [];

  const optionsComponents = [
    ...sysCompoOption,
    ...Array.from(machine.components.entries()).map(([idx, _component]) => compoEntry(idx)),
  ];

  const optionsParam1Components = [
    ...sysCompoOption,
    ...Array.from(machine.components.entries()).map(([idx, _component]) => compoEntry(idx)),
  ];

  const optionsParam2Components = [
    ...sysCompoOption,
    ...Array.from(machine.components.entries()).map(([idx, _component]) => compoEntry(idx)),
  ];

  const [components, setComponents] = useState<SelectOption>(optionsComponents[0]);
  const [param1Components, setParam1Components] = useState<SelectOption>(
    optionsParam1Components[0]
  );
  const [param2Components, setParam2Components] = useState<SelectOption>(
    optionsParam2Components[0]
  );

  const optionsMethods = !components
    ? []
    : !isEditingEvent
    ? machine.platform.getAvailableEvents(components.value).map(({ name }) => eventEntry(name))
    : machine.platform.getAvailableMethods(components.value).map(({ name }) => actionEntry(name));

  const optionsParam1Methods = !components
    ? []
    : machine.platform
        .getAvailableVariables(param1Components.value)
        .map(({ name }) => conditionEntry(name, param1Components.value));

  const optionsParam2Methods = !components
    ? []
    : machine.platform
        .getAvailableVariables(param2Components.value)
        .map(({ name }) => conditionEntry(name, param2Components.value));

  const [methods, setMethods] = useState<SelectOption | null>(optionsMethods[0]);
  const [param1Methods, setParam1Methods] = useState<SelectOption | null>(optionsParam1Methods[0]);
  const [param2Methods, setParam2Methods] = useState<SelectOption | null>(optionsParam2Methods[0]);

  useEffect(() => {
    if (isChanged) return;
    if (optionsMethods.length > 0) {
      setMethods(optionsMethods[0]);
    } else {
      setMethods(null);
    }
  }, [components]);

  useEffect(() => {
    if (isChanged) return;
    if (optionsParam1Methods.length > 0) {
      setParam1Methods(optionsParam1Methods[0]);
    } else {
      setParam1Methods(null);
    }
  }, [param1Components]);

  useEffect(() => {
    if (isChanged) return;
    if (optionsParam2Methods.length > 0) {
      setParam2Methods(optionsParam2Methods[0]);
    } else {
      setParam2Methods(null);
    }
  }, [param2Components]);

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
    if (isData) {
      const d = isData;
      if (d.state.eventBox.data.length >= 0) {
        const evs = d.state.eventBox.data[0];
        if (evs) {
          if (d.state.eventBox.data !== null) {
            const compoName = evs.trigger.component;
            const methodName = evs.trigger.method;
            return {
              compo: compoEntry(compoName),
              event: eventEntry(methodName, compoName),
              eventParam1: conditionEntry(methodName, compoName),
              eventParam2: conditionEntry(methodName, compoName),
              argSet: evs.trigger.args ?? {},
              argForm: retrieveArgForm(compoName, methodName),
            };
          } else {
            const ac = evs.trigger;
            if (ac) {
              const compoName = ac.component;
              const methodName = ac.method;
              const form = retrieveArgForm(compoName, methodName);
              return {
                compo: compoEntry(compoName),
                event: actionEntry(methodName, compoName),
                eventParam1: conditionEntry(methodName, compoName),
                eventParam2: conditionEntry(methodName, compoName),
                argSet: ac.args ?? {},
                argForm: form,
              };
            }
          }
        }
      }
    } else if (props.isTransition) {
      const d = props.isTransition.target.transition.data;
      const compoName = d.trigger.component;
      const methodName = d.trigger.method;
      if (d.condition) {
        return {
          compo: compoEntry(compoName),
          event: eventEntry(methodName, compoName),
          //TODO: необходимо доделать вывод уже имеющегося условия
          eventParam1: conditionEntry(methodName, compoName),
          eventParam2: conditionEntry(methodName, compoName),
          argSet: d.trigger.args ?? {},
          argForm: retrieveArgForm(compoName, methodName),
        };
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
        setParam1Methods(d.eventParam1);
        setParam2Methods(d.eventParam2);
        setArgSet(d.argSet);
        setArgForm(d.argForm);
      } else {
        setComponents(components);
      }
      setIsChanged(false);
    }
    setWasOpen(props.isOpen);
  }, [props.isOpen]);

  //-----------------------------------------------------------------------------------------------------

  //-----------------------------Функция для закрытия модального окна-----------------------------------
  const onRequestClose = () => {
    onClose();
  };
  //-----------------------------------------------------------------------------------------------------

  //-------------------------------Реализация показа блоков условия--------------------------------------
  const [isElse, setIsElse] = useState(true);
  const [isParamOne, setIsParamOne] = useState(true);
  const [isParamTwo, setIsParamTwo] = useState(true);
  const handleIsElse = (event) => {
    if (event.target.checked) {
      setIsElse(false);
    } else {
      setIsElse(true);
    }
  };
  const handleParamOne = (event) => {
    if (event.target.checked) {
      setIsParamOne(false);
    } else {
      setIsParamOne(true);
    }
  };
  const handleParamTwo = (event) => {
    if (event.target.checked) {
      setIsParamTwo(false);
    } else {
      setIsParamTwo(true);
    }
  };
  //-----------------------------------------------------------------------------------------------------
  var method: Action[] =
    props.isTransition?.target.transition.data.do !== undefined
      ? [...props.isTransition?.target.transition.data.do, ...props.isCondition!]
      : props.isCondition!;
  //-----------------------------Функция на нажатие кнопки "Сохранить"-----------------------------------
  const [type, setType] = useState<string>();
  const handleSubmit = hookHandleSubmit((formData) => {
    if (!isElse) {
      if (isParamOne && param1Methods?.value == null) {
        return;
      }
      if (isParamTwo && param2Methods?.value == null) {
        return;
      }
    }
    if (methods?.value == null) {
      return;
    }

    const cond = isElse
      ? undefined
      : {
          type: type!,
          value: [
            {
              type: isParamOne ? 'component' : 'value',
              value: isParamOne
                ? {
                    component: param1Components.value,
                    method: param1Methods!.value,
                    args: {},
                  }
                : formData.argsOneElse,
            },
            {
              type: isParamTwo ? 'component' : 'value',
              value: isParamTwo
                ? {
                    component: param2Components.value,
                    method: param2Methods!.value,
                    args: {},
                  }
                : formData.argsTwoElse,
            },
          ],
        };

    const data: CreateModalResult = {
      id: isData !== undefined ? isData.state.id! : '',
      key: isData ? 2 : 3,
      trigger: {
        component: components.value,
        method: methods.value,
      },
      condition: cond,
      do: method,
      color: formData.color,
    };

    onSubmit(data);
  });
  //-----------------------------------------------------------------------------------------------------

  const selectElse = [
    {
      type: 'greater',
      icon: '>',
    },
    {
      type: 'less',
      icon: '<',
    },
    {
      type: 'equals',
      icon: '=',
    },
    {
      type: 'notEquals',
      icon: '!=',
    },
    {
      type: 'greaterOrEqual',
      icon: '>=',
    },
    {
      type: 'lessOrEqual',
      icon: '<=',
    },
  ];

  //Ниже реализовано перетаскивание событий между собой

  const [dragId, setDragId] = useState();
  const handleDrag = (id) => {
    setDragId(id);
    console.log(id);
  };

  const handleDrop = (id) => {
    const dragBox = method.find((_box, index) => index === dragId);
    const dropBox = method.find((_box, index) => index === id);

    const dragBoxOrder = dragBox;
    const dropBoxOrder = dropBox;

    const newBoxState = method.map((box, index) => {
      if (index === dragId) {
        box = dropBoxOrder!;
      }
      if (index === id) {
        box = dragBoxOrder!;
      }
      return box;
    });
    props.setIsCondition(newBoxState);
  };

  const onSelect = (fn) => (value) => {
    fn(value as SelectOption);
  };

  return (
    //--------------------------------------Показ модального окна------------------------------------------
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={
        isData !== undefined
          ? 'Редактирование состояния: ' + JSON.stringify(isData?.state.data.name)
          : 'Редактор соединения'
      }
      onSubmit={handleSubmit}
      submitLabel="Сохранить"
    >
      {/*---------------------------------Добавление основного события-------------------------------------*/}
      <div className="flex items-center">
        <label className="mx-1">Когда: </label>
        <Select
          className="mb-6 h-[34px] w-[200px] max-w-[200px] px-2 py-1"
          options={optionsComponents}
          onChange={onSelect(setComponents)}
          value={components}
          isSearchable={false}
        />
        <Select
          className="mb-6 h-[34px] w-[200px] max-w-[200px] px-2 py-1"
          options={optionsMethods}
          onChange={onSelect(setMethods)}
          value={methods}
          isSearchable={false}
        />
        {parameters?.length >= 0 ? <div className="mb-6">{parameters}</div> : ''}
      </div>

      {/*--------------------------------------Добавление условия------------------------------------------*/}
      {isData !== undefined || (
        <div className="flex items-start">
          <div className="my-3 flex items-center">
            <label className="mx-1">Если: </label>
            <label
              className={twMerge(
                'my-2 ml-3 select-none rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-500',
                !isElse && 'bg-neutral-500'
              )}
            >
              <input type="checkbox" onChange={handleIsElse} className="h-0 w-0 opacity-0" />
              <span>Условие</span>
            </label>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center">
              <input
                type="checkbox"
                onChange={handleParamOne}
                className={twMerge('mx-2', isElse && 'hidden')}
              />
              {isParamOne ? (
                <>
                  <Select
                    className={twMerge(
                      'mb-6 h-[34px] w-[200px] max-w-[200px] px-2 py-1',
                      isElse && 'hidden'
                    )}
                    options={optionsParam1Components}
                    onChange={onSelect(setParam1Components)}
                    value={param1Components}
                    isSearchable={false}
                  />
                  <Select
                    className={twMerge(
                      'mb-6 h-[34px] w-[200px] max-w-[200px] px-2 py-1',
                      isElse && 'hidden'
                    )}
                    options={optionsParam1Methods}
                    onChange={onSelect(setParam1Methods)}
                    value={param1Methods}
                    isSearchable={false}
                  />
                </>
              ) : (
                <TextInput
                  label="Параметр:"
                  placeholder="Напишите параметр"
                  {...register('argsOneElse', {
                    required: 'Это поле обязательно к заполнению!',
                  })}
                  isElse={isElse}
                  error={!!errors.argsOneElse}
                  errorMessage={errors.argsOneElse?.message ?? ''}
                />
              )}
            </div>
            <select
              className={twMerge(
                'mb-4 ml-8 w-[60px] rounded border bg-transparent px-1 py-1 text-white',
                isElse && 'hidden'
              )}
              ref={(event) => {
                if (event !== null) {
                  setType(event.value);
                }
              }}
            >
              {selectElse.map((content) => (
                <option
                  key={'option' + content.type}
                  className="bg-neutral-800"
                  value={content.type}
                  label={content.icon}
                ></option>
              ))}
            </select>
            <div className="flex items-center">
              <input
                type="checkbox"
                disabled={isElse}
                onChange={handleParamTwo}
                className={twMerge('mx-2', isElse && 'hidden')}
              />
              {isParamTwo ? (
                <>
                  <Select
                    className={twMerge(
                      'mb-6 h-[34px] w-[200px] max-w-[200px] px-2 py-1',
                      isElse && 'hidden'
                    )}
                    options={optionsParam2Components}
                    onChange={onSelect(setParam2Components)}
                    value={param2Components}
                    isSearchable={false}
                  />
                  <Select
                    className={twMerge(
                      'mb-6 h-[34px] w-[200px] max-w-[200px] px-2 py-1',
                      isElse && 'hidden'
                    )}
                    options={optionsParam2Methods}
                    onChange={onSelect(setParam2Methods)}
                    value={param2Methods}
                    isSearchable={false}
                  />
                </>
              ) : (
                <TextInput
                  label="Параметр:"
                  placeholder="Напишите параметр"
                  {...register('argsTwoElse', {
                    required: 'Это поле обязательно к заполнению!',
                  })}
                  isElse={isElse}
                  error={!!errors.argsTwoElse}
                  errorMessage={errors.argsTwoElse?.message ?? ''}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/*-------------------------------------Добавление действий-----------------------------------------*/}
      <div className="flex">
        <label className="mx-1">Делай: </label>
        <div className="ml-1 mr-2 flex h-36 w-full flex-col overflow-y-auto break-words rounded bg-neutral-700 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#FFFFFF] scrollbar-thumb-rounded-full">
          {method === undefined ||
            method.map((data, key) => (
              <div
                key={'Methods' + key}
                className="flex"
                draggable={true}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => handleDrag(key)}
                onDrop={() => handleDrop(key)}
              >
                <div
                  key={'newEvent' + key}
                  //draggable
                  className={twMerge(
                    'm-2 flex min-h-[3rem] w-36 items-center justify-around rounded-lg border-2 bg-neutral-700 px-1'
                  )}
                >
                  <img
                    style={{ height: '32px', width: '32px' }}
                    src={machine.platform.getComponentIconUrl(data.component, true)}
                  />
                  <div className="h-full border-2 border-white"></div>
                  <img
                    style={{ height: '32px', width: '32px' }}
                    src={machine.platform.getActionIconUrl(data.component, data.method, true)}
                  />
                </div>
                <div className="flex items-center">
                  <div>{data.component}.</div>
                  <div>{data.method}</div>
                </div>

                {data.args !== undefined || <div>{data.args}</div>}
              </div>
            ))}
        </div>
        <div className="flex flex-col">
          <button
            type="button"
            className="rounded bg-neutral-700 px-1 py-1 transition-colors hover:bg-neutral-600"
            onClick={onOpenEventsModal}
          >
            <AddIcon />
          </button>
          <button
            type="button"
            className="my-2 rounded bg-neutral-700 px-1 py-1 transition-colors hover:bg-neutral-600"
            onClick={onOpenEventsModal /*() => onDeleteEventsModal(activeEvents)*/}
          >
            <SubtractIcon />
          </button>
        </div>
      </div>

      {isData !== undefined || (
        <>
          <ColorInput
            label="Цвет связи:"
            {...register('color', { required: 'Это поле обязательно к заполнению!' })}
            error={!!errors.color}
            errorMessage={errors.color?.message ?? ''}
            defaultValue={props.isTransition?.target.transition.data.color}
          />
        </>
      )}
    </Modal>
  );
};
