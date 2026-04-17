/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/client/**/*.{ts,tsx,html}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        nm: {
          accent: "#6366f1",
          get: "#3b82f6",
          post: "#22c55e",
          put: "#eab308",
          patch: "#f97316",
          delete: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
