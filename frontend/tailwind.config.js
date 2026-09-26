/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        kp: {
          green: {
            50: "#f2f7f1",
            100: "#e0ebdc",
            600: "#3f6b3a",
            700: "#33552f",
            900: "#1f3a1c",
          },
          earth: {
            50: "#faf7f2",
            100: "#f0e8db",
            600: "#8a6a3f",
          },
          ink: "#1f2421",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
