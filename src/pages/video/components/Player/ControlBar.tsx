import React from "react";
import { useModel } from "umi";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  SoundOutlined,
  MutedOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  UnorderedListOutlined,
  UploadOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import styles from "../styles.less";

interface ControlBarProps {
  onTogglePlaylist: () => void;
  onToggleFullscreen: () => void; // 现在不需要参数，因为已经在 VideoPlayer 中处理了
  videoRef?: React.RefObject<HTMLVideoElement>;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const ControlBar: React.FC<ControlBarProps> = ({
  onTogglePlaylist,
  onToggleFullscreen,
  videoRef,
}) => {
  const {
    isPlaying,
    volume,
    isMuted,
    playbackRate,
    isCasting,
    isFullscreen,
    setUserInteracted,
    play,
    pause,
    toggleMute,
    setVolume,
    setPlaybackRate,
    nextVideo,
    prevVideo,
    toggleCast,
  } = useModel("useVideoPlayerModel");

  // 从 upload 模型获取方法
  const { showUpload } = useModel("useVideoUploadModel");

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value), videoRef?.current);
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate, videoRef?.current);
  };

  const handleUploadClick = () => {
    showUpload();
  };

  const handlePlayClick = async () => {
    // 标记用户交互
    setUserInteracted();
    await play(videoRef?.current);
  };

  const handlePauseClick = () => {
    pause(videoRef?.current);
  };

  const handleMuteClick = () => {
    toggleMute(videoRef?.current);
  };

  return (
    <div className={styles.controlBar}>
      <div className={styles.leftControls}>
        <StepBackwardOutlined
          className={styles.controlIcon}
          onClick={prevVideo}
        />
        {isPlaying ? (
          <PauseCircleOutlined
            className={styles.controlIcon}
            onClick={handlePauseClick}
          />
        ) : (
          <PlayCircleOutlined
            className={styles.controlIcon}
            onClick={handlePlayClick}
          />
        )}
        <StepForwardOutlined
          className={styles.controlIcon}
          onClick={nextVideo}
        />

        <div className={styles.volumeControl}>
          {isMuted ? (
            <MutedOutlined
              className={styles.controlIcon}
              onClick={handleMuteClick}
            />
          ) : (
            <SoundOutlined
              className={styles.controlIcon}
              onClick={handleMuteClick}
            />
          )}
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className={styles.volumeSlider}
          />
        </div>

        <div className={styles.playbackRate}>
          <select
            value={playbackRate}
            onChange={(e) =>
              handlePlaybackRateChange(parseFloat(e.target.value))
            }
            className={styles.rateSelect}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>
      </div>

      <div className={styles.rightControls}>
        <UploadOutlined
          className={styles.controlIcon}
          onClick={handleUploadClick}
        />
        <UnorderedListOutlined
          className={styles.controlIcon}
          onClick={onTogglePlaylist}
        />
        <WifiOutlined
          className={`${styles.controlIcon} ${
            isCasting ? styles.castingActive : ""
          }`}
          onClick={toggleCast}
        />
        {isFullscreen ? (
          <FullscreenExitOutlined
            className={styles.controlIcon}
            onClick={onToggleFullscreen}
          />
        ) : (
          <FullscreenOutlined
            className={styles.controlIcon}
            onClick={onToggleFullscreen}
          />
        )}
      </div>
    </div>
  );
};

export default ControlBar;
