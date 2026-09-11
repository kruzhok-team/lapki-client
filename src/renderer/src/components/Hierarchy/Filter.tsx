import React, { useRef } from 'react';

import { twMerge } from 'tailwind-merge';

import { ReactComponent as ClearIcon } from '@renderer/assets/icons/close.svg';

import { TextInput } from '../UI';

interface FilterProps {
  search: string;
  onChangeSearch: (value: string) => void;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export const Filter: React.FC<FilterProps> = (props) => {
  const { search, onChangeSearch, disabled, className, fullWidth } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeSearch(e.target.value);
  };

  const handleClear = () => {
    onChangeSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className={twMerge('flex items-end gap-2 pb-[7px]', fullWidth && 'w-full', className)}>
      <label
        className={twMerge(
          'flex h-[32px] items-center rounded-lg border border-border-primary transition-colors focus-within:border-text-inactive',
          fullWidth && 'w-full'
        )}
      >
        <TextInput
          ref={inputRef}
          className={twMerge('border-none py-[2px] pr-3', fullWidth && 'max-w-none')}
          placeholder="Поиск..."
          value={search}
          onChange={handleChangeSearch}
          disabled={disabled}
        />
        <button
          className={twMerge(
            'invisible mr-1 cursor-pointer rounded-[3px] p-[3px] opacity-0 transition-opacity hover:bg-util-button-hover',
            search && 'visible opacity-100'
          )}
          onClick={handleClear}
          type="button"
        >
          <ClearIcon className="h-[10px] w-[10px]" />
        </button>
      </label>
    </div>
  );
};
