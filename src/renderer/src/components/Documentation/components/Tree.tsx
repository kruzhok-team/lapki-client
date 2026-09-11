import React from 'react';

import { ReactComponent as FileIcon } from '@renderer/assets/icons/file.svg';
import { File } from '@renderer/types/documentation';

import { Directory } from './Directory';
import { Item } from './Item';

interface TreeProps {
  root: File;
  onItemClick: (filePath: string) => void;
}

export const Tree: React.FC<TreeProps> = ({ root, onItemClick }) => {
  return (
    <ul className="h-full max-h-[calc(100%-49.6px-41.6px)] w-full overflow-y-auto p-2 pb-0 pt-0 scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
      {root?.children &&
        root.children.map((item) => {
          if (item.children && item.children.length > 0)
            return <Directory key={item.name} item={item} onItemClick={onItemClick} />;
          return (
            <Item
              key={item.name}
              onClick={(event) => {
                event.stopPropagation();
                onItemClick(item.path ?? '');
              }}
            >
              <span className="block max-w-[341px] truncate rounded-lg p-2 pl-3 transition hover:bg-[#E6F4FF]">
                <FileIcon className="mr-2 inline-block h-5 w-5" />
                {item.name}
              </span>
            </Item>
          );
        })}
    </ul>
  );
};
