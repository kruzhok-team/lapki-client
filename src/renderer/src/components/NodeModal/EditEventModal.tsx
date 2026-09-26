import React from 'react';

import { Actions, Trigger, Condition } from './components';
import type { ActionsHandle } from './components/Actions';
import { useEditEvent } from './hooks';

type EditEventModalProps = {
  actionsRef: React.RefObject<ActionsHandle>;
  expandedActionRequest: { index: number; requestId: number } | null;
} & ReturnType<typeof useEditEvent>;

export const EditEventModal: React.FC<EditEventModalProps> = (props) => {
  const { trigger, condition, actions, showCondition, event, error } = props;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <Trigger event={event} {...trigger} />
      {showCondition && <Condition {...condition} />}
      <Actions
        ref={props.actionsRef}
        event={event}
        {...actions}
        disabled={!!error}
        inlineEditing
        expandedActionRequest={props.expandedActionRequest}
      />
      {error && <div className="text-xs text-error">{error}</div>}
    </div>
  );
};
