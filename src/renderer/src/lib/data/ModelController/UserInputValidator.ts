import { ComponentProto, Platform } from '@renderer/types/platform';
import { frameworkWords, reservedWordsC, validators } from '@renderer/utils';

import { ComponentEntry } from '../PlatformManager';

import { ModelController } from '.';

export type ValidationResult = {
  status: boolean;
  error: string;
};

/*
  Класс для валидации пользовательского ввода.
  TODO (L140-beep): Собрать всю валидации в проекте и переместить сюда
*/
export class UserInputValidator {
  constructor(protected modelController: ModelController) {}

  private getAllComponents() {
    const componentsArr = Object.values(this.modelController.model.data.elements.stateMachines).map(
      (sm) => sm.components
    );

    return componentsArr.reduce((obj, item) => Object.assign(obj, item), {});
  }

  getComponentName(selectedComponent: ComponentEntry) {
    const components = this.getAllComponents();
    let idx = 1;
    while (`${selectedComponent.idx}${idx}` in components) {
      idx++;
    }
    return `${selectedComponent.idx}${idx}`;
  }

  validateComponentName(
    proto: ComponentProto,
    componentName: string,
    prevName: string,
    platform?: Platform
  ): ValidationResult {
    const components = this.getAllComponents();
    if (proto.singletone || (platform && platform.staticComponents)) {
      return {
        status: true,
        error: '',
      };
    }
    if (prevName !== componentName && componentName in components) {
      return {
        status: false,
        error: 'Имя не должно повторяться',
      };
    }

    if (componentName === '') {
      return {
        status: false,
        error: 'Имя не должно быть пустым',
      };
    }

    // допустимыми символами на первой позиции являются латинские буквы и подчёркивания
    const firstSymbolRegex = '[A-Z]|[a-z]|_';
    const numberSymbolRegex = '[0-9]';
    if (!componentName[0].match(firstSymbolRegex)) {
      return {
        status: false,
        error: `Название должно начинаться с латинской буквы или подчёркивания`,
      };
    }

    // допустимыми символами на всех позициях кроме первой являются латинские буквы, подчёркивания и цифры
    const remainingSymbolsRegex = firstSymbolRegex + '|' + numberSymbolRegex;
    for (const symbol of componentName) {
      if (!symbol.match(remainingSymbolsRegex)) {
        return {
          status: false,
          error: 'Допускаются только латинские буквы, цифры и подчёркивания',
        };
      }
    }

    for (const word of reservedWordsC) {
      if (word === componentName) {
        return {
          status: false,
          error: 'Нельзя использовать ключевые слова языка C',
        };
      }
    }

    for (const word of frameworkWords) {
      if (word === componentName) {
        return {
          status: false,
          error: 'Название является недопустимым. Выберите другое',
        };
      }
    }
    // проверка на то, что название не является типом данных
    for (const key in validators) {
      if (key === componentName) {
        return {
          status: false,
          error: 'Нельзя использовать название типа данных',
        };
      }
    }

    // проверка на то, что название не совпадает с названием класса компонентов
    const vacantComponents = this.modelController.getVacantComponents() as ComponentEntry[];
    for (const component of vacantComponents) {
      if (component.name === componentName) {
        return {
          status: false,
          error: 'Нельзя дублировать название класса компонентов',
        };
      }
    }
    return {
      status: true,
      error: '',
    };
  }
}
