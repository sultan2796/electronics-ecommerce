const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  future: { hoverOnlyWhenSupported: true },
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: token("brand-50"),
          100: token("brand-100"),
          500: token("brand-500"),
          600: token("brand-600"),
          700: token("brand-700"),
        },
        secondary: token("secondary"),
        accent: token("accent"),
        success: { DEFAULT: token("success"), soft: token("success-soft") },
        warning: { DEFAULT: token("warning"), soft: token("warning-soft") },
        danger: { DEFAULT: token("danger"), soft: token("danger-soft") },
        info: { DEFAULT: token("info"), soft: token("info-soft") },
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
