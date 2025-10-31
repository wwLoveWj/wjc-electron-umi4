import { useState, useCallback, useRef, useEffect } from "react";

export interface VideoItem {
  id: string;
  name: string;
  path: string;
  duration: number;
  thumbnail?: string;
  uploadTime: number;
}

export interface PlayerState {
  currentVideo: VideoItem | null;
  playlist: VideoItem[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  isCasting: boolean;
}

export default function useVideoPlayerModel() {
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentVideo: null,
    playlist: [],
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    playbackRate: 1,
    isFullscreen: false,
    isCasting: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 设置视频引用
  const setVideoRef = useCallback(
    (element: HTMLVideoElement) => {
      videoRef.current = element;

      if (element) {
        // 设置初始值
        element.volume = playerState.volume;
        element.playbackRate = playerState.playbackRate;

        // 添加事件监听器
        const handleTimeUpdate = () => {
          setPlayerState((prev) => ({
            ...prev,
            currentTime: element.currentTime,
            duration: element.duration || prev.duration,
          }));
        };

        const handleLoadedMetadata = () => {
          setPlayerState((prev) => ({
            ...prev,
            duration: element.duration || 0,
          }));
        };

        const handleEnded = () => {
          setPlayerState((prev) => ({
            ...prev,
            isPlaying: false,
            currentTime: 0,
          }));
        };

        const handlePlay = () => {
          setPlayerState((prev) => ({
            ...prev,
            isPlaying: true,
          }));
        };

        const handlePause = () => {
          setPlayerState((prev) => ({
            ...prev,
            isPlaying: false,
          }));
        };

        const handleError = (e: any) => {
          console.error("视频播放错误:", e);
          setPlayerState((prev) => ({
            ...prev,
            isPlaying: false,
          }));
        };

        // 添加事件监听
        element.addEventListener("timeupdate", handleTimeUpdate);
        element.addEventListener("loadedmetadata", handleLoadedMetadata);
        element.addEventListener("ended", handleEnded);
        element.addEventListener("play", handlePlay);
        element.addEventListener("pause", handlePause);
        element.addEventListener("error", handleError);

        // 清理函数
        return () => {
          element.removeEventListener("timeupdate", handleTimeUpdate);
          element.removeEventListener("loadedmetadata", handleLoadedMetadata);
          element.removeEventListener("ended", handleEnded);
          element.removeEventListener("play", handlePlay);
          element.removeEventListener("pause", handlePause);
          element.removeEventListener("error", handleError);
        };
      }
    },
    [playerState.volume, playerState.playbackRate]
  );

  // 设置容器引用
  const setContainerRef = useCallback((element: HTMLDivElement) => {
    containerRef.current = element;
  }, []);

  const play = useCallback(async () => {
    if (videoRef.current && playerState.currentVideo) {
      try {
        await videoRef.current.play();
      } catch (error) {
        console.error("播放失败:", error);
        // 如果自动播放被阻止，显示用户交互提示
        setPlayerState((prev) => ({
          ...prev,
          isPlaying: false,
        }));
      }
    }
  }, [playerState.currentVideo]);

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setPlayerState((prev) => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      setPlayerState((prev) => ({ ...prev, volume, isMuted: volume === 0 }));
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !playerState.isMuted;
      videoRef.current.muted = newMuted;
      setPlayerState((prev) => ({ ...prev, isMuted: newMuted }));
    }
  }, [playerState.isMuted]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlayerState((prev) => ({ ...prev, playbackRate: rate }));
    }
  }, []);

  const setCurrentVideo = useCallback((video: VideoItem) => {
    setPlayerState((prev) => ({
      ...prev,
      currentVideo: video,
      currentTime: 0,
      isPlaying: false,
    }));

    // 延迟设置持续时间，等待视频加载
    setTimeout(() => {
      if (videoRef.current) {
        setPlayerState((prev) => ({
          ...prev,
          duration: videoRef.current?.duration || 0,
        }));
      }
    }, 500);
  }, []);

  const addToPlaylist = useCallback((video: VideoItem) => {
    setPlayerState((prev) => {
      const newPlaylist = [...prev.playlist, video];
      // 如果没有当前播放的视频，设置新添加的视频为当前视频
      const newCurrentVideo = prev.currentVideo ? prev.currentVideo : video;

      return {
        ...prev,
        playlist: newPlaylist,
        currentVideo: newCurrentVideo,
      };
    });
  }, []);

  const removeFromPlaylist = useCallback((videoId: string) => {
    setPlayerState((prev) => {
      const newPlaylist = prev.playlist.filter((v) => v.id !== videoId);
      const newCurrentVideo =
        prev.currentVideo?.id === videoId
          ? newPlaylist[0] || null
          : prev.currentVideo;

      return {
        ...prev,
        playlist: newPlaylist,
        currentVideo: newCurrentVideo,
      };
    });
  }, []);

  const nextVideo = useCallback(() => {
    const { playlist, currentVideo } = playerState;
    if (!currentVideo || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((v) => v.id === currentVideo.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentVideo(playlist[nextIndex]);

    // 切换视频后自动播放
    setTimeout(() => play(), 100);
  }, [playerState, setCurrentVideo, play]);

  const prevVideo = useCallback(() => {
    const { playlist, currentVideo } = playerState;
    if (!currentVideo || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((v) => v.id === currentVideo.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentVideo(playlist[prevIndex]);

    // 切换视频后自动播放
    setTimeout(() => play(), 100);
  }, [playerState, setCurrentVideo, play]);

  // 投屏功能
  const toggleCast = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isCasting: !prev.isCasting }));
  }, []);

  // 全屏功能
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        // 进入全屏
        await containerRef.current.requestFullscreen();
        setPlayerState((prev) => ({ ...prev, isFullscreen: true }));
      } else {
        // 退出全屏
        await document.exitFullscreen();
        setPlayerState((prev) => ({ ...prev, isFullscreen: false }));
      }
    } catch (error) {
      console.error("全屏操作失败:", error);
    }
  }, []);

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setPlayerState((prev) => ({
        ...prev,
        isFullscreen: !!document.fullscreenElement,
      }));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // 监听 ESC 键退出全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return {
    ...playerState,
    setVideoRef,
    setContainerRef,
    play,
    pause,
    seekTo,
    setVolume,
    toggleMute,
    setPlaybackRate,
    setCurrentVideo,
    addToPlaylist,
    removeFromPlaylist,
    nextVideo,
    prevVideo,
    toggleCast,
    toggleFullscreen,
  };
}
