/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // One class per Inter weight: React Native needs a separate font file for each weight.
      fontFamily: {
        inter: ['Inter_400Regular'],
        'inter-md': ['Inter_500Medium'],
        'inter-sb': ['Inter_600SemiBold'],
        'inter-b': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
