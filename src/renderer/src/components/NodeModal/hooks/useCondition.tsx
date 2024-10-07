import { useCallback, useMemo, useState } from 'react';

import { SingleValue } from 'react-select';

import { SelectOption } from '@renderer/components/UI';
import { operatorSet } from '@renderer/lib/data/PlatformManager';
import { useModelContext } from '@renderer/store/ModelContext';
import { Component, Condition, Variable as VariableData } from '@renderer/types/diagram';

/**
 * Инкапсуляция логики условия формы
 */
export const useCondition = () => {
  const modelController = useModelContext();
  const headControllerId = modelController.model.useData('', 'headControllerId');
  // TODO: Передавать в модалки машину состояний
  const stateMachines = Object.keys(modelController.controllers[headControllerId].stateMachinesSub);
  const smId = stateMachines[0];

  const componentsData = modelController.model.useData(smId, 'elements.components') as {
    [id: string]: Component;
  };
  const editor = modelController.getCurrentCanvas();
  const controller = editor.controller;

  const [errors, setErrors] = useState({} as Record<string, string>);

  const [conditionOperator, setConditionOperator] = useState<string | null>(null);

  const [selectedComponentParam1, setSelectedComponentParam1] = useState<string | null>(null);
  const [selectedComponentParam2, setSelectedComponentParam2] = useState<string | null>(null);

  const [selectedMethodParam1, setSelectedMethodParam1] = useState<string | null>(null);
  const [selectedMethodParam2, setSelectedMethodParam2] = useState<string | null>(null);

  const [argsParam1, setArgsParam1] = useState<string | number | null>(null);
  const [argsParam2, setArgsParam2] = useState<string | number | null>(null);

  const [show, setShow] = useState(false);
  const [isParamOneInput1, setIsParamOneInput1] = useState(true);
  const [isParamOneInput2, setIsParamOneInput2] = useState(true);

  const componentOptionsParam1: SelectOption[] = useMemo(() => {
    const getComponentOption = (id: string) => {
      const proto = controller.platform!.getComponent(id);

      return {
        value: id,
        label: id,
        hint: proto?.description,
        icon: controller.platform!.getFullComponentIcon(id, 'mr-1 h-7 w-7'),
      };
    };

    const result = Object.keys(componentsData).map((idx) => getComponentOption(idx));

    return result;
  }, [componentsData, controller]);

  const componentOptionsParam2: SelectOption[] = useMemo(() => {
    const getComponentOption = (id: string) => {
      const proto = controller.platform!.getComponent(id);

      return {
        value: id,
        label: id,
        hint: proto?.description,
        icon: controller.platform!.getFullComponentIcon(id, 'mr-1 h-7 w-7'),
      };
    };

    const result = Object.keys(componentsData).map((idx) => getComponentOption(idx));

    return result;
  }, [componentsData, controller]);

  const methodOptionsParam1: SelectOption[] = useMemo(() => {
    if (!selectedComponentParam1 || !controller.platform) return [];
    const getAll = controller.platform['getAvailableVariables'];
    const getImg = controller.platform['getVariableIconUrl'];

    // Тут call потому что контекст теряется
    return getAll
      .call(controller.platform, selectedComponentParam1)
      .map(({ name, description }) => {
        return {
          value: name,
          label: name,
          hint: description,
          icon: (
            <img
              src={getImg.call(controller.platform, selectedComponentParam1, name, true)}
              className="mr-1 h-7 w-7 object-contain"
            />
          ),
        };
      });
  }, [controller, selectedComponentParam1]);

  const methodOptionsParam2: SelectOption[] = useMemo(() => {
    if (!selectedComponentParam2 || !controller.platform) return [];
    const getAll = controller.platform['getAvailableVariables'];
    const getImg = controller.platform['getVariableIconUrl'];

    // Тут call потому что контекст теряется
    return getAll
      .call(controller.platform, selectedComponentParam2)
      .map(({ name, description }) => {
        return {
          value: name,
          label: name,
          hint: description,
          icon: (
            <img
              src={getImg.call(controller.platform, selectedComponentParam2, name, true)}
              className="mr-1 h-7 w-7 object-contain"
            />
          ),
        };
      });
  }, [controller, selectedComponentParam2]);

  const checkForErrors = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (isParamOneInput1) {
      newErrors.selectedComponentParam1 = selectedComponentParam1 ? '' : 'Обязательно';
      newErrors.selectedMethodParam1 = selectedMethodParam1 ? '' : 'Обязательно';
    } else {
      newErrors.argsParam1 = argsParam1 ? '' : 'Обязательно';
    }

    if (isParamOneInput2) {
      newErrors.selectedComponentParam2 = selectedComponentParam2 ? '' : 'Обязательно';
      newErrors.selectedMethodParam2 = selectedMethodParam2 ? '' : 'Обязательно';
    } else {
      newErrors.argsParam2 = argsParam2 ? '' : 'Обязательно';
    }

    newErrors.conditionOperator = conditionOperator ? '' : 'Обязательно';

    setErrors(newErrors);

    return newErrors;
  }, [
    argsParam1,
    argsParam2,
    conditionOperator,
    isParamOneInput1,
    isParamOneInput2,
    selectedComponentParam1,
    selectedComponentParam2,
    selectedMethodParam1,
    selectedMethodParam2,
  ]);

  const handleComponentParam1Change = useCallback((value: SingleValue<SelectOption>) => {
    setSelectedComponentParam1(value?.value ?? null);
    setSelectedMethodParam1(null);
  }, []);
  const handleComponentParam2Change = useCallback((value: SingleValue<SelectOption>) => {
    setSelectedComponentParam2(value?.value ?? null);
    setSelectedMethodParam2(null);
  }, []);

  const handleMethodParam1Change = useCallback((value: SingleValue<SelectOption>) => {
    setSelectedMethodParam1(value?.value ?? null);
  }, []);
  const handleMethodParam2Change = useCallback((value: SingleValue<SelectOption>) => {
    setSelectedMethodParam2(value?.value ?? null);
  }, []);

  const handleConditionOperatorChange = useCallback((value: SingleValue<SelectOption>) => {
    setConditionOperator(value?.value ?? null);
  }, []);

  const clear = useCallback(() => {
    setSelectedComponentParam1(null);
    setSelectedComponentParam2(null);
    setArgsParam1('');
    setConditionOperator(null);
    setSelectedMethodParam1(null);
    setSelectedMethodParam2(null);
    setArgsParam2('');
    setShow(false);
    setIsParamOneInput1(true);
    setIsParamOneInput2(true);

    setErrors({});
  }, []);

  //Позволяет найти начальные значения условия(условий), если таковые имеются
  const parseCondition = useCallback(
    (c: Condition | undefined | null) => {
      if (!c) {
        clear();
        return undefined;
      }

      setShow(true);

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
        setIsParamOneInput1(false);
        setArgsParam1(param1.value);
      } else if (param1.type == 'component') {
        const compoName = (param1.value as VariableData).component;
        const methodName = (param1.value as VariableData).method;
        setIsParamOneInput1(true);
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
        setIsParamOneInput2(false);
        setArgsParam2(param2.value);
      } else if (param2.type == 'component') {
        const compoName = (param2.value as VariableData).component;
        const methodName = (param2.value as VariableData).method;
        setIsParamOneInput2(true);
        setSelectedComponentParam2(compoName);
        setSelectedMethodParam2(methodName);
      } else {
        console.warn('👽 got condition from future (strange operand 2)', c);
        return undefined;
      }
      return setConditionOperator(operator);
    },
    [clear]
  );

  return {
    show,
    handleChangeConditionShow: setShow,

    isParamOneInput1,
    handleParamOneInput1: setIsParamOneInput1,
    isParamOneInput2,
    handleParamOneInput2: setIsParamOneInput2,

    componentOptionsParam1,
    handleComponentParam1Change,
    selectedComponentParam1,
    methodOptionsParam1,
    handleMethodParam1Change,
    selectedMethodParam1,

    conditionOperator,
    handleConditionOperatorChange,

    componentOptionsParam2,
    handleComponentParam2Change,
    selectedComponentParam2,
    methodOptionsParam2,
    handleMethodParam2Change,
    selectedMethodParam2,

    argsParam1,
    handleArgsParam1Change: setArgsParam1,
    argsParam2,
    handleArgsParam2Change: setArgsParam2,

    errors,
    setErrors,
    checkForErrors,

    setSelectedComponentParam1,
    setSelectedComponentParam2,
    setArgsParam1,
    setConditionOperator,
    setSelectedMethodParam1,
    setSelectedMethodParam2,
    setArgsParam2,

    parseCondition,
    clear,
  };
};
