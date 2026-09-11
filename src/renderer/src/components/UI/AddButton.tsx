import { twMerge } from 'tailwind-merge';

import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';

type AddButtonProps = React.HTMLAttributes<HTMLButtonElement> & { disabled?: boolean };

export const AddButton: React.FC<AddButtonProps> = ({ className, disabled, ...props }) => {
  return (
    <div className="ml-auto flex">
      <button
        {...props}
        disabled={disabled}
        type="button"
        className={twMerge('w-5 disabled:opacity-40', className)}
      >
        <AddIcon className="shrink-0" />
      </button>
    </div>
  );
};
