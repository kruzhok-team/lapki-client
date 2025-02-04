import React, { useMemo, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { serializeEvent } from '@renderer/lib/data/GraphmlBuilder';
import { operatorSet, PlatformManager } from '@renderer/lib/data/PlatformManager';
import { useModelContext } from '@renderer/store/ModelContext';
import { Condition, Event as EventData, Variable } from '@renderer/types/diagram';

import { MonoPicto } from './MonoPicto';
import { Picto } from './Picto';
import './css/event.css';
interface EventProps {
  platform: PlatformManager;
  event: EventData;
  isSelected: boolean;
  onDoubleClick?: () => void;
  onClick?: () => void;
  text?: string;
  condition?: Condition;
}

export const Event: React.FC<EventProps> = ({
  platform,
  event,
  condition,
  text,
  onClick,
  onDoubleClick,
  isSelected,
}) => {
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
    <div
      onDoubleClick={onDoubleClick}
      onClick={onClick}
      id="event"
      className={twMerge(
        'event font-Fira-sans pl-6 pr-6 pt-4 font-sans hover:bg-bg-hover',
        isSelected && 'bg-bg-active'
      )}
    >
      <div className="flex gap-1">
        <span className="mr-2">
          <Picto
            leftIcon={platform.getFullComponentIcon(event.component)}
            rightIcon={platform.getEventIconUrl(event.component, event.method, true)}
          />
        </span>
        {...conditionsPicto}
      </div>
      {text && <div className="ml-2 mt-[0.5px]">{text}</div>}
      <hr className="mt-2 h-[1px] w-auto border-bg-hover opacity-70" />
    </div>
  );
};
