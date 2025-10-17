import React, { useCallback } from "react";
import { useModel } from "umi";
import {
  UploadOutlined,
  CloseOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { FileUtils } from "../fileUtils";
import styles from "./index.less";

const VideoUpload: React.FC = () => {
  const { addToPlaylist } = useModel("useVideoPlayerModel");
  const { isUploadVisible, hideUpload } = useModel("useVideoUploadModel");

  const handleFileSelect = useCallback(async () => {
    try {
      const filePaths = await FileUtils.selectVideoFiles();

      for (const filePath of filePaths) {
        // FileUtils.generateVideoItem 现在会自动处理文件名
        const videoItem = FileUtils.generateVideoItem(filePath, filePath);

        // 获取视频时长
        try {
          const duration = await FileUtils.getVideoDuration(filePath);
          videoItem.duration = duration;
        } catch (error) {
          console.error("获取视频时长失败:", error);
          videoItem.duration = 0;
        }

        addToPlaylist(videoItem);
      }

      hideUpload();
    } catch (error) {
      console.error("文件选择错误:", error);
    }
  }, [addToPlaylist, hideUpload]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("video/")
      );

      for (const file of files) {
        const fileUrl = URL.createObjectURL(file);
        // 使用文件名而不是完整路径
        const videoItem = FileUtils.generateVideoItem(fileUrl, file.name);

        // 获取视频时长
        try {
          const duration = await FileUtils.getVideoDuration(fileUrl);
          videoItem.duration = duration;
        } catch (error) {
          console.error("获取视频时长失败:", error);
          videoItem.duration = 0;
        }

        addToPlaylist(videoItem);
      }

      hideUpload();
    },
    [addToPlaylist, hideUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  if (!isUploadVisible) return null;

  return (
    <div className={styles.uploadModal}>
      <div className={styles.uploadContent}>
        <div className={styles.uploadHeader}>
          <h3>上传视频</h3>
          <CloseOutlined className={styles.closeIcon} onClick={hideUpload} />
        </div>

        <div
          className={styles.uploadArea}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleFileSelect}
        >
          <div className={styles.uploadIcon}>
            <VideoCameraOutlined />
          </div>
          <h4>点击选择视频文件或拖拽文件到这里</h4>
          <p>支持 MP4, AVI, MOV, WMV 等格式</p>
          <button
            className={styles.uploadButton}
            onClick={(e) => {
              e.stopPropagation();
              handleFileSelect();
            }}
          >
            <UploadOutlined />
            选择文件
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoUpload;
