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
          '--danger': '#FF4848',
          '--s': 'lime',
          '--w': '#E4A11B',

          '--m-a': '#f8f9fa',
          '--m-i': '#343a40',

          '--bg-p': '#333333',
          '--bg-s': '#1F1F1F',
          '--bg-canvas': '#F1F1F1',
          '--bg-h': '#434343',
          '--bg-a': '#545454',
          '--bg-c': '#1F1F1F',
          '--inactive-input': '#F9F9F9',
          '--util-button-hover': '#F1F1F1',

          '--b-c': '#f8f9fa',
          '--b-p': '#666666',
          '--b-w': '#E4A11B',
          '--b-i': '#DEDEDE',

          '--t-p': '#f2f2f2',
          '--t-s': '#fff',
          '--t-i': '#a3a2a2',
          '--t-d': 'rgb(156,163,175)',
          '--t-h': '#186AA9',

          '--c-e-t': 'vs-dark',

          '--s-tr': '#D9D9D9',
          '--s-th': '#9D9D9D',

          '--g': 'rgba(255,255,255,0.03)',
          '--d-n-bg': 'rgba(0,0,0,0.3)',
          '--d-n-c': '#FFFFFF',
          '--d-t-c': '#7C7C7C',
          '--d-s-o': '#F2F2F2',
          '--d-t-o': '#FFFFFF',

          '--i-a': '#CBCACA',
          '--i-s': '#B7B6B6',
          '--i-h': '#6DC0FF',
          '--i-s-bg': '#2F9BEE',
          '--sw-inactive-bg': '#9D9D9D',
        },
        ':root[data-theme="light"]': {
          '--p': '#186AA9',
          '--p-h': '#225EF9',
          '--p-a': '#2A62F4',
          '--e': 'red',
          '--danger': '#FF4848',
          '--s': 'lime',
          '--w': '#E4A11B',

          '--m-a': '#f8f9fa',
          '--m-i': '#343a40',

          '--bg-p': '#FFFFFF',
          '--bg-s': '#EDEDED',
          '--bg-canvas': '#F1F1F1',
          '--bg-h': '#E6F4FF',
          '--bg-a': '#E6F4FF',
          '--bg-c': '#FFFFFF',
          '--inactive-input': '#F9F9F9',
          '--util-button-hover': '#F1F1F1',

          '--b-c': '#343a40',
          '--b-p': '#DEDEDE',
          '--b-w': '#E4A11B',
          '--b-i': '#DEDEDE',

          '--t-p': '#000',
          '--t-s': '#fff',
          '--t-i': '#9D9D9D',
          '--t-d': 'rgb(156,163,175)',
          '--t-h': '#186AA9',

          '--c-e-t': 'vs-light',

          '--s-tr': '#D9D9D9',
          '--s-th': '#9D9D9D',

          '--g': 'rgba(0,0,0,0.08)',
          '--d-n-bg': 'rgba(255,255,255,0.5)',
          '--d-n-c': '#000000',
          '--d-t-c': '#494949',
          '--d-s-o': '#0a0a0a',
          '--d-t-o': '#0C4BEE',

          '--i-a': '#5A5959',
          '--i-s': '#878686',
          '--i-h': '#6DC0FF',
          '--i-s-bg': '#2F9BEE',
          '--sw-inactive-bg': '#9D9D9D',
        },
      };

      addBase(themesToInject);
    }),
  ],
};
