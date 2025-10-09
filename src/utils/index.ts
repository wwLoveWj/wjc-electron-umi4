export const collectError = ({
  tag,
  err,
  data,
}: {
  tag: string;
  err: Error | string;
  data: any;
}) => {
  console.log(tag, err, data);
  return "上报异常";
};
export const guid = () => {
  return "xxxxxxxx-xxxx-6xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export function getCookie(name: string): string {
  const reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
  const arr = document.cookie.match(reg);
  if (arr) {
    return unescape(arr[2]);
  }
  return "";
}

// 表单滚动报错
export const FormScrollIntoView = (
  errorFields: any[],
  container?: HTMLDivElement | null,
  scrollType: "start" | "center" | "end" | "nearest" = "center"
) => {
  if (errorFields?.length) {
    const [name] = errorFields?.[0]?.name ?? [""];
    if (name) {
      const ele = container
        ? container?.querySelector(`#${name}`)
        : document.querySelector(`#${name}`);
      ele?.scrollIntoView({ behavior: "smooth", block: scrollType });
    }
  }
  return Promise.reject();
};

// 解析 JSON 字符串，如果失败则返回默认值
export function parseJson<T>(jsonStr: string = "", defaultValue: T): T {
  try {
    const parsed = JSON.parse(jsonStr);
    return parsed as T;
  } catch (error) {
    return defaultValue;
  }
}

// 跳转到登录页
export const toLoginPage = () => {
  window.location.href = "/login";
};
