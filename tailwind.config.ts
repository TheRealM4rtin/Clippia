import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx}", // Merged from tailwind.config.js
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      // Add any additional theme extensions here if needed
    },
  },
  plugins: [],
  safelist: [
    'cursor-move',
    'cursor-default',
    'window-button',
    'active',
    'debug-panel'
  ],
};

export default config;
