import { Transition } from '@headlessui/react';
import React, { useState } from 'react';
import { File } from '../types/File';
import { DirectoryIcon } from '../Icons/Directory';
import { Item } from './Item';
import { Tree } from './Tree';

export const Directory = ({
  item,
  onItemClicked,
}: React.PropsWithChildren<{
  item: File;
  onItemClicked;
}>): JSX.Element => {
  const [toggle, setToggle] = useState<boolean>(false);

  const onDirectoryClicked = (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    event.stopPropagation();
    setToggle(!toggle);
  };

  return (
    <Item onClick={onDirectoryClicked}>
      <span className="block truncate pb-2 pl-0 pr-2 pt-2 transition hover:bg-gray-100">
        <DirectoryIcon />
        {item.name}
      </span>
      <Transition
        show={toggle}
        enter="transition-opacity duration-10"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-10"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <Tree root={item} onItemClicked={onItemClicked} />
      </Transition>
    </Item>
  );
};
