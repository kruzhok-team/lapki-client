/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
import { colors } from './src/renderer/src/theme';

const plugin = require('tailwindcss/plugin');

export default {
  content: ['./src/renderer/index.html', './src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        Fira: ['Fira Sans', 'sans-serif'],
        'Fira-Mono': ['Fira Mono', 'monospace'],
      },
      colors,
    },
  },
  plugins: [
    require('tailwind-scrollbar')({ nocompatible: true }),
    plugin(function ({ addBase }) {
      const themesToInject = {
        ':root': {
          '--p': '#186AA9',
          '--p-h': '#225EF9',
          '--p-a': '#2A62F4',
          '--e': 'red',
          '--s': 'lime',
          '--w': '#E4A11B',

          '--m-a': '#f8f9fa',
          '--m-i': '#343a40',

          '--bg-p': '#333333',
          '--bg-s': '#1F1F1F',
          '--bg-h': '#434343',
          '--bg-a': '#545454',

          '--b-c': '#f8f9fa',
          '--b-p': '#666666',
          '--b-w': '#E4A11B',

          '--t-p': '#f2f2f2',
          '--t-s': '#fff',
          '--t-i': '#a3a2a2',
          '--t-d': 'rgb(156,163,175)',
          '--t-h': 'yellow',

          '--c-e-t': 'vs-dark',

          '--s-tr': 'rgba(162,162,162, 0.5)',
          '--s-th': 'rgba(162,162,162, 0.7)',

          '--g': 'rgba(255,255,255,0.03)',
          '--d-n-bg': 'rgba(0,0,0,0.3)',
          '--d-n-c': '#FFFFFF',
          '--d-t-c': '#F2F2F2',
          '--d-s-o': '#F2F2F2',
          '--d-t-o': '#FFFFFF',

          '--i-a': '#CBCACA',
          '--i-s': '#B7B6B6',
        },
        ':root[data-theme="light"]': {
          '--p': '#186AA9',
          '--p-h': '#225EF9',
          '--p-a': '#2A62F4',
          '--e': 'red',
          '--s': 'lime',
          '--w': '#E4A11B',

          '--m-a': '#f8f9fa',
          '--m-i': '#343a40',

          '--bg-p': '#F1F1F1',
          '--bg-s': '#EDEDED',
          '--bg-h': '#cfcfcf',
          '--bg-a': '#c2c2c2',

          '--b-c': '#343a40',
          '--b-p': '#c2c2c2',
          '--b-w': '#E4A11B',

          '--t-p': '#000',
          '--t-s': '#fff',
          '--t-i': '#b3b2b2',
          '--t-d': 'rgb(156,163,175)',
          '--t-h': 'yellow',

          '--c-e-t': 'vs-light',

          '--s-tr': 'rgba(162,162,162, 0.5)',
          '--s-th': 'rgba(162,162,162, 0.7)',

          '--g': 'rgba(0,0,0,0.08)',
          '--d-n-bg': 'rgba(255,255,255,0.5)',
          '--d-n-c': '#000000',
          '--d-t-c': '#404040',
          '--d-s-o': '#0a0a0a',
          '--d-t-o': '#0C4BEE',

          '--i-a': '#5A5959',
          '--i-s': '#878686',
        },
      };

      addBase(themesToInject);
    }),
  ],
};
