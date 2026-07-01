import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        trust: "var(--color-primary)",
        leaf: "var(--color-secondary)",
        signal: "var(--color-warning)",
        ink: "var(--color-ink)",
        surface: "var(--color-card-bg)",
        page: "var(--color-page-bg)",
        "page-soft": "var(--color-page-soft)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        info: "var(--color-info)",
        danger: "var(--color-danger)"
      },
      borderRadius: {
        soft: "var(--radius-card)",
        card: "var(--radius-card-lg)",
        hero: "var(--radius-hero)"
      },
      boxShadow: {
        soft: "var(--shadow-card)",
        lift: "var(--shadow-card-hover)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
