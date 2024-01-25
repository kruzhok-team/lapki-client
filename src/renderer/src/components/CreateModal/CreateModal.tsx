import React, { useLayoutEffect, useMemo, useState } from 'react';

import { SingleValue } from 'react-select';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { ReactComponent as SubtractIcon } from '@renderer/assets/icons/subtract.svg';
import { Select, SelectOption, Modal, ColorInput, TextInput } from '@renderer/components/UI';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EditorManager } from '@renderer/lib/data/EditorManager';
import { operatorSet } from '@renderer/lib/data/PlatformManager';
import { State } from '@renderer/lib/drawable/State';
import { Transition } from '@renderer/lib/drawable/Transition';
import {
  Action,
  Condition as ConditionData,
  Event,
  Event as StateEvent,
  Variable as VariableData,
} from '@renderer/types/diagram';
import { defaultTransColor } from '@renderer/utils';

import { EventsBlockModal } from './EventsBlockModal';

export interface CreateModalResult {
  id: string;
  key: number;
  trigger: StateEvent;
  condition?: ConditionData;
  do: Action[];
  color?: string;
}

interface CreateModalProps {
  editor: CanvasEditor;
  manager: EditorManager;
  state: State | undefined;
  transition: Transition | undefined;
  events: Action[];
  setEvents: React.Dispatch<React.SetStateAction<Action[]>>;
  onOpenEventsModal: (event?: Event) => void;
  isOpen: boolean;
  onSubmit: (data: CreateModalResult) => void;
  onClose: () => void;
}

export const CreateModal: React.FC<CreateModalProps> = ({
  editor,
  manager,
  state,
  transition,
  events,
  setEvents,
  onOpenEventsModal,
  isOpen,
  onSubmit,
  onClose,
}) => {
  const operand = [
    {
      value: 'greater',
      label: '>',
    },
    {
      value: 'less',
      label: '<',
    },
    {
      value: 'equals',
      label: '=',
    },
    {
      value: 'notEquals',
      label: '!=',
    },
    {
      value: 'greaterOrEqual',
      label: '>=',
    },
    {
      value: 'lessOrEqual',
      label: '<=',
    },
  ];

  const componentsData = manager.useData('elements.components');
  const machine = editor.container.machineController;
  const isEditingState = state !== undefined;

  //Хранение цвета связи
  const [color, setColor] = useState<string>();
  const [conditionOperator, setConditionOperator] = useState<string | null>(null);

  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [selectedComponentParam1, setSelectedComponentParam1] = useState<string | null>(null);
  const [selectedComponentParam2, setSelectedComponentParam2] = useState<string | null>(null);

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedMethodParam1, setSelectedMethodParam1] = useState<string | null>(null);
  const [selectedMethodParam2, setSelectedMethodParam2] = useState<string | null>(null);

  const [argsParam1, setArgsParam1] = useState<string | number | null>(null);
  const [argsParam2, setArgsParam2] = useState<string | number | null>(null);

  const componentOptions: SelectOption[] = useMemo(() => {
    const getComponentOption = (id: string) => {
      const proto = machine.platform.getComponent(id);

      return {
        value: id,
        label: id,
        hint: proto?.description,
        icon: machine.platform.getFullComponentIcon(id, 'mr-1 h-7 w-7'),
      };
    };

    const result = Object.keys(componentsData).map((idx) => getComponentOption(idx));

    if (isEditingState) {
      result.unshift(getComponentOption('System'));
    }

    return result;
  }, [componentsData, isEditingState, machine]);

  const componentOptionsParam1: SelectOption[] = useMemo(() => {
    const getComponentOption = (id: string) => {
      const proto = machine.platform.getComponent(id);

      return {
        value: id,
        label: id,
        hint: proto?.description,
        icon: machine.platform.getFullComponentIcon(id, 'mr-1 h-7 w-7'),
      };
    };

    const result = Object.keys(componentsData).map((idx) => getComponentOption(idx));

    if (isEditingState) {
      result.unshift(getComponentOption('System'));
    }

    return result;
  }, [componentsData, isEditingState, machine]);

  const componentOptionsParam2: SelectOption[] = useMemo(() => {
    const getComponentOption = (id: string) => {
      const proto = machine.platform.getComponent(id);

      return {
        value: id,
        label: id,
        hint: proto?.description,
        icon: machine.platform.getFullComponentIcon(id, 'mr-1 h-7 w-7'),
      };
    };

    const result = Object.keys(componentsData).map((idx) => getComponentOption(idx));

    if (isEditingState) {
      result.unshift(getComponentOption('System'));
    }

    return result;
  }, [componentsData, isEditingState, machine]);

  const methodOptions: SelectOption[] = useMemo(() => {
    if (!selectedComponent) return [];
    const getAll = machine.platform['getAvailableEvents'];
    const getImg = machine.platform['getEventIconUrl'];

    // Тут call потому что контекст теряется
    return getAll.call(machine.platform, selectedComponent).map(({ name, description }) => {
      return {
        value: name,
        label: name,
        hint: description,
        icon: (
          <img
            src={getImg.call(machine.platform, selectedComponent, name, true)}
            className="mr-1 h-7 w-7 object-contain"
          />
        ),
      };
    });
  }, [machine, selectedComponent]);

  const methodOptionsParam1: SelectOption[] = useMemo(() => {
    if (!selectedComponentParam1) return [];
    const getAll = machine.platform['getAvailableVariables'];
    const getImg = machine.platform['getVariableIconUrl'];

    // Тут call потому что контекст теряется
    return getAll.call(machine.platform, selectedComponentParam1).map(({ name, description }) => {
      return {
        value: name,
        label: name,
        hint: description,
        icon: (
          <img
            src={getImg.call(machine.platform, selectedComponentParam1, name, true)}
            className="mr-1 h-7 w-7 object-contain"
          />
        ),
      };
    });
  }, [machine, selectedComponentParam1]);

  const methodOptionsParam2: SelectOption[] = useMemo(() => {
    if (!selectedComponentParam2) return [];
    const getAll = machine.platform['getAvailableVariables'];
    const getImg = machine.platform['getVariableIconUrl'];

    // Тут call потому что контекст теряется
    return getAll.call(machine.platform, selectedComponentParam2).map(({ name, description }) => {
      return {
        value: name,
        label: name,
        hint: description,
        icon: (
          <img
            src={getImg.call(machine.platform, selectedComponentParam2, name, true)}
            className="mr-1 h-7 w-7 object-contain"
          />
        ),
      };
    });
  }, [machine, selectedComponentParam2]);

  //-------------------------------Реализация показа блоков условия--------------------------------------
  const [conditionShow, setConditionShow] = useState(true);
  const [isParamOneInput1, setIsParamOneInput1] = useState(true);
  const [isParamOneInput2, setIsParamOneInput2] = useState(true);
  const handleIsElse = (event) => {
    return setConditionShow(!event.target.checked);
  };
  const handleParamOneInput1 = (event) => {
    return setIsParamOneInput1(!event.target.checked);
  };
  const handleParamOneInput2 = (event) => {
    return setIsParamOneInput2(!event.target.checked);
  };

  //-----------------------------------------------------------------------------------------------------

  const handleComponentChange = (value: SingleValue<SelectOption>) => {
    setSelectedComponent(value?.value ?? '');
    setSelectedMethod('');
  };
  const handleComponentParam1Change = (value: SingleValue<SelectOption>) => {
    setSelectedComponentParam1(value?.value ?? '');
    setSelectedMethodParam1('');
  };
  const handleComponentParam2Change = (value: SingleValue<SelectOption>) => {
    setSelectedComponentParam2(value?.value ?? '');
    setSelectedMethodParam2('');
  };

  const handleMethodChange = (value: SingleValue<SelectOption>) => {
    setSelectedMethod(value?.value ?? '');
  };
  const handleMethodParam1Change = (value: SingleValue<SelectOption>) => {
    setSelectedMethodParam1(value?.value ?? '');
  };
  const handleMethodParam2Change = (value: SingleValue<SelectOption>) => {
    setSelectedMethodParam2(value?.value ?? '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedComponent || !selectedMethod) return;

    //Проверка на наличие пустых блоков условия, если же они пустые, то форма не отправляется
    if (!conditionShow) {
      if (isParamOneInput1 && !selectedComponentParam1 && !selectedMethodParam1) {
        return;
      }
      if (isParamOneInput2 && !selectedComponentParam2 && !selectedMethodParam2) {
        return;
      }
      if (!isParamOneInput1 && argsParam1 === '') {
        return;
      }
      if (!isParamOneInput2 && argsParam2 === '') {
        return;
      }
    }

    if (methodOptions == null) {
      return;
    }

    const condition = conditionShow
      ? undefined
      : {
          type: conditionOperator!,
          value: [
            {
              type: isParamOneInput1 ? 'component' : 'value',
              value: isParamOneInput1
                ? {
                    component: selectedComponentParam1!,
                    method: selectedMethodParam1!,
                    args: {},
                  }
                : argsParam1!,
            },
            {
              type: isParamOneInput2 ? 'component' : 'value',
              value: isParamOneInput2
                ? {
                    component: selectedComponentParam2!,
                    method: selectedMethodParam2!,
                    args: {},
                  }
                : argsParam2!,
            },
          ],
        };

    const data: CreateModalResult = {
      id: isEditingState ? state!.id : '',
      key: isEditingState ? 2 : 3,
      trigger: {
        component: selectedComponent,
        method: selectedMethod,
      },
      condition: condition,
      do: events,
      color: color,
    };

    if ((state && events.length !== 0) || state === undefined) {
      onSubmit(data);
    }
  };

  // Обработка начальных данных
  useLayoutEffect(() => {
    // Сброс всего если нет начальных данных, то есть когда создаём новое событие
    setSelectedComponent('');
    setSelectedComponentParam1('');
    setSelectedComponentParam2('');
    setArgsParam1('');
    setConditionOperator('');
    setSelectedMethod('');
    setSelectedMethodParam1('');
    setSelectedMethodParam2('');
    setArgsParam2('');
    setColor(transition?.data.color);

    if (isEditingState) {
      if (!state) return;

      if (state.data.events.length === 0) return;

      const init = (state: State) => {
        const { data } = state;

        setSelectedComponent(data.events[0].trigger.component);
        setSelectedMethod(data.events[0].trigger.method);
      };
      return init(state);
    }

    //Позволяет найти начальные значения условия(условий), если таковые имеются
    const tryGetCondition = () => {
      if (transition) {
        const c = transition.data.condition;
        if (!c) return undefined;
        const operator = c.type;
        if (!operatorSet.has(operator) || !Array.isArray(c.value) || c.value.length != 2) {
          console.warn('👽 got condition from future (not comparsion)', c);
          return undefined;
        }
        const param1 = c.value[0];
        const param2 = c.value[1];
        if (Array.isArray(param1.value) || Array.isArray(param2.value)) {
          console.warn('👽 got condition from future (non-value operands)', c);
          return undefined;
        }

        if (
          param1.type == 'value' &&
          (typeof param1.value === 'string' || typeof param1.value === 'number')
        ) {
          setArgsParam1(param1.value);
        } else if (param1.type == 'component') {
          const compoName = (param1.value as VariableData).component;
          const methodName = (param1.value as VariableData).method;
          setSelectedComponentParam1(compoName);
          setSelectedMethodParam1(methodName);
          //eventVar1 = [compoEntry(compoName), conditionEntry(methodName, compoName)];
        } else {
          console.warn('👽 got condition from future (strange operand 1)', c);
          return undefined;
        }

        if (
          param2.type == 'value' &&
          (typeof param2.value === 'string' || typeof param2.value === 'number')
        ) {
          setArgsParam2(param2.value);
        } else if (param2.type == 'component') {
          const compoName = (param2.value as VariableData).component;
          const methodName = (param2.value as VariableData).method;
          setSelectedComponentParam2(compoName);
          setSelectedMethodParam2(methodName);
        } else {
          console.warn('👽 got condition from future (strange operand 2)', c);
          return undefined;
        }
        return setConditionOperator(operator);
      }
      return undefined;
    };

    if (!transition) return;
    const init = (transition: Transition) => {
      const { data } = transition;

      setSelectedComponent(data.trigger.component);
      setSelectedMethod(data.trigger.method);

      tryGetCondition();
    };
    return init(transition);
  }, [machine, isEditingState, state, transition]);

  return (
    //--------------------------------------Показ модального окна------------------------------------------
    <Modal
      title={
        isEditingState
          ? 'Редактор состояния: ' + JSON.stringify(state?.data.name)
          : 'Редактор соединения'
      }
      onSubmit={handleSubmit}
      isOpen={isOpen}
      onRequestClose={onClose}
    >
      {/*---------------------------------Добавление основного события-------------------------------------*/}
      <div className="my-5 flex items-center">
        <label className="mx-1 align-middle font-bold">Когда: </label>
        <Select
          className="mx-1 h-[34px] w-[200px] max-w-[200px] align-middle"
          options={componentOptions}
          onChange={handleComponentChange}
          value={componentOptions.find((o) => o.value === selectedComponent) ?? null}
          isSearchable={false}
        />
        <Select
          className="mx-1 h-[34px] w-[200px] max-w-[200px]"
          options={methodOptions}
          onChange={handleMethodChange}
          value={methodOptions.find((o) => o.value === selectedMethod) ?? null}
          isSearchable={false}
        />
        {isEditingState && (events ? <p className="text-success">✔</p> : <p>(Новое событие)</p>)}
        {/* {parameters?.length >= 0 ? <div className="mb-6">{parameters}</div> : ''} */}
      </div>

      {/*--------------------------------------Добавление условия------------------------------------------*/}
      {isEditingState || (
        <div className="my-3 flex items-start">
          <div className="flex items-center">
            <label className="mx-1 font-bold">Если: </label>
            <label
              className={twMerge('btn ml-3 border-primary px-3', !conditionShow && 'btn-primary')}
            >
              <input
                type="checkbox"
                checked={!conditionShow}
                onChange={handleIsElse}
                className="h-0 w-0 opacity-0"
              />
              <span>Условие</span>
            </label>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center">
              <input
                type="checkbox"
                onChange={handleParamOneInput1}
                checked={!isParamOneInput1}
                className={twMerge('mx-4', conditionShow && 'hidden')}
              />
              {isParamOneInput1 ? (
                <>
                  <Select
                    className={twMerge(
                      'mx-1 my-3 h-[34px] w-[200px] max-w-[200px]',
                      conditionShow && 'hidden'
                    )}
                    options={componentOptionsParam1}
                    onChange={handleComponentParam1Change}
                    value={
                      componentOptionsParam1.find((o) => o.value === selectedComponentParam1) ??
                      null
                    }
                    isSearchable={false}
                  />
                  <Select
                    className={twMerge(
                      'mx-1 my-3 h-[34px] w-[200px] max-w-[200px]',
                      conditionShow && 'hidden'
                    )}
                    options={methodOptionsParam1}
                    onChange={handleMethodParam1Change}
                    value={
                      methodOptionsParam1.find((o) => o.value === selectedMethodParam1) ?? null
                    }
                    isSearchable={false}
                  />
                </>
              ) : (
                <TextInput
                  label="Параметр:"
                  placeholder="Напишите параметр"
                  hidden={conditionShow}
                  onChange={(e) => setArgsParam1(e.target.value)}
                  value={argsParam1 ?? undefined}
                  error={false}
                  errorMessage={''}
                />
              )}
            </div>
            <Select
              className={twMerge('mx-12 my-3 max-w-[200px]', conditionShow && 'hidden')}
              options={operand}
              onChange={(v) => setConditionOperator((v as any).value)}
              value={operand.find((opt) => opt.value === conditionOperator)}
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                disabled={conditionShow}
                checked={!isParamOneInput2}
                onChange={handleParamOneInput2}
                className={twMerge('mx-4', conditionShow && 'hidden')}
              />
              {isParamOneInput2 ? (
                <>
                  <Select
                    className={twMerge(
                      'mx-1 my-3 h-[34px] w-[200px] max-w-[200px]',
                      conditionShow && 'hidden'
                    )}
                    options={componentOptionsParam2}
                    onChange={handleComponentParam2Change}
                    value={
                      componentOptionsParam2.find((o) => o.value === selectedComponentParam2) ??
                      null
                    }
                    isSearchable={false}
                  />
                  <Select
                    className={twMerge(
                      'mx-1 my-3 h-[34px] w-[200px] max-w-[200px]',
                      conditionShow && 'hidden'
                    )}
                    options={methodOptionsParam2}
                    onChange={handleMethodParam2Change}
                    value={
                      methodOptionsParam2.find((o) => o.value === selectedMethodParam2) ?? null
                    }
                    isSearchable={false}
                  />
                </>
              ) : (
                <TextInput
                  label="Параметр:"
                  placeholder="Напишите параметр"
                  hidden={conditionShow}
                  onChange={(e) => setArgsParam2(e.target.value)}
                  value={argsParam2 ?? undefined}
                  error={false}
                  errorMessage={''}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/*-------------------------------------Добавление действий-----------------------------------------*/}
      <EventsBlockModal
        editor={editor}
        state={state}
        transition={transition}
        selectedComponent={selectedComponent}
        selectedMethod={selectedMethod}
        events={events}
        setEvents={setEvents}
        onOpenEventsModal={onOpenEventsModal}
        isOpen={isOpen}
      />
      {isEditingState || (
        <ColorInput
          label="Цвет связи:"
          onChange={(e) => setColor(e.target.value)}
          defaultValue={transition?.data.color ?? defaultTransColor}
        />
      )}
    </Modal>
  );
};
