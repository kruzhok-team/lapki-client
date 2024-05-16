import { Point } from '@renderer/lib/types/graphics';
import { Component, Transition as TransitionData } from '@renderer/types/diagram';

export interface EditComponentParams {
  name: string;
  parameters: Component['parameters'];
  newName?: string;
}

export interface RemoveComponentParams {
  name: string;
  purge?: boolean;
}

export interface LinkStateParams {
  parentId: string;
  childId: string;

  // Поля ниже нужны для коректной отмены этого действия с помощью истории
  addOnceOff?: boolean;
  canBeInitial?: boolean;
}

export interface UnlinkStateParams {
  id: string;
}

export interface CCreateInitialStateParams {
  id?: string;
  targetId: string;
}

export interface DeleteInitialStateParams {
  id: string;
  targetId: string;
}

export type CreateTransitionParams = Omit<TransitionData, 'selection' | 'label'> & {
  label?: Omit<Required<TransitionData>['label'], 'position'> & { position?: Point };
} & { id?: string };

export type ChangeTransitionParams = Omit<TransitionData, 'selection' | 'label'> & {
  label: Omit<Required<TransitionData>['label'], 'position'> & { position?: Point };
} & { id: string };
