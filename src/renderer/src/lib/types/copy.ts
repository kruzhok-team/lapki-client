import { EventSelection } from '@renderer/lib/drawable';
import {
  Component as ComponentData,
  State as StateData,
  ChoiceState as ChoiceData,
  Transition as TransitionData,
  Note as NoteData,
  StateMachine,
} from '@renderer/types/diagram';

export type CopyBaseData = { smId: string; state: StateMachine };
export type CopyStateData = CopyBaseData & { type: 'state'; data: StateData & { id: string } };
export type CopyChoiceData = CopyBaseData & {
  type: 'choiceState';
  data: ChoiceData & { id: string };
};
export type CopyTransitionData = CopyBaseData & {
  type: 'transition';
  data: TransitionData & { id: string };
};
export type CopyNoteData = CopyBaseData & {
  type: 'note';
  data: NoteData & { id: string };
};
export type CopyComponentData = CopyBaseData & {
  type: 'component';
  data: ComponentData & { id: string };
};
export type CopyEventData = CopyBaseData & {
  type: 'event';
  data: EventSelection & { stateId: string };
};

export type CopyData =
  | CopyStateData
  | CopyTransitionData
  | CopyChoiceData
  | CopyNoteData
  | CopyComponentData
  | CopyEventData;
