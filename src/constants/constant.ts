import Package from "../../package.json";

const PROJECT_CONFIG = {
  NAME: Package.name,
  VERSION: Package.version,
  TITLE: "umi4模板项目",
};
const STORAGE_PARAMS = {
  tokenKey: "wjc-token",
};
export { PROJECT_CONFIG, STORAGE_PARAMS };
