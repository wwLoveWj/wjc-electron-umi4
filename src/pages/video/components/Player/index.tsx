import React, { useRef, useEffect, useState } from "react";
import { useModel } from "umi";
import ControlBar from "./ControlBar";
import ProgressBar from "./ProgressBar";
import Playlist from "./Playlist";
import { PlayCircleFilled, PauseCircleFilled } from "@ant-design/icons";
import styles from "../styles.less";

const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentVideo, isPlaying, setVideoRef, play, pause } = useModel(
    "useVideoPlayerModel"
  );

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showCenterControls, setShowCenterControls] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      setVideoRef(videoRef.current);
    }
  }, [setVideoRef]);

  // 当切换视频时，确保视频元素更新
  useEffect(() => {
    if (videoRef.current && currentVideo) {
      videoRef.current.load();
    }
  }, [currentVideo]);

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
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

  return (
    <div
      className={styles.playerContainer}
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.videoWrapper}>
        <video
          ref={videoRef}
          className={styles.videoElement}
          src={currentVideo?.path}
          preload="metadata"
          onClick={handleVideoClick}
        />

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
        {currentVideo && (
          <div className={styles.videoInfoOverlay}>
            <h3 className={styles.videoTitle}>{currentVideo.name}</h3>
          </div>
        )}

        {/* 进度条 */}
        <ProgressBar />

        {/* 控制栏 */}
        <ControlBar onTogglePlaylist={() => setShowPlaylist(!showPlaylist)} />
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
