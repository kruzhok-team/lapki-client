/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily :{
        Fira: ["Fira Sans","sans-serif"],
      },
    }
  },
  plugins: [
    require('tailwind-scrollbar')({ nocompatible: true }),
  ]
};
