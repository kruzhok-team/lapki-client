import { State } from '@renderer/lib/drawable/State';
import { Point } from '@renderer/types/graphics';

export interface ChangeNameState {
  state: State;
  position: Point;
  sizes: State['computedTitleSizes'];
}
