import { ArgList, Condition, Event, StateMachine, Variable } from '@renderer/types/diagram';
import { Platform } from '@renderer/types/platform';

function isVariable(value: unknown): value is Variable {
  return typeof value === 'object' && value !== null && 'component' in value && 'method' in value;
}

function collectArgumentReferences(args: ArgList | undefined, addReference: (id: string) => void) {
  for (const argument of Object.values(args ?? {})) {
    if (isVariable(argument?.value)) addReference(argument.value.component);
  }
}

function collectConditionReferences(
  condition: Condition | string | null | undefined,
  addReference: (id: string) => void
) {
  if (!condition || typeof condition === 'string' || !Array.isArray(condition.value)) return;
  for (const operand of condition.value) {
    if (isVariable(operand.value)) addReference(operand.value.component);
    else if (Array.isArray(operand.value)) {
      collectConditionReferences({ type: operand.type, value: operand.value }, addReference);
    }
  }
}

/** Returns component ids referenced by the machine but absent from its component set. */
export function getMissingComponentReferences(
  stateMachine: StateMachine,
  platform: Platform
): string[] {
  const missing = new Set<string>();
  const addReference = (id: string) => {
    const isDeclared = stateMachine.components[id] !== undefined;
    const isStatic = platform.staticComponents && platform.components[id] !== undefined;
    if (id !== 'System' && !isDeclared && !isStatic) missing.add(id);
  };
  const collectEvent = (event: Event) => {
    addReference(event.component);
    collectArgumentReferences(event.args, addReference);
  };

  for (const state of Object.values(stateMachine.states)) {
    for (const event of state.events) {
      if (typeof event.trigger !== 'string') collectEvent(event.trigger);
      if (typeof event.do !== 'string') {
        for (const action of event.do) collectEvent(action);
      }
      collectConditionReferences(event.condition, addReference);
    }
  }

  for (const transition of Object.values(stateMachine.transitions)) {
    const label = transition.label;
    if (!label) continue;
    if (label.trigger && typeof label.trigger !== 'string') collectEvent(label.trigger);
    if (label.do && typeof label.do !== 'string') {
      for (const action of label.do) collectEvent(action);
    }
    collectConditionReferences(label.condition, addReference);
  }

  return [...missing].sort((left, right) => left.localeCompare(right));
}
