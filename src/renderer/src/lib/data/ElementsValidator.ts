import isequal from 'lodash.isequal';

import { Elements, State, Component, ArgList, Transition } from '@renderer/types/diagram';
import { ArgumentProto, ComponentProto, MethodProto, Platform } from '@renderer/types/platform';

import { getProtoComponent, getProtoMethod } from './GraphmlParser';

const defaultComponents: { [key: string]: string[] } = {
  System: ['onEnter', 'onExit'],
};

function checkComponent(component: string, components: { [id: string]: Component }) {
  console.log(component, defaultComponents, defaultComponents[component]);
  if (components[component] == undefined && defaultComponents[component] == undefined) {
    throw new Error(`Неизвестный компонент ${component}`);
  }
}

function checkMethod(method: string, component: ComponentProto) {
  if (component.methods[method] == undefined) {
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
  if (defaultComponents[component] !== undefined) {
    if (!defaultComponents[component].includes(method)) {
      throw new Error(`Неизвестное событие ${method} для компонента System`);
    }
    return;
  } else {
    checkComponent(component, components);
    const protoComponent: ComponentProto | undefined = getProtoComponent(
      component,
      platformComponents,
      components
    );

    if (protoComponent == undefined) {
      throw new Error('Internal error: component didnt be validated');
    }

    checkMethod(method, protoComponent);
    const protoMethod: MethodProto | undefined = getProtoMethod(method, protoComponent);

    if (protoMethod == undefined) {
      throw new Error('Internal error: method didnt be validated');
    }

    validateArgs(method, protoMethod, args);
  }
}

function validateArgs(methodName: string, method: MethodProto, args: ArgList | undefined) {
  const methodArgs: ArgumentProto[] | undefined = method.parameters;
  if (methodArgs == undefined) {
    if (args !== undefined && Object.keys(args).length != 0) {
      throw new Error(
        `Неправильное количество аргументов у метода ${methodName}! Ожидалось 0, получено ${
          Object.keys(args).length
        }`
      );
    }
  } else {
    console.log(args);
    if (args == undefined) {
      console.log(methodArgs);
      throw new Error(
        `Неправильное количество аргументов у метода ${methodName}! Ожидалось ${methodArgs.length}`
      );
    }
    const argNames = Object.keys(args);
    for (const argIdx in methodArgs) {
      if (argNames[argIdx] !== methodArgs[argIdx].name) {
        throw new Error('Неправильный аргумент!');
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
    if (state.parent !== undefined && states[state.parent] == undefined) {
      throw new Error(`Unknown parent state ${state.parent}`);
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
  transitions: Transition[],
  components: { [id: string]: Component },
  platformComponents: { [name: string]: ComponentProto }
) {
  for (const transition of transitions) {
    if (transition.do !== undefined) {
      for (const action of transition.do) {
        validateEvent(action.component, action.method, action.args, components, platformComponents);
      }
    }
  }
}

function validateComponents(
  platformComponents: { [name: string]: ComponentProto },
  components: { [id: string]: Component }
) {
  for (const component of Object.values(components)) {
    const platformComponent = platformComponents[component.type];
    if (platformComponent == undefined) {
      throw new Error(`Неизвестный тип компонента ${component.type}.`);
    }
    const componentParemeters = new Set(Object.keys(component.parameters));
    const platformParameters = new Set(Object.keys(platformComponent.parameters));

    if (componentParemeters.size != platformParameters.size) {
      throw new Error(
        `Неверное количество параметров у компонента ${component.type}! Ожидается: ${platformParameters.size}, получено: ${componentParemeters.size}`
      );
    } else {
      if (!isequal(componentParemeters, platformParameters)) {
        throw new Error(
          `Получены параметры: ${componentParemeters}, но ожидались ${platformParameters}`
        );
      }
    }
  }
}

export function validateElements(elements: Elements, platform: Platform) {
  console.log(elements);
  validateComponents(platform.components, elements.components);
  validateStates(elements.states, elements.components, platform.components);
  validateTransitions(elements.transitions, elements.components, platform.components);
}
