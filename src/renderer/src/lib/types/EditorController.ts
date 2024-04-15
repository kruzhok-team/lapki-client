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

export interface UnlinkStateParams {
  id: string;
}

export interface CreateInitialStateParams {
  id?: string;
  targetId: string;
}

export interface DeleteInitialStateParams {
  id: string;
  targetId: string;
}
