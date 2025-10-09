// import type { MenuProps } from "antd";
import { LoginOutlined, UserOutlined } from "@ant-design/icons";
import { history } from "umi";
import { PROJECT_CONFIG } from "@/constants/constant";
import { WjLayout } from "magical-antd-ui";
import { menuRoutes } from "@/routes/menuRoutes"; // 配置的菜单项
import { useEffect } from "react";
import { storage } from "@/utils/storage";

const currentMenuTheme = "dark";
export default function Layout() {
  const loginInfo = storage.get("loginInfo");
  // settings的菜单
  const avatarItems = [
    {
      key: "1",
      label: (
        <a
          onClick={() => {
            history.push("/login");
          }}
        >
          退出登录
        </a>
      ),
      icon: <LoginOutlined />,
    },
    {
      key: "2",
      label: (
        <a
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            history.push("/center");
          }}
        >
          个人中心
        </a>
      ),
      icon: <UserOutlined />,
    },
  ];

  useEffect(() => {
    if (!loginInfo?.isLogin) {
      history.push(`/login?redirect=${encodeURIComponent(location.pathname)}`);
    }
  }, [loginInfo?.isLogin]);
  return (
    <WjLayout
      isShowHeader={false}
      avatarItems={avatarItems}
      // rolesList={rolesList}
      routes={menuRoutes}
      home="/home"
      projectName={PROJECT_CONFIG.TITLE}
      headerStyle={{
        background: `var(--art-main-bg-color)`,
        color: `var(--art-text-gray-700)`,
      }}
      themeMenu={currentMenuTheme}
    />
  );
}
