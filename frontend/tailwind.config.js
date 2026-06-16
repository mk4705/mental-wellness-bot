/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          900: "#1e1b4b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0, transform: "translateY(6px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        slideIn:   { from: { opacity: 0, transform: "translateX(-12px)" }, to: { opacity: 1, transform: "translateX(0)" } },
        pulse2:    { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } },
        blink:     { "0%,100%": { opacity: 1 }, "50%": { opacity: 0 } },
      },
      animation: {
        "fade-in":  "fadeIn 0.25s ease-out",
        "slide-in": "slideIn 0.2s ease-out",
        "pulse2":   "pulse2 1.4s ease-in-out infinite",
        "blink":    "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};
