import { twMerge } from 'tailwind-merge';

interface TabsProps {
  tabs: string[];
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, value, onChange, className }) => {
  return (
    <div className={twMerge('flex', className)}>
      {tabs.map((tab, i) => (
        <button
          key={tab}
          className={twMerge(
            'border-b-2 border-transparent px-6 py-1 hover:bg-bg-hover',
            value === i && 'border-primary'
          )}
          onClick={() => {
            onChange(i);
          }}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
