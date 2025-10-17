import React from 'react';
import { useModel } from 'umi';
import { 
  CloseOutlined, 
  PlayCircleOutlined, 
  DeleteOutlined, 
  PauseCircleOutlined 
} from '@ant-design/icons';
import styles from './playlist.less';

interface PlaylistProps {
  onClose: () => void;
}

const Playlist: React.FC<PlaylistProps> = ({ onClose }) => {
  const { 
    playlist, 
    currentVideo, 
    setCurrentVideo, 
    removeFromPlaylist,
    isPlaying,
    play,
    pause
  } = useModel('useVideoPlayerModel');

  // 提取视频名称（去掉路径）
  const getDisplayName = (video: any) => {
    if (!video?.name) return '未知视频';
    
    // 处理文件路径，只显示文件名
    const name = video.name;
    // 替换反斜杠为正斜杠，然后分割路径
    const normalizedPath = name.replace(/\\/g, '/');
    const fileName = normalizedPath.split('/').pop();
    
    // 去掉文件扩展名
    return fileName?.replace(/\.[^/.]+$/, "") || name;
  };

  const handleItemClick = (video: any) => {
    setCurrentVideo(video);
    // 如果当前正在播放的视频被点击，切换播放状态
    if (currentVideo?.id === video.id) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      // 切换视频时自动播放
      setTimeout(() => play(), 100);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation(); // 防止触发视频选择
    removeFromPlaylist(videoId);
  };

  return (
    <div className={styles.playlist}>
      <div className={styles.playlistHeader}>
        <h3>播放列表 ({playlist.length})</h3>
        <CloseOutlined onClick={onClose} className={styles.closeIcon} />
      </div>
      
      <div className={styles.playlistContent}>
        {playlist.map((video) => {
          const isActive = currentVideo?.id === video.id;
          const displayName = getDisplayName(video);
          
          return (
            <div
              key={video.id}
              className={`${styles.playlistItem} ${
                isActive ? styles.active : ''
              }`}
              onClick={() => handleItemClick(video)}
            >
              <div className={styles.itemInfo}>
                {isActive ? (
                  isPlaying ? (
                    <PauseCircleOutlined className={styles.playingIcon} />
                  ) : (
                    <PlayCircleOutlined className={styles.playingIcon} />
                  )
                ) : (
                  <PlayCircleOutlined className={styles.playIcon} />
                )}
                <div className={styles.videoInfo}>
                  <span className={styles.videoName}>{displayName}</span>
                  {video.duration > 0 && (
                    <span className={styles.videoDuration}>
                      {formatDuration(video.duration)}
                    </span>
                  )}
                </div>
              </div>
              <DeleteOutlined 
                className={styles.deleteIcon}
                onClick={(e) => handleDeleteClick(e, video.id)}
              />
            </div>
          );
        })}
        
        {playlist.length === 0 && (
          <div className={styles.emptyPlaylist}>
            <p>暂无视频，请上传视频文件</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 格式化视频时长
const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
};

export default Playlist;
