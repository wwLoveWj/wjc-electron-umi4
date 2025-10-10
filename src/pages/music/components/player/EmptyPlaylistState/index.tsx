// 空状态组件
import React from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Button } from "antd";
import styles from "./index.less";

export const EmptyPlaylistState: React.FC<{
  playlistName: string;
  onAddMusic: () => void;
}> = ({ playlistName, onAddMusic }) => (
  <div className={styles.emptyState}>
    <div className={styles.emptyIcon}>
      <div className={styles.musicNote}>♪</div>
    </div>
    <h3>{playlistName} 是空的</h3>
    <p>将音乐添加到这个歌单，开始打造您的专属收藏</p>
    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={onAddMusic}
      className={styles.addMusicBtn}
    >
      从播放列表添加
    </Button>
  </div>
);
