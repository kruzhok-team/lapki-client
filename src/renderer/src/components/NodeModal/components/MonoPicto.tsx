interface TextPictoProps {
  content: string | React.ReactNode;
  className?: string;
}

export const MonoPicto: React.FC<TextPictoProps> = ({ content, className }) => {
  return (
    <div className="flex h-12 w-auto items-center rounded-md bg-[#5B7173] px-2 text-3xl font-normal text-white">
      <span>{content}</span>
    </div>
  );
};
