import { CreateTransitionParameters as MCreateTransitionParameters } from '@renderer/types/EditorManager';

export type CreateTransitionParameters = Omit<MCreateTransitionParameters, 'position'>;
