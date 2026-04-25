import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        trust: "#0f766e",
        leaf: "#16a34a",
        signal: "#d97706",
        ink: "#10201f"
      },
      boxShadow: {
        soft: "0 18px 40px rgba(16, 32, 31, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
