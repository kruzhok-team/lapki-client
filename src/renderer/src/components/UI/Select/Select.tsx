import React from 'react';

import ReactSelect, { Props } from 'react-select';

import './style.css';

export const Select: React.FC<Props> = (props) => {
  return <ReactSelect classNamePrefix="CustomSelect" {...props} />;
};
