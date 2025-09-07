module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial']
      },
      colors: {
        brand: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          accent: '#22d3ee'
        }
      },
      boxShadow: {
        'elevate': '0 10px 30px -10px rgba(0,0,0,0.3)'
      }
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        adisyon: {
          primary: '#2563eb',
          'primary-content': '#ffffff',
          secondary: '#22d3ee',
          accent: '#10b981',
          neutral: '#1f2937',
          'base-100': '#0b1020',
          'base-200': '#0f172a',
          'base-300': '#111827',
          info: '#38bdf8',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      'corporate'
    ],
    darkTheme: 'adisyon'
  }
};
