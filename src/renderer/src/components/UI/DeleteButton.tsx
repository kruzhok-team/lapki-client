import { twMerge } from 'tailwind-merge';

import { ReactComponent as DeleteIcon } from '@renderer/assets/icons/delete.svg';

type DeleteButtonProps = React.HTMLAttributes<HTMLButtonElement> & { disabled?: boolean };

export const DeleteButton: React.FC<DeleteButtonProps> = ({ className, disabled, ...props }) => {
  return (
    <div className="ml-auto flex">
      <button
        {...props}
        disabled={disabled}
        type="button"
        className={twMerge(!disabled && 'cursor-pointer', className)}
      >
        <DeleteIcon className={twMerge('danger size-[14px]', disabled && 'text-inactive-button')} />
      </button>
    </div>
  );
};
