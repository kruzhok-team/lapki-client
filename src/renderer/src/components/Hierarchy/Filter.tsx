import React, { RefObject, useRef, useState } from 'react';

import { StaticTreeDataProvider, TreeRef } from 'react-complex-tree';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as ClearIcon } from '@renderer/assets/icons/close.svg';
import { ReactComponent as CollapseIcon } from '@renderer/assets/icons/collapse-all.svg';
import { ReactComponent as ExpandIcon } from '@renderer/assets/icons/expand-all.svg';

import { TextInput } from '../UI';

interface FilterProps {
  processSearch: (value: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export const Filter: React.FC<FilterProps> = ({ onExpandAll, onCollapseAll, processSearch }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');

  const handleChangeSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);

    processSearch(e.target.value);
  };

  const handleClear = () => {
    setSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className="mb-2 flex items-end gap-2">
      <label className="flex items-center border-b border-border-primary">
        {/* <SearchIcon className="h-6 w-6" /> */}
        <TextInput
          ref={inputRef}
          className="border-none p-1 py-[2px]"
          placeholder="Поиск..."
          value={search}
          onChange={handleChangeSearch}
        />
        <button
          className={twMerge(
            'invisible cursor-pointer rounded-full p-[6px] opacity-0 transition-opacity hover:bg-bg-hover',
            search && 'visible opacity-100'
          )}
          onClick={handleClear}
          type="button"
        >
          <ClearIcon className="h-[10px] w-[10px]" />
        </button>
      </label>

      <button
        type="button"
        className="rounded text-border-primary hover:text-text-primary"
        onClick={onExpandAll}
      >
        <ExpandIcon />
      </button>

      <button
        type="button"
        className="rounded text-border-primary hover:text-text-primary"
        onClick={onCollapseAll}
      >
        <CollapseIcon />
      </button>
    </div>
  );
};
