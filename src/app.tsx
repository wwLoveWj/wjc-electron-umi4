import "@/styles/reset.scss"; // 重置HTML样式
// import "@/styles/dark.scss"; // 系统主题
import "@/styles/antd-ui.scss"; // 优化element样式
import "./global.less";
// import "@/assets/icons/icons/iconfont.css";

import { ConfigProvider } from "antd";
import Package from "../package.json";
import React from "react";
import zhCN from "antd/es/locale/zh_CN";
import { WjConfigProvider } from "magical-antd-ui";
import type { RuntimeConfig } from "umi";
import { matchRoutes } from "umi";
import { PROJECT_CONFIG } from "./constants/constant";
import "./utils/dayjs";

// 初始化路由菜单数据
export async function getInitialState() {
  // 获取用户信息，这里可以调用API
  return {
    currentUser: null,
    isLogin: false,
  };
}

export function rootContainer(container: React.ReactNode) {
  return (
    <WjConfigProvider>
      <ConfigProvider
        prefixCls={Package.name + "-ant"}
        locale={zhCN}
        theme={{
          components: {
            Menu: {
              /* 这里是你的组件 token */
              collapsedWidth: 190,
              dropdownWidth: 30,
              collapsedIconSize: 22,
            },
          },
        }}
      >
        {container}
      </ConfigProvider>
    </WjConfigProvider>
  );
}

// 子应用动态添加网页title
export const onRouteChange: RuntimeConfig["onRouteChange"] = ({
  clientRoutes,
  location,
}) => {
  const { pathname } = location;
  // 浏览器页签的title
  const newPath = pathname.replace(`${PROJECT_CONFIG.NAME}/`, "");
  const route: any = matchRoutes(clientRoutes, newPath)?.pop()?.route;
  if (route) {
    document.title = route?.title || "";
  }
};

export async function render(oldRender: any) {
  oldRender();
}
