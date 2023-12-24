import React, { ComponentProps } from 'react';

type ItemProps = ComponentProps<'li'>;

export const Item: React.FC<ItemProps> = ({ children, ...rest }) => {
  return (
    <li className="cursor-pointer" {...rest}>
      {children}
    </li>
  );
};
