/** @type {import('tailwindcss').Config} */

import { colors } from './src/renderer/src/theme';

const plugin = require('tailwindcss/plugin');

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
  plugins: [
    require('tailwind-scrollbar')({ nocompatible: true }),
    plugin(function ({ addBase }) {
      const themesToInject = {
        ':root': {
          '--p': '#0C4BEE',
          '--p-h': '#225EF9',
          '--p-a': '#2A62F4',
          '--e': 'red',
          '--s': 'lime',

          '--bg-p': '#262626',
          '--bg-s': '#121111',
          '--bg-h': '#434343',
          '--bg-a': '#545454',

          '--b-p': '#666666',

          '--t-p': '#f2f2f2',
          '--t-s': '#fff',
          '--t-i': '#a3a2a2',
          '--t-d': 'rgb(156,163,175)',
          '--t-h': 'yellow',

          '--c-e-t': 'vs-dark',

          '--s-tr': 'rgba(162,162,162, 0.5)',
          '--s-th': 'rgba(162,162,162, 0.7)',

          '--g': 'rgba(255,255,255,0.03)',
        },
        ':root[data-theme="light"]': {
          '--p': '#0C4BEE',
          '--p-h': '#225EF9',
          '--p-a': '#2A62F4',
          '--e': 'red',
          '--s': 'lime',

          '--bg-p': '#e7e7e7',
          '--bg-s': '#f2f2f2',
          '--bg-h': '#cfcfcf',
          '--bg-a': '#c2c2c2',

          '--b-p': '#c2c2c2',

          '--t-p': '#000',
          '--t-s': '#fff',
          '--t-i': '#b3b2b2',
          '--t-d': 'rgb(156,163,175)',
          '--t-h': 'yellow',

          '--c-e-t': 'vs-light',

          '--s-tr': 'rgba(162,162,162, 0.5)',
          '--s-th': 'rgba(162,162,162, 0.7)',

          '--g': 'rgba(0,0,0,0.08)',
        },
      };

      addBase(themesToInject);
    }),
  ],
};
