import isequal from 'lodash.isequal';

import { Elements, State, Event, Component } from '@renderer/types/diagram';
import { ComponentProto, Platform } from '@renderer/types/platform';

import { getProtoComponent, getProtoMethod } from './GraphmlParser';

const defaultComponents = {
  System: ['onEnter, onExit'],
};

function checkComponent(component: string, components: { [id: string]: Component }) {
  console.log(component, defaultComponents, defaultComponents[component]);
  if (components[component] == undefined && defaultComponents[component] == undefined) {
    throw new Error(`Неизвестный компонент ${component}`);
  }
}

// function checkMethod(comp);

function validateEvent(
  event: Event,
  components: { [id: string]: Component },
  platformComponents: { [name: string]: ComponentProto }
) {
  checkComponent(event.component, components);
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
