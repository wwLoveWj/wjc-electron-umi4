// components/CustomTitleBar.tsx
import React, { useState, useEffect } from "react";
import {
  CloseOutlined,
  MinusOutlined,
  BorderOutlined,
  SwitcherOutlined,
  PushpinOutlined,
  PushpinFilled,
} from "@ant-design/icons";
import { Button, Space, Tooltip } from "antd";
import styles from "./index.less";

let removeListener;
// 或者显式定义 props 接口
interface MyComponentProps {
  children: React.ReactNode;
}
const CustomTitleBar: React.FC<MyComponentProps> = ({ children }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);

  useEffect(() => {
    // 监听置顶状态变化（来自快捷键）
    if (window.electronAPI && window.electronAPI.onAlwaysOnTopChange) {
      removeListener = window.electronAPI.onAlwaysOnTopChange((event, flag) => {
        setIsAlwaysOnTop(flag);
      });
    }
    // 检查窗口初始状态
    const checkWindowState = async () => {
      if (window.electronAPI) {
        const maximized = await window.electronAPI.isWindowMaximized();
        setIsMaximized(maximized);

        const onTop = await window.electronAPI.isAlwaysOnTop();
        setIsAlwaysOnTop(onTop);
      }
    };

    checkWindowState();

    // 监听窗口状态变化
    if (window.electronAPI) {
      const removeListener = window.electronAPI.onWindowStateChange(
        (event, maximized) => {
          setIsMaximized(maximized);
        }
      );

      return removeListener;
    }

    return () => {
      if (removeListener) removeListener();
      // 清理其他监听器...
    };
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  const handleToggleAlwaysOnTop = async () => {
    if (window.electronAPI) {
      const newState = !isAlwaysOnTop;
      const success = await window.electronAPI.setAlwaysOnTop(newState);
      if (success) {
        setIsAlwaysOnTop(newState);
      }
    }
  };

  return (
    <div className={styles.titleBar}>
      <div className={styles.dragRegion}>
        {children ? (
          children
        ) : (
          <span className={styles.appTitle}>Harmony Music Player</span>
        )}
      </div>

      <div className={styles.windowControls}>
        <Space size="small">
          {/* 置顶按钮 */}
          <Tooltip title={isAlwaysOnTop ? "取消置顶" : "窗口置顶"}>
            <Button
              type="text"
              size="small"
              icon={isAlwaysOnTop ? <PushpinFilled /> : <PushpinOutlined />}
              onClick={handleToggleAlwaysOnTop}
              className={`${styles.controlButton} ${isAlwaysOnTop ? styles.pinned : ""}`}
            />
          </Tooltip>

          {/* 窗口控制按钮 */}
          <Button
            type="text"
            size="small"
            icon={<MinusOutlined />}
            onClick={handleMinimize}
            className={styles.controlButton}
          />
          <Button
            type="text"
            size="small"
            icon={isMaximized ? <SwitcherOutlined /> : <BorderOutlined />}
            onClick={handleMaximize}
            className={styles.controlButton}
          />
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={handleClose}
            className={`${styles.controlButton} ${styles.closeButton}`}
          />
        </Space>
      </div>
    </div>
  );
};

export default CustomTitleBar;
