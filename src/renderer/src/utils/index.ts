import { Point } from '@renderer/types/graphics';
import { ArgType } from '@renderer/types/platform';

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

export const indexOfMin = (arr: number[]) => {
  let min = Infinity;
  let minIndex = Infinity;

  arr.forEach((v, i) => {
    if (v < min) {
      min = v;
      minIndex = i;
    }
  });

  return minIndex;
};

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

// цвет связи по-умолчанию
export const defaultTransColor = '#0000FF';

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
