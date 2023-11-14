import { Point } from './graphics';

export interface getCapturedNodeArgs {
  position: Point;
  type?: 'states' | 'transitions';
  exclude?: string[];
  includeChildrenHeight?: boolean;
}
