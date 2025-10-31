import { useState, useCallback, useEffect } from "react";

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
    userInteracted: false,
  });

  // 不再在模型中存储 videoRef，而是通过参数传递
  const setUserInteracted = useCallback(() => {
    setPlayerState((prev) => ({
      ...prev,
      userInteracted: true,
    }));
  }, []);

  // 播放函数现在需要接收 videoElement 参数
  const play = useCallback(
    async (videoElement?: HTMLVideoElement) => {
      console.log("play function called with videoElement:", videoElement);

      if (!playerState.currentVideo) {
        console.error("No current video to play");
        return;
      }

      // 如果没有传入 videoElement，尝试从状态中获取
      let videoToPlay = videoElement;

      if (!videoToPlay) {
        console.error("No video element provided to play function");
        return;
      }

      try {
        // 设置静音以绕过自动播放策略（可选）
        videoToPlay.muted = false;

        const playPromise = videoToPlay.play();

        if (playPromise !== undefined) {
          await playPromise;
          console.log("视频播放成功");
          setPlayerState((prev) => ({ ...prev, isPlaying: true }));
        }
      } catch (error: any) {
        console.error("播放失败:", error);

        // 如果自动播放被阻止，尝试静音播放
        if (error.name === "NotAllowedError") {
          console.log("自动播放被阻止，尝试静音播放");
          try {
            videoToPlay.muted = true;
            await videoToPlay.play();
            console.log("静音播放成功");
            setPlayerState((prev) => ({ ...prev, isPlaying: true }));
          } catch (mutedError) {
            console.error("静音播放也失败:", mutedError);
            setPlayerState((prev) => ({ ...prev, isPlaying: false }));
          }
        } else {
          setPlayerState((prev) => ({ ...prev, isPlaying: false }));
        }
      }
    },
    [playerState.currentVideo]
  );

  const pause = useCallback((videoElement?: HTMLVideoElement) => {
    if (videoElement) {
      videoElement.pause();
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const seekTo = useCallback(
    (time: number, videoElement?: HTMLVideoElement) => {
      if (videoElement) {
        videoElement.currentTime = time;
        setPlayerState((prev) => ({ ...prev, currentTime: time }));
      }
    },
    []
  );

  const setVolume = useCallback(
    (volume: number, videoElement?: HTMLVideoElement) => {
      if (videoElement) {
        videoElement.volume = volume;
      }
      setPlayerState((prev) => ({ ...prev, volume, isMuted: volume === 0 }));
    },
    []
  );

  const toggleMute = useCallback(
    (videoElement?: HTMLVideoElement) => {
      const newMuted = !playerState.isMuted;
      if (videoElement) {
        videoElement.muted = newMuted;
      }
      setPlayerState((prev) => ({ ...prev, isMuted: newMuted }));
    },
    [playerState.isMuted]
  );

  const setPlaybackRate = useCallback(
    (rate: number, videoElement?: HTMLVideoElement) => {
      if (videoElement) {
        videoElement.playbackRate = rate;
      }
      setPlayerState((prev) => ({ ...prev, playbackRate: rate }));
    },
    []
  );

  const setCurrentVideo = useCallback((video: API.VideoItem) => {
    setPlayerState((prev) => ({
      ...prev,
      currentVideo: video,
      currentTime: 0,
      isPlaying: false,
    }));
  }, []);

  const addToPlaylist = useCallback((video: API.VideoItem) => {
    setPlayerState((prev) => {
      const newPlaylist = [...prev.playlist, video];
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

  // 投屏功能
  const toggleCast = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isCasting: !prev.isCasting }));
  }, []);

  // 全屏功能
  const toggleFullscreen = useCallback(
    async (containerElement?: HTMLElement) => {
      if (!containerElement) return;

      try {
        if (!document.fullscreenElement) {
          // 进入全屏
          await containerElement.requestFullscreen();
          setPlayerState((prev) => ({ ...prev, isFullscreen: true }));
        } else {
          // 退出全屏
          await document.exitFullscreen();
          setPlayerState((prev) => ({ ...prev, isFullscreen: false }));
        }
      } catch (error) {
        console.error("全屏操作失败:", error);
      }
    },
    []
  );

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
    setUserInteracted,
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
