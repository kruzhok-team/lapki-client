import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as DirectoryIcon } from '@renderer/assets/icons/directory.svg';
import { File } from '@renderer/types/documentation';

import { Item } from './Item';
import { Tree } from './Tree';

interface DirectoryProps {
  item: File;
  onItemClick: (item: File) => void;
}

export const Directory: React.FC<DirectoryProps> = ({ item, onItemClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onDirectoryClicked = (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    event.stopPropagation();
    setIsOpen((p) => !p);
  };

  return (
    <Item onClick={onDirectoryClicked}>
      <span className="block truncate bg-opacity-50 pb-2 pl-0 pr-2 pt-2 transition hover:bg-[#4391bf] hover:bg-opacity-50">
        <DirectoryIcon className="mr-2 inline-block h-5 w-5" />
        {item.name}
      </span>
      <div
        className={twMerge(
          'max-h-0 overflow-hidden transition-opacity',
          isOpen && 'max-h-none opacity-100'
        )}
      >
        <Tree root={item} onItemClick={onItemClick} />
      </div>
    </Item>
  );
};
