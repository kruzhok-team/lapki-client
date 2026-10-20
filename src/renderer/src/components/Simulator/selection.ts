import { StateMachine } from '@renderer/types/diagram';

export const SUPPORTED_SIMULATION_PLATFORMS = new Set(['junior-gardener', 'junior-reader']);

export type SimulationMachineOption = {
  id: string;
  machine: StateMachine;
};

export const getSimulationMachineOptions = (
  stateMachines: Record<string, StateMachine>
): SimulationMachineOption[] =>
  Object.entries(stateMachines)
    .filter(([id, machine]) => id !== '' && SUPPORTED_SIMULATION_PLATFORMS.has(machine.platform))
    .map(([id, machine]) => ({ id, machine }));

export const selectInitialMachineId = (
  options: SimulationMachineOption[],
  preferredId?: string
): string | undefined =>
  options.some(({ id }) => id === preferredId) ? preferredId : options[0]?.id;

export const isSimulationResultStale = (
  hasResult: boolean,
  runRevision?: unknown,
  currentRevision?: unknown
): boolean =>
  Boolean(hasResult && runRevision && currentRevision && runRevision !== currentRevision);
