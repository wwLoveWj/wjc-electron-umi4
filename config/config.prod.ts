import { defineConfig } from "umi";

export default defineConfig({
  externals: {
    react: "React",
    "react-dom": "ReactDOM",
    ahooks: "ahooks",
  },
  headScripts:
    process.env.NODE_ENV === "production"
      ? [
          "https://static-ayh-gtm.msxf.com/library/third/react/18.2.0/react.production.min.js",
          "https://static-ayh-gtm.msxf.com/library/third/react/18.2.0/react-dom.production.min.js",
          "https://static-ayh-gtm.msxf.com/library/third/ahooks/ahooks@3.8.1.js",
        ]
      : [
          "https://unpkg.com/react@18.2.0/umd/react.development.js",
          "https://unpkg.com/react-dom@18.2.0/umd/react-dom.development.js",
          "https://static-ayh-gtm.msxf.com/library/third/ahooks/ahooks@3.8.1.js",
        ],
  define: {},
});
