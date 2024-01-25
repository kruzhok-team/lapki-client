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
  isState: { state: State } | undefined;
  isTransition: { transition: Transition } | undefined;
  isEvents: Action[] | undefined;
  setIsEvents: React.Dispatch<React.SetStateAction<Action[]>>;
  onOpenEventsModal: (event?: Event) => void;
  isOpen: boolean;
  onSubmit: (data: CreateModalResult) => void;
  onClose: () => void;
}

export const CreateModal: React.FC<CreateModalProps> = ({
  editor,
  manager,
  isState,
  isTransition,
  isEvents,
  setIsEvents,
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
  const isEditingData = isState !== undefined;

  //Хранение цвета связи
  const [color, setColor] = useState<string>();
  const [errors, setErrors] = useState<boolean>(false);
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

    if (isEditingData) {
      result.unshift(getComponentOption('System'));
    }

    return result;
  }, [componentsData, isEditingData, machine]);

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

    if (isEditingData) {
      result.unshift(getComponentOption('System'));
    }

    return result;
  }, [componentsData, isEditingData, machine]);

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

    if (isEditingData) {
      result.unshift(getComponentOption('System'));
    }

    return result;
  }, [componentsData, isEditingData, machine]);

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
  const [isParamOne, setIsParamOne] = useState(true);
  const [isParamTwo, setIsParamTwo] = useState(true);
  const handleIsElse = (event) => {
    return setConditionShow(!event.target.checked);
  };
  const handleParamOne = (event) => {
    return setIsParamOne(!event.target.checked);
  };
  const handleParamTwo = (event) => {
    return setIsParamTwo(!event.target.checked);
  };

  //-----------------------------------------------------------------------------------------------------

  //Делаем проверку на наличие событий в состояниях
  const dataEvents = isState?.state.eventBox.data.find(
    (value) =>
      selectedComponent === value.trigger.component && selectedMethod === value.trigger.method
  );

  useLayoutEffect(() => {
    if (!isTransition) {
      if (isState && dataEvents) {
        return setIsEvents(dataEvents.do);
      }
      return setIsEvents([]);
    }
  }, [dataEvents, isState, isTransition]);

  const method: Action[] = isEvents!;

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
      if (isParamOne && !selectedComponentParam1 && !selectedMethodParam1) {
        return;
      }
      if (isParamTwo && !selectedComponentParam2 && !selectedMethodParam2) {
        return;
      }
      if (!isParamOne && argsParam1 === '') {
        return;
      }
      if (!isParamTwo && argsParam2 === '') {
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
              type: isParamOne ? 'component' : 'value',
              value: isParamOne
                ? {
                    component: selectedComponentParam1!,
                    method: selectedMethodParam1!,
                    args: {},
                  }
                : argsParam1!,
            },
            {
              type: isParamTwo ? 'component' : 'value',
              value: isParamTwo
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
      id: isEditingData ? isState.state.id : '',
      key: isEditingData ? 2 : 3,
      trigger: {
        component: selectedComponent,
        method: selectedMethod,
      },
      condition: condition,
      do: method,
      color: color,
    };

    if ((isState && method.length !== 0) || isState === undefined) {
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
    setColor(isTransition?.transition.data.color);

    if (isEditingData) {
      if (isState.state.data.events.length === 0) return;

      const { state } = isState;
      const init = (state: State) => {
        const { data } = state;

        setSelectedComponent(data.events[0].trigger.component);
        setSelectedMethod(data.events[0].trigger.method);
      };
      return init(state);
    }

    //Позволяет найти начальные значения условия(условий), если таковые имеются
    const tryGetCondition = () => {
      if (isTransition) {
        const c = isTransition.transition.data.condition;
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

    if (!isTransition) return;
    const { transition } = isTransition;
    const init = (transition: Transition) => {
      const { data } = transition;

      setSelectedComponent(data.trigger.component);
      setSelectedMethod(data.trigger.method);

      tryGetCondition();
    };
    return init(transition);
  }, [machine, isEditingData, isState, isTransition]);

  //Срабатывания клика по элементу списка действий и удаление выбранного действия
  const [clickList, setClickList] = useState<number>(0);

  const deleteMethod = () => {
    const delMethod = method.filter((_value, index) => clickList !== index);
    setIsEvents(delMethod);
  };

  //Ниже реализовано перетаскивание событий между собой
  const [dragId, setDragId] = useState();
  const handleDrag = (id) => {
    setDragId(id);
  };

  const handleDrop = (id) => {
    const dragBox = method.find((_box, index) => index === dragId);
    const dropBox = method.find((_box, index) => index === id);

    if (!dragBox || !dropBox) return;

    const dragBoxOrder = dragBox;
    const dropBoxOrder = dropBox;

    const newBoxState = method.map((box, index) => {
      if (index === dragId) {
        box = dropBoxOrder;
      }
      if (index === id) {
        box = dragBoxOrder;
      }
      return box;
    });
    setIsEvents(newBoxState);
  };

  return (
    //--------------------------------------Показ модального окна------------------------------------------
    <Modal
      title={
        isEditingData
          ? 'Редактор состояния: ' + JSON.stringify(isState.state.data.name)
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
        {isEditingData && (dataEvents ? <p className="text-success">✔</p> : <p>(Новое событие)</p>)}
        {/* {parameters?.length >= 0 ? <div className="mb-6">{parameters}</div> : ''} */}
      </div>

      {/*--------------------------------------Добавление условия------------------------------------------*/}
      {isEditingData || (
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
                onChange={handleParamOne}
                checked={!isParamOne}
                className={twMerge('mx-4', conditionShow && 'hidden')}
              />
              {isParamOne ? (
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
                  isHidden={conditionShow}
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
                checked={!isParamTwo}
                onChange={handleParamTwo}
                className={twMerge('mx-4', conditionShow && 'hidden')}
              />
              {isParamTwo ? (
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
                  isHidden={conditionShow}
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
      <div className="my-1 flex">
        <label className="mx-1 mt-2 font-bold">Делай: </label>
        <div className="ml-1 mr-2 flex h-44 w-full flex-col overflow-y-auto break-words rounded bg-bg-secondary scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
          {method.length === 0 ||
            method.map((data, key) => (
              <div
                key={'Methods' + key}
                className={twMerge('flex hover:bg-bg-hover', clickList === key && 'bg-bg-active')}
                onClick={() => setClickList(key)}
                draggable={true}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => handleDrag(key)}
                onDrop={() => handleDrop(key)}
                onDoubleClick={() => onOpenEventsModal(data)}
              >
                <div
                  className={twMerge(
                    'm-2 flex min-h-[3rem] w-36 items-center justify-around rounded-md bg-bg-primary px-1'
                  )}
                >
                  {machine.platform.getFullComponentIcon(data.component)}
                  <div className="h-full w-[2px] bg-border-primary"></div>
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
          {method.length === 0 && <div className="mx-2 my-2 flex">(нет действий)</div>}
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" className="btn-secondary p-1" onClick={() => onOpenEventsModal()}>
            <AddIcon />
          </button>
          <button type="button" className="btn-secondary p-1" onClick={deleteMethod}>
            <SubtractIcon />
          </button>
        </div>
      </div>
      {isEditingData || (
        <ColorInput
          label="Цвет связи:"
          onChange={(e) => setColor(e.target.value)}
          defaultValue={isTransition?.transition.data.color ?? defaultTransColor}
        />
      )}
    </Modal>
  );
};
