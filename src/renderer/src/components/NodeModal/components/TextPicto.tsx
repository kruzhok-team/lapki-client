interface TextPictoProps {
  text: string;
  className?: string;
}

export const TextPicto: React.FC<TextPictoProps> = ({ text, className }) => {
  return (
    <div className="flex h-12 w-auto items-center rounded-md border-[0.5px] border-border-primary bg-[#5b7173] px-2 text-3xl font-normal text-white opacity-90">
      <span>{text}</span>
    </div>
  );
};
