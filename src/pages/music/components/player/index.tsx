import React, { useState, useRef, useEffect } from "react";
import {
  PlayCircleFilled,
  PauseCircleFilled,
  StepForwardFilled,
  StepBackwardFilled,
  HeartOutlined,
  HeartFilled,
  MenuOutlined,
  SearchOutlined,
  HomeOutlined,
  AimOutlined,
  UploadOutlined,
  DownloadOutlined,
  PlusOutlined,
  SoundOutlined,
  SoundFilled,
  MoreOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  CheckOutlined,
  RedoOutlined, // 列表循环
  RetweetOutlined, // 单曲循环
  SwapOutlined, // 随机播放
} from "@ant-design/icons";
import {
  Row,
  Col,
  Button,
  Input,
  Card,
  List,
  Avatar,
  Slider,
  Select,
  Modal,
  Tabs,
  Progress,
  Checkbox,
  Tooltip,
  Divider,
  Grid,
  message,
  Tag,
  Statistic,
  Space,
  Popconfirm,
} from "antd";
import styles from "./index.less";
import {
  getAlbumCover,
  getMusicCover,
  isValidImageUrl,
} from "@/utils/imageUtils";
import { Playlist, Music, Album } from "../../type";
import { AddMusicModal } from "./addMusicModal";
import { EmptyPlaylistState } from "./EmptyPlaylistState";
import CustomTitleBar from "@/components/CustomTitleBar";
import { MusicUploadModal } from "../upload";

const { Option } = Select;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;
const { Countdown } = Statistic;

// 格式化时间函数
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

// 格式化文件大小函数
const formatFileSize = (size?: number) => {
  if (!size) return "未知";
  return `${size.toFixed(2)} MB`;
};

const TechWeddingPlayer: React.FC = () => {
  const [currentMusic, setCurrentMusic] = useState<Music | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playMode, setPlayMode] = useState<"list" | "single" | "random">(
    "list"
  );
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedMusicIds, setSelectedMusicIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [storagePath, setStoragePath] = useState<string>("W:\\WeddingMusic");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadInfo, setUploadInfo] = useState({ current: 0, total: 0 });

  // 新增状态
  const [isAddMusicModalVisible, setIsAddMusicModalVisible] = useState(false);

  // 添加上传模态框状态
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  // 在搜索栏的上传按钮点击处理中修改
  const handleUploadClick = () => {
    setUploadModalVisible(true);
  };

  // 模拟数据 - 根据截图内容
  const [albums, setAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([
    {
      id: "default",
      name: "我的收藏",
      musics: [
        {
          id: "1",
          title: "clipped audio 1759480154979",
          artist: "未知艺术家",
          album: "未知专辑",
          duration: 141, // 2:21
          url: "",
          cover: "",
          liked: false,
          fileSize: 25.92,
        },
        {
          id: "2",
          title: "周杰伦",
          artist: "周杰伦",
          album: "周杰伦专辑",
          duration: 223, // 3:43
          url: "",
          cover: "",
          liked: false,
          fileSize: 24.81,
        },
        {
          id: "3",
          title: "婚礼进行曲",
          artist: "古典音乐",
          album: "婚礼音乐",
          duration: 180, // 3:00
          url: "",
          cover: "",
          liked: false,
          fileSize: 30.02,
        },
        {
          id: "4",
          title: "浪漫钢琴曲",
          artist: "钢琴家",
          album: "浪漫时刻",
          duration: 210, // 3:30
          url: "",
          cover: "",
          liked: false,
          fileSize: 14.92,
        },
        {
          id: "5",
          title: "舞会音乐",
          artist: "舞曲乐队",
          album: "舞会精选",
          duration: 195, // 3:15
          url: "",
          cover: "",
          liked: false,
          fileSize: 24.16,
        },
      ],
    },
    {
      id: "wedding",
      name: "婚礼进行曲",
      musics: [],
    },
    {
      id: "romantic",
      name: "浪漫时刻",
      musics: [],
    },
    {
      id: "dance",
      name: "舞会音乐",
      musics: [],
    },
  ]);

  const [currentPlaylistId, setCurrentPlaylistId] = useState("default");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const screens = useBreakpoint();

  // 切换播放模式
  const togglePlayMode = () => {
    const modes: Array<"list" | "single" | "random"> = [
      "list",
      "single",
      "random",
    ];
    const currentIndex = modes.indexOf(playMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setPlayMode(modes[nextIndex]);
  };

  // 获取播放模式图标
  const getPlayModeIcon = () => {
    switch (playMode) {
      case "list":
        return <RedoOutlined />; // 列表循环图标
      case "single":
        return <RetweetOutlined />; // 单曲循环图标
      case "random":
        return <SwapOutlined />; // 随机播放图标
      default:
        return <RedoOutlined />;
    }
  };

  // 获取播放模式提示文本
  const getPlayModeTooltip = () => {
    switch (playMode) {
      case "list":
        return "列表循环";
      case "single":
        return "单曲循环";
      case "random":
        return "随机播放";
      default:
        return "列表循环";
    }
  };
  // ===========================播放控制栏==========================================================
  // 处理进度条点击
  // 修改进度条点击处理
  const handleProgressClick = (e: React.MouseEvent) => {
    if (!progressBarRef.current || !duration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;

    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setIsPlaying(true);
      // 确保继续播放（如果之前是播放状态）
      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error("Play failed after clicking progress:", error);
          setIsPlaying(false);
        });
      }
    }
  };

  // 处理进度条拖动开始
  const handleProgressDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingProgress(true);

    // 记录拖动前的播放状态
    const wasPlaying = isPlaying;

    // 暂停播放，避免拖动时的杂音
    if (audioRef.current && wasPlaying) {
      audioRef.current.pause();
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!progressBarRef.current || !duration) return;

      const rect = progressBarRef.current.getBoundingClientRect();
      let percent = (moveEvent.clientX - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent)); // 限制在 0-1 范围内

      const newTime = percent * duration;
      setCurrentTime(newTime);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsDraggingProgress(false);

      // 计算最终位置
      if (progressBarRef.current && duration) {
        const rect = progressBarRef.current.getBoundingClientRect();
        let percent = (upEvent.clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        const finalTime = percent * duration;

        setCurrentTime(finalTime);

        if (audioRef.current) {
          audioRef.current.currentTime = finalTime;
          setIsPlaying(true);
          // 如果之前是播放状态，恢复播放
          if (wasPlaying) {
            audioRef.current.play().catch((error) => {
              console.error("Play failed after dragging:", error);
              setIsPlaying(false);
            });
          }
        }
      }

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // 处理音量条点击
  const handleVolumeClick = (e: React.MouseEvent) => {
    if (!volumeBarRef.current) return;

    const rect = volumeBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(1, percent));

    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // 处理音量条拖动开始
  const handleVolumeDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingVolume(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!volumeBarRef.current) return;

      const rect = volumeBarRef.current.getBoundingClientRect();
      let percent = (moveEvent.clientX - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent)); // 限制在 0-1 范围内

      const newVolume = percent;
      setVolume(newVolume);
      if (audioRef.current) {
        audioRef.current.volume = newVolume;
      }
    };

    const handleMouseUp = () => {
      setIsDraggingVolume(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // =====================================================================================
  // 获取当前播放列表
  const currentPlaylist =
    playlists.find((p) => p.id === currentPlaylistId) || playlists[0];

  // 获取可添加的音乐（从"我的收藏"中排除已在当前歌单的音乐）
  const availableMusic = React.useMemo(() => {
    const defaultPlaylist = playlists.find((p) => p.id === "default");
    if (!defaultPlaylist) return [];

    const currentPlaylistMusicIds = new Set(
      currentPlaylist.musics.map((music) => music.id)
    );

    return defaultPlaylist.musics.filter(
      (music) => !currentPlaylistMusicIds.has(music.id)
    );
  }, [playlists, currentPlaylist]);

  // 初始化 - 获取存储路径和本地音乐
  useEffect(() => {
    const initializeApp = async () => {
      if (window.electronAPI) {
        try {
          // 为专辑设置默认封面
          const albumsWithCovers = albums.map((album) => ({
            ...album,
            cover: getAlbumCover(album.name, album.cover),
          }));
          setAlbums(albumsWithCovers);
          // 获取存储路径
          const path = await window.electronAPI.getStoragePath();
          setStoragePath(path);

          // 加载本地音乐
          await loadLocalMusic();
        } catch (error) {
          console.error("Failed to initialize app:", error);
          message.error("初始化失败");
        }
      }
    };

    initializeApp();
  }, []);

  // 在加载本地音乐时设置封面
  const loadLocalMusic = async () => {
    if (window.electronAPI) {
      try {
        const localMusic = await window.electronAPI.getLocalMusic();
        if (localMusic.length > 0) {
          // 为音乐设置封面
          const musicWithCovers = localMusic.map((music) => ({
            ...music,
            cover: getMusicCover(music.title, music.album, music.cover),
          }));

          const updatedPlaylists = playlists.map((playlist) => {
            if (playlist.id === "default") {
              return {
                ...playlist,
                musics: musicWithCovers,
              };
            }
            return playlist;
          });
          setPlaylists(updatedPlaylists);

          // 从音乐数据生成专辑信息
          const albumMap = new Map();
          musicWithCovers.forEach((music) => {
            const albumName = music.album || "默认专辑";
            if (!albumMap.has(albumName)) {
              albumMap.set(albumName, {
                id: `album-${albumName}`,
                name: albumName,
                artist: music.artist,
                cover: getAlbumCover(albumName),
                year: new Date().getFullYear().toString(),
                musics: [],
              });
            }
            albumMap.get(albumName).musics.push(music);
          });

          setAlbums(Array.from(albumMap.values()));
        }
      } catch (error) {
        console.error("Failed to load local music:", error);
        message.error("加载音乐失败");
      }
    }
  };

  // 音频元素事件监听
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      handleNext();
    };

    const handleError = (e: any) => {
      console.error("Audio error:", e);
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  // 当当前音乐改变时，更新音频源
  useEffect(() => {
    if (currentMusic && audioRef.current) {
      const audio = audioRef.current;

      // 只有当音乐URL改变时才重新加载音频
      if (audio.src !== currentMusic.url) {
        audio.src = currentMusic.url;
        audio.load();

        if (isPlaying) {
          audio.play().catch((error) => {
            console.error("Play failed:", error);
            setIsPlaying(false);
          });
        }
      }
    }
  }, [currentMusic?.url]); // 只依赖于音乐的URL，而不是整个currentMusic对象

  // 添加一个新的useEffect来处理喜欢状态的同步显示
  useEffect(() => {
    // 这个effect确保当前播放音乐的喜欢状态与播放列表中的状态同步
    // 但不会触发音频重新加载
    if (currentMusic) {
      const allMusics = playlists.flatMap((playlist) => playlist.musics);
      const updatedMusic = allMusics.find(
        (music) => music.id === currentMusic.id
      );
      if (updatedMusic && updatedMusic.liked !== currentMusic.liked) {
        setCurrentMusic((prev) =>
          prev ? { ...prev, liked: updatedMusic.liked } : null
        );
      }
    }
  }, [playlists]); // 当播放列表更新时同步喜欢状态
  // 当播放状态改变时，控制音频播放/暂停
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error("Play failed:", error);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // 修改键盘事件处理，确保切换后自动播放
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果焦点在输入框中，不触发播放控制
      const activeElement = document.activeElement;
      if (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        (activeElement as HTMLElement)?.contentEditable === "true"
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          // 左箭头：后退5秒
          e.preventDefault();
          if (audioRef.current && duration) {
            const newTime = Math.max(0, currentTime - 5);
            setCurrentTime(newTime);
            audioRef.current.currentTime = newTime;
            setIsPlaying(true);
            // 确保继续播放
            if (isPlaying) {
              audioRef.current.play().catch((error) => {
                console.error("Play failed after seeking:", error);
              });
            }
          }
          break;

        case "ArrowRight":
          // 右箭头：前进5秒
          e.preventDefault();
          if (audioRef.current && duration) {
            const newTime = Math.min(duration, currentTime + 5);
            setCurrentTime(newTime);
            audioRef.current.currentTime = newTime;
            setIsPlaying(true);
            // 确保继续播放
            if (isPlaying) {
              audioRef.current.play().catch((error) => {
                console.error("Play failed after seeking:", error);
              });
            }
          }
          break;

        case "ArrowUp":
          // 上箭头：上一首
          e.preventDefault();
          handlePrev();
          break;

        case "ArrowDown":
          // 下箭头：下一首
          e.preventDefault();
          handleNext();
          break;

        case " ":
          // 空格键：播放/暂停
          e.preventDefault();
          if (currentMusic || currentPlaylist.musics.length > 0) {
            togglePlay();
          }
          break;

        default:
          break;
      }
    };

    // 添加事件监听
    document.addEventListener("keydown", handleKeyDown);

    // 清理函数
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    currentTime,
    duration,
    currentMusic,
    currentPlaylist.musics.length,
    isPlaying,
  ]); // 添加 isPlaying 作为依赖

  // 当音量改变时，更新音频音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 播放/暂停
  const togglePlay = () => {
    if (currentMusic) {
      setIsPlaying(!isPlaying);
    } else if (currentPlaylist.musics.length > 0) {
      setCurrentMusic(currentPlaylist.musics[0]);
      setIsPlaying(true);
    }
  };

  // 下一首
  const handleNext = () => {
    if (!currentMusic || currentPlaylist.musics.length === 0) return;

    const currentIndex = currentPlaylist.musics.findIndex(
      (m) => m.id === currentMusic.id
    );
    let nextIndex;

    switch (playMode) {
      case "random":
        // 随机播放：随机选择一首，确保不是当前播放的
        do {
          nextIndex = Math.floor(Math.random() * currentPlaylist.musics.length);
        } while (
          currentPlaylist.musics.length > 1 &&
          nextIndex === currentIndex
        );
        break;

      case "single":
        // 单曲循环：播放同一首
        nextIndex = currentIndex;
        break;

      case "list":
      default:
        // 列表循环：播放下一首，如果是最后一首则播放第一首
        nextIndex = (currentIndex + 1) % currentPlaylist.musics.length;
        break;
    }

    setCurrentMusic(currentPlaylist.musics[nextIndex]);
    setCurrentTime(0);

    // 确保自动播放
    setIsPlaying(true);

    // 确保音频开始播放
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // 修改 handlePrev 函数，确保切换后自动播放
  const handlePrev = () => {
    if (!currentMusic || currentPlaylist.musics.length === 0) return;

    const currentIndex = currentPlaylist.musics.findIndex(
      (m) => m.id === currentMusic.id
    );
    let prevIndex;

    switch (playMode) {
      case "random":
        // 随机播放：随机选择一首
        prevIndex = Math.floor(Math.random() * currentPlaylist.musics.length);
        break;

      case "single":
        // 单曲循环：播放同一首
        prevIndex = currentIndex;
        break;

      case "list":
      default:
        // 列表循环：播放上一首，如果是第一首则播放最后一首
        prevIndex =
          currentIndex === 0
            ? currentPlaylist.musics.length - 1
            : currentIndex - 1;
        break;
    }

    setCurrentMusic(currentPlaylist.musics[prevIndex]);
    setCurrentTime(0);

    // 确保自动播放
    setIsPlaying(true);

    // 确保音频开始播放
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // 选择音乐
  const handleSelectMusic = (music: Music) => {
    setCurrentMusic(music);
    setIsPlaying(true);
  };

  // 切换喜欢状态
  const toggleLike = (musicId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const updatedPlaylists = playlists.map((playlist) => ({
      ...playlist,
      musics: playlist.musics.map((music) =>
        music.id === musicId ? { ...music, liked: !music.liked } : music
      ),
    }));
    setPlaylists(updatedPlaylists);

    // 只在当前播放的音乐被点赞时更新currentMusic，但不重新加载音频
    if (currentMusic && currentMusic.id === musicId) {
      // 创建一个新的对象，但保持其他属性不变
      setCurrentMusic({
        ...currentMusic,
        liked: !currentMusic.liked,
      });
    }
  };

  // 选择专辑
  const handleSelectAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setActiveTab("album-detail");
  };

  // 返回专辑列表
  const handleBackToAlbums = () => {
    setSelectedAlbum(null);
    setActiveTab("albums");
  };

  // 创建新歌单
  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;

    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name: newPlaylistName,
      musics: [],
    };

    setPlaylists([...playlists, newPlaylist]);
    setNewPlaylistName("");
    setIsModalVisible(false);
    setCurrentPlaylistId(newPlaylist.id);
    setActiveTab("playlists");
    message.success(`已创建歌单: ${newPlaylistName}`);
  };

  // 处理文件上传
  const handleUploadMusic = async () => {
    if (!window.electronAPI) {
      message.warning("此功能仅在 Electron 环境中可用");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadInfo({ current: 0, total: 0 });

    try {
      const result = await window.electronAPI.selectAndUploadMusic();

      if (result.success) {
        const successfulUploads = result.files?.filter((file) => file.success);
        const failedUploads = result.files?.filter((file) => !file.success);

        if (successfulUploads && successfulUploads.length > 0) {
          // 添加到当前播放列表
          // 为上传的音乐设置封面
          const newMusics: Music[] = successfulUploads.map((file) => ({
            id: `music-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: file.title || "未知标题",
            artist: file.artist || "未知艺术家",
            album: file.album || "",
            duration: file.duration || 0,
            url: file.url || "",
            cover: getMusicCover(
              file.title || "",
              file.album || "",
              file.cover
            ),
            liked: false,
            filePath: file.filePath,
            fileName: file.fileName,
            fileSize: file.fileSize,
          }));

          const updatedPlaylists = playlists.map((playlist) => {
            if (playlist.id === "default") {
              return {
                ...playlist,
                musics: [...playlist.musics, ...newMusics],
              };
            }
            return playlist;
          });

          setPlaylists(updatedPlaylists);

          // 重新生成专辑信息
          await loadLocalMusic();

          message.success(`成功上传 ${successfulUploads.length} 个文件`);
        }

        if (failedUploads && failedUploads.length > 0) {
          message.error(`${failedUploads.length} 个文件上传失败`);
        }
      } else {
        message.error(`上传失败: ${result.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      message.error("上传过程中发生错误");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadInfo({ current: 0, total: 0 });
    }
  };

  // 选择存储目录
  const handleSelectStorageDirectory = async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.selectStorageDirectory();
        if (result.success) {
          setStoragePath(result.path || "");
          message.success(`存储目录已设置为: ${result.path}`);
          // 重新加载音乐
          await loadLocalMusic();
        }
      } catch (error) {
        message.error("选择目录失败");
      }
    } else {
      message.warning("此功能仅在 Electron 环境中可用");
    }
  };

  // 打开存储目录
  const handleOpenStorageDirectory = async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.openStorageDirectory();
        if (!result.success) {
          message.error("无法打开存储目录");
        }
      } catch (error) {
        message.error("打开目录失败");
      }
    } else {
      message.warning("此功能仅在 Electron 环境中可用");
    }
  };

  // 下载选中的音乐为zip
  const handleDownloadSelected = async () => {
    if (selectedMusicIds.length === 0) {
      message.warning("请先选择要下载的音乐");
      return;
    }

    const selectedMusics = currentPlaylist.musics.filter((music) =>
      selectedMusicIds.includes(music.id)
    );

    if (window.electronAPI) {
      try {
        const result =
          await window.electronAPI.downloadMusicZip(selectedMusics);
        if (result.success) {
          message.success(`音乐包已保存 (${result.size}MB)`);
        } else {
          message.error(`打包失败: ${result.error}`);
        }
      } catch (error) {
        message.error("下载失败，请重试");
      }
    } else {
      message.warning("此功能仅在 Electron 环境中可用");
    }
  };

  // 从播放列表移除音乐并删除文件
  const handleRemoveFromPlaylist = async (
    musicId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    // 找到要删除的音乐
    const musicToDelete = currentPlaylist.musics.find((m) => m.id === musicId);
    if (!musicToDelete) {
      message.error("未找到要删除的音乐");
      return;
    }

    // 确认删除
    Modal.confirm({
      title: `确定要从"${currentPlaylist.name}"中移除这首歌曲吗？`,
      content: (
        <div>
          <p>
            此操作将从播放列表中移除歌曲，并且会从存储文件夹中删除对应的音频文件。
          </p>
          <p>
            <strong>歌曲:</strong> {musicToDelete.title}
          </p>
          <p>
            <strong>艺术家:</strong> {musicToDelete.artist}
          </p>
          {musicToDelete.filePath && (
            <p>
              <strong>文件路径:</strong> {musicToDelete.filePath}
            </p>
          )}
        </div>
      ),
      okText: "确定删除",
      cancelText: "取消",
      okType: "danger",
      onOk: async () => {
        try {
          let deleteSuccess = true;

          // 如果音乐有文件路径，尝试删除物理文件
          if (musicToDelete.filePath && window.electronAPI) {
            try {
              const result =
                await window.electronAPI.deleteMusicFile(musicToDelete);
              if (!result.success) {
                deleteSuccess = false;
                console.error("删除文件失败:", result.error);
              }
            } catch (fileError) {
              deleteSuccess = false;
              console.error("删除文件时出错:", fileError);
            }
          }

          // 从播放列表中移除音乐
          const updatedPlaylists = playlists.map((playlist) => {
            if (playlist.id === currentPlaylistId) {
              return {
                ...playlist,
                musics: playlist.musics.filter((m) => m.id !== musicId),
              };
            }
            return playlist;
          });

          setPlaylists(updatedPlaylists);

          // 如果正在播放的是被移除的音乐，停止播放
          if (currentMusic && currentMusic.id === musicId) {
            setCurrentMusic(null);
            setIsPlaying(false);
            if (audioRef.current) {
              audioRef.current.src = "";
            }
          }

          // 显示成功消息
          if (deleteSuccess) {
            message.success("已从播放列表移除并删除文件");
          } else {
            message.warning("已从播放列表移除，但文件删除失败");
          }

          // 重新加载音乐列表以更新界面
          await loadLocalMusic();
        } catch (error) {
          console.error("移除音乐时出错:", error);
          message.error("移除音乐失败");
        }
      },
    });
  };

  // 删除音乐文件
  const handleDeleteMusic = async (music: Music, e: React.MouseEvent) => {
    e.stopPropagation();

    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.deleteMusicFile(music);
        if (result.success) {
          // 从播放列表中移除
          const updatedPlaylists = playlists.map((playlist) => ({
            ...playlist,
            musics: playlist.musics.filter((m) => m.id !== music.id),
          }));
          setPlaylists(updatedPlaylists);

          // 从选中列表中移除
          setSelectedMusicIds(selectedMusicIds.filter((id) => id !== music.id));

          // 如果正在播放的是被删除的音乐，停止播放
          if (currentMusic && currentMusic.id === music.id) {
            setCurrentMusic(null);
            setIsPlaying(false);
            if (audioRef.current) {
              audioRef.current.src = "";
            }
          }

          message.success("已删除音乐文件");

          // 重新加载专辑信息
          await loadLocalMusic();
        } else {
          message.error(`删除失败: ${result.error}`);
        }
      } catch (error) {
        message.error("删除失败");
      }
    } else {
      message.warning("此功能仅在 Electron 环境中可用");
    }
  };

  // 从歌单中移除音乐
  const handleRemovePlaylist = (musicId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const updatedPlaylists = playlists.map((playlist) => {
      if (playlist.id === currentPlaylistId) {
        return {
          ...playlist,
          musics: playlist.musics.filter((m) => m.id !== musicId),
        };
      }
      return playlist;
    });

    setPlaylists(updatedPlaylists);
    message.success("已从歌单中移除");
  };

  // 处理进度条跳转
  const handleProgressChange = (value: number) => {
    setCurrentTime(value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  // 切换静音
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // 过滤音乐
  const filteredMusic = currentPlaylist.musics.filter(
    (music) =>
      music.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      music.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      music.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 渲染专辑封面时使用安全的图片URL
  const renderAlbumCover = (album: Album, className: string = "") => (
    <img
      src={getAlbumCover(album.name, album.cover)}
      alt={album.name}
      className={className}
      onError={(e) => {
        // 图片加载失败时使用默认封面
        const target = e.target as HTMLImageElement;
        target.src = getAlbumCover(album.name);
      }}
    />
  );

  // 渲染音乐封面时使用安全的图片URL
  const renderMusicCover = (music: Music, className: string = "") => (
    <img
      src={getMusicCover(music.title, music.album, music.cover)}
      alt={music.title}
      className={className}
      onError={(e) => {
        // 图片加载失败时使用默认封面
        const target = e.target as HTMLImageElement;
        target.src = getMusicCover(music.title, music.album);
      }}
    />
  );

  // 处理播放列表点击
  const handlePlaylistClick = (playlistId: string) => {
    setCurrentPlaylistId(playlistId);
    setActiveTab("playlists");
  };

  // 处理添加音乐到歌单
  const handleAddMusicToPlaylist = (selectedMusicIds: string[]) => {
    const defaultPlaylist = playlists.find((p) => p.id === "default");
    if (!defaultPlaylist) {
      message.error("默认播放列表不存在");
      return;
    }

    const musicsToAdd = defaultPlaylist.musics.filter((music) =>
      selectedMusicIds.includes(music.id)
    );

    const updatedPlaylists = playlists.map((playlist) => {
      if (playlist.id === currentPlaylistId) {
        return {
          ...playlist,
          musics: [...playlist.musics, ...musicsToAdd],
        };
      }
      return playlist;
    });

    setPlaylists(updatedPlaylists);
    setIsAddMusicModalVisible(false);
    message.success(
      `成功添加 ${musicsToAdd.length} 首音乐到 ${currentPlaylist.name}`
    );
  };

  return (
    <div className={styles.container}>
      <CustomTitleBar>
        <div className={styles?.musicTitle}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>♫</div>
            <span className={styles.logoText}>Harmony</span>
          </div>
          {/* 搜索栏 */}
          <div className={styles.searchBar}>
            <div className={styles.searchBox}>
              <SearchOutlined />
              <Input
                placeholder="搜索音乐、专辑、艺术家..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bordered={false}
              />
            </div>
            <div className={styles.actionButtons}>
              {selectedMusicIds.length > 0 && (
                <Tooltip title={`下载选中的 ${selectedMusicIds.length} 首音乐`}>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadSelected}
                    className={styles.downloadBtn}
                  >
                    下载选中({selectedMusicIds.length})
                  </Button>
                </Tooltip>
              )}
              {/* <Button
                icon={<UploadOutlined />}
                onClick={handleUploadMusic}
                className={styles.uploadBtn}
                loading={uploading}
              >
                上传音乐
              </Button> */}
              <Button
                icon={<UploadOutlined />}
                onClick={handleUploadClick}
                className={styles.uploadBtn}
              >
                上传音乐
              </Button>
            </div>
          </div>
        </div>
      </CustomTitleBar>
      <div className={styles?.musicMain}>
        {/* 隐藏的audio元素 */}
        <audio ref={audioRef} preload="metadata" />
        <div className={styles.appLayout}>
          {/* 侧边导航 */}
          <div className={styles.sidebar}>
            <div className={styles.navMenu}>
              <div
                className={`${styles.navItem} ${activeTab === "home" ? styles.active : ""}`}
                onClick={() => setActiveTab("home")}
              >
                <HomeOutlined />
                <span>首页</span>
              </div>
              <div
                className={`${styles.navItem} ${activeTab === "albums" || activeTab === "album-detail" ? styles.active : ""}`}
                onClick={() => {
                  setActiveTab("albums");
                  setSelectedAlbum(null);
                }}
              >
                <AimOutlined />
                <span>专辑</span>
              </div>
              <div
                className={`${styles.navItem} ${activeTab === "favorites" ? styles.active : ""}`}
                onClick={() => {
                  setActiveTab("favorites");
                  setCurrentPlaylistId("default");
                }}
              >
                <HeartFilled />
                <span>播放列表</span>
              </div>
            </div>

            <div className={styles.playlistsSection}>
              <div className={styles.sectionTitle}>我的歌单</div>
              {playlists
                .filter((p) => p.id !== "default")
                .map((playlist) => (
                  <div
                    key={playlist.id}
                    className={`${styles.playlistItem} ${
                      currentPlaylistId === playlist.id ? styles.active : ""
                    }`}
                    onClick={() => handlePlaylistClick(playlist.id)}
                  >
                    <div className={styles.playlistName}>{playlist.name}</div>
                    <div className={styles.playlistCount}>
                      {playlist.musics.length}
                    </div>
                  </div>
                ))}
              <div
                className={styles.newPlaylistBtn}
                onClick={() => setIsModalVisible(true)}
              >
                <PlusOutlined />
                <span>新建歌单</span>
              </div>
            </div>

            {/* 存储路径信息 */}
            <div className={styles.storageInfo}>
              <div className={styles.sectionTitle}>存储位置</div>
              <div className={styles.storagePath}>
                <FolderOutlined />
                <Tooltip title={storagePath}>
                  <span className={styles.pathText}>
                    {storagePath.length > 30
                      ? `${storagePath.substring(0, 30)}...`
                      : storagePath}
                  </span>
                </Tooltip>
              </div>
              <div className={styles.storageActions}>
                <Button
                  size="small"
                  icon={<FolderOpenOutlined />}
                  onClick={handleOpenStorageDirectory}
                >
                  打开
                </Button>
                <Button size="small" onClick={handleSelectStorageDirectory}>
                  更改
                </Button>
              </div>
            </div>
          </div>

          {/* 主内容区 */}
          <div className={styles.mainContent}>
            {/* 上传进度显示 */}
            {uploading && (
              <div className={styles.uploadProgress}>
                <div className={styles.progressHeader}>
                  <span>上传文件中...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress
                  percent={uploadProgress}
                  status="active"
                  strokeColor={{
                    "0%": "#6c5ce7",
                    "100%": "#a29bfe",
                  }}
                />
                {uploadInfo.total > 0 && (
                  <div className={styles.uploadStats}>
                    正在处理 {uploadInfo.current} / {uploadInfo.total} 个文件
                  </div>
                )}
              </div>
            )}

            {/* 内容区域 */}
            <div className={styles.contentArea}>
              {activeTab === "favorites" && (
                <div className={styles.favoritesTab}>
                  <div className={styles.favoritesHeader}>
                    <h2>播放列表</h2>
                    <div className={styles.favoritesStats}>
                      <span>{currentPlaylist.musics.length} 首歌曲</span>
                      <span>·</span>
                      <span>604 MB</span>
                      <span>·</span>
                      <span>507300000000004 MB</span>
                    </div>
                  </div>

                  <div className={styles.favoritesContent}>
                    <div className={styles.musicList}>
                      {filteredMusic.map((music, index) => (
                        <div
                          key={music.id}
                          className={`${styles.musicListItem} ${currentMusic?.id === music.id ? styles.active : ""}`}
                          onClick={() => handleSelectMusic(music)}
                        >
                          <div className={styles.musicListInfo}>
                            <div className={styles.trackNumber}>
                              {currentMusic?.id === music.id && isPlaying ? (
                                <div className={styles.playingAnimation}>
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                </div>
                              ) : (
                                <span>{index + 1}</span>
                              )}
                            </div>
                            <div className={styles.musicCover}>
                              {renderMusicCover(music, styles.musicCoverImg)}
                            </div>
                            <div className={styles.musicListDetails}>
                              <h4>{music.title}</h4>
                              <p>{music.artist}</p>
                            </div>
                          </div>
                          <div className={styles.musicListMeta}>
                            <span className={styles.fileSize}>
                              {formatFileSize(music.fileSize)}
                            </span>
                          </div>
                          <div className={styles.musicListActions}>
                            <span className={styles.duration}>
                              {formatTime(music.duration)}
                            </span>
                            <>
                              <Button
                                type="text"
                                icon={
                                  music.liked ? (
                                    <HeartFilled />
                                  ) : (
                                    <HeartOutlined />
                                  )
                                }
                                onClick={(e) => toggleLike(music.id, e)}
                                className={`${styles.likeButton} ${music.liked ? styles.liked : ""}`}
                              />
                              <Popconfirm
                                title={`确定要从"${currentPlaylist.name}"中移除这首歌曲吗？`}
                                description={
                                  <div>
                                    <p>
                                      此操作将从播放列表中移除歌曲，并且会从存储文件夹中删除对应的音频文件。
                                    </p>
                                    <p>
                                      <strong>歌曲:</strong> {music.title}
                                    </p>
                                    <p>
                                      <strong>艺术家:</strong> {music.artist}
                                    </p>
                                  </div>
                                }
                                onConfirm={(e) => {
                                  e?.stopPropagation();
                                  handleRemoveFromPlaylist(music.id, e as any);
                                }}
                                disabled
                                onCancel={(e) => e?.stopPropagation()}
                                okText="确定删除"
                                cancelText="取消"
                                okType="danger"
                                placement="leftTop"
                              >
                                <Button
                                  type="text"
                                  icon={<DeleteOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFromPlaylist(
                                      music.id,
                                      e as any
                                    );
                                  }}
                                  title="从播放列表移除并删除文件"
                                  className={styles.deleteButton}
                                />
                              </Popconfirm>
                            </>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {/* 首页内容 */}
              {activeTab === "home" && (
                <div className={styles.homeTab}>
                  {/* 统计信息 */}
                  <div className={styles.statsContainer}>
                    <Card className={styles.statCard}>
                      <Statistic
                        title="总音乐数"
                        value={currentPlaylist.musics.length}
                      />
                    </Card>
                    <Card className={styles.statCard}>
                      <Statistic
                        title="总时长"
                        value={Math.round(
                          currentPlaylist.musics.reduce(
                            (acc, music) => acc + music.duration,
                            0
                          ) / 60
                        )}
                        suffix="分钟"
                      />
                    </Card>
                    <Card className={styles.statCard}>
                      <Statistic
                        title="存储空间"
                        value={
                          Math.round(
                            currentPlaylist.musics.reduce(
                              (acc, music) => acc + (music.fileSize || 0),
                              0
                            ) * 100
                          ) / 100
                        }
                        suffix="MB"
                      />
                    </Card>
                  </div>

                  <h2>最近添加</h2>
                  <div className={styles.musicGrid}>
                    {currentPlaylist.musics.slice(0, 8).map((music) => (
                      <div
                        key={music.id}
                        className={styles.musicCard}
                        onClick={() => handleSelectMusic(music)}
                      >
                        <div className={styles.musicCover}>
                          <img src={music.cover} alt={music.title} />
                          <div className={styles.playOverlay}>
                            <Button
                              type="text"
                              icon={
                                isPlaying && currentMusic?.id === music.id ? (
                                  <PauseCircleFilled />
                                ) : (
                                  <PlayCircleFilled />
                                )
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                if (currentMusic?.id === music.id) {
                                  togglePlay();
                                } else {
                                  handleSelectMusic(music);
                                }
                              }}
                            />
                          </div>
                          <div className={styles.musicBadge}>
                            <Tag color="blue">
                              {formatFileSize(music.fileSize)}
                            </Tag>
                          </div>
                        </div>
                        <div className={styles.musicInfo}>
                          <h4>{music.title}</h4>
                          <p>{music.artist}</p>
                          <div className={styles.musicMeta}>
                            <span>{music.album}</span>
                            <span>{formatTime(music.duration)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 专辑页面内容 */}
              {activeTab === "albums" && !selectedAlbum && (
                <div className={styles.albumsTab}>
                  <h2>专辑 ({albums.length})</h2>
                  <div className={styles.albumsGrid}>
                    {albums.map((album) => (
                      <div
                        key={album.id}
                        className={styles.albumCard}
                        onClick={() => handleSelectAlbum(album)}
                      >
                        <div className={styles.albumCover}>
                          {renderAlbumCover(album)}
                          <div className={styles.albumOverlay}>
                            <Button
                              type="text"
                              icon={<PlayCircleFilled />}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (album.musics.length > 0) {
                                  handleSelectMusic(album.musics[0]);
                                }
                              }}
                            />
                          </div>
                          <div className={styles.albumTrackCount}>
                            {album.musics.length} 首
                          </div>
                        </div>
                        <div className={styles.albumInfo}>
                          <h4>{album.name}</h4>
                          <p>{album.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 专辑详情页面 */}
              {activeTab === "album-detail" && selectedAlbum && (
                <div className={styles.albumDetailTab}>
                  <div className={styles.albumHeader}>
                    <Button
                      type="text"
                      onClick={handleBackToAlbums}
                      className={styles.backBtn}
                    >
                      ← 返回专辑
                    </Button>
                    <div className={styles.albumHero}>
                      <img src={selectedAlbum.cover} alt={selectedAlbum.name} />
                      <div className={styles.albumDetails}>
                        <h1>{selectedAlbum.name}</h1>
                        <p>
                          {selectedAlbum.artist} • {selectedAlbum.year} •{" "}
                          {selectedAlbum.musics.length} 首歌曲
                        </p>
                        <div className={styles.albumStats}>
                          <span>
                            总时长:{" "}
                            {formatTime(
                              selectedAlbum.musics.reduce(
                                (acc, music) => acc + music.duration,
                                0
                              )
                            )}
                          </span>
                          <span>
                            文件大小:
                            {formatFileSize(
                              selectedAlbum.musics.reduce(
                                (acc, music) => acc + (music.fileSize || 0),
                                0
                              )
                            )}
                          </span>
                        </div>
                        <div className={styles.albumActions}>
                          <Button
                            type="primary"
                            icon={<PlayCircleFilled />}
                            onClick={() => {
                              if (selectedAlbum.musics.length > 0) {
                                handleSelectMusic(selectedAlbum.musics[0]);
                              }
                            }}
                          >
                            播放全部
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.albumTracks}>
                    <h3>歌曲列表</h3>
                    {selectedAlbum.musics.map((music, index) => (
                      <div
                        key={music.id}
                        className={`${styles.trackItem} ${currentMusic?.id === music.id ? styles.active : ""}`}
                        onClick={() => handleSelectMusic(music)}
                      >
                        <div className={styles.trackNumber}>
                          {currentMusic?.id === music.id && isPlaying ? (
                            <div className={styles.playingAnimation}>
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                        <div className={styles.trackInfo}>
                          <h4>{music.title}</h4>
                          <p>{music.artist}</p>
                        </div>
                        <div className={styles.trackMeta}>
                          <Tag size="small">
                            {formatFileSize(music.fileSize)}
                          </Tag>
                          <span className={styles.duration}>
                            {formatTime(music.duration)}
                          </span>
                        </div>
                        <div className={styles.trackActions}>
                          <Button
                            type="text"
                            icon={
                              music.liked ? <HeartFilled /> : <HeartOutlined />
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(music.id);
                            }}
                            className={music.liked ? styles.liked : ""}
                          />
                          <Popconfirm
                            title="确定要删除这个音乐文件吗？"
                            description="此操作将从存储中永久删除文件"
                            onConfirm={(e) => {
                              e?.stopPropagation();
                              handleDeleteMusic(music, e as any);
                            }}
                            onCancel={(e) => e?.stopPropagation()}
                            okText="确定"
                            cancelText="取消"
                          >
                            <Button
                              type="text"
                              icon={<DeleteOutlined />}
                              onClick={(e) => e.stopPropagation()}
                              danger
                              className={styles.deleteButton}
                            />
                          </Popconfirm>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 播放列表页面 */}
              {activeTab === "playlists" && (
                <div className={styles.playlistsTab}>
                  <div className={styles.playlistHeader}>
                    <div className={styles.playlistTitleSection}>
                      <h2>{currentPlaylist.name}</h2>
                      <div className={styles.playlistStats}>
                        <span>{currentPlaylist.musics.length} 首歌曲</span>
                        <span>•</span>
                        <span>
                          {formatTime(
                            currentPlaylist.musics.reduce(
                              (acc, music) => acc + music.duration,
                              0
                            )
                          )}
                        </span>
                        <span>•</span>
                        <span>
                          {formatFileSize(
                            currentPlaylist.musics.reduce(
                              (acc, music) => acc + (music.fileSize || 0),
                              0
                            )
                          )}
                        </span>
                      </div>
                    </div>
                    {currentPlaylist.id !== "default" && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsAddMusicModalVisible(true)}
                        className={styles.addMusicButton}
                      >
                        添加音乐
                      </Button>
                    )}
                  </div>

                  <div className={styles.playlistContent}>
                    {currentPlaylist.musics.length === 0 ? (
                      <EmptyPlaylistState
                        playlistName={currentPlaylist.name}
                        onAddMusic={() => setIsAddMusicModalVisible(true)}
                      />
                    ) : (
                      <div className={styles.musicList}>
                        {filteredMusic.map((music, index) => (
                          <div
                            key={music.id}
                            className={`${styles.musicListItem} ${currentMusic?.id === music.id ? styles.active : ""}`}
                            onClick={() => handleSelectMusic(music)}
                          >
                            <div className={styles.musicListInfo}>
                              <div className={styles.trackNumber}>
                                {currentMusic?.id === music.id && isPlaying ? (
                                  <div className={styles.playingAnimation}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                  </div>
                                ) : (
                                  <span>{index + 1}</span>
                                )}
                              </div>
                              <div className={styles.musicCover}>
                                {renderMusicCover(music, styles.musicCoverImg)}
                              </div>
                              <div className={styles.musicListDetails}>
                                <h4>{music.title}</h4>
                                <p>{music.artist}</p>
                              </div>
                            </div>
                            <div className={styles.musicListMeta}>
                              <span className={styles.fileSize}>
                                {formatFileSize(music.fileSize)}
                              </span>
                            </div>
                            <div className={styles.musicListActions}>
                              <span className={styles.duration}>
                                {formatTime(music.duration)}
                              </span>
                              <>
                                <Button
                                  type="text"
                                  icon={
                                    music.liked ? (
                                      <HeartFilled />
                                    ) : (
                                      <HeartOutlined />
                                    )
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLike(music.id);
                                  }}
                                  className={`${styles.likeButton} ${music.liked ? styles.liked : ""}`}
                                />
                                {currentPlaylist.id !== "default" && (
                                  <Popconfirm
                                    title="确定要从歌单中移除这首音乐吗？"
                                    description="此操作不会删除音乐文件"
                                    onConfirm={(e) => {
                                      e?.stopPropagation();
                                      handleRemovePlaylist(music.id, e as any);
                                    }}
                                    onCancel={(e) => e?.stopPropagation()}
                                    okText="确定"
                                    cancelText="取消"
                                  >
                                    <Button
                                      type="text"
                                      icon={<DeleteOutlined />}
                                      onClick={(e) => e.stopPropagation()}
                                      className={styles.deleteButton}
                                    />
                                  </Popconfirm>
                                )}
                              </>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* 播放控制栏 */}
        <div className={styles.playerBar}>
          <div className={styles.playerInfo}>
            {currentMusic ? (
              <>
                {renderMusicCover(currentMusic, styles.playerCoverImg)}
                <div className={styles.playerTrackInfo}>
                  <h4>{currentMusic.title}</h4>
                  <p>{currentMusic.artist}</p>
                </div>
              </>
            ) : (
              <div className={styles.noMusic}>
                <span>未选择音乐</span>
              </div>
            )}
          </div>

          <div className={styles.playerControls}>
            <div className={styles.controlButtons}>
              {/* 播放模式切换按钮 - 在上一首按钮左侧 */}
              <Tooltip title={getPlayModeTooltip()}>
                <Button
                  type="text"
                  icon={getPlayModeIcon()}
                  onClick={togglePlayMode}
                  className={styles.modeButton}
                />
              </Tooltip>
              <Button
                type="text"
                icon={<StepBackwardFilled />}
                onClick={handlePrev}
                disabled={!currentMusic}
                className={styles.controlBtn}
              />
              <Button
                type="text"
                icon={isPlaying ? <PauseCircleFilled /> : <PlayCircleFilled />}
                onClick={togglePlay}
                className={`${styles.playPauseBtn} ${styles.controlBtn}`}
                disabled={currentPlaylist.musics.length === 0}
              />
              <Button
                type="text"
                icon={<StepForwardFilled />}
                onClick={handleNext}
                disabled={!currentMusic}
                className={styles.controlBtn}
              />
              {currentMusic && (
                <Button
                  type="text"
                  icon={
                    currentMusic.liked ? <HeartFilled /> : <HeartOutlined />
                  }
                  onClick={() => toggleLike(currentMusic.id)}
                  className={`${styles.likeButton} ${currentMusic.liked ? styles.liked : ""}`}
                />
              )}
            </div>

            {/* 可拖动的进度条 */}
            <div className={styles.progressContainer}>
              <div
                className={styles.progressBar}
                onClick={handleProgressClick}
                ref={progressBarRef}
              >
                <div
                  className={styles.progress}
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                >
                  <div
                    className={styles.progressHandle}
                    onMouseDown={handleProgressDragStart}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.playerExtra}>
            {/* 进度条播放进度 */}
            <div className={styles?.playerProcessTime}>
              <span className={styles.time}>{formatTime(currentTime)}</span>
              <span style={{ margin: "0 6px" }}>/</span>
              <span className={styles.time}>{formatTime(duration)}</span>
            </div>
            {/* 音量控制 */}
            <div className={styles.volumeControl}>
              <Button
                type="text"
                icon={isMuted ? <SoundOutlined /> : <SoundFilled />}
                onClick={toggleMute}
                className={styles.volumeBtn}
              />
              <div
                className={styles.volumeBar}
                onClick={handleVolumeClick}
                ref={volumeBarRef}
              >
                <div
                  className={styles.volumeLevel}
                  style={{ width: `${volume * 100}%` }}
                >
                  <div
                    className={styles.volumeHandle}
                    onMouseDown={handleVolumeDragStart}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 新建歌单模态框 */}
      <Modal
        title="新建歌单"
        open={isModalVisible}
        onOk={handleCreatePlaylist}
        onCancel={() => setIsModalVisible(false)}
        okText="创建"
        cancelText="取消"
        className={styles.modal}
      >
        <Input
          placeholder="请输入歌单名称"
          value={newPlaylistName}
          onChange={(e) => setNewPlaylistName(e.target.value)}
          onPressEnter={handleCreatePlaylist}
        />
      </Modal>
      {/* 添加音乐模态框 */}
      <AddMusicModal
        visible={isAddMusicModalVisible}
        onCancel={() => setIsAddMusicModalVisible(false)}
        onConfirm={handleAddMusicToPlaylist}
        availableMusic={availableMusic}
        playlists={playlists}
      />
      {/* 上传音频文件到minio */}
      <MusicUploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        onSuccess={() => {
          // 上传成功后重新加载音乐
          loadLocalMusic();
        }}
      />
    </div>
  );
};

export default TechWeddingPlayer;
