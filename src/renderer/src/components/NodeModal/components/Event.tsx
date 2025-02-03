import React, { useMemo, useState } from 'react';

import { operatorSet, PlatformManager } from '@renderer/lib/data/PlatformManager';
import { Condition, Event as EventData, Variable } from '@renderer/types/diagram';

import { MonoPicto } from './MonoPicto';
import { Picto } from './Picto';

interface EventProps {
  platform: PlatformManager;
  event: EventData;
  isSelected: boolean;
  condition?: Condition;
}

export const Event: React.FC<EventProps> = ({ platform, event, condition }) => {
  const [conditionsPicto, setConditionsPicto] = useState<React.ReactNode[]>([]);
  useMemo(() => {
    const getCondition = (condition: Condition) => {
      if (condition.type == 'component') {
        let leftIcon: string | React.ReactNode | undefined = undefined;
        let rightIcon = 'unknown';

        if (
          !Array.isArray(condition.value) &&
          typeof condition.value !== 'string' &&
          typeof condition.value !== 'number'
        ) {
          const vr: Variable = condition.value;
          if (vr.component === 'System') {
            rightIcon = vr.method;
          } else {
            const compoData = platform.resolveComponent(vr.component);
            const component = compoData.component;
            leftIcon = platform.getFullComponentIcon(component);
            rightIcon = platform.getVariableIconUrl(component, vr.method);
          }
        }

        setConditionsPicto((p) => [
          ...p,
          <Picto
            className="border-border-primary bg-[#5b7173]"
            leftIcon={leftIcon}
            rightIcon={rightIcon}
          />,
        ]);
        return;
      }
      // бинарные операторы (сравнения)
      if (operatorSet.has(condition.type)) {
        if (!(Array.isArray(condition.value) && condition.value.length == 2)) {
          console.error(['Event', 'non-binary not implemented yet', condition]);
        }

        getCondition(condition.value[0]);
        setConditionsPicto((p) => [
          ...p,
          <MonoPicto content={platform.picto.getMarkedIcon({ icon: `op/${condition.type}` })} />,
        ]);
        getCondition(condition.value[1]);
        return;
      }
      if (condition.type == 'value') {
        setConditionsPicto((p) => [...p, <MonoPicto content={condition.value as string} />]);
        return;
      }
    };
    if (condition) {
      getCondition(condition);
    }
  }, [platform, condition, setConditionsPicto]);

  return (
    <div className="flex gap-2 p-4 hover:bg-bg-hover">
      <Picto
        leftIcon={platform.getFullComponentIcon(event.component)}
        rightIcon={platform.getEventIconUrl(event.component, event.method, true)}
      />
      {...conditionsPicto}
    </div>
  );
};
