/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ip: {
          page: 'rgb(var(--ip-page) / <alpha-value>)',
          surface: 'rgb(var(--ip-surface) / <alpha-value>)',
          'surface-elevated': 'rgb(var(--ip-surface-elevated) / <alpha-value>)',
          header: 'rgb(var(--ip-header) / <alpha-value>)',
          footer: 'rgb(var(--ip-footer) / <alpha-value>)',
          primary: 'rgb(var(--ip-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--ip-text-secondary) / <alpha-value>)',
          border: 'rgb(var(--ip-border) / <alpha-value>)',
          muted: 'rgb(var(--ip-text-muted) / <alpha-value>)',
          input: 'rgb(var(--ip-input-bg) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
