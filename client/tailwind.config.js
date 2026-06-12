/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0d14",
          secondary: "#0f1320",
          card: "#141928",
          hover: "#1a2035",
          border: "#1e2740",
        },
        teal: {
          50: "#e6fff9",
          100: "#b3ffee",
          200: "#66ffe0",
          300: "#00f5c8",
          400: "#00d4aa",
          500: "#00b894",
          600: "#009678",
          700: "#00785f",
          800: "#005a47",
          900: "#003c30",
        },
        accent: {
          purple: "#7c5cfc",
          blue: "#3b82f6",
          orange: "#f59e0b",
          red: "#ef4444",
          green: "#10b981",
        },
      },
      fontFamily: {
        syne: ["Syne", "sans-serif"],
        dm: ["DM Sans", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 212, 170, 0.15)",
        "glow-lg": "0 0 40px rgba(0, 212, 170, 0.2)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "slide-in": "slideIn 0.3s ease forwards",
        shimmer: "shimmer 1.5s infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(20px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        slideIn: { from: { opacity: 0, transform: "translateX(-20px)" }, to: { opacity: 1, transform: "translateX(0)" } },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
}
