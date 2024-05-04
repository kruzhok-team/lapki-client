import { Elements, State, Component, ArgList, Transition, Event } from '@renderer/types/diagram';
import { ArgumentProto, ComponentProto, MethodProto, Platform } from '@renderer/types/platform';

import { getProtoComponent, getProtoMethod } from './GraphmlParser';

const defaultComponents = {
  System: { onEnter: 'entry', onExit: 'exit' },
};

const defaultParameters = ['label', 'labelColor', 'name', 'description'] as const;

export function convertDefaultComponent(component: string, method: string): string {
  return defaultComponents[component][method];
}

export function isDefaultComponent(event: Event) {
  if (defaultComponents[event.component] !== undefined) {
    if (defaultComponents[event.component][event.method] === undefined) {
      throw new Error(`Неизвестный метод ${event.method} для компонента System!`);
    }
    return true;
  }
  return false;
}

function checkComponent(component: string, components: { [id: string]: Component }) {
  if (components[component] === undefined && defaultComponents[component] === undefined) {
    throw new Error(`Неизвестный компонент ${component}`);
  }
}

function checkMethod(method: string, component: ComponentProto) {
  if (component.methods[method] === undefined) {
    throw new Error(`Неизвестный метод ${method}`);
  }
}

function validateEvent(
  component: string,
  method: string,
  args: ArgList | undefined,
  components: { [id: string]: Component },
  platformComponents: { [name: string]: ComponentProto }
) {
  if (isDefaultComponent({ component: component, method: method })) {
    return;
  } else {
    checkComponent(component, components);
    const protoComponent: ComponentProto | undefined = getProtoComponent(
      component,
      platformComponents,
      components
    );
    if (protoComponent === undefined) {
      throw new Error('Internal error: component didnt be validated');
    }
    checkMethod(method, protoComponent);
    const protoMethod: MethodProto | undefined = getProtoMethod(method, protoComponent);
    if (protoMethod === undefined) {
      throw new Error('Internal error: method didnt be validated');
    }
    validateArgs(method, protoMethod, args);
  }
}

function validateArgs(methodName: string, method: MethodProto, args: ArgList | undefined) {
  const methodArgs: ArgumentProto[] | undefined = method.parameters;
  if (methodArgs === undefined) {
    if (args !== undefined && Object.keys(args).length != 0) {
      throw new Error(
        `Неправильное количество аргументов у метода ${methodName}! Ожидалось 0, получено ${
          Object.keys(args).length
        }`
      );
    }
  } else {
    if (args === undefined) {
      throw new Error(
        `Неправильное количество аргументов у метода ${methodName}! Ожидалось ${methodArgs.length}`
      );
    }
    const argNames = Object.keys(args);
    for (const argIdx in methodArgs) {
      if (argNames[argIdx] !== methodArgs[argIdx].name) {
        throw new Error(
          `Неправильный аргумент ${argNames[argIdx]}, ожидался ${methodArgs[argIdx].name}`
        );
      }
    }
  }
}

function validateStates(
  states: { [id: string]: State },
  components: { [id: string]: Component },
  platformComponents: { [name: string]: ComponentProto }
) {
  for (const state of Object.values(states)) {
    if (state.parentId !== undefined && states[state.parentId] === undefined) {
      throw new Error(`Unknown parent state ${state.parentId}`);
    }
    for (const event of state.events) {
      const trigger = event.trigger;
      validateEvent(
        trigger.component,
        trigger.method,
        trigger.args,
        components,
        platformComponents
      );
      for (const action of event.do) {
        validateEvent(action.component, action.method, action.args, components, platformComponents);
      }
    }
  }
}

function validateTransitions(
  transitions: Record<string, Transition>,
  components: { [id: string]: Component },
  platformComponents: { [name: string]: ComponentProto }
) {
  for (const transition of Object.values(transitions)) {
    if (transition.label?.do !== undefined) {
      for (const action of transition.label.do) {
        validateEvent(action.component, action.method, action.args, components, platformComponents);
      }
    }
  }
}

function isDefaultParameter(parameter: any): boolean {
  return defaultParameters.includes(parameter);
}

function setIncludes(lval: Set<any>, rval: Set<any>): boolean {
  for (const val of rval) {
    if (lval.has(val) || isDefaultParameter(val)) continue;
    else return false;
  }
  return true;
}

function validateComponents(
  platformComponents: { [name: string]: ComponentProto },
  components: { [id: string]: Component }
) {
  for (const component of Object.values(components)) {
    const platformComponent = platformComponents[component.type];
    if (platformComponent === undefined) {
      throw new Error(`Неизвестный тип компонента ${component.type}.`);
    }
    const componentParemeters = new Set(Object.keys(component.parameters));
    const platformParameters = new Set(Object.keys(platformComponent.parameters));
    if (!setIncludes(platformParameters, componentParemeters)) {
      throw new Error(
        `Получены параметры: ${[...componentParemeters].join(', ')}, но ожидались ${[
          ...platformParameters,
        ].join(', ')}`
      );
    }
  }
}

export function validateElements(elements: Elements, platform: Platform) {
  validateComponents(platform.components, elements.components);
  validateStates(elements.states, elements.components, platform.components);
  validateTransitions(elements.transitions, elements.components, platform.components);
}
