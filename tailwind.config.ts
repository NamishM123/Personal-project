import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "hsl(var(--bg))",
        surface: "hsl(var(--surface))",
        surface2: "hsl(var(--surface-2))",
        border: "hsl(var(--border))",
        fg: "hsl(var(--fg))",
        muted: "hsl(var(--muted))",
        accent: "hsl(var(--accent))",
        "accent-fg": "hsl(var(--accent-fg))",
        success: "hsl(var(--success))",
        warn: "hsl(var(--warn))",
        danger: "hsl(var(--danger))",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      boxShadow: {
        card: "0 1px 0 hsl(var(--border)), 0 8px 24px -16px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
