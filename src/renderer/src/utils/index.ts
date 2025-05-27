export * from './MatrixActions';
import { Point } from '@renderer/lib/types/graphics';
import { Component, StateMachine } from '@renderer/types/diagram';
import { ArgType } from '@renderer/types/platform';
import { Range } from '@renderer/types/utils';

export const DEFAULT_RANGE_STEP = 1;

export function isBerlogaRobot(value: any): boolean {
  return ['Autoborder', 'Stapler', 'Smoker', 'Generator'].includes(value);
}

function newConvention(value: string) {
  const robotName = value.split('_').pop();
  return isBerlogaRobot(robotName) ? robotName : null;
}

function oldConvention(value: string) {
  const robotName = value.split('_')[0];
  return isBerlogaRobot(robotName) ? robotName : null;
}

/**
 * Вытащить название робота из названия схемы Берлоги
 *
 * По очереди парсит название по старой и новой конвеции
 * названий схем.
 * @param value - название файла с расширением
 * @returns название робота или null
 */
export function getBerlogaRobot(value: string | null): string | null {
  if (!value) return null;

  const filename = value.split('.')[0];

  if (filename === undefined) return null;

  return newConvention(filename) ?? oldConvention(filename) ?? null;
}

/**
 * Inverts and normalizes a value to the range [0, 1].
 * This function is commonly used for opacity adjustments or similar scenarios.
 *
 * @param {number} value - The value to normalize.
 * @param {Range} range - The range object containing `min` and `max` values.
 * @returns {number} - The normalized value in the range [0, 1].
 */
export function normalizeRangeValue(value: number, range: Range): number {
  if (range.max === range.min) {
    return 0;
  }
  return 1 - (value - range.min) / (range.max - range.min);
}

export function getDefaultRange(): Range {
  return {
    step: DEFAULT_RANGE_STEP,
    min: 0,
    max: 100,
  };
}

export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function isMatrix(type: string) {
  return type.includes('Matrix');
}

/*
 (L140-beep): Получить опции для выбора без «пустых» компонентов.
*/
export const getFilteredOptions = <T>(
  getComponentOption: (id: string) => T,
  componentsData: { [id: string]: Component }
): NonNullable<T>[] => {
  const sortedComponents = Object.entries(componentsData).sort((a, b) => a[1].order - b[1].order);
  const result: NonNullable<T>[] = [];
  for (const [componentId] of sortedComponents) {
    const option = getComponentOption(componentId);
    if (option) {
      result.push(option);
    }
  }

  return result;
};

export const getDefaultSmSelection = (
  stateMachines: { [id: string]: StateMachine },
  selectedStateMachines: { [id: string]: boolean }
) => {
  const defaultMap: { [id: string]: boolean } = {};
  Object.keys(stateMachines).map((id) => {
    if (id === '') return;

    defaultMap[id] = selectedStateMachines[id] === undefined ? true : selectedStateMachines[id];
  });

  return defaultMap;
};

export const getVirtualElement = (position: Point) => {
  return {
    getBoundingClientRect() {
      return {
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        top: position.y,
        left: position.x,
        right: 0,
        bottom: 0,
      };
    },
  };
};

export const isDev = () => !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

// Валидаторы типов arduino, в платформе это поле type
export const validators: Record<string, (value: string) => boolean> = {
  uint8_t(value) {
    const nValue = Number(value);

    if (isNaN(nValue) || value.includes('.')) return false;

    return nValue >= 0 && nValue <= 255;
  },
  byte(value) {
    return this.uint8_t(value);
  },
  int(value) {
    const nValue = Number(value);

    if (isNaN(nValue) || value.includes('.')) return false;

    return nValue >= -32_767 && nValue <= 32_767;
  },
  'unsigned int'(value) {
    const nValue = Number(value);

    if (isNaN(nValue) || value.includes('.')) return false;

    return nValue >= 0 && nValue <= 65_535;
  },
  'unsigned long'(value) {
    const nValue = Number(value);

    if (isNaN(nValue)) return false;

    return nValue >= 0 && nValue <= 4_294_967_295;
  },
  'char[]'() {
    return true;
  },
};

export const formatArgType = (value: ArgType) => {
  if (Array.isArray(value)) return `[${value}]`;

  return value;
};

// пресеты цветов
export const presetColors = ['#119da4', '#591f0a', '#f26419', '#1f487e', '#4b296b'];

export const placeCaretAtEnd = (el: HTMLElement) => {
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
};

export const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

export const removeNonNumbers = (str: string) => {
  return str.replace(/[^0-9]/g, '');
};

export const languageMappers = {
  h: 'cpp',
  ino: 'cpp',
  graphml: 'xml',
};

export const randomColor = (): string => {
  let result = '';
  for (let i = 0; i < 6; ++i) {
    const value = Math.floor(16 * Math.random());
    result += value.toString(16);
  }
  return '#' + result;
};

// список зарезервированных (ключевых) слов из языка C
export const reservedWordsC = [
  'auto',
  'else',
  'long',
  'switch',
  'break',
  'enum',
  'register',
  'typedef',
  'case',
  'extern',
  'return',
  'union',
  'char',
  'float',
  'short',
  'unsigned',
  'const',
  'for',
  'signed',
  'void',
  'continue',
  'goto',
  'sizeof',
  'volatile',
  'default',
  'if',
  'static',
  'while',
  'do',
  'int',
  'struct',
  '_Packed',
  'double',
];

// список слов, используемых фреймворком QHSM в компиляторе
export const frameworkWords = [
  // Классы фреймворка:
  'QEvt',
  'QState',
  'QSignal',
  'QStateHandler',
  'QHsm',
  // Функции фреймфорка:
  'QMsm_simple_dispatch',
  'QMsm_dispatch',
  'do_transition',
  'QHsm_top',
  'QMsm_init',
  'QHsm_ctor',
  // Макросы:
  'Q_MAX_DEPTH',
  'QEP_EMPTY_SIG_',
  'Q_ENTRY_SIG',
  'Q_EXIT_SIG',
  'Q_INIT_SIG',
  'Q_VERTEX_SIG',
  'Q_USER_SIG',
  'Q_RET_SUPER',
  'Q_RET_UNHANDLED',
  'Q_RET_HANDLED',
  'Q_RET_IGNORED',
  'Q_RET_TRAN',
  'Q_MSM_UPCAST',
  'Q_STATE_CAST',
  'Q_UNHANDLED',
  'Q_HANDLED',
  'Q_TRAN',
  'Q_SUPER',
  'QMSM_INIT',
  'QMSM_DISPATCH',
  'SIMPLE_DISPATCH',
  'SIGNAL_DISPATCH',
  'PASS_EVENT_TO',
];

export const dateFormatTime = new Intl.DateTimeFormat('ru-Ru', {
  timeStyle: 'medium',
}).format;

export const dateFormatTimeAndDate = new Intl.DateTimeFormat('ru-Ru', {
  dateStyle: 'short',
  timeStyle: 'short',
}).format;
