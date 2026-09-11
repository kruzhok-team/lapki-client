const colorNames = {
  codeEditorTheme: '--c-e-t',
  primary: '--p',
  error: '--e',
  danger: '--danger',
  success: '--s',
  warning: '--w',

  primaryHover: '--p-h',
  primaryActive: '--p-a',
  'matrix-active': '--m-a',
  'matrix-inactive': '--m-i',
  'bg-primary': '--bg-p', // экран, самое левое меню с иконками, вкладки
  'bg-secondary': '--bg-s', // сайдбар, верхняя панель
  'bg-canvas': '--bg-canvas',
  'bg-hover': '--bg-h',
  'bg-active': '--bg-a',
  'bg-control': '--bg-c',
  'inactive-input': '--inactive-input',
  'util-button-hover': '--util-button-hover',

  'border-contrast': '--b-c',
  'border-primary': '--b-p',
  'border-warning': '--b-w',
  'inactive-button': '--b-i',

  'text-primary': '--t-p',
  'text-secondary': '--t-s',
  'text-inactive': '--t-i',
  'text-disabled': '--t-d',
  'text-highlighted': '--t-h',

  'scrollbar-track': '--s-tr',
  'scrollbar-thumb': '--s-th',

  grid: '--g',

  'default-transition-color': '--d-t-c',
  'default-state-outline': '--d-s-o',
  'default-transition-outline': '--d-t-o',

  'icon-active': '--i-a',
  'icon-secondary': '--i-s',
  'icon-hover': '--i-h',
  'icon-selected-bg': '--i-s-bg',
  'switch-inactive-bg': '--sw-inactive-bg',
} as const;
type ColorNames = typeof colorNames;
type ColorName = keyof ColorNames;

// Это метод для того чтобы достать цвет из джаваскрипта
export const getColor = (colorName: ColorName) => {
  return getComputedStyle(document.documentElement).getPropertyValue(colorNames[colorName]);
};

const getVariables = () => {
  return Object.fromEntries(
    Object.entries(colorNames).map(([name, value]) => [name, `var(${value})`])
  ) as { [Name in ColorName]: `var(${ColorNames[Name]})` };
};

export default {
  colors: {
    ...getVariables(),

    diagram: {
      state: {
        bodyBg: '#7c7c7c',
        titleColor: '#FFF',
        titleColorUndefined: '#89a3af',
        titleBg: '#494949',
        eventColor: '#FFF',
        selectedBorderColor: '#FFF',
      },
      transition: {
        color: '#FFF',
      },
    },
  },
  getColor,
};
