import { defineConfig } from "umi";
import routes from "../src/routes";
import { PROJECT_CONFIG } from "../src/constants/constant";

export default defineConfig({
  title: "umi4模板项目",
  mountElementId: PROJECT_CONFIG.NAME,
  history: { type: "hash" },
  base: "/",
  publicPath: process.env.NODE_ENV === "production" ? "./" : "/",
  initialState: {},
  model: {}, // 使用useModel需要这个配置
  // locale: {},
  // icons: {},
  // 解决 esbuild 助手函数冲突
  esbuildMinifyIIFE: true,
  // mfsu默认开启，需要开启按需加载 extraBabelPlugins，注意！！在本地qiankun下调试的时候需要关闭按需加载
  mfsu: false, // 关闭 mfsu，因为它与 Electron 不兼容
  lessLoader: {
    javascriptEnabled: true,
    modifyVars: {
      // hack: 'true; @import "~@/styles/common.less";',
      "@ant-prefix": PROJECT_CONFIG.NAME + "-ant", // ant前缀 样式隔离
      /* 自定义less变量 */
      "@define-prefix": PROJECT_CONFIG.NAME,
      "@prefix": PROJECT_CONFIG.NAME,
    },
  },
  // qiankun: {
  //   slave: {},
  // },
  routes,
  // 配置别名，对引用路径进行映射。
  alias: {
    "@utils": "/src/utils",
    "@assets": "/src/assets",
    "@service": "/src/service",
  },
  plugins: [
    "@umijs/plugins/dist/initial-state",
    "@umijs/plugins/dist/model",
    // "@umijs/plugins/dist/locale",
  ],
  // 确保源码映射正确
  devtool: process.env.NODE_ENV === "development" ? "source-map" : false,

  chainWebpack: (config) => {
    // 确保文件路径正确
    config.module
      .rule("js")
      .test(/\.(js|jsx|ts|tsx)$/)
      .use("babel-loader")
      .loader("babel-loader")
      .options({
        presets: [
          [
            "@umijs/babel-preset-umi",
            {
              // 确保源码映射
              sourceMaps: true,
            },
          ],
        ],
      });
    return config;
  },
  analyze: {
    analyzerMode: "server",
    analyzerPort: 8888,
    openAnalyzer: true,
    // generate stats file while ANALYZE_DUMP exist
    generateStatsFile: false,
    statsFilename: "stats.json",
    logLevel: "info",
    defaultSizes: "parsed", // stat  // gzip
  },
});
