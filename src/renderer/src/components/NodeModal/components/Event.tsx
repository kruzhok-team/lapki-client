import React, { useMemo } from 'react';

import { operatorSet, PlatformManager } from '@renderer/lib/data/PlatformManager';
import { MarkedIconData } from '@renderer/lib/drawable';
import { Condition, Event as EventData, Variable } from '@renderer/types/diagram';

import { Picto } from './Picto';
import { TextPicto } from './TextPicto';

interface EventProps {
  platform: PlatformManager;
  event: EventData;
  isSelected: boolean;
  condition?: Condition;
}

export const Event: React.FC<EventProps> = ({ platform, event, condition }) => {
  const conditions: React.ReactNode[] = [];
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
            rightIcon = platform.getVariableIcon(component, vr.method);
          }
        }

        conditions.push(<Picto leftIcon={leftIcon} rightIcon={rightIcon} />);
        return;
      }
      // бинарные операторы (сравнения)
      if (operatorSet.has(condition.type)) {
        if (!(Array.isArray(condition.value) && condition.value.length == 2)) {
          console.error(['Event', 'non-binary not implemented yet', condition]);
        }

        getCondition(condition.value[0]);

        conditions.push(platform.picto.getMarkedIcon({ icon: `op/${condition.type}` }));
        getCondition(condition.value[1]);
        return;
      }
      if (condition.type == 'value') {
        conditions.push(<TextPicto text={condition.value as string} />);
        return;
      }
    };
    // if (condition) {
    getCondition({ type: 'value', value: '12' });
    // }
  }, [platform, condition]);
  return (
    <div className="flex gap-2 p-4 hover:bg-bg-hover">
      <Picto
        leftIcon={platform.getFullComponentIcon(event.component)}
        rightIcon={platform.getEventIconUrl(event.component, event.method, true)}
      />
      {...conditions}
    </div>
  );
};
