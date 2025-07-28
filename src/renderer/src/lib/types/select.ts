import { EventSelection } from '../drawable';

export type SelectedItemType =
  | 'state'
  | 'transition'
  | 'event'
  | 'note'
  | 'component'
  | 'choiceState';
// | 'final';

export interface BaseSelectionData {
  smId: string;
}

export interface StateData extends BaseSelectionData {
  id: string;
}

export interface TransitionData extends BaseSelectionData {
  id: string;
}

export interface EventData extends BaseSelectionData {
  stateId: string;
  selection: EventSelection;
}

export interface FinalStateData extends BaseSelectionData {
  id: string;
}

export interface ChoiceStateData extends BaseSelectionData {
  id: string;
}

export interface ComponentData extends BaseSelectionData {
  id: string;
}

export interface NoteData extends BaseSelectionData {
  id: string;
}

export interface SelectedChoiceItem {
  type: 'choiceState';
  data: ChoiceStateData;
}

export interface SelectedNoteItem {
  type: 'note';
  data: NoteData;
}

export interface SelectedComponentItem {
  type: 'component';
  data: ComponentData;
}

export interface SelectedStateItem {
  type: 'state';
  data: StateData;
}

export interface SelectedTransitionItem {
  type: 'transition';
  data: TransitionData;
}

export interface SelectedEventItem {
  type: 'event';
  data: EventData;
}

export interface SelectedFinalStateItem {
  type: 'final';
  data: FinalStateData;
}

export type SelectedItem =
  | SelectedStateItem
  | SelectedTransitionItem
  | SelectedEventItem
  // | SelectedFinalStateItem
  | SelectedComponentItem
  | SelectedNoteItem
  | SelectedChoiceItem;
