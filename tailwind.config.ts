import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        line: "#d9e2ec",
        paper: "#f7f9fb",
        action: "#0f766e"
      },
      boxShadow: {
        soft: "0 12px 32px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
