import isequal from 'lodash.isequal';

import { Elements, State, Event, Component, ArgList } from '@renderer/types/diagram';
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
  event: Event,
  components: { [id: string]: Component },
  platformComponents: { [name: string]: ComponentProto }
) {
  if (defaultComponents[event.component] !== undefined) {
    if (!defaultComponents[event.component].includes(event.method)) {
      throw new Error(`Неизвестное событие ${event.method} для компонента System`);
    }
    return;
  } else {
    checkComponent(event.component, components);
    const protoComponent: ComponentProto | undefined = getProtoComponent(
      event.component,
      platformComponents,
      components
    );

    if (protoComponent == undefined) {
      throw new Error('Internal error: component didnt be validated');
    }

    checkMethod(event.method, protoComponent);
    const protoMethod: MethodProto | undefined = getProtoMethod(event.method, protoComponent);

    if (protoMethod == undefined) {
      throw new Error('Internal error: method didnt be validated');
    }

    if (event.args != undefined) {
      validateArgs(event.method, protoMethod, event.args);
    }
  }
}

function validateArgs(methodName: string, method: MethodProto, args: ArgList) {
  const methodArgs: ArgumentProto[] | undefined = method.parameters;
  if (methodArgs == undefined) {
    if (Object.keys(args).length != 0) {
      throw new Error(
        `Неправильное количество аргументов у метода ${methodName}! Ожидалось 0, получено ${
          Object.keys(args).length
        }`
      );
    }
  } else {
    for (const arg in methodArgs) {
      console.log(arg);
    }
  }
}

function validateStates(
  states: { [id: string]: State },
  components: { [id: string]: Component },
  platformComponents: { [name: string]: ComponentProto }
) {
  for (const state of Object.values(states)) {
    for (const event of state.events) {
      validateEvent(event.trigger, components, platformComponents);
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
  validateComponents(platform.components, elements.components);
  validateStates(elements.states, elements.components, platform.components);
}
