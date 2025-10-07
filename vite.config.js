import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    {
      name: "console-polyfill",
      apply: "serve",
      transform(code, id) {
        if (id.includes("vite") && code.match(/^import.+vite.+/g)) {
          return (
            "console.log = console.log || (() => {});\n" +
            "console.debug = console.debug || console.log;\n" +
            "console.warn = console.warn || console.log;\n" +
            "console.error = console.error || console.log;\n" +
            code
          );
        }
        return code;
      },
    },
    monkey({
      entry: "src/main.js",
      userscript: {
        name: "Transifex-JS",
        version: "0.1.0",
        description: "My Tampermonkey Script for Transifex",
        author: "Harry Huang",
        license: "MIT",
        match: ["https://app.transifex.com/*"],
        require: [
          "https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js",
        ],
        source: "https://github.com/isHarryh/Transifex-JS",
        namespace: "https://app.transifex.com/",
      },
    }),
  ],
});
