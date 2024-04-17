import { Component } from '@renderer/types/diagram';

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
