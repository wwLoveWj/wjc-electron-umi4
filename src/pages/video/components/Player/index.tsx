import React, { useRef, useEffect, useState } from "react";
import { useModel } from "umi";
import ControlBar from "./ControlBar";
import ProgressBar from "./ProgressBar";
import Playlist from "./Playlist";
import {
  PlayCircleFilled,
  PauseCircleFilled,
  UploadOutlined,
} from "@ant-design/icons";
import styles from "../styles.less";

const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    currentVideo,
    isPlaying,
    setVideoRef,
    setContainerRef,
    play,
    pause,
    toggleFullscreen,
  } = useModel("useVideoPlayerModel");

  const { showUpload } = useModel("useVideoUploadModel");

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showCenterControls, setShowCenterControls] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // 设置视频和容器引用
  useEffect(() => {
    if (videoRef.current) {
      setVideoRef(videoRef.current);
    }
    if (containerRef.current) {
      setContainerRef(containerRef.current);
    }
  }, [setVideoRef, setContainerRef]);

  // 当切换视频时，确保视频元素更新
  useEffect(() => {
    if (videoRef.current && currentVideo) {
      setVideoError(null);
      videoRef.current.load();

      // 视频加载后尝试播放
      const handleLoaded = () => {
        play().catch((error) => {
          console.error("自动播放失败:", error);
          setVideoError("点击播放按钮开始播放");
        });
      };

      videoRef.current.addEventListener("loadeddata", handleLoaded);
      return () => {
        videoRef.current?.removeEventListener("loadeddata", handleLoaded);
      };
    }
  }, [currentVideo, play]);

  const togglePlayPause = async () => {
    if (!currentVideo) {
      showUpload();
      return;
    }

    try {
      if (isPlaying) {
        pause();
      } else {
        await play();
      }
    } catch (error) {
      console.error("播放控制失败:", error);
      setVideoError("播放失败，请检查视频文件");
    }
  };

  const handleVideoClick = () => {
    togglePlayPause();
  };

  const handleMouseEnter = () => {
    setShowCenterControls(true);
  };

  const handleMouseLeave = () => {
    setShowCenterControls(false);
  };

  const handleUploadClick = () => {
    showUpload();
  };

  const handleVideoError = (
    e: React.SyntheticEvent<HTMLVideoElement, Event>
  ) => {
    console.error("视频加载错误:", e);
    setVideoError("视频加载失败，请检查文件格式或路径");
    pause();
  };

  return (
    <div
      className={styles.playerContainer}
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.videoWrapper}>
        {/* 视频元素 - 只在有视频时显示 */}
        {currentVideo ? (
          <>
            <video
              ref={videoRef}
              className={styles.videoElement}
              src={currentVideo?.path}
              preload="metadata"
              onClick={handleVideoClick}
              onError={handleVideoError}
            />

            {/* 错误提示 */}
            {videoError && (
              <div className={styles.errorOverlay}>
                <div className={styles.errorMessage}>
                  <p>{videoError}</p>
                  {videoError.includes("点击播放") && (
                    <button
                      className={styles.retryButton}
                      onClick={handleVideoClick}
                    >
                      点击播放
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 科技感覆盖层 */}
            <div className={styles.techOverlay}>
              <div className={styles.gridLines}></div>
              <div className={styles.cornerBorder}>
                <div className={styles.corner}></div>
                <div className={styles.corner}></div>
                <div className={styles.corner}></div>
                <div className={styles.corner}></div>
              </div>
            </div>

            {/* 中央播放控制按钮 */}
            <div
              className={`${styles.centerControls} ${
                showCenterControls || !isPlaying ? styles.visible : ""
              }`}
              onClick={handleVideoClick}
            >
              {isPlaying ? (
                <PauseCircleFilled className={styles.centerPlayIcon} />
              ) : (
                <PlayCircleFilled className={styles.centerPlayIcon} />
              )}
            </div>

            {/* 视频信息覆盖层 */}
            <div className={styles.videoInfoOverlay}>
              <h3 className={styles.videoTitle}>{currentVideo.name}</h3>
              {videoError && <div className={styles.errorIndicator}>!</div>}
            </div>

            {/* 进度条 */}
            <ProgressBar />
          </>
        ) : (
          // 没有视频时的提示
          <div className={styles.noVideoPlaceholder}>
            <div className={styles.uploadPrompt}>
              <UploadOutlined className={styles.uploadPromptIcon} />
              <h3 className={styles.uploadPromptTitle}>暂无视频</h3>
              <p className={styles.uploadPromptText}>
                请先上传视频文件开始播放
              </p>
              <button
                className={styles.uploadPromptButton}
                onClick={handleUploadClick}
              >
                上传视频
              </button>
            </div>

            {/* 科技感背景 */}
            <div className={styles.techBackground}>
              <div className={styles.gridLines}></div>
              <div className={styles.cornerBorder}>
                <div className={styles.corner}></div>
                <div className={styles.corner}></div>
                <div className={styles.corner}></div>
                <div className={styles.corner}></div>
              </div>
            </div>
          </div>
        )}

        {/* 控制栏 */}
        <ControlBar
          onTogglePlaylist={() => setShowPlaylist(!showPlaylist)}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>

      {/* 播放列表侧边栏 */}
      {showPlaylist && (
        <div className={styles.playlistSidebar}>
          <Playlist onClose={() => setShowPlaylist(false)} />
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
