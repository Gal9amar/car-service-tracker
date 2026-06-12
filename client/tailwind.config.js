/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EFF7FF',
          100: '#DBEFFE',
          200: '#BFDFFD',
          300: '#8CC5FC',
          400: '#4AA3F8',
          500: '#1E7DD6',
          600: '#0066CC',
          700: '#0052A3',
          800: '#003D82',
          900: '#002A5C',
          950: '#001A3D',
        },
        teal: {
          400: '#26CCB8',
          500: '#00B4A0',
          600: '#009688',
          700: '#007A6E',
        },
        surface: {
          50:  '#F0F4F8',
          100: '#E8EEF5',
          200: '#D1DCE8',
          300: '#A8BDD0',
          400: '#7896B0',
          500: '#556F8A',
          600: '#3D5570',
          700: '#2C3E55',
          800: '#1E2D3D',
          900: '#121E2B',
          950: '#080E15',
        },
      },
      fontFamily: {
        sans: ['Heebo', 'sans-serif'],
        display: ['Rubik', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
