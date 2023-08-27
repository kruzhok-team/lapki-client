import React from 'react';
import ReactSelect, { Props } from 'react-select';

import './style.css';

interface SelectProps extends Props {}

export const Select: React.FC<SelectProps> = (props) => {
  return <ReactSelect classNamePrefix="CustomSelect" {...props} />;
};
