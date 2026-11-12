const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff4ef",
          100: "#ffe4d8",
          500: "#f97847",
          600: "#fe5e22",
          700: "#e2480f",
        },
        canvas: token("canvas"),
        surface: token("surface"),
        chip: token("chip"),
        tile: token("tile"),
        ink: token("ink"),
        muted: token("muted"),
        line: token("line"),
        navbar: token("navbar"),
        rating: token("rating"),
      },
      fontFamily: {
        sans: ["Poppins", "Arial", "sans-serif"],
      },
      borderRadius: {
        tile: "12.609px",
        phone: "40px",
      },
      boxShadow: {
        tile: "0px 1px 4px 0px rgba(0, 0, 0, 0.15)",
        product: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
        cta: "2px 2px 7.5px rgba(0, 0, 0, 0.15)",
      },
    },
  },
  plugins: [],
};
