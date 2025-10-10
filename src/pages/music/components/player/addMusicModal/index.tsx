import React, { useState } from "react";
import { CheckOutlined } from "@ant-design/icons";
import { Modal, message } from "antd";
import styles from "./index.less";
import { Playlist, Music } from "../../../type";
// 添加音乐模态框组件
export const AddMusicModal: React.FC<{
  visible: boolean;
  onCancel: () => void;
  onConfirm: (selectedMusicIds: string[]) => void;
  availableMusic: Music[];
  playlists: Playlist[];
}> = ({ visible, onCancel, onConfirm, availableMusic, playlists }) => {
  const [selectedMusicIds, setSelectedMusicIds] = useState<string[]>([]);

  const handleMusicSelect = (musicId: string) => {
    setSelectedMusicIds((prev) =>
      prev.includes(musicId)
        ? prev.filter((id) => id !== musicId)
        : [...prev, musicId]
    );
  };

  const handleConfirm = () => {
    if (selectedMusicIds.length === 0) {
      message.warning("请至少选择一首音乐");
      return;
    }
    onConfirm(selectedMusicIds);
    setSelectedMusicIds([]);
  };

  const handleCancel = () => {
    setSelectedMusicIds([]);
    onCancel();
  };

  // 格式化文件大小函数
  const formatFileSize = (size?: number) => {
    if (!size) return "未知";
    return `${size.toFixed(2)} MB`;
  };
  return (
    <Modal
      title="从播放列表添加音乐"
      open={visible}
      onOk={handleConfirm}
      onCancel={handleCancel}
      okText="添加"
      cancelText="取消"
      width={1000}
      className={styles.addMusicModal}
      styles={{
        body: {
          padding: 0,
        },
      }}
    >
      <div className={styles.modalContent}>
        <div className={styles.availableMusicSection}>
          <div className={styles.sectionHeader}>
            <h3>可添加的音乐</h3>
            <span className={styles.musicCount}>({availableMusic.length})</span>
          </div>
          <div className={styles.musicSelectionList}>
            {availableMusic.map((music) => (
              <div
                key={music.id}
                className={`${styles.musicSelectionItem} ${
                  selectedMusicIds.includes(music.id) ? styles.selected : ""
                }`}
                onClick={() => handleMusicSelect(music.id)}
              >
                <div className={styles.musicSelectionCheckbox}>
                  {selectedMusicIds.includes(music.id) && <CheckOutlined />}
                </div>
                <div className={styles.fileSize}>
                  {formatFileSize(music.fileSize)}
                </div>
                <div className={styles.musicTextInfo}>
                  <div className={styles.musicTitle}>{music.title}</div>
                  <div className={styles.musicArtist}>{music.artist}</div>
                </div>
                <div className={styles.trackCount}>
                  {Math.floor(Math.random() * 500) + 200}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.selectedMusicSection}>
          <div className={styles.sectionHeader}>
            <h3>已选择</h3>
            <span className={styles.musicCount}>
              ({selectedMusicIds.length})
            </span>
          </div>
          {selectedMusicIds.length === 0 ? (
            <div className={styles.noSelection}>
              <div className={styles.noSelectionText}>暂无选择</div>
            </div>
          ) : (
            <div className={styles.selectedMusicList}>
              {availableMusic
                .filter((music) => selectedMusicIds.includes(music.id))
                .map((music) => (
                  <div key={music.id} className={styles.selectedMusicItem}>
                    <div className={styles.selectedFileSize}>
                      {formatFileSize(music.fileSize)}
                    </div>
                    <div className={styles.selectedMusicInfo}>
                      <div className={styles.selectedMusicTitle}>
                        {music.title}
                      </div>
                      <div className={styles.selectedMusicArtist}>
                        {music.artist}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
