import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as DirectoryIcon } from '@renderer/assets/icons/directory.svg';
import { File } from '@renderer/types/documentation';

import { Item } from './Item';
import { Tree } from './Tree';

interface DirectoryProps {
  item: File;
  onItemClick: (filePath: string) => void;
}

export const Directory: React.FC<DirectoryProps> = ({ item, onItemClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onDirectoryClicked = (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    event.stopPropagation();
    setIsOpen((p) => !p);
  };

  return (
    <Item onClick={onDirectoryClicked}>
      <span className="block truncate rounded-lg pb-2 pl-3 pr-2 pt-2 transition hover:bg-[#E6F4FF]">
        <DirectoryIcon
          className={twMerge(
            'mr-3 inline-block h-5 w-5 transition-colors',
            isOpen && '[&_path]:stroke-icon-hover'
          )}
        />
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
