/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Plex-inspired theme colors
        'plex': {
          // Dark theme colors
          'dark-primary': '#1a1a1a',
          'dark-secondary': '#2d2d2d',
          'dark-elevated': '#3d3d3d',
          'dark-border': '#404040',
          'dark-text-primary': '#ffffff',
          'dark-text-secondary': '#b3b3b3',
          'dark-text-muted': '#808080',
          
          // Light theme colors
          'light-primary': '#f8f9fa',
          'light-secondary': '#ffffff',
          'light-elevated': '#f0f0f0',
          'light-border': '#e0e0e0',
          'light-text-primary': '#1a1a1a',
          'light-text-secondary': '#666666',
          'light-text-muted': '#999999',
          
          // Accent colors (adjust for contrast in each theme)
          'accent-dark': '#e5a00d',
          'accent-light': '#cc7b00',
          'accent-hover-dark': '#ffb31a',
          'accent-hover-light': '#b8700a',
          
          // Status colors
          'success-dark': '#28a745',
          'success-light': '#198754',
          'warning-dark': '#ffc107',
          'warning-light': '#ff8800',
          'error-dark': '#dc3545',
          'error-light': '#c82333',
          
          // Surface colors for cards/panels
          'surface-dark': '#252525',
          'surface-light': '#fafafa',
          'surface-hover-dark': '#333333',
          'surface-hover-light': '#f0f0f0',
        }
      },
      animation: {
        'theme-transition': 'theme-transition 0.3s ease-in-out',
      },
      keyframes: {
        'theme-transition': {
          '0%': { opacity: '0.8' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}