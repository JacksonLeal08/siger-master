/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        jimmp: {
          glow: {
            light: '#B7F365',
            DEFAULT: '#68D346',
            dark: '#1C4E26',
          },
          metal: {
            light: '#D5D9DC',
            DEFAULT: '#7E8289',
            dark: '#3C3F45',
          },
          surface: {
            DEFAULT: '#282A2F',
            canvas: '#1E2024',
            spotlight: '#5B5E64',
          }
        }
      },
      boxShadow: {
        'glow-neon': '0 0 15px -2px rgba(104, 211, 70, 0.45)',
        'glow-neon-lg': '0 0 25px 2px rgba(183, 243, 101, 0.35)',
        'metal-bevel': 'inset 0 1px 1px 0 rgba(213, 217, 220, 0.3), 0 4px 12px rgba(0, 0, 0, 0.5)',
      }
    }
  },
  plugins: [],
};
