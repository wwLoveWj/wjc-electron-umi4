import WjcRequest from "./requestClass";

const whiteList: string[] = ["/web/v1/check"];

const request = new WjcRequest({
  whiteList,
});
export default request;
