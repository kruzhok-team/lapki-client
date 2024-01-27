import React from 'react';

import { SingleValue } from 'react-select';
import { twMerge } from 'tailwind-merge';

import { Checkbox, Select, SelectOption, Switch, TextInput } from '@renderer/components/UI';

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
  setArgsParam1: (value: string | number | null) => void;
  argsParam2: string | number | null;
  setArgsParam2: (value: string | number | null) => void;
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

    setConditionOperator,
    conditionOperator,

    componentOptionsParam2,
    handleComponentParam2Change,
    selectedComponentParam2,
    methodOptionsParam2,
    handleMethodParam2Change,
    selectedMethodParam2,

    argsParam1,
    setArgsParam1,
    argsParam2,
    setArgsParam2,
  } = props;

  return (
    <div className="my-3">
      <div className="mb-2 flex items-center">
        <span className="mr-2 font-bold">Условие: </span>
        <Switch checked={show} onCheckedChange={handleChangeConditionShow} />
      </div>

      <div className={twMerge('flex flex-col', !show && 'hidden')}>
        <div className="flex items-center">
          <Checkbox
            checked={!isParamOneInput1}
            onCheckedChange={(v) => handleParamOneInput1(!v)}
            className="mr-2"
          />
          {isParamOneInput1 ? (
            <>
              <Select
                className="mx-1 my-3 h-[34px] w-[200px] max-w-[200px]"
                options={componentOptionsParam1}
                onChange={handleComponentParam1Change}
                value={
                  componentOptionsParam1.find((o) => o.value === selectedComponentParam1) ?? null
                }
                isSearchable={false}
              />
              <Select
                className="mx-1 my-3 h-[34px] w-[200px] max-w-[200px]"
                options={methodOptionsParam1}
                onChange={handleMethodParam1Change}
                value={methodOptionsParam1.find((o) => o.value === selectedMethodParam1) ?? null}
                isSearchable={false}
              />
            </>
          ) : (
            <TextInput
              label="Параметр:"
              placeholder="Напишите параметр"
              onChange={(e) => setArgsParam1(e.target.value)}
              value={argsParam1 ?? undefined}
              error={false}
              errorMessage={''}
            />
          )}
        </div>
        <Select
          className="mx-12 my-3 max-w-[200px]"
          options={operand}
          onChange={(v) => setConditionOperator((v as any).value)}
          value={operand.find((opt) => opt.value === conditionOperator)}
        />
        <div className="flex items-center">
          <Checkbox
            checked={!isParamOneInput2}
            onCheckedChange={(v) => handleParamOneInput2(!v)}
            className="mr-2"
          />
          {isParamOneInput2 ? (
            <>
              <Select
                className="mx-1 my-3 h-[34px] w-[200px] max-w-[200px]"
                options={componentOptionsParam2}
                onChange={handleComponentParam2Change}
                value={
                  componentOptionsParam2.find((o) => o.value === selectedComponentParam2) ?? null
                }
                isSearchable={false}
              />
              <Select
                className="mx-1 my-3 h-[34px] w-[200px] max-w-[200px]"
                options={methodOptionsParam2}
                onChange={handleMethodParam2Change}
                value={methodOptionsParam2.find((o) => o.value === selectedMethodParam2) ?? null}
                isSearchable={false}
              />
            </>
          ) : (
            <TextInput
              label="Параметр:"
              placeholder="Напишите параметр"
              onChange={(e) => setArgsParam2(e.target.value)}
              value={argsParam2 ?? undefined}
              error={false}
              errorMessage={''}
            />
          )}
        </div>
      </div>
    </div>
  );
};
