/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Food-focused warm palette
        primary: {
          50: '#fff4f0',
          100: '#ffe4d6',
          200: '#ffc9ad',
          300: '#ffa57a',
          400: '#ff7a47',
          500: '#ff6b35', // Main primary
          600: '#e64d1f',
          700: '#cc3a15',
          800: '#a82e12',
          900: '#852812',
        },
        secondary: {
          50: '#f0f5f0',
          100: '#d4e6d4',
          200: '#a8cda8',
          300: '#7db47d',
          400: '#519b51',
          500: '#2d5016', // Main secondary
          600: '#244012',
          700: '#1b300e',
          800: '#12200a',
          900: '#091006',
        },
        accent: {
          50: '#fef9f3',
          100: '#fdf2e7',
          200: '#fbe5cf',
          300: '#f9d8b7',
          400: '#f7cb9f',
          500: '#f4a261', // Main accent (gold)
          600: '#f18f3e',
          700: '#e67e2e',
          800: '#cc6d28',
          900: '#b35c22',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
