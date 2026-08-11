export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2A1D16",
        earth: "#463226",
        umber: "#6B4A32",
        clay: "#8B6845",
        brass: "#B18A5A",
        gold: "#C9A66B",
        sand: "#D4B27A",
        cream: "#E8D6B3",
        ivory: "#F4E8D0",
        accent: "#8E7CC3"
      },
      fontFamily: {
        dev: ['"Noto Serif Devanagari"', "serif"],
        serif2: ['"Instrument Serif"', '"Noto Serif Devanagari"', "Georgia", "serif"],
        hand: ['"Kalam"', '"Caveat"', '"Noto Serif Devanagari"', "cursive"]
      },
      transitionTimingFunction: {
        cin: "cubic-bezier(0.22, 1, 0.36, 1)"
      }
    }
  },
  plugins: []
};
