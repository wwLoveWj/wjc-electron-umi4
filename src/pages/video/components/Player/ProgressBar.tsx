import React from "react";
import { useModel } from "umi";
import styles from "./style.less";

const ProgressBar: React.FC = () => {
  const { currentTime, duration, seekTo } = useModel("useVideoPlayerModel");

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    seekTo(newTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) {
      return "0:00";
    }

    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.progressContainer}>
      <div className={styles.timeDisplay}>{formatTime(currentTime)}</div>
      <div className={styles.progressBar} onClick={handleProgressClick}>
        <div
          className={styles.progress}
          style={{ width: `${progressPercent}%` }}
        >
          <div className={styles.progressThumb}></div>
        </div>
        <div className={styles.bufferBar}></div>
      </div>
      <div className={styles.timeDisplay}>{formatTime(duration)}</div>
    </div>
  );
};

export default ProgressBar;
