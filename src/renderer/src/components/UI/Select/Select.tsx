import React, { ReactNode } from 'react';

import ReactSelect, { Props } from 'react-select';

import './style.css';

export interface SelectOption {
  value: string;
  label: ReactNode;
}

type SelectProps = Props;

export const Select: React.FC<SelectProps> = (props) => {
  return <ReactSelect classNamePrefix="CustomSelect" {...props} />;
};
