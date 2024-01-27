import React from 'react';

import { mergeRefs } from 'react-merge-refs';
import ReactSelect, {
  Props,
  GroupBase,
  OptionProps,
  SingleValueProps,
  components,
} from 'react-select';

import './style.css';
import { WithHint } from '../WithHint';

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
}

const Option = ({ innerRef, ...props }: OptionProps<SelectOption>) => {
  const { hint, icon, label } = props.data;
  return (
    <WithHint hint={hint} placement="right" offset={7}>
      {({ ref, ...hintProps }) => (
        <components.Option innerRef={mergeRefs([innerRef, ref])} {...props} {...hintProps}>
          <div className="flex items-center">
            {icon}
            {label}
          </div>
        </components.Option>
      )}
    </WithHint>
  );
};

const SingleValue = (props: SingleValueProps<SelectOption>) => {
  const { icon, label } = props.data;
  return (
    <components.SingleValue {...props}>
      <div className="flex items-center">
        {icon}
        {label}
      </div>
    </components.SingleValue>
  );
};

export function Select<
  Option extends SelectOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>(props: Props<Option, IsMulti, Group>) {
  return (
    <ReactSelect
      placeholder="Выберите..."
      {...props}
      classNamePrefix="CustomSelect"
      components={{ Option: Option as any, SingleValue: SingleValue as any }}
    />
  );
}
