export const getStateMachineDeletionFallbackId = (
  stateMachineIds: string[],
  deletedStateMachineId: string
) => {
  const deletedIndex = stateMachineIds.indexOf(deletedStateMachineId);
  if (deletedIndex === -1) return undefined;

  return stateMachineIds[deletedIndex - 1] ?? stateMachineIds[deletedIndex + 1];
};
