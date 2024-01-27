import React from 'react';

import { SingleValue } from 'react-select';
import { twMerge } from 'tailwind-merge';

import { Checkbox, Select, SelectOption, TextInput } from '@renderer/components/UI';

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

interface ConditionProps {
  show: boolean;
  handleChangeConditionShow: (value: boolean) => void;
  isParamOneInput1: boolean;
  handleParamOneInput1: (value: boolean) => void;
  isParamOneInput2: boolean;
  handleParamOneInput2: (value: boolean) => void;

  componentOptionsParam1: SelectOption[];
  handleComponentParam1Change: (value: SingleValue<SelectOption>) => void;
  selectedComponentParam1: string | null;
  methodOptionsParam1: SelectOption[];
  handleMethodParam1Change: (value: SingleValue<SelectOption>) => void;
  selectedMethodParam1: string | null;

  setConditionOperator: (value: string | null) => void;
  conditionOperator: string | null;

  componentOptionsParam2: SelectOption[];
  handleComponentParam2Change: (value: SingleValue<SelectOption>) => void;
  selectedComponentParam2: string | null;
  methodOptionsParam2: SelectOption[];
  handleMethodParam2Change: (value: SingleValue<SelectOption>) => void;
  selectedMethodParam2: string | null;

  argsParam1: string | number | null;
  handleArgsParam1Change: (value: string) => void;
  argsParam2: string | number | null;
  handleArgsParam2Change: (value: string) => void;

  handleConditionOperatorChange: (value: SingleValue<SelectOption>) => void;

  errors: Record<string, string>;
}

export const Condition: React.FC<ConditionProps> = (props) => {
  const {
    show,
    handleChangeConditionShow,
    isParamOneInput1,
    handleParamOneInput1,
    isParamOneInput2,
    handleParamOneInput2,

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
    handleArgsParam1Change,
    argsParam2,
    handleArgsParam2Change,

    errors,
  } = props;

  return (
    <div className="my-3">
      <div className="mb-2 flex items-center">
        <label className="mr-2 font-bold">Если: </label>
        <label className={twMerge('btn border-primary px-3', show && 'btn-primary')}>
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => handleChangeConditionShow(e.target.checked)}
            className="h-0 w-0 opacity-0"
          />
          <span>{show ? 'Убрать условие' : 'Добавить условие'}</span>
        </label>
      </div>

      <div className={twMerge('ml-12 flex flex-col gap-2', !show && 'hidden')}>
        <div className="flex items-end">
          <Checkbox
            checked={!isParamOneInput1}
            onCheckedChange={(v) => handleParamOneInput1(!v)}
            className="mb-2 mr-2"
          />
          {isParamOneInput1 ? (
            <div className="flex gap-2">
              <Select
                className="h-[34px] w-[200px] max-w-[200px]"
                options={componentOptionsParam1}
                onChange={handleComponentParam1Change}
                value={
                  componentOptionsParam1.find((o) => o.value === selectedComponentParam1) ?? null
                }
                isSearchable={false}
                error={errors.selectedComponentParam1 || ''}
              />
              <Select
                className="h-[34px] w-[200px] max-w-[200px]"
                options={methodOptionsParam1}
                onChange={handleMethodParam1Change}
                value={methodOptionsParam1.find((o) => o.value === selectedMethodParam1) ?? null}
                isSearchable={false}
                error={errors.selectedMethodParam1 || ''}
              />
            </div>
          ) : (
            <TextInput
              label="Параметр:"
              placeholder="Напишите параметр"
              onChange={(e) => handleArgsParam1Change(e.target.value)}
              value={argsParam1 ?? ''}
              error={!!errors.argsParam1}
              errorMessage={errors.argsParam1 || ''}
            />
          )}
        </div>

        <Select
          containerClassName="pl-7"
          className="max-w-[200px]"
          options={operand}
          onChange={handleConditionOperatorChange}
          value={operand.find((opt) => opt.value === conditionOperator)}
          error={errors.conditionOperator || ''}
        />

        <div className="flex items-end">
          <Checkbox
            checked={!isParamOneInput2}
            onCheckedChange={(v) => handleParamOneInput2(!v)}
            className="mb-2 mr-2"
          />
          {isParamOneInput2 ? (
            <div className="flex gap-2">
              <Select
                className="h-[34px] w-[200px] max-w-[200px]"
                options={componentOptionsParam2}
                onChange={handleComponentParam2Change}
                value={
                  componentOptionsParam2.find((o) => o.value === selectedComponentParam2) ?? null
                }
                isSearchable={false}
                error={errors.selectedComponentParam2 || ''}
              />
              <Select
                className="h-[34px] w-[200px] max-w-[200px]"
                options={methodOptionsParam2}
                onChange={handleMethodParam2Change}
                value={methodOptionsParam2.find((o) => o.value === selectedMethodParam2) ?? null}
                isSearchable={false}
                error={errors.selectedMethodParam2 || ''}
              />
            </div>
          ) : (
            <TextInput
              label="Параметр:"
              placeholder="Напишите параметр"
              onChange={(e) => handleArgsParam2Change(e.target.value)}
              value={argsParam2 ?? ''}
              error={!!errors.argsParam2}
              errorMessage={errors.argsParam2 || ''}
            />
          )}
        </div>
      </div>
    </div>
  );
};
