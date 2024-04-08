import { CreateTransitionParams as MCreateTransitionParameters } from '@renderer/types/EditorManager';

import { Component } from './diagram';
import { Point } from './graphics';

export type CreateTransitionParameters = Omit<MCreateTransitionParameters, 'position'> & {
  position?: Point;
};

export interface EditComponentParams {
  name: string;
  parameters: Component['parameters'];
  newName?: string;
}

export interface RemoveComponentParams {
  name: string;
  purge?: boolean;
}

export interface UnlinkStateParams {
  id: string;
}
