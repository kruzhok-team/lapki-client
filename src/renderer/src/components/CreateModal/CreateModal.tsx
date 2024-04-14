import React, { useLayoutEffect, useMemo, useState } from 'react';

import { SingleValue } from 'react-select';

import { Select, SelectOption, Modal, ColorInput } from '@renderer/components/UI';
import { useCreateModalCondition } from '@renderer/hooks';
import { operatorSet } from '@renderer/lib/data/PlatformManager';
import { State, Transition } from '@renderer/lib/drawable';
import { useEditorContext } from '@renderer/store/EditorContext';
import {
  Action,
  Condition as ConditionData,
  Event,
  Event as StateEvent,
  Variable as VariableData,
} from '@renderer/types/diagram';
import { defaultTransColor } from '@renderer/utils';

import { Condition } from './Condition';
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
  state,
  transition,
  events,
  setEvents,
  onOpenEventsModal,
  isOpen,
  onSubmit,
  onClose,
}) => {
  const editor = useEditorContext();
  const model = editor.model;

  const componentsData = model.useData('elements.components');
  const machine = editor.editorView.editorController;
  const isEditingState = state !== undefined;

  const [formState, setFormState] = useState<'submitted' | 'default'>('default');

  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

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

  const handleComponentChange = (value: SingleValue<SelectOption>) => {
    setSelectedComponent(value?.value ?? '');
    setSelectedMethod('');
  };

  const handleMethodChange = (value: SingleValue<SelectOption>) => {
    setSelectedMethod(value?.value ?? '');
  };

  //Хранение цвета связи
  const [color, setColor] = useState(defaultTransColor);

  const condition = useCreateModalCondition({ isEditingState, formState });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setFormState('submitted');

    if (!selectedComponent || !selectedMethod) return;

    const {
      show,
      isParamOneInput1,
      selectedComponentParam1,
      selectedMethodParam1,
      isParamOneInput2,
      selectedComponentParam2,
      selectedMethodParam2,
      argsParam1,
      argsParam2,
      conditionOperator,
    } = condition;

    //Проверка на наличие пустых блоков условия, если же они пустые, то форма не отправляется
    if (show) {
      const errors = condition.checkForErrors();

      for (const key in errors) {
        if (errors[key]) return;
      }
    }

    if (methodOptions == null) {
      return;
    }

    const resultCondition = !show
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
      id: isEditingState ? state.id : '',
      key: isEditingState ? 2 : 3,
      trigger: {
        component: selectedComponent,
        method: selectedMethod,
      },
      condition: resultCondition,
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
    condition.setSelectedComponentParam1('');
    condition.setSelectedComponentParam2('');
    condition.setArgsParam1('');
    condition.setConditionOperator('');
    setSelectedMethod('');
    condition.setSelectedMethodParam1('');
    condition.setSelectedMethodParam2('');
    condition.setArgsParam2('');
    setColor(transition?.data?.color ?? defaultTransColor);
    condition.handleChangeConditionShow(false);
    condition.handleParamOneInput1(true);
    condition.handleParamOneInput2(true);
    setFormState('default');
    condition.setErrors({});

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
      if (!transition) return;
      const c = transition.data.label?.condition;
      if (!c) return undefined;
      condition.handleChangeConditionShow(true);
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
        condition.handleParamOneInput1(false);
        condition.setArgsParam1(param1.value);
      } else if (param1.type == 'component') {
        const compoName = (param1.value as VariableData).component;
        const methodName = (param1.value as VariableData).method;
        condition.handleParamOneInput1(true);
        condition.setSelectedComponentParam1(compoName);
        condition.setSelectedMethodParam1(methodName);
        //eventVar1 = [compoEntry(compoName), conditionEntry(methodName, compoName)];
      } else {
        console.warn('👽 got condition from future (strange operand 1)', c);
        return undefined;
      }

      if (
        param2.type == 'value' &&
        (typeof param2.value === 'string' || typeof param2.value === 'number')
      ) {
        condition.handleParamOneInput2(false);
        condition.setArgsParam2(param2.value);
      } else if (param2.type == 'component') {
        const compoName = (param2.value as VariableData).component;
        const methodName = (param2.value as VariableData).method;
        condition.handleParamOneInput2(true);
        condition.setSelectedComponentParam2(compoName);
        condition.setSelectedMethodParam2(methodName);
      } else {
        console.warn('👽 got condition from future (strange operand 2)', c);
        return undefined;
      }
      return condition.setConditionOperator(operator);
    };

    if (!transition) return;
    const init = (transition: Transition) => {
      const { data } = transition;

      if (!data.label?.trigger) return;

      setSelectedComponent(data.label.trigger.component);
      setSelectedMethod(data.label.trigger.method);

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
      <div className="flex items-center">
        <p className="mr-2 font-bold">Когда:</p>
        <div className="flex w-full gap-2">
          <Select
            containerClassName="w-full"
            options={componentOptions}
            onChange={handleComponentChange}
            value={componentOptions.find((o) => o.value === selectedComponent) ?? null}
            isSearchable={false}
          />
          <Select
            containerClassName="w-full"
            options={methodOptions}
            onChange={handleMethodChange}
            value={methodOptions.find((o) => o.value === selectedMethod) ?? null}
            isSearchable={false}
          />
        </div>
      </div>

      {!isEditingState && <Condition {...condition} />}

      <EventsBlockModal
        state={state}
        transition={transition}
        selectedComponent={selectedComponent}
        selectedMethod={selectedMethod}
        events={events}
        setEvents={setEvents}
        onOpenEventsModal={onOpenEventsModal}
        isOpen={isOpen}
      />

      {!isEditingState && (
        <div className="flex items-center gap-2">
          <span className="font-bold">Цвет связи:</span>
          <ColorInput value={color} onChange={setColor} />
        </div>
      )}
    </Modal>
  );
};
