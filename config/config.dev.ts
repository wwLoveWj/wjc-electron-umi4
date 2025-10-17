import { defineConfig } from "umi";

export default defineConfig({
  proxy: {
    "/getNginxConfig": {
      target: "http://localhost:3007",
      changeOrigin: true,
    },
    "/api": {
      target: "http://localhost:3000/",
      // ws: true,
      changeOrigin: true,
      // pathRewrite: { "^/api": "" },
    },
  },
  define: {
    "process.env.EMIAL_PWD": "HPJEIWOOTHGWHJCO",
    "process.env.EMIAL_USER": "blww885@163.com",
  },
});
