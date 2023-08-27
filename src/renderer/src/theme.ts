const colors = {
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
};

// Это метод для того чтобы достать цвет из джаваскрипта
export const getColor = (colorName: keyof typeof colors) => {
  return getComputedStyle(document.documentElement).getPropertyValue(colors[colorName]);
};

const makeVariables = (colors: Record<string, string>) => {
  return Object.fromEntries(Object.entries(colors).map(([name, value]) => [name, `var(${value})`]));
};

export default {
  colors: {
    ...makeVariables(colors),

    diagram: {
      state: {
        bodyBg: '#404040',
        titleColor: '#FFF',
        titleBg: '#525252',
        eventColor: '#FFF',
        selectedBorderColor: '#FFF',
      },
    },
  },
  getColor,
};
