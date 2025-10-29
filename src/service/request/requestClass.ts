import { notification, message } from "antd";
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  Canceler,
  InternalAxiosRequestConfig,
  CancelToken,
  AxiosProgressEvent,
} from "axios";
import axios from "axios";
import { collectError, getCookie, guid } from "@/utils/index";

const codeMessage = {
  0: "服务器成功返回请求的数据。",
  201: "新建或修改数据成功。",
  202: "一个请求已经进入后台排队（异步任务）。",
  204: "删除数据成功。",
  400: "发出的请求有错误，服务器没有进行新建或修改数据的操作。",
  401: "用户没有权限（令牌、用户名、密码错误）。",
  403: "用户得到授权，但是访问是被禁止的。",
  404: "发出的请求针对的是不存在的记录，服务器没有进行操作。",
  406: "请求的格式不可得。",
  410: "请求的资源被永久删除，且不会再得到的。",
  422: "当创建一个对象时，发生一个验证错误。",
  500: "服务器发生错误，请检查服务器。",
  502: "网关错误。",
  503: "服务不可用，服务器暂时过载或维护。",
  504: "网关超时。",
};
notification.config({
  maxCount: 1,
});
export interface WjcInterceptors<T = AxiosResponse> {
  requestInterceptors?: (
    config: InternalAxiosRequestConfig
  ) => InternalAxiosRequestConfig;
  requestInterceptorsCatch?: (error: any) => any;
  responseInterceptors?: (res: T) => T;
  responseInterceptorsCatch?: (error: any) => any;
}

export interface WjcRequestConfig extends AxiosRequestConfig {
  interceptors?: WjcInterceptors;
  whiteList?: string[]; // 不展示错误提示信息的接口白名单
  maxCancelNum?: number;
  /** 在单个接口请求中配置，如果设置为true，则此接口不会被clearRequestAll统一取消 */
  noCancel?: boolean;
  requestType?: string;
}

// 接口返回的数据类型
export interface ApiResponse {
  code?: string | number;
  data?: any;
  message?: string;
}

const defaultConfig = {
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json; charset=UTF-8", // 统一json返回
    "Access-Control-Allow-Origin": "*",
  },
  timeout: 60000, // 默认超时1分钟
  withCredentials: true, // 重要：允许携带 Cookie
};

// 进度信息接口
interface UploadProgressInfo {
  percent: number;
  loaded: number;
  total: number;
  speed: string;
  estimated: string;
  event: AxiosProgressEvent;
}

// 上传选项接口
interface UploadOptions {
  headers?: Record<string, string>;
  timeout?: number;
  cancelToken?: CancelToken;
  [key: string]: any;
}

// 上传方法返回类型
interface UploadReturn {
  cancel: () => void;
  promise: Promise<AxiosResponse>;
}
// 增加任务队列
interface PendingTask {
  config: AxiosRequestConfig;
  resolve: Function;
}
let refreshing = false;
const queue: PendingTask[] = [];

class WjcRequest {
  instance: AxiosInstance;
  interceptors?: WjcInterceptors;
  private uploadStartTime: number | null = null;
  private lastLoaded: number = 0;
  private axiosCancels: Canceler[] = [];
  /** 取消所有请求的函数，按需使用 */
  clearRequestAll = async () => {
    this.axiosCancels.forEach((cancel) => {
      if (cancel) cancel();
    });
    // 移除所有记录
    this.axiosCancels.splice(0);
  };
  constructor(config: WjcRequestConfig) {
    this.swRequest = this.swRequest.bind(this);
    this.instance = axios.create({ ...defaultConfig, ...config });
    this.interceptors = config.interceptors;
    const maxCancelNum = config.maxCancelNum || 10; // 最大存cancelToken条数
    this.instance.interceptors.request.use(
      this.interceptors?.requestInterceptors,
      this.interceptors?.requestInterceptorsCatch
    );
    this.instance.interceptors.response.use(
      this.interceptors?.responseInterceptors,
      this.interceptors?.responseInterceptorsCatch
    );

    this.instance.interceptors.request.use(
      (conf: InternalAxiosRequestConfig<any> & { noCancel?: boolean }) => {
        if (conf.headers) {
          // 某些接口token信息需放在header上 如不需要 请注释
          // const token = getCookie("yyds");
          // conf.headers.Authorization = "bearer " + token;

          const accessToken =
            typeof window !== "undefined" ? localStorage.getItem("yyds") : null;
          if (accessToken) {
            conf.headers.Authorization = "Bearer " + accessToken;
          }

          // 接口均添加traceId
          conf.headers["wjc-traceId"] = guid();
        }
        if (!conf.noCancel) {
          if (this.axiosCancels.length >= maxCancelNum) {
            this.axiosCancels.shift();
          }
          conf.cancelToken = new axios.CancelToken((cancel) => {
            this.axiosCancels.push(cancel);
          });
        }
        return conf;
      },
      (err) => {
        console.log("wwRequest类的拦截器请求失败拦截器");
        return err;
      }
    );

    this.instance.interceptors.response.use(
      (response) => {
        // 下载文件流 返回全量response
        if (response.request.responseType === "blob") {
          return response;
        }
        const data = response.data;
        // 异常统一提示开启  code = 0 表示请求正常
        // 接口返回的数据code不等于0时展示错误信息  无需展示的接口可添加到白名单 whiteList
        if (
          !(
            parseInt(data.code) === 0 ||
            parseInt(data.code) === 200 ||
            data?.success
          ) &&
          !config.whiteList?.includes(response.config.url as string)
        ) {
          notification.error({
            message: "错误提示",
            description: data.msg || data.message,
          });
          // 请求错误时统一返回格式reject response，页面上需要对错误进一步处理时用catch捕获response
          return Promise.reject(response);
        }

        if (data?.success && !data?.data) {
          message.success(data?.message);
        }
        return data;
      },
      async (error) => {
        const response = error.response;
        if (!response) return Promise.reject(error);
        const { status, config } = response;
        // 鉴权失败并且不是长token的刷新接口
        if (status === 401 && !config.url.includes("/refresh")) {
          notification.error({
            message: "当前用户未登录，请前往登录页重新登录",
          });
          if (refreshing) {
            return new Promise((resolve) => {
              queue.push({
                config,
                resolve,
              });
            });
          }
          refreshing = true;

          try {
            // 尝试刷新 token
            await this.refreshToken();

            // 处理队列中的请求
            queue.forEach(({ config, resolve }) => {
              resolve(this.instance(config));
            });

            // 重试原始请求
            // config.headers.Authorization = `Bearer ${newToken}`;
            return this.instance(config);
          } catch (refreshError) {
            // 刷新 token 失败，跳转到登录页
            //  this.processQueue(refreshError, null);
            this.handleAuthError();
            return Promise.reject(refreshError);
          } finally {
            refreshing = false;
          }
          // 跳转到登录页
          //   toLoginPage();
        }

        if (status === 403) {
          notification.error({
            message: response.status,
            description: "无权操作",
          });
        }
        if (status === 406) {
          notification.error({
            message: response.status,
            description: "无权访问",
          });
        }

        if (axios.isCancel(error)) {
          // 请求未结束前被取消了 抛出的错误类型和其他错误不一样
          return Promise.reject(error);
        }

        if (status <= 504 && status >= 500) {
          notification.error({
            message: status,
            description: response.statusText || "服务器出错了",
          });
        }

        if (status === 404) {
          notification.error({
            message: "404",
            description: "请求未找到！",
          });
        }

        if (![401, 403, 406].includes(status)) {
          // 接口异常上报sentry
          collectError({
            tag: "api",
            err: error,
            data: {
              url: response?.config?.url,
              method: response?.config?.method || "GET",
              data: response?.config?.data,
              params: response?.config?.params,
              response: response?.data,
            },
          });
        }
        // 请求非200
        // const errortext =
        //   response.data?.message ||
        //   codeMessage[response.status] ||
        //   response.statusText;
        // 请求错误时统一返回格式reject response，页面上需要对错误进一步处理时用catch捕获response
        return Promise.reject(error);
      }
    );
  }
  // 处理认证错误
  handleAuthError = () => {
    // 清除本地存储的 token
    // this.clearTokens();

    // 显示错误消息
    message.error("登录已过期，请重新登录");

    // 跳转到登录页
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  };
  refreshToken = async () => {
    const response = await axios.post(
      `${this.instance.defaults.baseURL}/auth/refresh`,
      {},
      {
        withCredentials: true, // 自动携带 refreshToken cookie
      }
    );
    // 更新存储的 access token
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", response.data.accessToken);
      localStorage.setItem("refresh_token", response.data.refreshToken);
    }
    return response;
  };

  request<T>(config: WjcRequestConfig): Promise<T> {
    return new Promise((resolve, reject) => {
      this.instance.interceptors.request.use(
        config.interceptors?.requestInterceptors,
        config.interceptors?.requestInterceptorsCatch
      );

      this.instance.interceptors.response.use(
        config.interceptors?.responseInterceptors,
        config.interceptors?.responseInterceptorsCatch
      );

      this.instance
        .request(config)
        .then((res) => {
          // 返回data
          resolve(res?.data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
  // =========================支持 FormData 的上传方法========================================
  // 支持 FormData 的上传方法
  upload(
    url: string,
    formData: FormData,
    onProgress?: (progressInfo: UploadProgressInfo) => void,
    options: UploadOptions = {}
  ): UploadReturn {
    // 重置上传统计
    this.resetUploadStats();

    const cancelTokenSource = axios.CancelToken.source();
    let uploadCompleted = false;

    // 设置超时定时器
    const timeout = options.timeout || 300000;
    const timeoutId = setTimeout(() => {
      if (!uploadCompleted) {
        cancelTokenSource.cancel(`上传超时（${timeout / 1000}秒）`);
      }
    }, timeout);

    const config: AxiosRequestConfig = {
      headers: {
        "Content-Type": "multipart/form-data",
        ...options.headers,
      },
      cancelToken: cancelTokenSource.token, // 使用 token 而不是 source,
      timeout,
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        try {
          if (onProgress && typeof onProgress === "function") {
            const progressInfo = this.calculateProgressInfo(progressEvent);
            onProgress(progressInfo);
          }
        } catch (error) {
          console.warn("进度回调错误:", error);
        }
      },
      ...options,
    };

    const uploadPromise = this.instance
      .post(url, formData, config)
      .then((response: AxiosResponse) => {
        uploadCompleted = true;
        clearTimeout(timeoutId);
        return response;
      })
      .catch((error: any) => {
        uploadCompleted = true;
        clearTimeout(timeoutId);

        if (axios.isCancel(error)) {
          throw new Error(`上传已取消: ${error.message}`);
        } else if (error.code === "ECONNABORTED") {
          throw new Error("网络连接超时");
        } else if (error.response) {
          // 服务器返回错误状态码
          const status = error.response.status;
          let msg = "上传失败";

          switch (status) {
            case 400:
              msg = "请选择要上传的文件";
              break;
            case 413:
              msg = "文件太大，超过服务器限制";
              break;
            case 415:
              msg = "不支持的文件类型";
              break;
            case 500:
              msg = "服务器内部错误";
              break;
            default:
              msg = error.response.data?.message || `服务器错误: ${status}`;
          }
          message.error(msg);
          // throw new Error(message);
        } else if (error.request) {
          throw new Error("网络错误，请检查网络连接");
        } else {
          throw new Error(error.message || "上传失败");
        }
      });

    return {
      cancel: () => {
        if (!uploadCompleted) {
          cancelTokenSource.cancel("用户取消上传");
        }
      },
      promise: uploadPromise,
    };
  }

  // 计算进度信息
  private calculateProgressInfo(
    progressEvent: AxiosProgressEvent
  ): UploadProgressInfo {
    let percentCompleted = 0;

    if (progressEvent.total) {
      percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      percentCompleted = Math.min(100, Math.max(0, percentCompleted));
    }

    return {
      percent: percentCompleted,
      loaded: progressEvent.loaded, // 已上传字节数
      total: progressEvent.total || 0, // 总字节数
      speed: this.calculateSpeed(progressEvent), // 上传速度
      estimated: this.calculateRemainingTime(progressEvent), // 预计剩余时间
      event: progressEvent, // 原始事件对象（用于高级需求）
    };
  }

  // 计算上传速度（字节/秒）
  private calculateSpeed(progressEvent: AxiosProgressEvent): string {
    if (!this.uploadStartTime) {
      this.uploadStartTime = Date.now();
      this.lastLoaded = 0;
      return "0 B/s";
    }

    const currentTime = Date.now();
    const timeElapsed = (currentTime - this.uploadStartTime) / 1000; // 转换为秒
    const bytesUploaded = progressEvent.loaded - this.lastLoaded;

    if (timeElapsed > 0) {
      const speed = bytesUploaded / timeElapsed; // 字节/秒

      // 更新记录
      this.lastLoaded = progressEvent.loaded;

      return this.formatSpeed(speed);
    }

    return "0 B/s";
  }

  // 格式化速度显示
  private formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond === 0) return "0 B/s";

    const units = ["B/s", "KB/s", "MB/s", "GB/s"];
    let speed = bytesPerSecond;
    let unitIndex = 0;

    while (speed >= 1024 && unitIndex < units.length - 1) {
      speed /= 1024;
      unitIndex++;
    }

    return `${speed.toFixed(1)} ${units[unitIndex]}`;
  }

  // 计算预计剩余时间
  private calculateRemainingTime(progressEvent: AxiosProgressEvent): string {
    if (!progressEvent.total || progressEvent.loaded <= 0) {
      return "计算中...";
    }

    if (!this.uploadStartTime) {
      this.uploadStartTime = Date.now();
      return "计算中...";
    }

    const timeElapsed = (Date.now() - this.uploadStartTime) / 1000; // 已用时间（秒）
    const uploadSpeed = progressEvent.loaded / timeElapsed; // 平均速度（字节/秒）

    if (uploadSpeed > 0) {
      const remainingBytes = progressEvent.total - progressEvent.loaded;
      const remainingTime = remainingBytes / uploadSpeed; // 剩余时间（秒）

      return this.formatTime(remainingTime);
    }

    return "计算中...";
  }

  // 格式化时间显示
  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}秒`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.ceil(seconds % 60);
      return `${minutes}分${remainingSeconds}秒`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}时${minutes}分`;
    }
  }

  // 重置上传统计
  private resetUploadStats(): void {
    this.uploadStartTime = null;
    this.lastLoaded = 0;
  }

  // ==============================================================

  /**
   * swagger请求
   * 由于request对返回的数据做了处理只返回data
   * 获取api文档传入的泛型T的data属性作为返回类型
   * */
  swRequest<T>(url: string, config?: WjcRequestConfig) {
    return this.request<T>({ ...config, url }) as Promise<
      T extends ApiResponse ? T["data"] : T
    >;
  }

  get<T>(url: string, params?: unknown, config?: WjcRequestConfig): Promise<T> {
    return this.request<T>({ ...config, url, params, method: "GET" });
  }

  post<T>(
    url: string,
    params?: unknown,
    config?: WjcRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, url, data: params, method: "POST" });
  }
  put<T>(url: string, params?: unknown, config?: WjcRequestConfig): Promise<T> {
    return this.request<T>({ ...config, url, data: params, method: "PUT" });
  }
  delete<T>(
    url: string,
    params?: unknown,
    config?: WjcRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, url, data: params, method: "DELETE" });
  }

  patch<T>(
    url: string,
    params?: unknown,
    config?: WjcRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, url, data: params, method: "PATCH" });
  }
}

export default WjcRequest;
