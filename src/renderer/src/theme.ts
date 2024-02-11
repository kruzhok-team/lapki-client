const colorNames = {
  codeEditorTheme: '--c-e-t',
  primary: '--p',
  error: '--e',
  success: '--s',

  primaryHover: '--p-h',
  primaryActive: '--p-a',

  'bg-primary': '--bg-p',
  'bg-secondary': '--bg-s',
  'bg-hover': '--bg-h',
  'bg-active': '--bg-a',

  'border-primary': '--b-p',

  'text-primary': '--t-p',
  'text-secondary': '--t-s',
  'text-inactive': '--t-i',
  'text-disabled': '--t-d',
  'text-highlighted': '--t-h',

  'scrollbar-track': '--s-tr',
  'scrollbar-thumb': '--s-th',

  grid: '--g',
};

// Это метод для того чтобы достать цвет из джаваскрипта
export const getColor = (colorName: keyof typeof colorNames) => {
  return getComputedStyle(document.documentElement).getPropertyValue(colorNames[colorName]);
};

const getVariables = () => {
  return Object.fromEntries(
    Object.entries(colorNames).map(([name, value]) => [name, `var(${value})`])
  );
};

export default {
  colors: {
    ...getVariables(),

    diagram: {
      state: {
        bodyBg: '#404040',
        titleColor: '#FFF',
        titleColorUndefined: '#89a3af',
        titleBg: '#525252',
        eventColor: '#FFF',
        selectedBorderColor: '#FFF',
      },
    },
  },
  getColor,
};
