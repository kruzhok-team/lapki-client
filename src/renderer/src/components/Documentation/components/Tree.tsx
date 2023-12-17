import React, { useMemo } from 'react';

import { ReactComponent as FileIcon } from '@renderer/assets/icons/file.svg';
import { File } from '@renderer/types/documentation';

import { Directory } from './Directory';
import { Item } from './Item';

interface TreeProps {
  root: File;
  borderWidth?: number;
  onItemClick: (item: File) => void;
}

export const Tree: React.FC<TreeProps> = ({ root, borderWidth, onItemClick }) => {
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
      {root?.children &&
        root.children.map((item) => {
          if (item.children && item.children.length > 0)
            return <Directory key={item.name} item={item} onItemClick={onItemClick} />;
          return (
            <Item
              key={item.name}
              onClick={(event) => {
                event.stopPropagation();
                onItemClick(item);
              }}
            >
              <span className="block max-w-[341px] truncate p-2 pl-0 transition hover:bg-[#4391bf] hover:bg-opacity-50">
                <FileIcon className="mr-2 inline-block h-5 w-5" />
                {item.name}
              </span>
            </Item>
          );
        })}
    </ul>
  );
};
