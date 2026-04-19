import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--bg-primary)",
        secondary: "var(--bg-secondary)",
        tertiary: "var(--bg-tertiary)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        hover: "var(--bg-hover)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-subtle": "var(--accent-subtle)",
        "accent-glow": "var(--accent-glow)",
        critical: "var(--critical)",
        "critical-subtle": "var(--critical-subtle)",
        warning: "var(--warning)",
        "warning-subtle": "var(--warning-subtle)",
        good: "var(--good)",
        "good-subtle": "var(--good-subtle)",
        info: "var(--info)",
        "info-subtle": "var(--info-subtle)",
        border: "var(--border)",
        "border-bright": "var(--border-bright)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "text-accent": "var(--text-accent)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
