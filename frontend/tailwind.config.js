/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep black background for the FinOps dashboard
        background: '#050505',
        surface: '#111111',
        // Your specific Bright Red Accent
        primary: '#B21318', 
        primaryHover: '#8A0E12',
        // Status colors for the Verification Center
        success: '#10B981', 
        warning: '#F59E0B',
      }
    },
  },
  plugins: [],
}