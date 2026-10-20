# ADR-0002: Gardener field visibility masks

## Status

Accepted

## Context

Some educational tasks require a partially unknown starting field. The existing task view shows every input cell and every cell in execution results and step history. A static illustration in the task description cannot control those views. The task catalog is local, and ADR-0001 does not treat task data as secret.

The main alternatives were description-only illustrations, a client-side mask, and protected test data supplied by a remote service. The latter would change the offline task model and is unnecessary for an educational fog effect.

## Decision

An optional per-test `hiddenCells` grid marks Gardener cells whose contents are displayed as `?`. Its dimensions match the field, and the starting cell remains visible. Any cell content may be hidden. The same mask applies to the input field, the actual field, and step history, including after a successful result. The Gardener marker remains visible on a hidden cell.

The mask affects presentation only. The real input and expected outcomes remain unchanged. Before sending a task to the State Machine Interpreter, the client removes the visibility grid from the protocol payload so the interpreter continues to receive its supported strict schema version 1.

## Consequences

Existing tasks render as before when they omit the grid. Authors can describe a different visible region in each test without creating images. A trial run does not reveal masked cell contents through the field views, but local task files and execution data remain inspectable; the mask provides no adversarial secrecy.
