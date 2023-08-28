import React, { ReactNode } from 'react';
import ReactSelect, { Props } from 'react-select';

import './style.css';

export interface SelectOption {
  value: string;
  label: ReactNode;
}

interface SelectProps extends Props {}

export const Select: React.FC<SelectProps> = (props) => {
  return <ReactSelect classNamePrefix="CustomSelect" {...props} />;
};
