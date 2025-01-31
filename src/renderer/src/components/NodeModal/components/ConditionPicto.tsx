import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { Condition } from '@renderer/types/diagram';

interface ConditionPictoProps {
  condition: Condition;
  platformManager: PlatformManager;
}

export const ConditionPicto: React.FC<ConditionPictoProps> = ({ condition, platformManager }) => {
  return (
    <div className="flex gap-2 p-4">
      <div className="flex items-center gap-[2px] overflow-hidden rounded-md bg-border-primary">
        <div className="bg-bg-primary px-4 py-2"></div>
        <div className="bg-bg-primary px-4 py-2">
          <img
            className="size-8 object-contain"
            src={platform.getEventIconUrl(event.component, event.method, true)}
          />
        </div>
      </div>
    </div>
  );
};
