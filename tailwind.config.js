import colors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Replace the default warm gray with slate so all gray-* classes
        // produce the spec's exact midnight-blue-tinted values.
        gray: colors.slate,
        primary: {
          50:  '#eff6ff', // blue-50
          100: '#dbeafe', // blue-100
          200: '#bfdbfe', // blue-200
          500: '#3b82f6', // blue-500
          600: '#2563eb', // blue-600  ← primary accent
          700: '#1d4ed8', // blue-700  ← primary accent hover
        },
      },
    },
  },
  plugins: [],
}
