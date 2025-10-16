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
  UnorderedListOutlined,
  UploadOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import styles from "../styles.less";

interface ControlBarProps {
  onTogglePlaylist: () => void;
}

const ControlBar: React.FC<ControlBarProps> = ({ onTogglePlaylist }) => {
  const {
    isPlaying,
    volume,
    isMuted,
    playbackRate,
    isCasting,
    play,
    pause,
    toggleMute,
    setVolume,
    setPlaybackRate,
    nextVideo,
    prevVideo,
    toggleCast,
  } = useModel("useVideoPlayerModel");

  const { showUpload } = useModel("useVideoUploadModel");

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
  };

  return (
    <div className={styles.controlBar}>
      <div className={styles.leftControls}>
        <StepBackwardOutlined
          className={styles.controlIcon}
          onClick={prevVideo}
        />
        {isPlaying ? (
          <PauseCircleOutlined className={styles.controlIcon} onClick={pause} />
        ) : (
          <PlayCircleOutlined className={styles.controlIcon} onClick={play} />
        )}
        <StepForwardOutlined
          className={styles.controlIcon}
          onClick={nextVideo}
        />

        <div className={styles.volumeControl}>
          {isMuted ? (
            <MutedOutlined
              className={styles.controlIcon}
              onClick={() => toggleMute()}
            />
          ) : (
            <SoundOutlined
              className={styles.controlIcon}
              onClick={() => toggleMute()}
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
        <UploadOutlined className={styles.controlIcon} onClick={showUpload} />
        <UnorderedListOutlined
          className={styles.controlIcon}
          onClick={onTogglePlaylist}
        />
        <WifiOutlined
          className={`${styles.controlIcon} ${isCasting ? styles.castingActive : ""}`}
          onClick={toggleCast}
        />
        <FullscreenOutlined
          className={styles.controlIcon}
          // onClick={toggleFullscreen}
        />
      </div>
    </div>
  );
};

export default ControlBar;
