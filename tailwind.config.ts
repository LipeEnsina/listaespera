import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#07070A",
          soft: "#0D0D12",
          card: "#101017",
          line: "rgba(255,255,255,0.08)",
        },
        magenta: {
          DEFAULT: "#FF0080",
          400: "#FF3D9E",
          600: "#D6006B",
          glow: "rgba(255,0,128,0.35)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,0,128,0.35), 0 12px 40px -12px rgba(255,0,128,0.55)",
        card: "0 24px 70px -30px rgba(0,0,0,0.9)",
      },
      keyframes: {
        "float-slow": {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(0,-24px,0) scale(1.06)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { opacity: "0" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "draw-check": {
          to: { strokeDashoffset: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(200%)" },
        },
      },
      animation: {
        "float-slow": "float-slow 14s ease-in-out infinite",
        marquee: "marquee 28s linear infinite",
        "pulse-ring": "pulse-ring 2.6s cubic-bezier(0.24,0.8,0.32,1) infinite",
        "rise-in": "rise-in 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "draw-check": "draw-check 0.6s 0.15s cubic-bezier(0.65,0,0.35,1) forwards",
        shimmer: "shimmer 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
