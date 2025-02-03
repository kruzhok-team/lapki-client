import { twMerge } from 'tailwind-merge';

interface TextPictoProps {
  content: string | React.ReactNode;
  className?: string;
}

export const MonoPicto: React.FC<TextPictoProps> = ({ content, className }) => {
  return (
    <div
      className={twMerge(
        'flex h-12 w-auto items-center rounded-md bg-[#5B7173] px-2 text-3xl font-normal text-white',
        className && className
      )}
    >
      <span>{content}</span>
    </div>
  );
};
