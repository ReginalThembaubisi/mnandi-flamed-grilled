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
        // New vibrant accents
        flame: {
          500: '#FF4500',
          600: '#E63E00',
        },
        smoke: '#2C3E50',
        charcoal: '#1a1a1a',
        grill: '#FFD700',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(255, 107, 53, 0.3)',
        'glow': '0 0 30px rgba(255, 107, 53, 0.4)',
        'glow-lg': '0 0 50px rgba(255, 107, 53, 0.5)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'inner-glow': 'inset 0 0 20px rgba(255, 107, 53, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
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
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 107, 53, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 107, 53, 0.6)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
    },
  },
  plugins: [],
}
