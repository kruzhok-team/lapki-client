import { CreateTransitionParameters as MCreateTransitionParameters } from '@renderer/types/EditorManager';
import { Component } from './diagram';

export type CreateTransitionParameters = Omit<MCreateTransitionParameters, 'position'>;

export interface EditComponentParams {
  name: string;
  parameters: Component['parameters'];
  newName?: string;
}

export interface RemoveComponentParams {
  name: string;
  purge?: boolean;
}
