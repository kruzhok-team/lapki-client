import React, { useMemo } from 'react';
import { Directory } from './Directory';
import { File } from '../types/File';
import { FileIcon } from '../Icons/File';
import { Item } from './Item';

export const Tree = ({
  root,
  borderWidth,
  onItemClicked,
}: React.PropsWithChildren<{
  root: File;
  borderWidth?: number;
  onItemClicked;
}>): JSX.Element => {
  const color_gen = useMemo(() => Math.floor(Math.random() * 16777215).toString(16), []);
  const borderWidthVal = typeof borderWidth === 'undefined' ? 2 : 0;

  return (
    <ul
      style={{
        borderLeftColor: `#${color_gen}`,
        borderLeftWidth: borderWidthVal,
      }}
      className="menu bg-default text-content-700 mb-0 ml-2 mt-0 flex-1 p-2 pb-0 pt-0"
    >
      {root.children &&
        root.children.map((item) => {
          if (item.children && item.children.length > 0)
            return <Directory key={item.name} item={item} onItemClicked={onItemClicked} />;
          return (
            <Item key={item.name} onClick={(event) => onItemClicked(event, item)}>
              <span className="block max-w-[310px] truncate whitespace-normal p-2 pl-0 transition hover:bg-gray-100">
                <FileIcon />
                {item.name}
              </span>
            </Item>
          );
        })}
    </ul>
  );
};
