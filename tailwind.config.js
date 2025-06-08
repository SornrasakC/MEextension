/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./static/**/*.{html,js}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./build/**/*.html"
  ],
  theme: {
    textFillColor: (theme) => theme("borderColor"),
    textStrokeColor: (theme) => theme("borderColor"),
    textStrokeWidth: (theme) => theme("borderWidth"),
    paintOrder: {
      fsm: { paintOrder: "fill stroke markers" },
      fms: { paintOrder: "fill markers stroke" },
      sfm: { paintOrder: "stroke fill markers" },
      smf: { paintOrder: "stroke markers fill" },
      mfs: { paintOrder: "markers fill stroke" },
      msf: { paintOrder: "markers stroke fill" },
    },
    extend: {
      brightness: {
        70: ".7",
      },
      borderColor: {
        tsumugi: "#EABF80",
      },
      dropShadow: {
        "seround-text": [
          `.6px .6px 0 #fff`,
          `-.4px .6px 0 #fff`,
          `.6px -.4px 0 #fff`,
          `-.4px -.4px 0 #fff`,
        ],
        ideal: "0 0 20px #EABF80",
      },
      fontFamily: {
        "summer-pocket": ["SummerPocket"],
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        ".horizontal-tb": {
          writingMode: "horizontal-tb",
        },
        ".vertical-rl": {
          writingMode: "vertical-rl",
        },
        ".vertical-lr": {
          writingMode: "vertical-lr",
        },
      });
    },
  ],
};
