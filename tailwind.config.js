/** @type {import('tailwindcss').Config} */

import { colors } from './src/renderer/src/theme';

export default {
  content: ['./src/renderer/index.html', './src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        Fira: ['Fira Sans', 'sans-serif'],
      },
      colors,
    },
  },
  plugins: [require('tailwind-scrollbar')({ nocompatible: true })],
};
