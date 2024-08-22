import { Point } from '@renderer/lib/types/graphics';
import { ArgType } from '@renderer/types/platform';

export function isString(value: any): value is string {
  return typeof value === 'string';
}

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
