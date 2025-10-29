import React, { useState, useEffect } from "react";
import { useModel } from "umi";
import { WifiOutlined, CloseOutlined } from "@ant-design/icons";
import styles from "../styles.less";

const ScreenCast: React.FC = () => {
  const [devices, setDevices] = useState<API.ScreenCastDevice[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const { isCasting, toggleCast, currentVideo } = useModel(
    "useVideoPlayerModel"
  );

  useEffect(() => {
    discoverDevices();
  }, []);

  const discoverDevices = async () => {
    setIsDiscovering(true);
    // 模拟设备发现
    setTimeout(() => {
      setDevices([
        { id: "1", name: "客厅电视", type: "tv" },
        { id: "2", name: "卧室电视", type: "tv" },
        { id: "3", name: "会议室投影仪", type: "projector" },
      ]);
      setIsDiscovering(false);
    }, 2000);
  };

  const handleCastToDevice = (device: API.ScreenCastDevice) => {
    if (!currentVideo) return;

    // 模拟投屏
    console.log(`投屏到 ${device.name}: ${currentVideo.name}`);
    toggleCast();
  };

  if (!isCasting) return null;

  return (
    <div className={styles.castModal}>
      <div className={styles.castContent}>
        <div className={styles.castHeader}>
          <WifiOutlined className={styles.castIcon} />
          <h3>选择投屏设备</h3>
          <CloseOutlined className={styles.closeIcon} onClick={toggleCast} />
        </div>

        <div className={styles.devicesList}>
          {isDiscovering ? (
            <div className={styles.discovering}>
              <div className={styles.loadingSpinner}></div>
              <p>正在搜索设备...</p>
            </div>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className={styles.deviceItem}
                onClick={() => handleCastToDevice(device)}
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
                <div className={styles.connectButton}>连接</div>
              </div>
            ))
          )}
        </div>

        <div className={styles.castActions}>
          <button className={styles.rescanButton} onClick={discoverDevices}>
            重新搜索
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScreenCast;
