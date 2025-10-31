import React, { useState, useEffect } from "react";
import { useModel } from "umi";
import {
  WifiOutlined,
  CloseOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import styles from "./index.less";

const ScreenCast: React.FC = () => {
  const [devices, setDevices] = useState<API.ScreenCastDevice[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { isCasting, toggleCast, currentVideo } = useModel(
    "useVideoPlayerModel"
  );

  useEffect(() => {
    if (isCasting) {
      discoverDevices();
    }
  }, [isCasting]);

  const discoverDevices = async () => {
    setIsDiscovering(true);
    // 模拟设备发现 - 在实际应用中这里应该调用真实的投屏API
    setTimeout(() => {
      setDevices([
        { id: "1", name: "客厅电视 (Living Room TV)", type: "tv" },
        { id: "2", name: "卧室电视 (Bedroom TV)", type: "tv" },
        { id: "3", name: "会议室投影仪 (Conference Room)", type: "projector" },
        { id: "4", name: "小米电视 (Mi TV)", type: "tv" },
      ]);
      setIsDiscovering(false);
    }, 2000);
  };

  const handleCastToDevice = async (device: API.ScreenCastDevice) => {
    if (!currentVideo) {
      alert("请先选择要播放的视频");
      return;
    }

    setIsConnecting(true);

    // 模拟投屏连接过程
    setTimeout(() => {
      setIsConnecting(false);
      alert(
        `已开始投屏到 ${device.name}\n\n视频: ${currentVideo.name}\n\n注意: 这是模拟投屏功能，实际投屏需要硬件支持。`
      );
      // 在实际应用中，这里应该调用投屏API
    }, 1500);
  };

  const handleClose = () => {
    toggleCast();
  };

  if (!isCasting) return null;

  return (
    <div className={styles.castModal}>
      <div className={styles.castContent}>
        <div className={styles.castHeader}>
          <div className={styles.headerLeft}>
            <WifiOutlined className={styles.castIcon} />
            <h3>选择投屏设备</h3>
          </div>
          <CloseOutlined className={styles.closeIcon} onClick={handleClose} />
        </div>

        <div className={styles.castInfo}>
          {currentVideo ? (
            <p>
              当前视频: <strong>{currentVideo.name}</strong>
            </p>
          ) : (
            <p className={styles.warning}>请先选择要投屏的视频</p>
          )}
        </div>

        <div className={styles.devicesList}>
          {isDiscovering ? (
            <div className={styles.discovering}>
              <LoadingOutlined className={styles.loadingSpinner} />
              <p>正在搜索附近的投屏设备...</p>
            </div>
          ) : (
            <>
              {devices.map((device) => (
                <div
                  key={device.id}
                  className={styles.deviceItem}
                  onClick={() => !isConnecting && handleCastToDevice(device)}
                >
                  <div className={styles.deviceIcon}>
                    {device.type === "tv" ? "📺" : "📽️"}
                  </div>
                  <div className={styles.deviceInfo}>
                    <div className={styles.deviceName}>{device.name}</div>
                    <div className={styles.deviceType}>
                      {device.type === "tv" ? "智能电视" : "投影仪"}
                    </div>
                  </div>
                  <div
                    className={`${styles.connectButton} ${
                      isConnecting ? styles.connecting : ""
                    }`}
                  >
                    {isConnecting ? "连接中..." : "投屏"}
                  </div>
                </div>
              ))}

              {devices.length === 0 && !isDiscovering && (
                <div className={styles.noDevices}>
                  <p>未发现可用的投屏设备</p>
                  <button
                    className={styles.retryButton}
                    onClick={discoverDevices}
                  >
                    重新搜索
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.castActions}>
          <button
            className={styles.rescanButton}
            onClick={discoverDevices}
            disabled={isDiscovering}
          >
            {isDiscovering ? "搜索中..." : "重新搜索"}
          </button>
          <button className={styles.closeButton} onClick={handleClose}>
            取消
          </button>
        </div>

        <div className={styles.castHint}>
          <p>💡 提示: 确保您的设备和电视在同一WiFi网络下</p>
        </div>
      </div>
    </div>
  );
};

export default ScreenCast;
