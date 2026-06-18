import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ig: {
          bg: "#fafafa",
          bgdark: "#000",
          border: "#dbdbdb",
          borderdark: "#262626",
          text: "#262626",
          textdark: "#fafafa",
          muted: "#8e8e8e",
          accent: "#0095f6",
          danger: "#ed4956",
        },
      },
      backgroundImage: {
        "story-ring":
          "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        brand: ['"Grand Hotel"', "cursive"],
      },
    },
  },
  plugins: [],
} satisfies Config;
