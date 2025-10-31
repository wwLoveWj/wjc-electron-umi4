import React, { useRef, useEffect, useState, useCallback } from "react";
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
    setUserInteracted,
    play,
    pause,
    toggleFullscreen,
  } = useModel("useVideoPlayerModel");

  const { showUpload } = useModel("useVideoUploadModel");

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showCenterControls, setShowCenterControls] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [autoPlayBlocked, setAutoPlayBlocked] = useState(false);

  // 使用 useCallback 创建 ref 回调函数
  const handleVideoRef = useCallback((element: HTMLVideoElement) => {
    videoRef.current = element;
    console.log("Video ref set:", element);
  }, []);

  const handleContainerRef = useCallback((element: HTMLDivElement) => {
    containerRef.current = element;
    console.log("Container ref set:", element);
  }, []);

  // 当切换视频时，重置错误状态
  useEffect(() => {
    if (currentVideo) {
      setVideoError(null);
      setAutoPlayBlocked(false);
      console.log("Current video changed:", currentVideo);

      // 确保视频元素重新加载
      if (videoRef.current) {
        videoRef.current.load();
      }
    }
  }, [currentVideo]);

  const togglePlayPause = async () => {
    console.log("togglePlayPause called", {
      currentVideo,
      isPlaying,
      videoRef: videoRef.current,
    });

    if (!currentVideo) {
      showUpload();
      return;
    }

    // 确保 videoRef 存在
    if (!videoRef.current) {
      console.error("videoRef is null, cannot play");
      setVideoError("播放器未准备好，请刷新页面重试");
      return;
    }

    try {
      // 标记用户已经交互
      setUserInteracted();

      if (isPlaying) {
        pause(videoRef.current);
      } else {
        await play(videoRef.current);
        setAutoPlayBlocked(false);
      }
    } catch (error: any) {
      console.error("播放控制失败:", error);
      if (error.name === "NotAllowedError") {
        setVideoError("浏览器阻止了自动播放，请点击播放按钮");
        setAutoPlayBlocked(true);
      } else {
        setVideoError("播放失败，请检查视频文件");
      }
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
    if (videoRef.current) {
      pause(videoRef.current);
    }
  };

  // 处理视频元数据加载完成
  const handleLoadedMetadata = () => {
    console.log("视频元数据加载完成，videoRef:", videoRef.current);
  };

  // 处理视频可以播放
  const handleCanPlay = () => {
    console.log("视频可以播放，videoRef:", videoRef.current);
  };

  // 全屏切换函数
  const handleToggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      toggleFullscreen(containerRef.current);
    }
  }, [toggleFullscreen]);

  return (
    <div
      className={styles.playerContainer}
      ref={handleContainerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.videoWrapper}>
        {/* 视频元素 - 只在有视频时显示 */}
        {currentVideo ? (
          <>
            <video
              ref={handleVideoRef}
              className={styles.videoElement}
              src={currentVideo?.path}
              preload="metadata"
              onClick={handleVideoClick}
              onError={handleVideoError}
              onLoadedMetadata={handleLoadedMetadata}
              onCanPlay={handleCanPlay}
              playsInline
            />

            {/* 自动播放被阻止的提示 */}
            {autoPlayBlocked && (
              <div className={styles.autoplayBlockedOverlay}>
                <div className={styles.autoplayMessage}>
                  <p>点击播放按钮开始播放视频</p>
                  <button
                    className={styles.playButton}
                    onClick={handleVideoClick}
                  >
                    <PlayCircleFilled />
                    播放视频
                  </button>
                </div>
              </div>
            )}

            {/* 错误提示 */}
            {videoError && !autoPlayBlocked && (
              <div className={styles.errorOverlay}>
                <div className={styles.errorMessage}>
                  <p>{videoError}</p>
                  <button
                    className={styles.retryButton}
                    onClick={handleVideoClick}
                  >
                    重试播放
                  </button>
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
                showCenterControls || !isPlaying || autoPlayBlocked
                  ? styles.visible
                  : ""
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
              {(videoError || autoPlayBlocked) && (
                <div className={styles.errorIndicator}>!</div>
              )}
            </div>

            {/* 进度条 */}
            <ProgressBar videoRef={videoRef} />
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
          onToggleFullscreen={handleToggleFullscreen}
          videoRef={videoRef}
          containerRef={containerRef}
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
