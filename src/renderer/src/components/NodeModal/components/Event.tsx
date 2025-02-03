import React, { useMemo, useState } from 'react';

import { serializeEvent } from '@renderer/lib/data/GraphmlBuilder';
import { operatorSet, PlatformManager } from '@renderer/lib/data/PlatformManager';
import { useModelContext } from '@renderer/store/ModelContext';
import { Condition, Event as EventData, Variable } from '@renderer/types/diagram';

import { MonoPicto } from './MonoPicto';
import { Picto } from './Picto';

interface EventProps {
  platform: PlatformManager;
  event: EventData;
  isSelected: boolean;
  text?: string;
  condition?: Condition;
}

export const Event: React.FC<EventProps> = ({ platform, event, condition, text }) => {
  const [conditionsPicto, setConditionsPicto] = useState<React.ReactNode[]>([]);
  useMemo(() => {
    setConditionsPicto([]);
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
    <div className="font-Fira-sans p-4 pb-2 font-sans hover:bg-bg-hover">
      <div className="flex gap-1 hover:bg-bg-hover">
        <span className="mr-2">
          <Picto
            leftIcon={platform.getFullComponentIcon(event.component)}
            rightIcon={platform.getEventIconUrl(event.component, event.method, true)}
          />
        </span>
        {...conditionsPicto}
      </div>
      {text && <div className="ml-2 mt-[0.5px]">{text}</div>}
    </div>
  );
};
