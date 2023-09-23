import { State } from '@renderer/lib/drawable/State';
import { CreateTransitionParameters as MCreateTransitionParameters } from '@renderer/types/EditorManager';

export interface CreateTransitionParameters
  extends Omit<MCreateTransitionParameters, 'source' | 'target' | 'position'> {
  source: State;
  target: State;
}
