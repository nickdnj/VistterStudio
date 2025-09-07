/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8',
        dark: '#1a1a1a',
        darker: '#0d0d0d',
      },
      fontFamily: {
        'streaming': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
