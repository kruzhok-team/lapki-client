import { twMerge } from 'tailwind-merge';

interface PictoProps {
  leftIcon: React.ReactNode | string;
  rightIcon: React.ReactNode | string;
  className?: string;
}

export const Picto: React.FC<PictoProps> = ({ leftIcon, rightIcon, className }) => {
  return (
    <div className="flex select-none items-center gap-[2px] overflow-hidden rounded-md bg-border-primary">
      <div className={twMerge('bg-bg-primary px-4 py-2', className && className)}>
        {typeof leftIcon === 'string' ? (
          <img className="size-8 object-contain" src={leftIcon} />
        ) : (
          leftIcon
        )}
      </div>
      <div className={twMerge('bg-bg-primary px-4 py-2', className && className)}>
        {typeof rightIcon === 'string' ? (
          <img className="size-8 object-contain" src={rightIcon} />
        ) : (
          rightIcon
        )}
      </div>
    </div>
  );
};
