import { PlatformInfo } from '@renderer/types/platform';

export type StateMachinesStackItem = {
  name?: string;
  platform: PlatformInfo;
};
interface StateMachinesStackProps {
  selectedStateMachines: StateMachinesStackItem[];
}
export const StateMachinesStack: React.FC<StateMachinesStackProps> = ({
  selectedStateMachines,
}) => {
  return (
    <div className="max-h-[40vh] w-full overflow-y-auto scrollbar-thin scrollbar-track-scrollbar-track scrollbar-thumb-scrollbar-thumb">
      {selectedStateMachines.map((sm) => {
        return <div>{`${sm.name ?? ''} ${sm.platform.name}`}</div>;
      })}
    </div>
  );
};
