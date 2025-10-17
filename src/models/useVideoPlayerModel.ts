import { useState, useCallback, useRef, useEffect } from "react";

export default function useVideoPlayerModel() {
  const [playerState, setPlayerState] = useState<API.PlayerState>({
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

        // 添加事件监听
        element.addEventListener("timeupdate", handleTimeUpdate);
        element.addEventListener("loadedmetadata", handleLoadedMetadata);
        element.addEventListener("ended", handleEnded);
        element.addEventListener("play", handlePlay);
        element.addEventListener("pause", handlePause);

        // 清理函数
        return () => {
          element.removeEventListener("timeupdate", handleTimeUpdate);
          element.removeEventListener("loadedmetadata", handleLoadedMetadata);
          element.removeEventListener("ended", handleEnded);
          element.removeEventListener("play", handlePlay);
          element.removeEventListener("pause", handlePause);
        };
      }
    },
    [playerState.volume, playerState.playbackRate]
  );

  const play = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

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

  const setCurrentVideo = useCallback((video: API.VideoItem) => {
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

  const addToPlaylist = useCallback((video: API.VideoItem) => {
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
  }, [playerState, setCurrentVideo]);

  const prevVideo = useCallback(() => {
    const { playlist, currentVideo } = playerState;
    if (!currentVideo || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((v) => v.id === currentVideo.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentVideo(playlist[prevIndex]);
  }, [playerState, setCurrentVideo]);

  const toggleCast = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isCasting: !prev.isCasting }));
  }, []);

  return {
    ...playerState,
    setVideoRef,
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
  };
}
