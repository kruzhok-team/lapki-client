import { useCallback, useLayoutEffect, useMemo, useState } from 'react';

import { SingleValue } from 'react-select';

import { SelectOption } from '@renderer/components/UI';
import { useEditorContext } from '@renderer/store/EditorContext';

interface UseConditionParams {
  isEditingState: boolean;
  formState: 'submitted' | 'default';
}

export const useCondition = ({ isEditingState, formState }: UseConditionParams) => {
  const editor = useEditorContext();
  const model = editor.model;
  const componentsData = model.useData('elements.components');
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
  const handleChangeConditionShow = (value: boolean) => setShow(value);
  const handleParamOneInput1 = (value: boolean) => setIsParamOneInput1(value);
  const handleParamOneInput2 = (value: boolean) => setIsParamOneInput2(value);

  const componentOptionsParam1: SelectOption[] = useMemo(() => {
    const getComponentOption = (id: string) => {
      const proto = controller.platform.getComponent(id);

      return {
        value: id,
        label: id,
        hint: proto?.description,
        icon: controller.platform.getFullComponentIcon(id, 'mr-1 h-7 w-7'),
      };
    };

    const result = Object.keys(componentsData).map((idx) => getComponentOption(idx));

    if (isEditingState) {
      result.unshift(getComponentOption('System'));
    }

    return result;
  }, [componentsData, isEditingState, controller]);

  const componentOptionsParam2: SelectOption[] = useMemo(() => {
    const getComponentOption = (id: string) => {
      const proto = controller.platform.getComponent(id);

      return {
        value: id,
        label: id,
        hint: proto?.description,
        icon: controller.platform.getFullComponentIcon(id, 'mr-1 h-7 w-7'),
      };
    };

    const result = Object.keys(componentsData).map((idx) => getComponentOption(idx));

    if (isEditingState) {
      result.unshift(getComponentOption('System'));
    }

    return result;
  }, [componentsData, isEditingState, controller]);

  const methodOptionsParam1: SelectOption[] = useMemo(() => {
    if (!selectedComponentParam1) return [];
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
    if (!selectedComponentParam2) return [];
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

  const handleComponentParam1Change = (value: SingleValue<SelectOption>) => {
    setSelectedComponentParam1(value?.value ?? '');
    setSelectedMethodParam1('');
  };
  const handleComponentParam2Change = (value: SingleValue<SelectOption>) => {
    setSelectedComponentParam2(value?.value ?? '');
    setSelectedMethodParam2('');
  };

  const handleMethodParam1Change = (value: SingleValue<SelectOption>) => {
    setSelectedMethodParam1(value?.value ?? '');
  };
  const handleMethodParam2Change = (value: SingleValue<SelectOption>) => {
    setSelectedMethodParam2(value?.value ?? '');
  };

  const handleConditionOperatorChange = (value: SingleValue<SelectOption>) => {
    setConditionOperator(value?.value ?? null);
  };

  const handleArgsParam1Change = (value: string) => {
    setArgsParam1(value);
  };

  const handleArgsParam2Change = (value: string) => {
    setArgsParam2(value);
  };

  useLayoutEffect(() => {
    if (formState === 'submitted') {
      checkForErrors();
    }
  }, [checkForErrors, formState]);

  return {
    show,
    isParamOneInput1,
    isParamOneInput2,
    selectedComponentParam1,
    selectedComponentParam2,
    selectedMethodParam1,
    selectedMethodParam2,
    argsParam1,
    argsParam2,
    conditionOperator,
    setSelectedComponentParam1,
    setSelectedComponentParam2,
    setArgsParam1,
    setConditionOperator,
    setSelectedMethodParam1,
    setSelectedMethodParam2,
    setArgsParam2,
    handleChangeConditionShow,
    handleParamOneInput1,
    handleParamOneInput2,
    componentOptionsParam1,
    componentOptionsParam2,
    methodOptionsParam1,
    methodOptionsParam2,
    handleComponentParam1Change,
    handleComponentParam2Change,
    handleMethodParam1Change,
    handleMethodParam2Change,
    errors,
    setErrors,
    checkForErrors,
    handleArgsParam1Change,
    handleArgsParam2Change,
    handleConditionOperatorChange,
  };
};
